import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../components/Layout";
import { LoadingState } from "../components/shared";

export function Login() {
  const { personas, login, loading } = useAuth();
  const navigate = useNavigate();

  function handleSelect(id: string) {
    login(id);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary text-primary-on flex items-center justify-center font-mono font-semibold text-lg mx-auto mb-3">RI</div>
          <h1 className="text-xl font-semibold text-foreground">Retail Control Tower</h1>
          <p className="text-sm text-slate-500 mt-1">
            Mock SSO — pick a persona to sign in. No password is required in this environment; a real deployment sits behind
            SSO and RBAC (see docs/SPEC.md §37).
          </p>
        </div>

        {loading ? (
          <LoadingState />
        ) : (
          <div className="space-y-2">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="w-full text-left bg-surface border border-border rounded-lg px-4 py-3 hover:border-primary hover:shadow-sm transition-all cursor-pointer flex items-center justify-between min-h-[44px]"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-slate-500">{roleLabel(p.role)}</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">{p.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
