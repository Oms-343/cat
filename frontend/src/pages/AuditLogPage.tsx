import { useEffect, useState } from "react";
import { exportAuditExcel, listAudit } from "../api/audit";
import { ApiError } from "../api/client";
import { ACTION_TYPES, RESOURCE_TYPES } from "../types/audit";
import type { AuditLogList } from "../types/audit";
import {
  Alert,
  Button,
  Card,
  Input,
  PageHeader,
  PageShell,
  Select,
} from "../components/ui";
import { formatAuditDetails } from "../utils/formatAuditDetails";
import { cn } from "../utils/cn";

const PAGE_SIZE = 25;

const roleStyles: Record<string, string> = {
  super: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  msme: "bg-green-100 text-green-800 border-green-200",
};

const actionStyles: Record<string, string> = {
  USER_LOGIN: "bg-slate-100 text-slate-700 border-slate-200",
  USER_CREATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  USER_UPDATED: "bg-blue-50 text-blue-800 border-blue-200",
  USER_DEACTIVATED: "bg-red-50 text-red-800 border-red-200",
  USER_PASSWORD_RESET: "bg-amber-50 text-amber-800 border-amber-200",
  COMPANY_CREATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPANY_UPDATED: "bg-blue-50 text-blue-800 border-blue-200",
  COMPANY_TAGGED: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  COMPANY_DELETED: "bg-red-50 text-red-800 border-red-200",
  MASTER_ENTRY_CREATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MASTER_ENTRY_UPDATED: "bg-blue-50 text-blue-800 border-blue-200",
  MASTER_ENTRY_DELETED: "bg-red-50 text-red-800 border-red-200",
};

function formatAuditTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AuditLogPage() {
  const [data, setData] = useState<AuditLogList | null>(null);
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    listAudit({
      action: action || undefined,
      resource_type: resourceType || undefined,
      user_email: userEmail || undefined,
      since: since || undefined,
      until: until || undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.detail : String(err)),
      )
      .finally(() => setLoading(false));
  }, [action, resourceType, userEmail, since, until, offset]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportAuditExcel({
        action: action || undefined,
        resource_type: resourceType || undefined,
        user_email: userEmail || undefined,
        since: since || undefined,
        until: until || undefined,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setAction("");
    setResourceType("");
    setUserEmail("");
    setSince("");
    setUntil("");
    setOffset(0);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const anyFilter = action || resourceType || userEmail || since || until;

  return (
    <PageShell width="lg">
      <PageHeader
        title="Audit Log"
        description="Every mutating action across the platform — logins, profile edits, tag changes, master updates, password resets."
        actions={
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
        }
      />

      <Card padding="sm" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            value={action}
            onChange={(e) => {
              setOffset(0);
              setAction(e.target.value);
            }}
          >
            <option value="">All actions</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Select
            value={resourceType}
            onChange={(e) => {
              setOffset(0);
              setResourceType(e.target.value);
            }}
          >
            <option value="">All resource types</option>
            {RESOURCE_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Input
            type="email"
            value={userEmail}
            onChange={(e) => {
              setOffset(0);
              setUserEmail(e.target.value);
            }}
            placeholder="User email"
          />
          <Input
            type="datetime-local"
            value={since}
            onChange={(e) => {
              setOffset(0);
              setSince(e.target.value);
            }}
            aria-label="Since"
          />
          <Input
            type="datetime-local"
            value={until}
            onChange={(e) => {
              setOffset(0);
              setUntil(e.target.value);
            }}
            aria-label="Until"
          />
        </div>
        {anyFilter && (
          <div className="mt-3">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted hover:text-ink underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </Card>

      <Card variant="elevated" padding="none" className="overflow-hidden">
        {error && (
          <Alert variant="error" className="rounded-none border-0 border-b">
            {error}
          </Alert>
        )}
        {loading && <p className="p-6 text-sm text-muted">Loading…</p>}

        {!loading && data && data.items.length === 0 && (
          <p className="p-6 text-sm text-muted text-center">
            No log entries match these filters.
          </p>
        )}

        {!loading && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted bg-surface-soft border-b border-hairline">
              <tr>
                <th className="py-2 px-4 w-36">Time</th>
                <th className="py-2 px-4">Action</th>
                <th className="py-2 px-4">Resource</th>
                <th className="py-2 px-4">Details</th>
                <th className="py-2 px-4">Who</th>
                <th className="py-2 px-4 w-24">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-hairline-soft last:border-0 hover:bg-surface-soft"
                >
                  <td
                    className="py-2 px-4 text-muted text-xs whitespace-nowrap"
                    title={new Date(r.timestamp).toLocaleString()}
                  >
                    {formatAuditTime(r.timestamp)}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase whitespace-nowrap",
                        actionStyles[r.action] ??
                          "bg-slate-50 text-slate-700 border-slate-200",
                      )}
                    >
                      {r.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-body">
                    <p
                      className="truncate max-w-44"
                      title={
                        r.resource_type
                          ? `${r.resource_name ?? "—"} · ${r.resource_type}`
                          : (r.resource_name ?? "—")
                      }
                    >
                      <span className="font-medium text-ink">
                        {r.resource_name ?? "—"}
                      </span>
                      {r.resource_type && (
                        <span className="text-muted text-xs">
                          {" "}
                          · {r.resource_type}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="py-2 px-4 text-muted text-xs">
                    {formatAuditDetails(r)}
                  </td>
                  <td className="py-2 px-4 text-body">
                    <p
                      className="truncate max-w-52"
                      title={
                        r.user_email
                          ? `${r.user_name ?? "—"} · ${r.user_email}`
                          : (r.user_name ?? "—")
                      }
                    >
                      <span className="font-medium text-ink">
                        {r.user_name ?? "—"}
                      </span>
                      {r.user_email && (
                        <span className="text-muted text-xs">
                          {" "}
                          · {r.user_email}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="py-2 px-4">
                    {r.user_role && (
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded border uppercase",
                          roleStyles[r.user_role] ?? "",
                        )}
                      >
                        {r.user_role}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-hairline text-sm">
            <p className="text-muted">
              Page {currentPage} of {totalPages} · {data.total.toLocaleString()}{" "}
              entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={offset + PAGE_SIZE >= data.total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
