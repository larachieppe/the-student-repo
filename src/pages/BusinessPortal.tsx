// BusinessPortal.tsx
import { useState } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import type { TabKey } from "../components/TabBusiness";

export default function BusinessPortal() {
  const [activeTab, setActiveTab] = useState<TabKey>("students");

  return (
    <div className="bg-white">
      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      <div className="min-h-[70vh] max-w-5xl mx-auto px-4 mt-10">
        {activeTab === "students" && (
          <div>
            <h1 className="text-xl font-semibold">Students</h1>
            <p>Students tab content here.</p>
          </div>
        )}

        {activeTab === "shortlist" && (
          <div>
            <h1 className="text-xl font-semibold">Shortlist</h1>
            <p>Content for the SHORTLIST tab goes here.</p>
          </div>
        )}

        {activeTab === "messages" && (
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
