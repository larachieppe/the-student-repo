import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import type { TabKey } from "../tabTypes";

export default function PortalLayout() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>("students");

  useEffect(() => {
    if (location.pathname === "/student-portal") setActiveTab("businesses");
    if (location.pathname === "/business-portal") setActiveTab("students");
  }, [location.pathname]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
