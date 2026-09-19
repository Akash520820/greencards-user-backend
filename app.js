const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");

const notFound = require("./shared/middleware/notFound.middleware");
const errorHandler = require("./shared/middleware/errorHandler.middleware");
const { apiLimiter } = require("./shared/middleware/rateLimiter.middleware");

const userRouter     = require("./routes/user.routes");
const addressRouter  = require("./routes/address.routes");
const productRouter  = require("./routes/product.routes");
const cartRouter     = require("./routes/cart.routes");
const orderRouter    = require("./routes/order.routes");
const returnRouter   = require("./routes/return.routes");
const reviewRouter   = require("./routes/review.routes");
const wishlistRouter = require("./routes/wishlist.routes");
const contactRouter  = require("./routes/contact.routes");
const { handleIncomingEvent } = require("./controllers/events.controller");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(cors({ origin: true, credentials: true }));

// raw body ONLY for Razorpay webhook route — must come BEFORE express.json()
app.use("/api/v1/orders/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(apiLimiter);

// User Microservice Routes
app.use("/api/v1/users",    userRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart",     cartRouter);
app.use("/api/v1/orders",   orderRouter);
app.use("/api/v1/returns",  returnRouter);
app.use("/api/v1/reviews",  reviewRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/contact",  contactRouter);

// Internal Saga callback endpoint — receives STOCK_RESERVED / STOCK_FAILED
// from seller-backend's outbox poller. NOT exposed through the API gateway.
app.post("/internal/events", handleIncomingEvent);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
