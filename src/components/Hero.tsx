import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* soft lime glow */}
        <div className="absolute left-1/2 top-[-10%] h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-brand-blue blur-3xl" />
      </div>
      <div className="container-tight grid gap-8 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col items-start justify-center">
          <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
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
            <Link
              to="/form"
              className="rounded-xl bg-brand-blue px-5 py-3 text-white shadow-soft hover:brightness-95"
            >
              SUBMIT YOUR PROFILE
            </Link>
          </div>
          <div>
            <p className="mt-3 text-center text-xs text-brand-sub">
              Join 700+ hackers already in the network.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
