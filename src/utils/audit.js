const { run } = require("../config/database");
const { logServerError } = require("./errors");

async function createAuditLog(req, entry) {
  // This saves one audit log entry for a sensitive action.
  const actor = req.session?.user || null;
  const actorEmail = entry.actorEmail || actor?.email || "Unknown";
  const actorRole = entry.actorRole || actor?.role || "Unknown";
  const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
  const entityId = entry.entityId ? String(entry.entityId) : null;
  const details = entry.details ? JSON.stringify(entry.details) : null;

  try {
    await run(
      `
        INSERT INTO audit_logs (
          actor_email,
          actor_role,
          action,
          entity_type,
          entity_id,
          details,
          ip_address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        actorEmail,
        actorRole,
        entry.action,
        entry.entityType,
        entityId,
        details,
        ipAddress,
      ]
    );
  } catch (error) {
    logServerError("audit:create", error);
  }
}

module.exports = {
  createAuditLog,
};
