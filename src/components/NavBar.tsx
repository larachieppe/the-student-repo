import logo from "../assets/logo.png";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-line/60 backdrop-blur supports-[backdrop-filter]:bg-brand-bg/70 font-mono">
      <nav className="container-tight flex h-16 items-center justify-between">
        <a href="#" className="group inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
            <img src={logo} alt="Logo" />
          </span>
          <span className="font-semibold tracking-tight">
            Reach&nbsp;Capital
          </span>
        </a>

        <div className="hidden gap-6 text-sm text-brand-sub md:flex">
          <a href="#students" className="hover:text-brand-text">
            About
          </a>
          <a href="#businesses" className="hover:text-brand-text">
            Partners
          </a>
          <a href="#about" className="hover:text-brand-text">
            Newsletter
          </a>
          <a href="#about" className="hover:text-brand-text">
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
          <a
            className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm text-white hover:brightness-95"
            href="#get-started"
          >
            SUBMIT YOUR PROFILE
          </a>
        </div>
      </nav>
    </header>
  );
}
