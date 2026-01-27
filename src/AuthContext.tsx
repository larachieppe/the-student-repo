import { createContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, role?: string) => Promise<{ error: any }>;
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

  // Send magic link; attach role & send user back to /auth/callback
  const signInWithEmail = async (email: string) => {
    const basePath = window.location.pathname.endsWith("/")
      ? window.location.pathname
      : window.location.pathname + "/";

    const redirectTo = `${window.location.origin}${basePath}#/auth/callback`;
    console.log("[OTP redirectTo]", redirectTo);

    try {
      const res = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
