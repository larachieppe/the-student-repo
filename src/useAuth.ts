import { useContext } from "react";
import { AuthContext } from "./AuthContext"; // adjust path if needed
import type { AuthContextType } from "./AuthContext";

export const useAuth = () => {
  const ctx = useContext<AuthContextType | null>(AuthContext as any);
  // if you want, you can add a safety check:
  // if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx!;
};
