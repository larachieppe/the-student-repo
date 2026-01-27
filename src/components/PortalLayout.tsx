import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

export default function PortalLayout() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
