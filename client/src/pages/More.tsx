import { Link, useNavigate } from "react-router-dom";
import { MORE_ITEMS } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { LogoutIcon } from "../components/icons";

export function More() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-3">More</h1>
      <div className="space-y-2">
        {MORE_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 min-h-[44px] hover:border-primary transition-colors"
          >
            <item.icon width={18} height={18} className="text-primary" />
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 min-h-[44px] cursor-pointer text-destructive"
        >
          <LogoutIcon width={18} height={18} />
          <span className="text-sm font-medium">Switch persona</span>
        </button>
      </div>
    </div>
  );
}
