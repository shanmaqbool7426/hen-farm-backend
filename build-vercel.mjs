import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";

// Vercel's Node.js runtime does NOT bundle our raw TypeScript source files -
// it runs them individually through Node's native ES module loader, which
// (unlike our local esbuild-based build.mjs, or CommonJS require()) refuses
// directory imports and extension-less relative imports. Rather than rewrite
// every relative import across src/ with explicit .js extensions, this
// bundles the Vercel entry point (_vercel-src/[...path].ts) into a single
// self-contained file exactly like build.mjs already does for the
// traditional server - so Node never has to resolve our internal module
// graph at runtime at all.
//
// The source used to live at api-src/ - Vercel's zero-config function
// detection picked it up too (despite it not being under api/), compiled it
// WITHOUT bundling, and crashed on the exact same directory-import problem
// this file exists to avoid. Renaming it to the underscore-prefixed
// _vercel-src/ (Vercel explicitly never scans underscore-prefixed paths)
// fixed that.
//
// Output goes to api/_lib/ (also underscore-prefixed, same reasoning) and
// the small static file at api/handler.js (committed, not generated) just
// re-exports from there. vercel.json rewrites every /api/* request (and "/")
// to this one plain function - no [...path] bracket dynamic-route filename,
// that consistently failed to match anything beyond a single path segment on
// Vercel for reasons that were never fully clear. Express's own router then
// does the real routing from req.url, same as it always has. The daily-eggs
// cron is a normal Express route (src/routes/cron.ts) served through this
// same function, not a second Vercel function - an earlier nested api/cron/
// function broke routing for every other path too.

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

const EXTERNAL = [
  "*.node",
  "sharp",
  "better-sqlite3",
  "sqlite3",
  "canvas",
  "bcrypt",
  "argon2",
  "fsevents",
  "re2",
  "farmhash",
  "xxhash-addon",
  "bufferutil",
  "utf-8-validate",
  "ssh2",
  "cpu-features",
  "dtrace-provider",
  "isolated-vm",
  "lightningcss",
  "pg-native",
  "oracledb",
  "mongodb-client-encryption",
  "nodemailer",
  "handlebars",
  "knex",
  "typeorm",
  "protobufjs",
  "onnxruntime-node",
  "@tensorflow/*",
  "@prisma/client",
  "@mikro-orm/*",
  "@grpc/*",
  "@swc/*",
  "@aws-sdk/*",
  "@azure/*",
  "@opentelemetry/*",
  "@google-cloud/*",
  "@google/*",
  "googleapis",
  "firebase-admin",
  "@parcel/watcher",
  "@sentry/profiling-node",
  "@tree-sitter/*",
  "aws-sdk",
  "classic-level",
  "dd-trace",
  "ffi-napi",
  "grpc",
  "hiredis",
  "kerberos",
  "leveldown",
  "miniflare",
  "mysql2",
  "newrelic",
  "odbc",
  "piscina",
  "realm",
  "ref-napi",
  "rocksdb",
  "sass-embedded",
  "sequelize",
  "serialport",
  "snappy",
  "tinypool",
  "usb",
  "workerd",
  "wrangler",
  "zeromq",
  "zeromq-prebuilt",
  "playwright",
  "puppeteer",
  "puppeteer-core",
  "electron",
];

const BANNER = `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`;

async function buildAll() {
  const outDir = path.resolve(artifactDir, "api/_lib");
  await rm(outDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [
      { in: path.resolve(artifactDir, "_vercel-src/[...path].ts"), out: "path-handler" },
    ],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: outDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: EXTERNAL,
    sourcemap: "linked",
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
    banner: { js: BANNER },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
