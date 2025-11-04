import logo from "../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function NavBar() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { user, signOut } = useAuth();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white border-brand-line/60 backdrop-blur font-mono">
      <nav className="container-tight flex h-16 items-center justify-between">
        <Link
          to="/"
          onClick={scrollToTop}
          className="group inline-flex items-center gap-2"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
            <img src={logo} alt="Logo" />
          </span>
          <span className="font-semibold tracking-tight">
            Reach&nbsp;Capital
          </span>
        </Link>
        {isHome && (
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
        )}

        <div className="flex items-center gap-3">
          {!user ? (
            <Link
              className="hidden rounded-lg px-3 py-1.5 text-sm text-brand-text hover:border md:inline-block"
              to="/login"
            >
              LOG IN
            </Link>
          ) : (
            <button
              onClick={() => {
                signOut();
                scrollToTop();
              }}
              className="hidden rounded-lg px-3 py-1.5 text-sm text-brand-text hover:border md:inline-block"
            >
              LOG OUT
            </button>
          )}
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
