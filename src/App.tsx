import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import FormPage from "./pages/FormPage";
import LoginPage from "./pages/LoginPage";
import SubmittedPage from "./pages/SubmittedPage";
import AuthCallback from "./AuthCallback";
import BusinessPortal from "./pages/BusinessPortal";
import RCPortal from "./pages/RCPortal";
import RequireAuth from "./components/RequireAuth";
import StudentRedirectGate from "./components/StudentRedirectGate";
import PortalLayout from "./components/PortalLayout";
import LogoutRedirector from "./components/LogoutRedirector";

export default function App() {
  return (
    <>
      <LogoutRedirector />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/form" element={<FormPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/submitted" element={<SubmittedPage />} />
        </Route>

        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<PortalLayout />}>
          <Route
            path="/student-portal"
            element={
              <RequireAuth>
                <StudentRedirectGate />
              </RequireAuth>
            }
          />

          <Route
            path="/business-portal"
            element={
              <RequireAuth>
                <BusinessPortal />
              </RequireAuth>
            }
          />

          <Route
            path="/admin-portal"
            element={
              <RequireAuth>
                <RCPortal />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
