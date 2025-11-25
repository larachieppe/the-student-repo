import type { Dispatch, SetStateAction } from "react";

export type SubtabKey = "humble" | "projects" | "bios";

export default function StudentsSubtabs({
  active,
  setActive,
}: {
  active: SubtabKey;
  setActive: Dispatch<SetStateAction<SubtabKey>>;
}) {
  const subtabs = [
    { key: "humble", label: "Humble Flex" },
    { key: "projects", label: "Side Projects" },
    { key: "bios", label: "Bios" },
  ] as const;

  return (
    <div className="inline-flex gap-2 rounded-xl border border-gray-200 bg-white">
      {subtabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-1.5 rounded-xl text-sm transition
                ${
                  isActive
                    ? "bg-brand-blue text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
