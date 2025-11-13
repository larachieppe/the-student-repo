// NavBar.tsx
import logo from "../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logout from "../assets/logout.png";
import TabStudent from "./TabStudent";
import TabBusiness, { TabKey } from "./TabBusiness";

type NavBarProps = {
  activeTab: TabKey;
  onChangeTab: (key: TabKey) => void;
};

export default function NavBar({ activeTab, onChangeTab }: NavBarProps) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isStudentPortal = pathname === "/student-portal";
  const isBusinessPortal = pathname === "/business-portal";
  const { user, signOut } = useAuth();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white border-brand-line/60 backdrop-blur">
      <nav className="container-tight flex h-16 items-center justify-between">
        {/* logo */}
        <Link
          to="/"
          onClick={scrollToTop}
          className="group inline-flex items-center gap-2"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
            <img src={logo} alt="Logo" />
          </span>
          <span className="font-semibold tracking-tight font-sans">
            THE&nbsp;REPO
          </span>
        </Link>

        {/* center content */}
        {isHome && (
          <div className="hidden gap-6 text-sm text-brand-sub md:flex">
            {/* links... */}
          </div>
        )}

        {isStudentPortal && <TabStudent />}

        {isBusinessPortal && (
          <TabBusiness active={activeTab} onChange={onChangeTab} />
          //                   ^^^^^^^^^   ^^^^^^^^^^^^^ matches TabBusiness props
        )}

        {/* right side */}
        <div className="flex items-center gap-3">
          {!user ? (
            <Link
              className="hidden rounded-lg px-3 py-1.5 text-sm text-brand-text hover:border md:inline-block"
              to="/login"
            >
              LOG IN
            </Link>
          ) : (
            <>
              <div className="bg-brand-blue h-8 w-8">
                <img src={logout} width={30} height={30} />
              </div>
              <button
                onClick={() => {
                  signOut();
                  scrollToTop();
                }}
                className="hidden rounded-lg px-3 py-1.5 text-sm text-brand-text hover:border md:inline-block"
              >
                LOG OUT
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
