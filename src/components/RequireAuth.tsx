import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function RequireAuth(props: { children: React.ReactElement }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">Loading...</div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return props.children;
}
