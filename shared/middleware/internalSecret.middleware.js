/**
 * Internal-secret guard middleware.
 *
 * Protects /internal/* routes from unauthenticated callers.
 * All internal service-to-service calls must include the header:
 *   x-internal-secret: <INTERNAL_API_SECRET>
 *
 * Without this guard, anyone who discovers the Render service URL can call
 * POST /internal/commands and promote arbitrary users, flip isActive flags, etc.
 *
 * If INTERNAL_API_SECRET is not set, the service fails open with a warning
 * rather than blocking legitimate internal traffic during local development
 * where the var is often omitted. In production, the fail-fast check in
 * server.js should be extended to include INTERNAL_API_SECRET.
 */
const internalSecretGuard = (req, res, next) => {
  const expected = process.env.INTERNAL_API_SECRET;

  // If not configured, skip the check with a warning (dev-only convenience)
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      // In production, treat an unconfigured secret as a hard block
      return res.status(503).json({
        error: "Service misconfigured — INTERNAL_API_SECRET not set",
      });
    }
    return next();
  }

  const provided = req.headers["x-internal-secret"];
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized — invalid internal secret" });
  }

  next();
};

module.exports = internalSecretGuard;
