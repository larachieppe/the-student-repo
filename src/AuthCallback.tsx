import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [fatal, setFatal] = useState<string | null>(null);
  console.log("AUTH CALLBACK MOUNTED");

  useEffect(() => {
    (async () => {
      const hash = window.location.hash;
      const qs = hash.includes("?") ? hash.split("?")[1] : "";
      const code = new URLSearchParams(qs).get("code");

      if (!code) {
        setFatal("Missing code in callback URL.");
        return;
      }

      const { error: exchErr } = await supabase.auth.exchangeCodeForSession(
        code
      );
      if (exchErr) {
        setFatal(
          `exchangeCodeForSession failed: ${
            (exchErr as any)?.message ?? JSON.stringify(exchErr)
          }`
        );
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setFatal("No session created after exchange.");
        return;
      }

      navigate("/student-portal", { replace: true });
    })();
  }, [navigate]);

  if (fatal) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-xl w-full border rounded-xl p-4 bg-red-50 text-red-800">
          <div className="font-semibold mb-2">Login failed</div>
          <pre className="whitespace-pre-wrap text-sm">{fatal}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center">Signing you in…</div>
  );
}
