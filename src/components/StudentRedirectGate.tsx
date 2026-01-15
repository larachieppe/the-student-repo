// StudentRedirectGate.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../useAuth";

export default function StudentRedirectGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run this gate ON the portal entry route
    if (location.pathname !== "/student-portal") return;

    // Wait until auth is settled
    if (loading) return;

    // If logged out, do nothing (RequireAuth will redirect)
    if (!user) return;

    let cancelled = false;

    const run = async () => {
      // 1) If we stored an id from LoginPage, use it (only while logged in)
      const storedId = localStorage.getItem("studentSubmissionId");
      if (storedId && !cancelled) {
        navigate(`/student/${storedId}`, { replace: true });
        return;
      }

      // 2) Fallback: look up by email
      const email = user.email?.toLowerCase();
      if (!email) return;

      const { data, error } = await supabase
        .from("submissions")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error(error);
        return;
      }

      if (data?.id) {
        navigate(`/student/${data.id}`, { replace: true });
      } else {
        navigate("/student-form", { replace: true });
      }
    };

    run();

    // Prevent navigation after logout / unmount
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate, location.pathname]);

  return null;
}
