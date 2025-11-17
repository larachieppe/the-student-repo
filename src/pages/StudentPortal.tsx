import { useState } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import type { TabKey } from "../tabTypes";

export default function StudentPortal() {
  const [activeTab, setActiveTab] = useState<TabKey>("businesses");

  return (
    <div className="bg-white">
      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      <div className="min-h-[70vh] max-w-5xl mx-auto px-4 mt-10">
        {activeTab === "businesses" && (
          <div>
            <h1 className="text-xl font-semibold">Businesses</h1>
            <p>Business tab content here.</p>
          </div>
        )}

        {activeTab === "shortlist" && (
          <div>
            <h1 className="text-xl font-semibold">Shortlist</h1>
            <p>Content for the SHORTLIST tab goes here.</p>
          </div>
        )}

        {activeTab === "edit-profile" && (
          <div>
            <h1 className="text-xl font-semibold">Messages</h1>
            <p>Content for the MESSAGES tab goes here.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
