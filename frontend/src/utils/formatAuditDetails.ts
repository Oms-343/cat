import type { AuditLogEntry } from "../types/audit";

function normalizeDetails(details: unknown): Record<string, unknown> {
  if (!details) return {};
  if (typeof details === "string") {
    try {
      const parsed: unknown = JSON.parse(details);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof details === "object" && !Array.isArray(details)) {
    return details as Record<string, unknown>;
  }
  return {};
}

function formatFilterValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatFilters(filters: unknown): string {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    return "";
  }
  const parts = Object.entries(filters as Record<string, unknown>)
    .map(([key, value]) => {
      const formatted = formatFilterValue(value);
      if (!formatted) return "";
      const label = key.replace(/_/g, " ");
      return `${label}: ${formatted}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "";
}

function formatKeyValues(d: Record<string, unknown>): string {
  return Object.entries(d)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ");
      if (Array.isArray(value)) {
        return `${label}: ${value.join(", ")}`;
      }
      if (value && typeof value === "object") {
        const nested = formatFilters(value);
        return nested ? `${label}: ${nested}` : label;
      }
      if (typeof value === "boolean") {
        return `${label}: ${value ? "yes" : "no"}`;
      }
      return `${label}: ${String(value)}`;
    })
    .join(" · ");
}

/** Human-readable summary for audit log detail payloads. */
export function formatAuditDetails(entry: AuditLogEntry): string {
  const d = normalizeDetails(entry.details);
  if (Object.keys(d).length === 0) return "";

  if (entry.action === "REPORT_EXPORTED") {
    const parts: string[] = [];
    if (typeof d.row_count === "number") {
      const n = d.row_count;
      parts.push(`${n.toLocaleString()} row${n === 1 ? "" : "s"}`);
    }
    if (typeof d.format === "string") {
      parts.push(d.format.toUpperCase());
    }
    const filters = formatFilters(d.filters);
    if (filters) parts.push(filters);
    return parts.join(" · ") || "Export";
  }

  if (entry.action === "COMPANY_CREATED") {
    const parts: string[] = [];
    if (d.sector) parts.push(`Sector ${d.sector}`);
    if (d.district) parts.push(`District ${d.district}`);
    return parts.join(" · ");
  }

  if (entry.action === "COMPANY_TAGGED") {
    const before = (d.tags_before as string[]) ?? [];
    const after = (d.tags_after as string[]) ?? [];
    const added = after.filter((t) => !before.includes(t));
    const removed = before.filter((t) => !after.includes(t));
    const parts: string[] = [];
    if (added.length) parts.push(`+${added.join(", ")}`);
    if (removed.length) parts.push(`-${removed.join(", ")}`);
    return (
      parts.join(" · ") || `${after.length} tag${after.length === 1 ? "" : "s"}`
    );
  }

  if (Array.isArray(d.fields_changed)) {
    const fields = d.fields_changed as string[];
    return `${fields.length} field${fields.length === 1 ? "" : "s"} updated: ${fields.join(", ")}`;
  }

  if (typeof d.master_key === "string") {
    if (typeof d.created === "number" || typeof d.updated === "number") {
      const counts: string[] = [];
      if (typeof d.created === "number" && d.created > 0) {
        counts.push(`${d.created} created`);
      }
      if (typeof d.updated === "number" && d.updated > 0) {
        counts.push(`${d.updated} updated`);
      }
      if (counts.length) return `${d.master_key}: ${counts.join(", ")}`;
    }
    return `${d.master_key}${d.code ? ` · ${d.code}` : ""}`;
  }

  if (
    entry.action.startsWith("EDIT_REQUEST_") &&
    (d.request_id != null || d.fields || d.note)
  ) {
    const prefix =
      d.request_id != null ? `Request #${String(d.request_id)}` : "Request";
    if (Array.isArray(d.fields) && d.fields.length) {
      return `${prefix}: ${(d.fields as string[]).join(", ")}`;
    }
    if (typeof d.note === "string" && d.note.trim()) {
      return `${prefix}: ${d.note.trim()}`;
    }
    return prefix;
  }

  if (typeof d.target_user_email === "string") {
    return `For user ${d.target_user_email}`;
  }

  if (typeof d.role === "string") {
    const parts = [`Role: ${d.role}`];
    if (d.password_set_by_admin === true) {
      parts.push("temporary password set");
    }
    return parts.join(" · ");
  }

  if (d.section && d.operation) {
    const parts = [String(d.section), String(d.operation)];
    if (d.item_name) parts.push(String(d.item_name));
    return parts.join(" · ");
  }

  if (Array.isArray(d.tags) && d.tags.length) {
    return `Tags: ${(d.tags as string[]).join(", ")}`;
  }

  if (typeof d.cohort === "string" && typeof d.invites_created === "number") {
    return `${d.cohort}: ${d.invites_created} invite${d.invites_created === 1 ? "" : "s"}`;
  }

  if (typeof d.audience_label === "string" && typeof d.queued === "number") {
    const parts = [d.audience_label, `${d.queued} queued`];
    if (d.language_code) parts.push(String(d.language_code));
    return parts.join(" · ");
  }

  return formatKeyValues(d);
}
