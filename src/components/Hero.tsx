export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* soft lime glow */}
        <div className="absolute left-1/2 top-[-10%] h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-brand-blue/10 blur-3xl" />
      </div>

      <div className="container-tight grid gap-8 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col items-start justify-center">
          <h1 className="mb-5 font-mono text-4xl font-bold tracking-tight md:text-5xl">
            JOIN THE STUDENT REPO
          </h1>

          <p className="mb-8 max-w-prose text-brand-text">
            Reach Capital invests in early-stage founders redefining how we
            learn, live, and work. Our portfolio of 130+ startups are constantly
            on the lookout for talented builders like you. Share what you're
            studying, building, or exploring, and we'll connect you with
            career-defining opportunities.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#get-started"
              className="rounded-xl bg-brand-blue px-5 py-3 text-white shadow-soft hover:brightness-95"
            >
              SUBMIT YOUR PROFILE
            </a>
          </div>
          <div>
            <p className="mt-3 text-center text-xs text-brand-sub">
              Join 700+ hackers already in the network.
            </p>
          </div>
        </div>
        {/*
        <div className="relative">
          <div className="rounded-2xl border border-brand-line bg-gradient-to-b from-[#12151C] to-[#0B0D12] p-4 shadow-soft">
            
            <div className="rounded-xl border border-brand-line bg-brand-bg p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-mono text-sm text-brand-sub">/Search</div>
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-lime/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-sub/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-sub/40" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 rounded-lg border border-brand-line/60 p-3">
                  <div className="text-xs uppercase tracking-wide text-brand-sub">
                    Filter
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    {[
                      "Role: SWE",
                      "Experience: 1-2y",
                      "Location: Remote",
                      "Stack: React",
                    ].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-md bg-brand-blue px-2 py-1 text-brand-text/90 ring-1 ring-brand-line"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-brand-line/60 p-3 hover:border-brand-lime/50"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold">Candidate #{i}</span>
                      <span className="rounded-md bg-brand-lime/15 px-2 py-0.5 text-xs text-brand-lime ring-1 ring-brand-lime/40">
                        Match {76 + i}%
                      </span>
                    </div>
                    <p className="text-sm text-brand-sub">
                      React • TypeScript • Postgres
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        
        </div>
        */}
      </div>
    </section>
  );
}
