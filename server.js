require("dotenv").config();
const app = require("./app");
const connectDB = require("./shared/db/index");
const logger = require("./shared/utils/logger");
const { startPoller } = require("./shared/workers/outboxPoller");

const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 5001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`👤 User Microservice running on port ${PORT}`);
      console.log(`👤 User Microservice running on port ${PORT}`);
    });
    // Start background outbox poller — delivers ORDER_CREATED events to seller-backend
    startPoller();
  })
  .catch((err) => {
    logger.error("MongoDB connection failed in User Microservice:", err);
    process.exit(1);
  });
