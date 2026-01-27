import { createContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (
    email: string,
    role?: string
  ) => Promise<{ error: any; redirectTo?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any; session: Session | null }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current session once on mount
  useEffect(() => {
    const isAuthCallback = window.location.hash.includes("#/auth/callback");

    let timeoutId: number | undefined;
    if (isAuthCallback) {
      timeoutId = window.setTimeout(() => setLoading(false), 3000);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);

      if (isAuthCallback && !data.session) return;

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        setLoading(false);
      }

      // keep your upsert if you want
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Send 6-digit OTP code to email (no magic link)
  const signInWithEmail = async (email: string, role?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (role === "student") {
        // For students: check if email exists in submissions table
        const { data: submission, error: subError } = await supabase
          .from("submissions")
          .select("email")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (subError) {
          console.error("[Login] Error checking submissions:", subError);
          return { error: { message: "Error checking student records. Please try again." } };
        }

        // If email doesn't exist in submissions, redirect to form
        if (!submission) {
          return { error: null, redirectTo: "/form" };
        }

        // Email exists in submissions, now check if user exists in auth
        // Try to sign in - if user doesn't exist, Supabase will create them
        // But we need to verify the role matches
        const { data: existingUser } = await supabase
          .from("users")
          .select("role, email")
          .eq("email", cleanEmail)
          .maybeSingle();

        // If user exists in users table, check role
        if (existingUser && existingUser.role !== "student") {
          return {
            error: {
              message: "You are logging in with the wrong button. Please select the correct role.",
            },
          };
        }

        // Student exists and role is correct (or no role set yet), send OTP
        const res = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
          },
        });

        if (res.error) {
          console.error("[OTP] signInWithOtp error:", res.error);
          return { error: res.error };
        }

        console.log("[OTP] signInWithOtp ok:", res.data);
        return { error: null };
      } else if (role === "business" || role === "admin") {
        // For business/admin: check if email exists in users table with correct role
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("email, role")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (userError) {
          console.error("[Login] Error checking users:", userError);
          return { error: { message: "Error checking user records. Please try again." } };
        }

        // If email doesn't exist
        if (!user) {
          return {
            error: {
              message: `No ${role} account found with this email. Please contact support.`,
            },
          };
        }

        // Check if role matches
        if (user.role !== role) {
          return {
            error: {
              message: "You are logging in with the wrong button. Please select the correct role.",
            },
          };
        }

        // Role matches, send OTP
        const res = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false, // Don't create new users for business/admin
          },
        });

        if (res.error) {
          console.error("[OTP] signInWithOtp error:", res.error);
          // If user doesn't exist in auth but exists in users table, that's an error
          if (res.error.message?.includes("not found") || res.error.message?.includes("does not exist")) {
            return {
              error: {
                message: "Account not found. Please contact support to set up your account.",
              },
            };
          }
          return { error: res.error };
        }

        console.log("[OTP] signInWithOtp ok:", res.data);
        return { error: null };
      }

      // Default: send OTP without role check (fallback)
      const res = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (res.error) {
        console.error("[OTP] signInWithOtp error:", res.error);
      } else {
        console.log("[OTP] signInWithOtp ok:", res.data);
      }

      return { error: res.error };
    } catch (e) {
      console.error("[OTP] signInWithOtp threw:", e);
      return { error: e };
    }
  };

  // Verify 6-digit OTP code
  const verifyOtp = async (email: string, token: string) => {
    try {
      const res = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (res.error) {
        console.error("[OTP] verifyOtp error:", res.error);
        return { error: res.error, session: null };
      } else {
        console.log("[OTP] verifyOtp ok:", res.data);
        setSession(res.data.session);
        setUser(res.data.user);
        return { error: null, session: res.data.session };
      }
    } catch (e) {
      console.error("[OTP] verifyOtp threw:", e);
      return { error: e, session: null };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("loginRole");
    localStorage.removeItem("studentSubmissionId");

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Immediately update app state
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
