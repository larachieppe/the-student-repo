// StudentRedirectGate.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../useAuth";

export default function StudentRedirectGate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      // If we stored an id from LoginPage, use it
      const storedId = localStorage.getItem("studentSubmissionId");
      if (storedId) {
        navigate(`/student/${storedId}`);
        return;
      }

      // Fallback: look up by email
      const email = user.email?.toLowerCase();
      if (!email) return;

      const { data, error } = await supabase
        .from("submissions")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        navigate(`/student/${data.id}`);
      } else {
        // No profile found → maybe send to form page
        navigate("/student-form");
      }
    };

    run();
  }, [user, navigate]);

  return null; // just a redirect gate, no UI needed
}
