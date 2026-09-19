/**
 * Generates human-readable prefixed IDs for cross-service entity references.
 *
 * In a 4-cluster split database, MongoDB ObjectIds cannot be used for
 * cross-service references because each cluster is completely isolated.
 * Instead, we use these string IDs which encode the entity type in the prefix,
 * making it immediately obvious what type of entity a reference points to.
 *
 * Format: <prefix>_<12-char-hex>
 * Example: prd_1a2b3c4d5e6f  (a product ID)
 *          usr_9z8y7x6w5v4u  (a user ID)
 */
const { v4: uuidv4 } = require("uuid");

const PREFIXES = {
  user:     "usr",
  seller:   "sel",
  product:  "prd",
  order:    "ord",
  shipment: "shp",
  staff:    "stf",
  category: "cat",
};

/**
 * @param {"user"|"seller"|"product"|"order"|"shipment"|"staff"|"category"} entity
 * @returns {string}  e.g. "prd_1a2b3c4d5e6f"
 */
const generateId = (entity) => {
  const prefix = PREFIXES[entity];
  if (!prefix) throw new Error(`Unknown entity type: "${entity}". Valid types: ${Object.keys(PREFIXES).join(", ")}`);
  const short = uuidv4().replace(/-/g, "").substring(0, 12);
  return `${prefix}_${short}`;
};

module.exports = { generateId, PREFIXES };
