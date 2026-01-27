import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";

const PROTECTED_PREFIXES = [
  "/student-portal",
  "/business-portal",
  "/admin-portal",
];

export default function LogoutRedirector() {
  const { session, loading } = useAuth(); // ✅ CHANGED: session not user
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // ✅ never touch callback
    if (location.pathname === "/auth/callback") return;

    const isProtected = PROTECTED_PREFIXES.some((p) =>
      location.pathname.startsWith(p)
    );

    // ✅ CHANGED: redirect to /login (not /) and only for protected routes
    if (isProtected && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, loading, location.pathname, navigate]);

  return null;
}
