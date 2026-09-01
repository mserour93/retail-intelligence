import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, ReportIcon, AiIcon, FlagIcon, ActionIcon, MoreIcon, LogoutIcon, DataIcon, BuildingIcon } from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/reports", label: "Reports", icon: ReportIcon },
  { to: "/ask-ai", label: "Ask AI", icon: AiIcon },
  { to: "/red-flags", label: "Red Flags", icon: FlagIcon },
  { to: "/actions", label: "Actions", icon: ActionIcon },
];

const MORE_ITEMS = [
  { to: "/commercial", label: "Commercial Command Center", icon: BuildingIcon },
  { to: "/data-control-center", label: "Data Control Center", icon: DataIcon },
];

export function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-20 bg-primary text-primary-on shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center font-mono font-semibold">RI</div>
            <div>
              <p className="font-semibold leading-tight">Retail Control Tower</p>
              {currentUser && <p className="text-xs text-white/70 leading-tight">{currentUser.name} · {roleLabel(currentUser.role)}</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-sm text-white/80 hover:text-white cursor-pointer px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <LogoutIcon width={16} height={16} /> Switch persona
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        <nav className="hidden md:flex flex-col w-56 shrink-0 border-r border-border px-3 py-4 gap-1">
          {NAV_ITEMS.map((item) => (
            <SideNavLink key={item.to} {...item} />
          ))}
          <div className="h-px bg-border my-2" />
          {MORE_ITEMS.map((item) => (
            <SideNavLink key={item.to} {...item} />
          ))}
        </nav>

        <main className="flex-1 min-w-0 px-4 py-5 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-1.5 z-20">
        {NAV_ITEMS.map((item) => (
          <BottomNavLink key={item.to} {...item} />
        ))}
        <MoreMenuLink />
      </nav>
    </div>
  );
}

function SideNavLink({ to, label, icon: IconEl, end }: (typeof NAV_ITEMS)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          isActive ? "bg-muted text-primary" : "text-slate-600 hover:bg-muted/60"
        }`
      }
    >
      <IconEl width={18} height={18} />
      {label}
    </NavLink>
  );
}

function BottomNavLink({ to, label, icon: IconEl, end }: (typeof NAV_ITEMS)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-[11px] font-medium min-w-[44px] min-h-[44px] justify-center cursor-pointer ${
          isActive ? "text-primary" : "text-slate-500"
        }`
      }
    >
      <IconEl width={20} height={20} />
      {label}
    </NavLink>
  );
}

function MoreMenuLink() {
  return (
    <NavLink
      to="/more"
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-[11px] font-medium min-w-[44px] min-h-[44px] justify-center cursor-pointer ${
          isActive ? "text-primary" : "text-slate-500"
        }`
      }
    >
      <MoreIcon width={20} height={20} />
      More
    </NavLink>
  );
}

export function roleLabel(role: string) {
  return role
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export { MORE_ITEMS };
