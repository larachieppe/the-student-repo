import * as React from "react";

interface CompanyCardProps {
  children: React.ReactNode;
  /** Optional extra classes so we can tweak size from the parent grid */
  className?: string;
}

export function CompanyCard({ children, className = "" }: CompanyCardProps) {
  return (
    <div
      className={
        // ↓ smaller padding, same rounded corners & border
        "flex items-center justify-center rounded-xl border border-[rgba(5,37,164,1)] px-5 py-5 text-center " +
        "shadow-[0_0_0_2px_rgba(5,37,164,1)_inset] " +
        className
      }
    >
      {children}
    </div>
  );
}