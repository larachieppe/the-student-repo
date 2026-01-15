import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/form",
  "/submitted",
  "/auth/callback",
]);

export default function LogoutRedirector() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If logged out and currently on a non-public route, force home.
    if (!user && !PUBLIC_PATHS.has(location.pathname)) {
      navigate("/", { replace: true });

      // HashRouter sometimes keeps stale hash; force it too.
      if (window.location.hash !== "#/") {
        window.location.hash = "#/";
      }
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
}
