const express = require("express");
const request = require("supertest");
const validate = require("../shared/middleware/validate.middleware");
const errorHandler = require("../shared/middleware/errorHandler.middleware");

const { addToCartSchema } = require("../validators/cart.validators");
const { addToWishlistSchema } = require("../validators/wishlist.validators");
const { createReviewSchema } = require("../validators/review.validators");
const { createReturnSchema } = require("../validators/return.validators");

const appFor = (schema, part = "body") => {
  const app = express();
  app.use(express.json());
  app.post("/test", validate({ [part]: schema }), (req, res) => res.status(200).json({ ok: true }));
  app.use(errorHandler);
  return app;
};

const validObjectId = "507f1f77bcf86cd799439011";

describe("New validator schemas — cart", () => {
  const app = appFor(addToCartSchema);
  test("rejects a missing productId", async () => {
    const res = await request(app).post("/test").send({ quantity: 1 });
    expect(res.status).toBe(400);
  });
  test("accepts a valid productId with no quantity (controller defaults it to 1)", async () => {
    const res = await request(app).post("/test").send({ productId: validObjectId });
    expect(res.status).toBe(200);
  });
});

describe("New validator schemas — wishlist", () => {
  const app = appFor(addToWishlistSchema);
  test("rejects a malformed ObjectId", async () => {
    const res = await request(app).post("/test").send({ productId: "not-an-id" });
    expect(res.status).toBe(400);
  });
  test("accepts a valid ObjectId", async () => {
    const res = await request(app).post("/test").send({ productId: validObjectId });
    expect(res.status).toBe(200);
  });
});

describe("New validator schemas — review", () => {
  const app = appFor(createReviewSchema);
  test("rejects a rating above 5", async () => {
    const res = await request(app)
      .post("/test")
      .send({ productId: validObjectId, orderId: validObjectId, rating: 6 });
    expect(res.status).toBe(400);
  });
  test("rejects a rating of 0", async () => {
    const res = await request(app)
      .post("/test")
      .send({ productId: validObjectId, orderId: validObjectId, rating: 0 });
    expect(res.status).toBe(400);
  });
  test("accepts a valid rating of 5 with a comment", async () => {
    const res = await request(app)
      .post("/test")
      .send({ productId: validObjectId, orderId: validObjectId, rating: 5, comment: "Great!" });
    expect(res.status).toBe(200);
  });
});

describe("New validator schemas — return", () => {
  const app = appFor(createReturnSchema);
  test("rejects a request with no reason", async () => {
    const res = await request(app)
      .post("/test")
      .send({ orderId: validObjectId, items: [{ productId: validObjectId, quantity: 1 }] });
    expect(res.status).toBe(400);
  });
  test("rejects an empty items array", async () => {
    const res = await request(app)
      .post("/test")
      .send({ orderId: validObjectId, items: [], reason: "Wrong size" });
    expect(res.status).toBe(400);
  });
  test("accepts a well-formed return request", async () => {
    const res = await request(app)
      .post("/test")
      .send({
        orderId: validObjectId,
        items: [{ productId: validObjectId, quantity: 1, variant: { color: "Red", size: "M" } }],
        reason: "Wrong size",
      });
    expect(res.status).toBe(200);
  });
});
