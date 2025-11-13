import { useState } from "react";

export default function FAQ() {
  const faqs = [
    {
      q: "filler text this would contain a FAQ",
      a: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae lectus at ipsum cursus feugiat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec convallis sapien vitae orci eleifend, at facilisis libero hendrerit. Integer in orci ac lacus vestibulum tempor.",
    },
    {
      q: "filler text this would contain a FAQ",
      a: "Suspendisse potenti. Cras non risus a odio vestibulum pulvinar. Vivamus dapibus, justo at tristique malesuada, turpis nibh elementum massa, nec pharetra mi augue nec metus.",
    },
    {
      q: "filler text this would contain a FAQ",
      a: "Praesent id sagittis nibh. Nulla facilisi. Aliquam erat volutpat. Pellentesque non urna euismod, aliquet arcu non, aliquet nunc.",
    },
    {
      q: "filler text this would contain a FAQ",
      a: "Curabitur ut sem id elit dapibus sodales. Integer vulputate libero sed arcu bibendum, a luctus odio ultrices. Quisque a accumsan magna.",
    },
    {
      q: "filler text this would contain a FAQ",
      a: "Mauris eu porttitor lorem. Aenean dignissim, arcu ut pretium mattis, urna arcu sollicitudin arcu, ut hendrerit leo nulla at velit.",
    },
    {
      q: "filler text this would contain a FAQ",
      a: "Nunc cursus, justo vitae dignissim porta, nunc augue rutrum lorem, vitae feugiat lectus augue nec enim. Donec fermentum ipsum non mi pretium ornare.",
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
