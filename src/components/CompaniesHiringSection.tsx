import * as React from "react";
import { CompanyCard } from "./CompanyCard";

import ReplitLogo from "../assets/replit.png";
import StepfulLogo from "../assets/stepful.png";
import HandshakeLogo from "../assets/handshake.png";
import GPTZeroLogo from "../assets/gptzero.png";
import WorkWhileLogo from "../assets/workwhile.png";
import TeachShareLogo from "../assets/teachshare.png";

const logos = [
  { src: ReplitLogo, alt: "Replit",      scale: 2.5 },
  { src: StepfulLogo, alt: "Stepful",    scale: 1.0 },
  { src: HandshakeLogo, alt: "Handshake",scale: 1.0 },
  { src: GPTZeroLogo, alt: "GPTZero",    scale: 1.0 },
  { src: WorkWhileLogo, alt: "WorkWhile",scale: 1.2 },
  { src: TeachShareLogo, alt: "TeachShare", scale: 1.2 },
];

export default function CompaniesHiringSection(): JSX.Element {
  return (
    <section className="w-full bg-white px-4 py-16 text-[#0a0f0a]">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-[2.25rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.75rem]">
          COMPANIES HIRING IN OUR PORTFOLIO
        </h2>
        <p className="mt-6 mx-auto max-w-3xl text-lg leading-relaxed">
          Built for you. Curated by us. Shared directly with 130+ startups in our portfolio.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {logos.map((l) => (
          <CompanyCard key={l.alt}>
            {/* fixed card height for perfect row alignment */}
            <div className="flex h-15 w-full items-center justify-center">
              {/* fixed logo box height; we scale inside this box */}
              <div className="h-16 sm:h-20">
                <img
                  src={l.src}
                  alt={l.alt}
                  className="h-full w-auto object-contain origin-center"
                  style={{ transform: `scale(${l.scale})` }}
                />
              </div>
            </div>
          </CompanyCard>
        ))}
      </div>
    </section>
  );
};