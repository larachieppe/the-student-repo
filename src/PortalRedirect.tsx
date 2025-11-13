// src/components/PersistedPortalRedirect.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PortalRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const role =
      (user.user_metadata as any)?.role || localStorage.getItem("loginRole");

    // Only auto-redirect away from landing/login/callback
    if (
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/auth/callback"
    ) {
      if (role === "student") navigate("/student-portal", { replace: true });
      else if (role === "business")
        navigate("/business-portal", { replace: true });
      else if (role === "admin") navigate("/admin-portal", { replace: true });
    }
  }, [user, loading, pathname, navigate]);

  return null;
}
