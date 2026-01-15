import { createContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, role?: string) => Promise<{ error: any }>;
  signInWithProvider: (
    provider: "google" | "github"
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const signOutResolverRef = useRef<null | (() => void)>(null);

  // Load current session once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("[AUTH] getSession user:", data.session?.user?.id ?? null);
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log(
        "[AUTH] event:",
        event,
        "user:",
        sess?.user?.id ?? null,
        "hash:",
        window.location.hash
      );
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_OUT") {
        // resolve any pending signOut waits
        if (signOutResolverRef.current) {
          signOutResolverRef.current();
          signOutResolverRef.current = null;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send magic link; attach role & send user back to /auth/callback
  const signInWithEmail = async (email: string, role?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { role },
        emailRedirectTo: `${window.location.origin}${
          import.meta.env.BASE_URL
        }#/auth/callback`,
      },
    });

    if (error) {
      console.error("Supabase signInWithOtp error:", error);
    }
    return { error };
  };

  // OAuth → also return to /auth/callback for unified handling
  const signInWithProvider = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${
          import.meta.env.BASE_URL
        }#/auth/callback`,
      },
    });
    return { error };
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
        signInWithProvider,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
