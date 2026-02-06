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
    { key: "companies", label: "COMPANIES" },
    { key: "profile", label: "MY PROFILE" },
    { key: "messages", label: "MESSAGES" },
  ];

  const businessTabs: TabConfig<BusinessTabKey>[] = [
    { key: "students", label: "STUDENTS" },
    { key: "shortlist", label: "SHORTLIST" },
    { key: "messages", label: "MESSAGES" },
    { key: "profile", label: "PROFILE" },
  ];

  let routeTabs = tabs;
  if (!tabs) {
    if (isStudentPortal) {
      routeTabs = studentTabs;
    } else if (isBusinessPortal) {
      routeTabs = businessTabs;
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white border-brand-line/60 backdrop-blur">
      <nav className="container-tight flex h-16 items-center justify-between">
        {user ? (
          <div className="group inline-flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
              <img src={logo} alt="Logo" />
            </span>
            <span className="font-semibold tracking-tight font-sans">
              THE&nbsp;REPO
            </span>
          </div>
        ) : (
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
        )}

        {/* center content */}
        {isHome && (
          <div className="hidden gap-6 text-sm text-brand-sub md:flex">
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-brand-text"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("partners")}
              className="hover:text-brand-text"
            >
              Companies
            </button>
            <button
              onClick={() => scrollToSection("newsletter")}
              className="hover:text-brand-text"
            >
              Newsletter
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-brand-text"
            >
              FAQ
            </button>
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
          {isHome ? (
            /* Always show public buttons on home page */
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
          ) : !user ? (
            /* Not home and not logged in - show login/signup */
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
            /* Logged in and not on home page - show logout */
            <>
              <button
                onClick={async () => {
                  console.log("[LOGOUT] clicked", {
                    href: window.location.href,
                    hash: window.location.hash,
                  });

                  try {
                    // 1) call your app signOut
                    await signOut();
                    console.log("[LOGOUT] signOut() resolved");
                  } catch (e) {
                    console.error("[LOGOUT] signOut() threw", e);
                  } finally {
                    // 2) regardless of what happened, force home + hard reload
                    const target = `${import.meta.env.BASE_URL}#/`;
                    console.log("[LOGOUT] forcing redirect to", target);

                    window.location.assign(target);
                    window.location.reload();
                  }
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
