// NavBar.tsx
import logo from "../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../useAuth";
import logout from "../assets/logout.png";
import type {
  TabKey,
  TabConfig,
  StudentTabKey,
  BusinessTabKey,
} from "../tabTypes";

type NavBarProps = {
  tabs?: TabConfig[];
  activeTab?: TabKey;
  onChangeTab?: (key: TabKey) => void;
};

export default function NavBar({ tabs, activeTab, onChangeTab }: NavBarProps) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isStudentPortal = pathname === "/student-portal";
  const isBusinessPortal = pathname === "/business-portal";
  const { user, signOut } = useAuth();

  const studentTabs: TabConfig<StudentTabKey>[] = [
    { key: "businesses", label: "BUSINESSES" },
    { key: "shortlist", label: "SHORTLIST" },
    { key: "edit-profile", label: "EDIT PROFILE" },
  ];

  const businessTabs: TabConfig<BusinessTabKey>[] = [
    { key: "students", label: "STUDENTS" },
    { key: "shortlist", label: "SHORTLIST" },
    { key: "messages", label: "MESSAGES" },
  ];

  let routeTabs = tabs;
  if (!tabs) {
    if (isStudentPortal) {
      routeTabs = studentTabs; // defined below with StudentTabKey
    } else if (isBusinessPortal) {
      routeTabs = businessTabs; // defined with BusinessTabKey
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white border-brand-line/60 backdrop-blur">
      <nav className="container-tight flex h-16 items-center justify-between">
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

        {routeTabs && onChangeTab && (
          <div className="hidden md:flex gap-4">
            {routeTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onChangeTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg ${
                  activeTab === tab.key
                    ? "text-gray-500 font-semibold"
                    : "text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* right side */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                className="hidden rounded-lg px-3 py-1.5 text-sm text-brand-text hover:border md:inline-block min-w-[80px]"
                to="/login"
              >
                LOG IN
              </Link>
              <Link
                className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm text-white hover:brightness-95 min-w-[180px] text-center"
                to="/form"
              >
                SUBMIT YOUR PROFILE
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  signOut();
                  scrollToTop();
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-brand-text hover:border md:inline-flex min-w-[80px]"
              >
                <img src={logout} width={20} height={20} alt="Logout" />
                <span>LOG OUT</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
