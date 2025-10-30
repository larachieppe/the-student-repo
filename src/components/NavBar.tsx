import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-line/60 backdrop-blur supports-[backdrop-filter]:bg-brand-bg/70 font-mono">
      <nav className="container-tight flex h-16 items-center justify-between">
        <a href="#home" className="group inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
            <img src={logo} alt="Logo" />
          </span>
          <span className="font-semibold tracking-tight">
            Reach&nbsp;Capital
          </span>
        </a>

        <div className="hidden gap-6 text-sm text-brand-sub md:flex">
          <a href="#about" className="hover:text-brand-text">
            About
          </a>
          <a href="#partners" className="hover:text-brand-text">
            Partners
          </a>
          <a href="#newsletter" className="hover:text-brand-text">
            Newsletter
          </a>
          <a href="#faq" className="hover:text-brand-text">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a
            className="hidden rounded-lg border px-3 py-1.5 text-sm text-brand-text hover:bg-brand-blue md:inline-block"
            href="#login"
          >
            LOG IN
          </a>
          <Link
            className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm text-white hover:brightness-95"
            to="/form"
          >
            SUBMIT YOUR PROFILE
          </Link>
        </div>
      </nav>
    </header>
  );
}
