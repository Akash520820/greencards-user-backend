const crypto = require("crypto");

const HMAC_SECRET = process.env.ORDER_HMAC_SECRET;

/**
 * Builds a deterministic pipe-delimited string from the order's financial
 * fields and signs it with HMAC-SHA256.
 *
 * IMPORTANT: The field order here is fixed and must never change.
 * If you add new financial fields in the future, APPEND them to the END
 * of the payload array — never reorder existing entries.
 */
const signOrder = (data) => {
  if (!HMAC_SECRET) {
    throw new Error("ORDER_HMAC_SECRET is not configured in environment variables");
  }
  const payload = [
    data.userId,
    data.itemsPrice,
    data.discountAmount,
    data.shippingPrice,
    data.totalPrice,
    data.paymentMethod,
    data.createdAt,
  ].join("|");

  return crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
};

/**
 * Verifies an order's integrity hash against the stored value.
 * Uses timingSafeEqual to prevent timing-based side-channel attacks.
 * Returns true if the order has NOT been tampered with.
 */
const verifyOrder = (data, storedHash) => {
  if (!storedHash) return false;
  try {
    const expected = signOrder(data);
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    // Buffer length mismatch or missing secret — treat as tampered
    return false;
  }
};

module.exports = { signOrder, verifyOrder };
