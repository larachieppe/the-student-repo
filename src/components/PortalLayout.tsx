import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import { TabKey } from "../tabTypes";

export default function PortalLayout() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>("students");

  useEffect(() => {
    if (location.pathname === "/student-portal") setActiveTab("companies");
    if (location.pathname === "/business-portal") setActiveTab("students");
  }, [location.pathname]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="flex-1">
        <Outlet context={{ activeTab, setActiveTab }} />
      </div>
      <Footer />
    </div>
  );
}
