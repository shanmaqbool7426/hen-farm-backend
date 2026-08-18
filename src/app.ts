import express, { type Express } from "express";
import cors from "cors";
import pinoHttpImport from "pino-http";
import router from "./routes/index";
import { logger } from "./lib/logger";
// connectDB and startDailyEggsJob are initialized in index.ts AFTER .env is loaded
import { connectDB } from "./db/mongoose";
export { connectDB };
export { startDailyEggsJob } from "./jobs/daily-eggs";

// pino-http is CommonJS; local esbuild and Vercel's own TypeScript build
// resolve its default export's callability differently depending on which
// esModuleInterop setting they end up picking up. It's the same function at
// runtime either way, so cast to `any` here to make this immune to that.
const pinoHttp = pinoHttpImport as any;

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database is connected for all requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        success: false,
        error: `Database connection failed: ${message}. Make sure MONGODB_URI is set correctly.`
      });
    }
  }
  next();
});

app.use("/api", router);

// Not used by the mobile app (which only ever calls /api/*), but a plain 200
// here means Vercel's own deployment-preview screenshot (which visits bare
// "/") stops showing a false "crashed" thumbnail.
app.get("/", (_req, res) => {
  res.json({ message: "HenFarm API - see /api/healthz" });
});

export default app;

