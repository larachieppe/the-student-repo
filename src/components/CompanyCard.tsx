import * as React from "react";

interface CompanyCardProps {
  children: React.ReactNode;
}

export function CompanyCard({ children }: CompanyCardProps) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-[rgba(5,37,164,1)] px-8 py-10 text-center shadow-[0_0_0_2px_rgba(5,37,164,1)_inset]">
      <div className="text-4xl font-semibold leading-none text-[#0a0f0a]">
        {children}
      </div>
    </div>
  );
}