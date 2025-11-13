import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      //Try to get role from metadata or from localStorage
      let role =
        user?.user_metadata?.role ||
        localStorage.getItem("loginRole") ||
        "student";

      //Persist role into Supabase user_metadata if it wasn’t already stored
      if (role && user && user.user_metadata?.role !== role) {
        await supabase.auth.updateUser({ data: { role } });
      }

      //Redirect user to correct portal
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
