import { useState } from "react";

export default function FAQ() {
  const faqs = [
    {
      q: "What's the history behind Reach Capital?",
      a: (
        <div className="space-y-2">
          <div>
            Reach Capital has its origins in NewSchools Venture Fund (NSVF), where our founding partners began working together and investing in early-stage education technology companies when they launched the NewSchools Seed fund in 2011 and the Zynga co.lab accelerator. The team made over 40 early-stage investments through that fund, including K-12 category leaders such as Newsela, Nearpod (acquired), SchoolMint (acquired), NoRedInk, ClassDojo, and Ellevation (acquired).
          </div>
          <div>
            To grow their impact and continue investing in companies transforming how people learn, grow, and thrive, they spun out of NSVF and founded Reach Capital in 2015. They picked the name Reach to signify the goal of expanding the reach of high-quality learning experiences that increase access to opportunity. Reach has since invested in over 140 companies across learning, health, and work—areas that are essential and interconnected in our mission to enable people to live their best lives.
          </div>
        </div>
      ),
    },
    {
      q: "What stages do we invest in?",
      a: "We are an early-stage venture capital firm that typically makes initial investments in Pre-seed, Seed, and Series A rounds.",
    },
    {
      q: "What is our investment timeline?",
      a: "A key element of our investment strategy is our ability to make investment decisions in a timely and efficient manner. We apply a high standard of due diligence when evaluating potential investments, but are nimble and can move quickly when necessary.",
    },
    {
      q: "How much do we typically invest?",
      a: "Our check size depends on the stage of the financing round and the company's business model. It typically ranges from $100K for Pre-seed to upwards of $12 million for later-stage startups.",
    },
    {
      q: "How can you get in touch with us?",
      a: (
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Need marketing collateral? Find our media kit{" "}
            <a
              href="https://reachcapital.notion.site/reach-capital-media-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              here
            </a>
            .
          </li>
          <li>
            Have general questions about early-stage venture capital financing? Email us{" "}
            <a
              href="mailto:info@reachcapital.com"
              className="underline hover:opacity-80"
            >
              here
            </a>
            .
          </li>
          <li>
            Want to know what's happening at Reach? Subscribe to our newsletter{" "}
            <a
              href="https://thewire.reachcapital.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              here
            </a>
            .
          </li>
        </ul>
      ),
    },
    {
      q: "How can I find a job at a Reach portfolio company?",
      a: (
        <div className="space-y-2">
          <div>
            Check out openings at our portfolio companies{" "}
            <a
              href="https://jobs.reachcapital.com/companies"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              here
            </a>
            .
          </div>
          <div>
            We also have a jobs community for early-stage technical talent{" "}
            <a
              href="https://repo.reachcapital.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              here
            </a>
            .
          </div>
        </div>
      ),
    },
  ];

  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="border-t py-16 md:py-20">
      <div className="container-tight">
        <div className="rounded-2xl border border-brand-line bg-gradient-to-br bg-brand-blue p-8 text-center shadow-soft">
          <h3 className="font text-2xl font-bold text-white">FAQ</h3>
          <p className="mx-auto mt-2 max-w-prose text-white">
            Common questions about how the Repo network helps you.
          </p>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            {faqs.map((item, index) => {
              const isOpen = openSet.has(index);
              return (
                <div key={index} className="border-b border-white/30">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between gap-4 py-3 text-left font text-lg font-bold text-white hover:opacity-80 focus:outline-none"
                  >
                    <span>
                      {isOpen ? "-" : "+"} {item.q}
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${index}`}
                    role="region"
                    className={`${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    } grid transition-all duration-200 ease-out`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-3 text-sm text-white/80">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
