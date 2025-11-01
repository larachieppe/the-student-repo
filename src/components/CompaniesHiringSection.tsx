import { CompanyCard } from "./CompanyCard";

import ReplitLogo from "../assets/replit.png";
import StepfulLogo from "../assets/stepful.png";
import HandshakeLogo from "../assets/handshake.png";
import GPTZeroLogo from "../assets/gptzero.png";
import WorkWhileLogo from "../assets/workwhile.png";
import TeachShareLogo from "../assets/teachshare.png";

const logos = [
  { src: ReplitLogo, alt: "Replit", scale: 2.5 },
  { src: StepfulLogo, alt: "Stepful", scale: 1.0 },
  { src: HandshakeLogo, alt: "Handshake", scale: 1.0 },
  { src: GPTZeroLogo, alt: "GPTZero", scale: 1.0 },
  { src: WorkWhileLogo, alt: "WorkWhile", scale: 1.2 },
  { src: TeachShareLogo, alt: "TeachShare", scale: 1.2 },
];

export default function CompaniesHiringSection(): JSX.Element {
  return (
    <section id="partners" className="w-full px-4 py-16 text-[#0a0f0a]">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-[2.25rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.75rem]">
          COMPANIES HIRING IN OUR PORTFOLIO
        </h2>
        <p className="mt-6 mx-auto max-w-3xl text-lg leading-relaxed">
          Built for you. Curated by us. Shared directly with 130+ startups in
          our portfolio.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {logos.map((l) => (
          <CompanyCard key={l.alt}>
            {/* ↓ shorter card height */}
            <div className="flex h-24 sm:h-28 w-full items-center justify-center">
              {/* ↓ smaller logo base height (your per-logo scale() can stay) */}
              <div className="h-10 sm:h-12">
                <img
                  src={l.src}
                  alt={l.alt}
                  className="h-full w-auto object-contain origin-center"
                  style={{ transform: `scale(${l.scale ?? 1})` }}
                />
              </div>
            </div>
          </CompanyCard>
        ))}
      </div>
    </section>
  );
}
