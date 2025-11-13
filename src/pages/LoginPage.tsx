import { useState } from "react";
import adminImageBlue from "../assets/loginAdminBlue.png";
import adminImageYellow from "../assets/loginAdminYellow.png";
import businessImageBlue from "../assets/loginBusinessBlue.png";
import businessImageYellow from "../assets/loginBusinessYellow.png";
import studentImageBlue from "../assets/loginStudentBlue.png";
import studentImageYellow from "../assets/loginStudentYellow.png";
import googleImage from "../assets/loginGoogle.png";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
// import { Link } from "react-router-dom"; // 🔧 CHANGED: no direct nav on email submit
import { useAuth } from "../AuthContext";

type Role = "student" | "business" | "admin"; // ➕ NEW

export default function LoginPage() {
  const [role, setRole] = useState<Role>("student");
  const { signInWithEmail, signInWithProvider } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading("email");
    try {
      localStorage.setItem("loginRole", role);
      const { error } = await signInWithEmail(email, role);
      if (error) setErr(error.message);
      else setSent(true);
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setErr(null);
    setLoading("google");
    try {
      // keep the chosen role so we can stamp it after OAuth returns
      localStorage.setItem("loginRole", role);

      const { error } = await signInWithProvider("google");
      if (error) setErr(error.message);
      // no success state here — OAuth redirects away
    } finally {
      setLoading(null);
    }
  };

  const roles = [
    {
      name: "student" as const,
      label: "STUDENT",
      image:
        role === "student" ? (
          <img src={studentImageYellow} alt="Student" className="w-10 h-10" />
        ) : (
          <img src={studentImageBlue} alt="Student" className="w-10 h-10" />
        ),
    },
    {
      name: "business" as const,
      label: "BUSINESS",
      image:
        role === "business" ? (
          <img src={businessImageYellow} alt="Business" className="w-10 h-10" />
        ) : (
          <img src={businessImageBlue} alt="Business" className="w-10 h-10" />
        ),
    },
    {
      name: "admin" as const,
      label: "ADMIN",
      image:
        role === "admin" ? (
          <img src={adminImageYellow} alt="Admin" className="w-10 h-10" />
        ) : (
          <img src={adminImageBlue} alt="Admin" className="w-10 h-10" />
        ),
    },
  ];

  return (
    <div className="bg-white">
      <NavBar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-[500px] text-center">
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
                <div className="mb-1">{r.image}</div>
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
                  Magic link sent to <b>{email}</b>. Check your inbox to finish
                  signing in.
                </div>
                <button
                  type="button"
                  onClick={() => setSent(false)} // allow entering a different email
                  className="w-full border rounded-lg py-2 text-brand-blue hover:bg-gray-50 transition"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                {/* Google Sign-in */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading === "google"}
                  className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 mb-4 bg-brand-blue text-white hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <img
                    src={googleImage}
                    alt="Google icon"
                    className="w-5 h-5"
                  />
                  <span>
                    {loading === "google"
                      ? "Continuing..."
                      : "Continue with Google"}
                  </span>
                </button>

                <div className="flex items-center mb-4">
                  <hr className="flex-1 border-gray-300" />
                  <span className="text-gray-400 text-sm px-2">OR</span>
                  <hr className="flex-1 border-gray-300" />
                </div>

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
                    {loading === "email" ? "Sending link..." : "CONTINUE"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
