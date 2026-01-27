import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";

type Role = "student" | "business" | "admin";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("student");
  const { signInWithEmail, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "otp" | null>(null);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading("email");

    try {
      const cleanEmail = email.trim().toLowerCase();
      console.log("[Login] cleanEmail =", JSON.stringify(cleanEmail));

      const { error, redirectTo } = await signInWithEmail(cleanEmail, role);
      
      // Handle redirect case (e.g., student not found -> redirect to form)
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        return;
      }

      if (error) {
        console.error("[Supabase signInWithEmail error]", error);
        setErr(
          (error as any)?.message ??
            (error as any)?.error_description ??
            (error as any)?.error ??
            JSON.stringify(error)
        );
      } else {
        setSent(true);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading("otp");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();

      const { error, session } = await verifyOtp(cleanEmail, cleanOtp);
      if (error || !session) {
        console.error("[Supabase verifyOtp error]", error);
        setErr(
          (error as any)?.message ??
            (error as any)?.error_description ??
            (error as any)?.error ??
            "Verification failed. Please try again."
        );
      } else {
        localStorage.setItem("loginRole", role);
        navigate(`/${role}-portal`, { replace: true });
      }
    } finally {
      setLoading(null);
    }
  };

  const roles = [
    {
      name: "student" as const,
      label: "STUDENT",
    },
    {
      name: "business" as const,
      label: "BUSINESS",
    },
    {
      name: "admin" as const,
      label: "ADMIN",
    },
  ];

  return (
    <div className="bg-white">
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-10 rounded-2xl shadow-xl w-[500px] text-center bg-white border-brand-blue border-2">
          {/* Title */}
          <h1 className="font-mono font-semibold text-[30px] leading-none text-[#1e2015] tracking-[-1.2px]">
            LOGIN TO YOUR ACCOUNT
          </h1>

          {/* Role Selector */}
          <div className="flex justify-center gap-6 mb-6 mt-4">
            {roles.map((r) => (
              <button
                key={r.name}
                onClick={() => setRole(r.name)}
                type="button"
                className={`flex flex-col items-center justify-center border-2 rounded-xl px-8 py-5 w-32 transition-all ${
                  role === r.name
                    ? "border-blue-600 bg-brand-blue text-white"
                    : "border-blue-300 text-brand-blue hover:border-brand-blue"
                }`}
              >
                <span className="text-sm font-semibold">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Login Card */}
          <div className="border rounded-xl p-6 text-left">
            {/* Error & Success */}
            {err && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}

            {sent ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  A 6-digit code was sent to <b>{email}</b>. Enter it below to
                  sign in.
                </div>
                <form onSubmit={handleVerifyOtp}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code*
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full border rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-blue text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading === "otp" || otp.length !== 6}
                    className="w-full bg-brand-blue text-white py-2 rounded-lg hover:bg-brand-blue transition disabled:opacity-60 disabled:cursor-not-allowed flex justify-center"
                  >
                    {loading === "otp" ? "Verifying..." : "VERIFY CODE"}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setOtp("");
                    setErr(null);
                  }}
                  className="w-full border rounded-lg py-2 text-brand-blue hover:bg-gray-50 transition"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                {/* Email form */}
                <form onSubmit={handleEmail}>
                  {" "}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email*
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder="you@example.com"
                  />
                  <button
                    type="submit"
                    disabled={loading === "email" || email.trim() === ""}
                    className="w-full bg-brand-blue text-white py-2 rounded-lg hover:bg-brand-blue transition disabled:opacity-60 disabled:cursor-not-allowed flex justify-center"
                  >
                    {loading === "email" ? "Sending code..." : "CONTINUE"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
