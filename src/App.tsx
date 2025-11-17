import React from "react";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import FAQ from "./components/faq";
import FeatureGrid from "./components/FeatureGrid";
import { Link, Routes, Route } from "react-router-dom";
import FormPage from "./pages/FormPage";
import CompaniesHiringSection from "./components/CompaniesHiringSection";
import LoginPage from "./pages/LoginPage";
import SubmittedPage from "./pages/SubmittedPage";
import AuthCallback from "./AuthCallback";
import BusinessPortal from "./pages/BusinessPortal";
import RCPortal from "./pages/RCPortal";
import StudentRedirectGate from "./components/StudentRedirectGate";

function Section(props: {
  id?: string;
  eyebrow: string;
  title: string;
  copy: string;
  children?: React.ReactNode;
}) {
  const { id, eyebrow, title, copy, children } = props;
  const isBlue = id === "newsletter";

  return (
    <section
      id={id}
      className={`text-center border-t border-brand-line/60 py-16 md:py-20 ${
        isBlue ? "bg-brand-blue text-white" : "bg-white text-black"
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

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <NavBar />
            <main className="font-sans bg-white">
              <Hero />
              <Section
                id="about"
                eyebrow=""
                title="WHAT HAPPENS WHEN YOU DROP YOUR PROFILE?"
                copy="Built for you. Curated by us. Shared directly with 130+ startups in our portfolio."
              >
                <FeatureGrid />
              </Section>

              <CompaniesHiringSection />

              <Section
                id="newsletter"
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
                <Link
                  className="rounded-lg bg-brand-blue text-sm text-white hover:brightness-95 p-4"
                  to="/form"
                >
                  SUBMIT YOUR PROFILE
                </Link>
                <div className="mt-10">
                  <p className="mt-3 text-center text-xs text-brand-sub">
                    Free to join • No spam
                  </p>
                </div>
              </Section>
              <FAQ />
            </main>
            <Footer />
          </>
        }
      />
      <Route path="/form" element={<FormPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/submitted" element={<SubmittedPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/student-portal" element={<StudentRedirectGate />} />
      <Route path="/business-portal" element={<BusinessPortal />} />
      <Route path="/admin-portal" element={<RCPortal />} />
    </Routes>
  );
}
