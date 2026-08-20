import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import marketplaceRouter from "./marketplace";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import cronRouter from "./cron";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/marketplace', marketplaceRouter);
router.use('/orders', ordersRouter);
router.use('/admin', adminRouter);
router.use('/cron', cronRouter);
router.use('/upload', uploadRouter);

export default router;
