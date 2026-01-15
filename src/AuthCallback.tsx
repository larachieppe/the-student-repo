import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          console.error("[exchangeCodeForSession error]", error);
          navigate("/login", { replace: true });
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const role =
        user?.user_metadata?.role ||
        localStorage.getItem("loginRole") ||
        "student";

      if (user && user.user_metadata?.role !== role) {
        await supabase.auth.updateUser({ data: { role } });
      }

      localStorage.removeItem("loginRole");

      if (role === "student") navigate("/student-portal", { replace: true });
      else if (role === "business")
        navigate("/business-portal", { replace: true });
      else if (role === "admin") navigate("/admin-portal", { replace: true });
      else navigate("/", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center">Signing you in…</div>
  );
}
