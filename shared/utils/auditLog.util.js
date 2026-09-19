const logger = require("./logger");

/**
 * Sends a security event to the superadmin-backend's append-only audit log.
 * Fire-and-forget: if the call fails, it logs locally but does NOT throw —
 * a logging failure must never block or crash the main operation.
 *
 * In the 4-cluster architecture, audit logs live on a completely separate
 * cluster (greencard-superadmin). Even if an attacker compromises this
 * service's cluster, they cannot reach or delete the audit trail.
 *
 * @param {object} opts
 * @param {string} opts.action        - Event name e.g. "ORDER_INTEGRITY_FAILURE"
 * @param {string} opts.performedBy   - publicId of the actor
 * @param {string} [opts.targetEntity] - Entity type e.g. "order"
 * @param {string} [opts.targetId]    - publicId of the affected entity
 * @param {"INFO"|"WARNING"|"CRITICAL"} [opts.severity]
 * @param {object} [opts.metadata]    - Any extra context
 * @param {string} [opts.ipAddress]
 */
const logSecurityEvent = async ({
  action,
  performedBy,
  targetEntity,
  targetId,
  severity = "INFO",
  metadata = {},
  ipAddress,
}) => {
  const superadminUrl = process.env.SUPERADMIN_BACKEND_INTERNAL_URL;
  if (!superadminUrl) {
    logger.warn("logSecurityEvent: SUPERADMIN_BACKEND_INTERNAL_URL not set — audit log not sent", { action, severity });
    return;
  }

  try {
    await fetch(`${superadminUrl}/internal/audit`, {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
      },
      body:   JSON.stringify({ action, performedBy, targetEntity, targetId, severity, metadata, ipAddress }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    // Log locally — never crash the caller
    logger.error("logSecurityEvent: failed to write to superadmin audit log", {
      action,
      severity,
      error: err.message,
    });
  }
};

module.exports = { logSecurityEvent };
