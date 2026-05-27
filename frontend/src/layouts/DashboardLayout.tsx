import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { EditRequestsPanel } from "../components/EditRequestsPanel";
import { NavIcon } from "../components/icons/navIcons";
import { Badge, Button } from "../components/ui";
import type { UserRole } from "../types/auth";

interface NavItem {
  to: string;
  label: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin"] },
  { to: "/companies", label: "Companies", roles: ["admin"] },
  { to: "/masters", label: "Master Data", roles: ["admin"] },
  { to: "/users", label: "Users", roles: ["admin"] },
  { to: "/onboarding-drives", label: "Onboarding Drives", roles: ["admin"] },
  { to: "/reports", label: "Reports", roles: ["admin"] },
  { to: "/audit-log", label: "Audit Log", roles: ["admin"] },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const visibleNav = navItems.filter(
    (n) => !n.roles || n.roles.includes(user.role),
  );

  return (
    <div className="h-dvh flex overflow-hidden bg-surface-soft">
      <aside className="w-60 shrink-0 flex flex-col h-full bg-surface-card border-r border-hairline">
        <div className="shrink-0 h-14 px-4 flex flex-col justify-center border-b border-hairline">
          <h1 className="text-sm font-semibold text-ink leading-tight">
            MSME Platform
          </h1>
          <p className="text-xs text-muted">TIDCO · Tamil Nadu</p>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-0.5">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-canvas text-ink shadow-sm"
                    : "text-body hover:bg-surface-strong/40 hover:text-ink"
                }`
              }
            >
              <NavIcon to={item.to} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-hairline px-4 py-3 bg-surface-card">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <Badge tone="neutral">{user.role}</Badge>
          </div>
          <Button variant="secondary" size="sm" fullWidth onClick={logout}>
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden bg-surface-soft">
        {user.role === "admin" && (
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 pt-4 pb-0">
            <EditRequestsPanel />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
