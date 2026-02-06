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
          .from("accounts")
          .select("role, email")
          .eq("email", cleanEmail)
          .maybeSingle();

        // If user exists in accounts table, check role
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
      } else if (role === "business") {
        // For business: check if email domain matches a company
        const emailDomain = cleanEmail.split("@")[1];
        
        if (!emailDomain) {
          return {
            error: {
              message: "Invalid email address format.",
            },
          };
        }

        // Check if domain exists in companies table
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id, name, email_domain")
          .eq("email_domain", emailDomain)
          .maybeSingle();

        if (companyError) {
          console.error("[Login] Error checking companies:", companyError);
          return { error: { message: "Error checking company records. Please try again." } };
        }

        // If domain doesn't match any company
        if (!company) {
          return {
            error: {
              message: "Your email domain is not associated with any partner company. Please contact support if you believe this is an error.",
            },
          };
        }

        // Domain matches a company, check if user already exists
        const { data: existingUser } = await supabase
          .from("accounts")
          .select("id, email, role, company_id")
          .eq("email", cleanEmail)
          .maybeSingle();

        // If user exists, check role
        if (existingUser) {
          if (existingUser.role !== "business") {
            return {
              error: {
                message: "You are logging in with the wrong button. Please select the correct role.",
              },
            };
          }
          // User exists and role is correct, update company_id if needed
          if (existingUser.company_id !== company.id) {
            await supabase
              .from("accounts")
              .update({ company_id: company.id })
              .eq("id", existingUser.id);
          }
        }

        // Send OTP - allow user creation if they don't exist yet
        const res = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
            data: {
              role: "business",
              company_id: company.id,
              company_name: company.name,
            },
          },
        });

        if (res.error) {
          console.error("[OTP] signInWithOtp error:", res.error);
          return { error: res.error };
        }

        // User record will be created in users table after OTP verification

        console.log("[OTP] signInWithOtp ok:", res.data);
        return { error: null };
      } else if (role === "admin") {
        // For admin: check if email domain is reachcapital.com, berkeley.edu, or gmail.com
        const emailDomain = cleanEmail.split("@")[1];
        const allowedAdminDomains = ["reachcapital.com", "berkeley.edu", "gmail.com"];

        if (!emailDomain) {
          return {
            error: {
              message: "Invalid email address format.",
            },
          };
        }

        // Check if email domain is allowed for admin access
        if (!allowedAdminDomains.includes(emailDomain)) {
          return {
            error: {
              message: "Admin access is restricted to Reach Capital, Berkeley, and Gmail email addresses.",
            },
          };
        }

        // Check if user already exists in accounts table
        const { data: existingUser } = await supabase
          .from("accounts")
          .select("id, email, role")
          .eq("email", cleanEmail)
          .maybeSingle();

        // If user exists, check role
        if (existingUser && existingUser.role !== "admin") {
          return {
            error: {
              message: "You are logging in with the wrong button. Please select the correct role.",
            },
          };
        }

        // Send OTP - allow user creation if they don't exist yet
        const res = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
            data: {
              role: "admin",
            },
          },
        });

        if (res.error) {
          console.error("[OTP] signInWithOtp error:", res.error);
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

        // Create or update user record in accounts table if needed
        if (res.data.user) {
          const userMetadata = res.data.user.user_metadata || {};
          const role = userMetadata.role || null;
          const companyId = userMetadata.company_id || null;

          // Check if user already exists
          const { data: existingUser } = await supabase
            .from("accounts")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (!existingUser && role) {
            // Create user record
            await supabase.from("accounts").upsert({
              id: res.data.user.id,
              email: email.toLowerCase(),
              role: role,
              company_id: companyId || null,
            });
          } else if (existingUser && companyId) {
            // Update company_id if it's missing
            await supabase
              .from("accounts")
              .update({ company_id: companyId })
              .eq("id", existingUser.id);
          }
        }

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
