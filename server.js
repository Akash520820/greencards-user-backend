require("dotenv").config();
const app = require("./app");
const connectDB = require("./shared/db/index");
const logger = require("./shared/utils/logger");
const { startPoller } = require("./shared/workers/outboxPoller");
const startKeepAlive = require("./shared/utils/keepAlive");

// ─── Fail-fast: required env vars ────────────────────────────────────────────
// Crash immediately at startup with a clear message rather than crashing deep
// inside a request handler or silently using an insecure fallback.
const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];
const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[user-backend] Missing required environment variables: ${missing.join(", ")}`);
  console.error("Set them in your .env file (local) or Render Dashboard (production).");
  process.exit(1);
}

const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 5001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`👤 User Microservice running on port ${PORT}`);
      console.log(`👤 User Microservice running on port ${PORT}`);
    });
    // Start background outbox poller — delivers ORDER_CREATED events to seller-backend
    startPoller();
    // Start keep-alive self-pinging on Render
    startKeepAlive();
  })
  .catch((err) => {
    logger.error("MongoDB connection failed in User Microservice:", err);
    process.exit(1);
  });
