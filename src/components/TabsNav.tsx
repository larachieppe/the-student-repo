import { useState, useRef } from "react";

export default function TabsNav() {
  const tabDefs = [
    { key: "edit", label: "EDIT PROFILE" },
    { key: "businesses", label: "BUSINESSES" },
    { key: "saved", label: "SAVED" },
  ] as const;

  const [active, setActive] =
    useState<(typeof tabDefs)[number]["key"]>("businesses");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (dir: 1 | -1) => {
    const i = tabDefs.findIndex((t) => t.key === active);
    const next = (i + dir + tabDefs.length) % tabDefs.length;
    setActive(tabDefs[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Tablist */}
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10"
      >
        {tabDefs.map((t, i) => {
          const isActive = active === t.key;
          const base =
            "rounded-full px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-mono font-semibold tracking-wide border transition " +
            "focus:outline-none focus:ring-2 focus:ring-brand-blue";
          const variant = isActive
            ? "bg-brand-blue border-brand-blue text-[#E6FF8A]"
            : "bg-white border-blue-200 text-brand-blue hover:bg-blue-50";

          return (
            <button
              key={t.key}
              ref={(el) => (tabRefs.current[i] = el)}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={isActive}
              aria-controls={`panel-${t.key}`}
              tabIndex={isActive ? 0 : -1}
              className={`${base} ${variant}`}
              onClick={() => setActive(t.key)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") move(1);
                if (e.key === "ArrowLeft") move(-1);
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="mt-4 mb-4">
        {/* EDIT PROFILE */}
        <TabPanel id="edit" active={active}>
          <div className="rounded-2xl border border-brand-line p-6 md:p-8 bg-white shadow-soft">
            <h2 className="font-mono font-semibold text-lg mb-3">
              Edit your details
            </h2>
            <p className="text-sm text-brand-sub mb-4">
              Update your name, links, skills, and preferences.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="First name"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Last Name"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Email"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="School"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Graduation Year"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Major"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="GitHub Account"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="LinkedIn Account"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Type of Work"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Open to relocating?"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Which programming languages, frameworks, and technical areas are you proficient in?"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Which programming languages, frameworks, and technical areas are you proficient in?"
              />
              <input
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                placeholder="Humble flex, we want to hear the things you’re proud of! Any outlier things you have done in LIFE. Cool projects, hacks, viral moments, whatever you are most proud of. What non-traditional things were you doing growing up?"
              />
            </div>
            <button className="mt-5 px-5 py-2 rounded-lg bg-brand-blue text-white font-mono font-semibold hover:brightness-95">
              Save changes
            </button>
          </div>
        </TabPanel>

        {/* BUSINESSES */}
        <TabPanel id="businesses" active={active}>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-center">
            {[
              "Acme Labs",
              "Learnly",
              "NanoHealth",
              "BrightPath",
              "CodeSprout",
              "AtlasBio",
            ].map((n) => (
              <div
                key={n}
                className="rounded-2xl border-4 border-brand-blue/20 p-5 bg-white shadow-lg"
              >
                <p className="font-mono font-semibold">{n}</p>
                <p className="text-sm text-brand-sub mt-1">
                  Early-stage • Open roles
                </p>
                <button className="mt-4 text-xs px-3 py-1 rounded bg-brand-blue text-white font-mono hover:brightness-95">
                  View details
                </button>
              </div>
            ))}
          </div>
        </TabPanel>

        {/* SAVED */}
        <TabPanel id="saved" active={active}>
          <div className="rounded-2xl border border-brand-line p-6 bg-white">
            <p className="text-sm text-brand-sub">
              You haven’t saved anything yet. Browse{" "}
              <span className="font-mono">Businesses</span> and tap “Save”.
            </p>
          </div>
        </TabPanel>
      </div>
    </div>
  );
}

function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: string;
  children: React.ReactNode;
}) {
  const isActive = active === id;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      className="animate-[fadeIn_180ms_ease-out]"
    >
      {isActive && children}
    </div>
  );
}
