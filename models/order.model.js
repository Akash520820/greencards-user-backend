const mongoose = require("mongoose");

// ─── Embedded product snapshot ────────────────────────────────────────────────
// In the 4-cluster split database, user-backend connects ONLY to the
// greencard-user Atlas cluster. It has no network path to the greencard-seller
// cluster where Product documents live.
//
// Instead of storing an ObjectId ref and later calling populate() across
// clusters (which would silently return null), we copy the fields we need
// from the Product at the moment the order is placed.
//
// Benefits:
//   • Price freeze — the amount the customer paid is preserved forever, even if
//     the seller later changes the product price.
//   • Delete-safe — order history still renders correctly even after the seller
//     deletes the product.
//   • Zero cross-cluster reads — order listing/detail pages need no external calls.
const orderItemSchema = new mongoose.Schema(
  {
    // Cross-service reference IDs — stored as strings (not ObjectId) because
    // they live on a different cluster. Use publicId format: prd_xxx, sel_xxx.
    // NEVER call populate() on these fields.
    productId:     { type: String, required: true, index: true },
    sellerId:      { type: String, required: true, index: true },

    // Immutable snapshot — copied from Product document at order creation time.
    name:          { type: String, required: true },
    image:         { type: String, required: true }, // first image at time of purchase
    brand:         { type: String },
    categoryName:  { type: String },                 // category name string, NOT an ObjectId
    sku:           { type: String },
    variant: {
      color: { type: String },
      size:  { type: String },
    },
    price:         { type: Number, required: true },  // final price actually paid (after discounts)
    originalPrice: { type: Number, required: true },  // MRP at time of order
    quantity:      { type: Number, required: true },
    itemStatus: {
      type:    String,
      enum:    ["processing", "shipped", "delivered", "cancelled", "returned"],
      default: "processing",
    },
  },
  { _id: false }
);


const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, uppercase: true, trim: true },
    totalPrice: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    orderStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    deliveredAt: { type: Date },
    // client-supplied key (e.g. a UUID generated once per checkout attempt) — lets a
    // retried/double-submitted "place order" request return the original order instead
    // of creating a duplicate. Unique+sparse so orders without one (or older orders,
    // pre-migration) don't collide with each other on a shared `null`.
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Cross-cluster reference ID — format: ord_<12-char-hex>
    // Used by seller-backend and other services to reference this order
    // without needing access to the greencard-user Atlas cluster.
    publicId: {
      type:   String,
      unique: true,
      sparse: true,
      index:  true,
    },

    // HMAC-SHA256 signature of the order's financial fields (totalPrice,
    // itemsPrice, discountAmount, shippingPrice, paymentMethod, userId).
    // Computed with ORDER_HMAC_SECRET at creation time; verified before any
    // refund, invoice generation, or financial reporting.
    // select:false means this field is NEVER included in API responses.
    integrityHash: {
      type:   String,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);