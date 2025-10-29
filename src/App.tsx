import React from "react";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import FAQ from "./components/Faq";
import FeatureGrid from "./components/FeatureGrid";

function Section(props: {
  id?: string;
  eyebrow: string;
  title: string;
  copy: string;
  children?: React.ReactNode;
}) {
  const { id, eyebrow, title, copy, children } = props;
  const isBlue = id === "blue";

  return (
    <section
      id={id}
      className={`text-center border-t border-brand-line/60 py-16 md:py-20 ${
        isBlue ? "bg-brand-blue text-white" : "bg-brand-bg text-black"
      }`}
    >
      <div className="container-tight">
        <div className="mb-8">
          <div className="mb-2 text-xs uppercase tracking-wide ">{eyebrow}</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h2>
          <div className="justify-center flex">
            <p className=" mt-3 max-w-prose">{copy}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function TwoColumns({
  leftTitle,
  leftBody,
  rightTitle,
  rightBody,
}: {
  leftTitle: string;
  leftBody: string;
  rightTitle: string;
  rightBody: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-brand-line bg-brand-blue p-6">
        <div className="mb-3 text-white font-semibold">{leftTitle}</div>
        <p className="text-white">{leftBody}</p>
        <a
          href="#students"
          className="mt-4 inline-block rounded-lg border border-brand-line px-3 py-2 text-sm hover:bg-brand-bg"
        >
          Learn more
        </a>
      </div>
      <div className="rounded-xl border border-brand-line bg-brand-blue p-6">
        <div className="mb-3 text-white font-semibold">{rightTitle}</div>
        <p className="text-white">{rightBody}</p>
        <a
          href="#businesses"
          className="mt-4 inline-block rounded-lg border border-brand-line px-3 py-2 text-sm hover:bg-brand-bg"
        >
          Explore
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <main className={"font-mono"}>
        <Hero />

        <Section
          eyebrow=""
          title="WHAT HAPPENS WHEN YOU DROP YOUR PROFILE?"
          copy="Built for you. Curated by us. Shared directly with 130+ startups in our portfolio."
        >
          <FeatureGrid />
        </Section>

        <Section
          id=""
          eyebrow=""
          title="COMPANIES HIRING IN OUR PORTFOLIO"
          copy="Create a profile that highlights projects, skills, and interests—then opt into opportunities that fit you."
        >
          <TwoColumns
            leftTitle="Own your profile"
            leftBody="Edit anytime, highlight projects and skills, and control what’s shared with partner companies."
            rightTitle="Precision filters"
            rightBody="Companies find you by stack, interests, and availability—so every conversation is higher-signal."
          />
        </Section>

        <Section
          id="blue"
          eyebrow=""
          title="STAY IN THE LOOP"
          copy="Get the latest opportunities, success stories, and community updates across learning, work and health delivered straight to your inbox."
        >
          <a
            className="rounded-lg bg-brand-lime text-sm text-brand-blue hover:brightness-95 p-4"
            href="#get-started"
          >
            SUBSCRIBE TO THE REPO NEWSLETTER →
          </a>
        </Section>

        <Section
          id=""
          eyebrow=""
          title="CHALLENGE ACCEPTED?"
          copy="Join hundreds of technical students building careers with innovative companies."
        >
          <a
            className="rounded-lg bg-brand-blue text-sm text-white hover:brightness-95 p-4"
            href="#get-started"
          >
            SUBMIT YOUR PROFILE
          </a>
        </Section>

        <FAQ />
      </main>
      <Footer />
    </>
  );
}
