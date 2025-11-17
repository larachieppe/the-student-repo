import { useRef } from "react";
import type { StudentTabKey } from "../tabTypes";

const tabDefs = [
  { key: "businesses", label: "BUSINESSES" },
  { key: "shortlist", label: "SHORTLIST" },
  { key: "edit-profile", label: "EDIT PROFILE" },
] as const;

export type TabKey = StudentTabKey;

type Props = {
  active: StudentTabKey;
  onChange: (key: StudentTabKey) => void;
};

export default function TabStudent({ active, onChange }: Props) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (dir: 1 | -1) => {
    const i = tabDefs.findIndex((t) => t.key === active);
    const next = (i + dir + tabDefs.length) % tabDefs.length;
    onChange(tabDefs[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="w-full max-w-5xl">
      <div
        role="tablist"
        aria-label="Business sections"
        className="flex items-center justify-center gap-10"
      >
        {tabDefs.map((t, i) => {
          const isActive = active === t.key;

          const base =
            "font-mono tracking-wide text-sm sm:text-base transition";
          const variant = isActive
            ? "font-normal text-black" // active = black
            : "font-normal text-gray-400"; // inactive = gray

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
              onClick={() => onChange(t.key)}
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
    </div>
  );
}
