import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import type { TabKey } from "../tabTypes";
import StudentsSubtabs, { SubtabKey } from "../components/StudentSubtabs";
import FlexComponent from "../components/FlexComponent";
import ProjectCard from "../components/ProjectComponent";
import BiosSection from "../components/BioSection";
import MessagesSection from "../components/ConversationComponent";
import { supabase } from "../supabase";
import { useAuth } from "../useAuth";
import { Navigate } from "react-router-dom";

interface HumbleFlexSubmission {
  id: string;
  first_name: string;
  last_name: string;
  school: string;
  graduation_year: string;
  flex: string;
  skills: string[];
  email: string;
}

type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  projectImage?: string;
  projectUrl?: string;
  authorName: string;
  authorSchool: string;
  studentId: string;
};

type SubmissionRow = {
  id: string;
  first_name: string;
  last_name: string;
  school: string;
  graduation_year: string;
  side_projects: string | null;
  side_project_link?: string | null;
  skills?: string[] | null;
  github?: string | null;
};

type StudentProfile = {
  id: string;
  name: string;
  school: string;
};

export default function RCPortal() {
  const [activeTab, setActiveTab] = useState<TabKey>("students");
  const [activeSubtab, setActiveSubtab] = useState<SubtabKey>("humble");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [profilesCount, setProfilesCount] = useState<number | null>(null);
  const [humbleFlexSubmissions, setHumbleFlexSubmissions] = useState<
    HumbleFlexSubmission[]
  >([]);
  const [loadingFlex, setLoadingFlex] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [initialConversationId, setInitialConversationId] = useState<
    string | null
  >(null);
  const [shortlist, setShortlist] = useState<StudentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentAccountCount, setStudentAccountCount] = useState<number | null>(null);
  const [businessAccountCount, setBusinessAccountCount] = useState<number | null>(null);
  const [totalCompaniesCount, setTotalCompaniesCount] = useState<number | null>(null);
  const { user } = useAuth();

  // Phase 1 Analytics states
  const [analytics, setAnalytics] = useState({
    totalShortlists: 0,
    totalIntroductions: 0,
    totalInterviewing: 0,
    conversionRateInterviewingFromShortlists: 0, // interviewing / shortlists (0..1)
    companyActivity: [] as Array<{
      companyName: string;
      conversations: number;
      shortlists: number;
      interviewing: number;
      conversionRateInterviewingFromShortlists: number; // 0..1
    }>,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Accounts management states
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsSearchTerm, setAccountsSearchTerm] = useState("");
  const [accountsFilter, setAccountsFilter] = useState<"all" | "student" | "business" | "admin">("all");

  // Pagination states
  const [flexCurrentPage, setFlexCurrentPage] = useState(1);
  const [projectsCurrentPage, setProjectsCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when filters change
  useEffect(() => {
    setFlexCurrentPage(1);
  }, [searchTerm, sortOrder, activeSubtab]);

  useEffect(() => {
    setProjectsCurrentPage(1);
  }, [searchTerm, sortOrder, activeSubtab]);

  // Calculate pagination for Humble Flex
  const flexTotalPages = Math.ceil(humbleFlexSubmissions.length / itemsPerPage);
  const flexIndexOfLast = flexCurrentPage * itemsPerPage;
  const flexIndexOfFirst = flexIndexOfLast - itemsPerPage;
  const currentFlexSubmissions = humbleFlexSubmissions.slice(
    flexIndexOfFirst,
    flexIndexOfLast
  );

  // Calculate pagination for Projects
  const projectsTotalPages = Math.ceil(projects.length / itemsPerPage);
  const projectsIndexOfLast = projectsCurrentPage * itemsPerPage;
  const projectsIndexOfFirst = projectsIndexOfLast - itemsPerPage;
  const currentProjects = projects.slice(
    projectsIndexOfFirst,
    projectsIndexOfLast
  );

  const toggleShortlist = (student: StudentProfile) => {
    setShortlist((current) => {
      const alreadyInList = current.some((s) => s.id === student.id);

      if (alreadyInList) {
        return current.filter((s) => s.id !== student.id);
      }

      return [...current, student];
    });
  };

  const handleStartConversation = async (studentId: string) => {
    if (!user) return; // not logged in

    // assume conversations table has business_id & student_id with a UNIQUE constraint on (business_id, student_id)
    const { data, error } = await supabase
      .from("conversations")
      .upsert(
        {
          business_id: user.id,
          student_id: studentId,
        },
        { onConflict: "business_id,student_id" }
      )
      .select("id")
      .single();

    if (error) {
      console.error("Error starting conversation", error);
      return;
    }

    setInitialConversationId(data.id);
    setActiveTab("messages");
  };

  // Parse side_projects text into project objects
  const parseProjects = (submissions: SubmissionRow[]): Project[] => {
    const parsedProjects: Project[] = [];

    submissions.forEach((submission) => {
      if (!submission.side_projects || !submission.side_projects.trim()) {
        return;
      }

      const authorName = `${submission.first_name} ${submission.last_name}`;
      const graduationYear = submission.graduation_year?.slice(-2) || "";
      const authorSchool = `${submission.school}${
        graduationYear ? ` '${graduationYear}` : ""
      }`;

      const projectText = submission.side_projects.trim();

      // Use side_project_link from database, fallback to extracting from text
      let projectUrl = submission.side_project_link || undefined;

      // If no link in database, try to extract URL from text
      if (!projectUrl) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = projectText.match(urlRegex) || [];
        projectUrl = urls[0] || undefined;
      }

      // Remove URLs from description if they were in the text
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let description = projectText.replace(urlRegex, "").trim();

      // Try to extract title (first line if it's short, otherwise use default)
      const lines = description.split("\n").filter((line) => line.trim());
      let title = "Side Project";
      let finalDescription = description;

      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // If first line is short and doesn't end with punctuation, treat as title
        if (firstLine.length < 60 && !firstLine.match(/[.!?]$/)) {
          title = firstLine;
          finalDescription = lines.slice(1).join("\n").trim() || firstLine;
        } else {
          finalDescription = description;
        }
      }

      // Use skills as tags, or extract from description if no skills
      const tags =
        submission.skills && submission.skills.length > 0
          ? submission.skills
          : [];

      parsedProjects.push({
        id: `${submission.id}-project`,
        title,
        description: finalDescription,
        tags,
        projectUrl,
        authorName,
        authorSchool,
        studentId: submission.id,
      });
    });

    return parsedProjects;
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const loadCount = async () => {
      const { count, error } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error("Error loading submissions count", error);
        return;
      }

      setProfilesCount(count ?? 0);
    };

    loadCount();
  }, []);

  useEffect(() => {
    const loadAccountCounts = async () => {
      const [studentResult, businessResult, companiesResult] = await Promise.all([
        supabase
          .from("accounts")
          .select("*", { count: "exact" })
          .eq("role", "student"),
        supabase
          .from("accounts")
          .select("*", { count: "exact" })
          .eq("role", "business"),
        supabase
          .from("companies")
          .select("*", { count: "exact" }),
      ]);

      if (studentResult.error) {
        console.error(
          "Error loading student accounts count",
          studentResult.error
        );
      } else {
        setStudentAccountCount(studentResult.count ?? 0);
      }

      if (businessResult.error) {
        console.error(
          "Error loading business accounts count",
          businessResult.error
        );
      } else {
        setBusinessAccountCount(businessResult.count ?? 0);
      }

      if (companiesResult.error) {
        console.error("Error loading companies count", companiesResult.error);
      } else {
        setTotalCompaniesCount(companiesResult.count ?? 0);
      }
    };

    loadAccountCounts();
  }, [user]);

  // Load Phase 1 Analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      if (activeTab !== "analytics") {
        return;
      }

      setAnalyticsLoading(true);
      try {
        // Get total shortlists
        const { count: shortlistCount } = await supabase
          .from("shortlists")
          .select("*", { count: "exact", head: true });

        // Get total introductions (conversations with company_id and student_id)
        const { count: introCount } = await supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .not("company_id", "is", null)
          .not("student_id", "is", null);

        // Get total students in interviewing stage (from pipeline)
        const { count: interviewingCount, error: interviewingError } = await supabase
          .from("student_pipeline")
          .select("*", { count: "exact", head: true })
          .eq("stage", "interviewing");

        // Get company activity (top companies by conversations and shortlists)
        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("company_id")
          .not("company_id", "is", null);

        const { data: shortlistsData } = await supabase
          .from("shortlists")
          .select("company_id");

        const { data: interviewingData, error: interviewingDataError } = await supabase
          .from("student_pipeline")
          .select("company_id")
          .eq("stage", "interviewing");

        if (interviewingError) {
          console.error("Error loading interviewing count", interviewingError);
        }

        // Get company names
        const companyIds = new Set<string>();
        conversationsData?.forEach((c) => c.company_id && companyIds.add(c.company_id));
        shortlistsData?.forEach((s) => s.company_id && companyIds.add(s.company_id));
        interviewingData?.forEach((p) => p.company_id && companyIds.add(p.company_id));

        let companiesMap: { [key: string]: string } = {};
        if (companyIds.size > 0) {
          const { data: companies, error: companiesError } = await supabase
            .from("companies")
            .select("id, name")
            .in("id", Array.from(companyIds));

          if (!companiesError && companies) {
            companiesMap = companies.reduce((acc: any, company: any) => {
              acc[company.id] = company.name;
              return acc;
            }, {});
          }
        }

        // Count conversations and shortlists per company
        const companyStats: {
          [key: string]: { conversations: number; shortlists: number; interviewing: number };
        } = {};
        
        conversationsData?.forEach((c) => {
          if (c.company_id) {
            if (!companyStats[c.company_id]) {
              companyStats[c.company_id] = { conversations: 0, shortlists: 0, interviewing: 0 };
            }
            companyStats[c.company_id].conversations++;
          }
        });

        shortlistsData?.forEach((s) => {
          if (s.company_id) {
            if (!companyStats[s.company_id]) {
              companyStats[s.company_id] = { conversations: 0, shortlists: 0, interviewing: 0 };
            }
            companyStats[s.company_id].shortlists++;
          }
        });

        interviewingData?.forEach((p) => {
          if (p.company_id) {
            if (!companyStats[p.company_id]) {
              companyStats[p.company_id] = { conversations: 0, shortlists: 0, interviewing: 0 };
            }
            companyStats[p.company_id].interviewing++;
          }
        });

        if (interviewingDataError) {
          console.error("Error loading interviewing pipeline rows", interviewingDataError);
        }

        const companyActivity = Object.entries(companyStats)
          .map(([companyId, stats]) => ({
            companyName: companiesMap[companyId] || "Unknown Company",
            conversations: stats.conversations,
            shortlists: stats.shortlists,
            interviewing: stats.interviewing,
            conversionRateInterviewingFromShortlists:
              stats.shortlists > 0 ? stats.interviewing / stats.shortlists : 0,
          }))
          .sort((a, b) => b.conversations - a.conversations)
          .slice(0, 10); // Top 10 companies

        const safeShortlists = shortlistCount ?? 0;
        const safeInterviewing = interviewingCount ?? 0;

        setAnalytics({
          totalShortlists: safeShortlists,
          totalIntroductions: introCount ?? 0,
          totalInterviewing: safeInterviewing,
          conversionRateInterviewingFromShortlists:
            safeShortlists > 0 ? safeInterviewing / safeShortlists : 0,
          companyActivity,
        });
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [activeTab]);

  useEffect(() => {
    if (activeSubtab !== "humble") return;

    const loadHumbleFlex = async () => {
      setLoadingFlex(true);
      try {
        const term = searchTerm.trim();
        let data: any[] | null = null;
        let error: any = null;

        if (term) {
          const rpcResult = await supabase
            .rpc("search_submissions_ci", { search_term: term })
            .select(
              "id, first_name, last_name, school, graduation_year, flex, skills, email"
            );

          data = rpcResult.data as HumbleFlexSubmission[];
          error = rpcResult.error;
        } else {
          let query = supabase
            .from("submissions")
            .select(
              "id, first_name, last_name, school, graduation_year, flex, skills, email"
            )
            .not("flex", "is", null)
            .neq("flex", "");

          if (sortOrder === "asc") {
            query = query.order("last_name", { ascending: true });
          } else {
            query = query.order("last_name", { ascending: false });
          }

          const defaultResult = await query;
          data = defaultResult.data;
          error = defaultResult.error;
        }

        if (error) {
          console.error("Error loading humble flex submissions", error);
          return;
        }

        let sortedData = (data as HumbleFlexSubmission[]) || [];

        if (term) {
          sortedData.sort((a, b) => {
            const comparison = a.last_name.localeCompare(b.last_name);
            return sortOrder === "asc" ? comparison : -comparison;
          });
        }

        setHumbleFlexSubmissions(sortedData);
      } catch (err) {
        console.error("Unexpected error", err);
      } finally {
        setLoadingFlex(false);
      }
    };

    loadHumbleFlex();
  }, [activeSubtab, sortOrder, searchTerm]);

  useEffect(() => {
    const loadProjects = async () => {
      if (activeSubtab !== "projects") {
        setProjects([]);
        return;
      }

      setProjectsLoading(true);
      try {
        const term = searchTerm.trim();
        let query;

        if (term) {
          // Use RPC for search, then filter for non-null side_projects
          query = supabase
            .rpc("search_submissions_ci", { search_term: term })
            .select(
              "id, first_name, last_name, school, graduation_year, side_projects, side_project_link, skills, github"
            )
            .not("side_projects", "is", null)
            .neq("side_projects", "");
        } else {
          // Default query if no search term
          query = supabase
            .from("submissions")
            .select(
              "id, first_name, last_name, school, graduation_year, side_projects, side_project_link, skills, github"
            )
            .not("side_projects", "is", null)
            .neq("side_projects", "");
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading projects:", error);
          setProjects([]);
          return;
        }

        if (!Array.isArray(data) || data.length === 0) {
          setProjects([]);
          return;
        }

        const parsed = parseProjects(data as SubmissionRow[]);

        // Sort projects
        const sorted = [...parsed].sort((a, b) => {
          if (sortOrder === "asc") {
            return a.authorName.localeCompare(b.authorName);
          } else {
            return b.authorName.localeCompare(a.authorName);
          }
        });

        setProjects(sorted);
      } catch (err) {
        console.error("Error parsing projects:", err);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [activeSubtab, sortOrder, searchTerm]);

  // Load accounts for accounts management tab
  useEffect(() => {
    const loadAccounts = async () => {
      if (activeTab !== "accounts") {
        setAccounts([]);
        return;
      }

      setAccountsLoading(true);
      try {
        let query = supabase
          .from("accounts")
          .select("id, email, role, created_at, company_id");

        // Apply filter
        if (accountsFilter !== "all") {
          query = query.eq("role", accountsFilter);
        }

        // Apply search
        if (accountsSearchTerm.trim()) {
          query = query.ilike("email", `%${accountsSearchTerm.trim()}%`);
        }

        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error("Error loading accounts:", error);
          setAccounts([]);
          return;
        }

        setAccounts(data || []);
      } catch (err) {
        console.error("Unexpected error loading accounts:", err);
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    };

    loadAccounts();
  }, [activeTab, accountsFilter, accountsSearchTerm]);


  return (
    <div className="flex-1 bg-white font-sans">
      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />
      <div className="mb-8">
        {activeTab === "messages" ? (
          // FULL-SCREEN MESSAGES LAYOUT
          <main className="flex-1 flex justify-center items-start bg-white pt-8">
            <MessagesSection
              initialConversationId={initialConversationId ?? undefined}
              role="business"
            />
          </main>
        ) : (
          // EXISTING LAYOUT FOR OTHER TABS
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 mt-10">
            {/* Stats Section */}
            <div className="flex gap-6 mb-8">
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-500 mb-1">
                  Student Accounts
                </div>
                <div className="text-3xl font-semibold text-gray-900">
                  {studentAccountCount === null ? "—" : studentAccountCount}
                </div>
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-500 mb-1">
                  Business Accounts
                </div>
                <div className="text-3xl font-semibold text-gray-900">
                  {businessAccountCount === null ? "—" : businessAccountCount}
                </div>
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-500 mb-1">Total Companies</div>
                <div className="text-3xl font-semibold text-gray-900">
                  {totalCompaniesCount === null ? "—" : totalCompaniesCount}
                </div>
              </div>
            </div>

            {activeTab === "students" && (
              <>
                <div className="flex justify-between">
                  <div className="flex items-center gap-6">
                    <h1 className="text-xl font-semibold">Students</h1>
                    <StudentsSubtabs
                      active={activeSubtab}
                      setActive={setActiveSubtab}
                    />
                  </div>
                  <div className="ml-6 flex-1 justify-end">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search name, school, or skill..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex font-sans text-sm items-center w-full px-4 py-1.5 gap-2 text-black rounded-xl border border-gray-300 focus:border-brand-blue hover:bg-brand-blue/5 transition"
                      />
                      <svg
                        className="w-4 h-4 text-brand-blue absolute right-3 top-1/2 transform -translate-y-1/2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <div className="text-gray-400">
                    {activeSubtab === "projects"
                      ? projectsLoading
                        ? "Loading projects…"
                        : `${projects.length} ${
                            projects.length === 1 ? "project" : "projects"
                          }`
                      : profilesCount === null
                      ? "Loading profiles…"
                      : `${profilesCount} profiles`}
                  </div>

                  <div className="flex items-center justify-end gap-4 mb-4">
                    <div className="relative">
                      <select
                        value={sortOrder}
                        onChange={(e) =>
                          setSortOrder(e.target.value as "asc" | "desc")
                        }
                        className="px-4 py-2 text-sm rounded-lg hover:bg-gray-50 appearance-none pr-8"
                      >
                        <option value="asc">Alphabetical</option>
                        <option value="desc">Recent</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                {activeSubtab === "humble" && (
                  <>
                    {loadingFlex ? (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        Loading humble flex posts...
                      </div>
                    ) : humbleFlexSubmissions.length === 0 ? (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        No humble flex posts yet.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 mb-4">
                          {currentFlexSubmissions.map((submission) => {
                          const authorName = `${submission.first_name} ${submission.last_name}`;
                          const authorSchool = `${submission.school} '${
                            submission.graduation_year?.slice(-2) || ""
                          }`;
                            const studentId = submission.id;

                          const studentProfile: StudentProfile = {
                            id: studentId,
                            name: authorName,
                            school: authorSchool,
                          };

                          return (
                            <FlexComponent
                              key={submission.id}
                              authorName={authorName}
                              authorSchool={authorSchool}
                              flexContent={submission.flex}
                              skills={submission.skills || []}
                              studentId={studentId}
                              onStartConversation={handleStartConversation}
                              isShortlisted={shortlist.some(
                                (s) => s.id === studentProfile.id
                              )}
                              onToggleShortlist={() =>
                                toggleShortlist(studentProfile)
                              }
                              showActions={false}
                            />
                          );
                        })}
                      </div>

                        {/* Pagination Controls for Humble Flex */}
                        {flexTotalPages > 1 && (
                          <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                setFlexCurrentPage((prev) =>
                                  Math.max(prev - 1, 1)
                                )
                              }
                              disabled={flexCurrentPage === 1}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from(
                                { length: flexTotalPages },
                                (_, i) => i + 1
                              ).map((page) => {
                                const showPage =
                                  page === 1 ||
                                  page === flexTotalPages ||
                                  (page >= flexCurrentPage - 1 &&
                                    page <= flexCurrentPage + 1);

                                const showEllipsis =
                                  (page === 2 && flexCurrentPage > 3) ||
                                  (page === flexTotalPages - 1 &&
                                    flexCurrentPage < flexTotalPages - 2);

                                if (showEllipsis) {
                                  return (
                                    <span
                                      key={page}
                                      className="px-2 text-gray-500"
                                    >
                                      ...
                                    </span>
                                  );
                                }

                                if (!showPage) return null;

                                return (
                                  <button
                                    key={page}
                                    onClick={() => setFlexCurrentPage(page)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                      flexCurrentPage === page
                                        ? "bg-brand-blue text-white"
                                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() =>
                                setFlexCurrentPage((prev) =>
                                  Math.min(prev + 1, flexTotalPages)
                                )
                              }
                              disabled={flexCurrentPage === flexTotalPages}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                  </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {activeSubtab === "projects" && (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 mb-4">
                    {projectsLoading ? (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        Loading projects...
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        No projects found.
                      </div>
                    ) : (
                        currentProjects.map((project) => {
                          const studentProfile: StudentProfile = {
                            id: project.studentId,
                            name: project.authorName,
                            school: project.authorSchool,
                          };

                          return (
                        <ProjectCard
                          key={project.id}
                          title={project.title}
                          description={project.description}
                          tags={project.tags}
                          authorName={project.authorName}
                          authorSchool={project.authorSchool}
                          projectImage={project.projectImage}
                          projectUrl={project.projectUrl}
                          studentId={project.studentId}
                          onStartConversation={handleStartConversation}
                              isShortlisted={shortlist.some(
                                (s) => s.id === studentProfile.id
                              )}
                              onToggleShortlist={() =>
                                toggleShortlist(studentProfile)
                              }
                              showActions={false}
                            />
                          );
                        })
                      )}
                    </div>

                    {/* Pagination Controls for Projects */}
                    {projectsTotalPages > 1 && !projectsLoading && (
                      <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            setProjectsCurrentPage((prev) =>
                              Math.max(prev - 1, 1)
                            )
                          }
                          disabled={projectsCurrentPage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: projectsTotalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            const showPage =
                              page === 1 ||
                              page === projectsTotalPages ||
                              (page >= projectsCurrentPage - 1 &&
                                page <= projectsCurrentPage + 1);

                            const showEllipsis =
                              (page === 2 && projectsCurrentPage > 3) ||
                              (page === projectsTotalPages - 1 &&
                                projectsCurrentPage < projectsTotalPages - 2);

                            if (showEllipsis) {
                              return (
                                <span key={page} className="px-2 text-gray-500">
                                  ...
                                </span>
                              );
                            }

                            if (!showPage) return null;

                            return (
                              <button
                                key={page}
                                onClick={() => setProjectsCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                  projectsCurrentPage === page
                                    ? "bg-brand-blue text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() =>
                            setProjectsCurrentPage((prev) =>
                              Math.min(prev + 1, projectsTotalPages)
                            )
                          }
                          disabled={projectsCurrentPage === projectsTotalPages}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                  </div>
                    )}
                  </>
                )}
                {activeSubtab === "bios" && (
                  <BiosSection
                    searchTerm={searchTerm}
                    sortOrder={sortOrder}
                    onStartConversation={handleStartConversation}
                    shortlist={shortlist}
                    onToggleShortlist={toggleShortlist}
                    showActions={false}
                  />
                )}
              </>
            )}

            {activeTab === "accounts" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-semibold">Account Management</h1>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search by email..."
                      value={accountsSearchTerm}
                      onChange={(e) => setAccountsSearchTerm(e.target.value)}
                      className="flex font-sans text-sm items-center w-full px-4 py-1.5 gap-2 text-black rounded-xl border border-gray-300 focus:border-brand-blue hover:bg-brand-blue/5 transition"
                    />
                    <svg
                      className="w-4 h-4 text-brand-blue absolute right-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <select
                    value={accountsFilter}
                    onChange={(e) =>
                      setAccountsFilter(
                        e.target.value as "all" | "student" | "business" | "admin"
                      )
                    }
                    className="px-4 py-1.5 text-sm rounded-xl border border-gray-300 hover:bg-gray-50 appearance-none pr-8"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="business">Business</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Accounts List */}
                {accountsLoading ? (
                  <div className="text-center text-gray-400 py-8">
                    Loading accounts...
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No accounts found.
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.map((account) => (
                          <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  account.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : account.role === "business"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {account.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {account.created_at
                                ? new Date(account.created_at).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-semibold">Analytics & Insights</h1>
                </div>

                {analyticsLoading ? (
                  <div className="text-center text-gray-400 py-8">
                    Loading analytics...
                  </div>
                ) : (
                  <>
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="text-sm text-gray-500 mb-1">Total Introductions</div>
                        <div className="text-3xl font-semibold text-gray-900">
                          {analytics.totalIntroductions}
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="text-sm text-gray-500 mb-1">Total Shortlists</div>
                        <div className="text-3xl font-semibold text-gray-900">
                          {analytics.totalShortlists}
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="text-sm text-gray-500 mb-1">
                          Conversion (Interviewing / Shortlists)
                        </div>
                        <div className="text-3xl font-semibold text-gray-900">
                          {Math.round(
                            analytics.conversionRateInterviewingFromShortlists * 1000
                          ) / 10}
                          %
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {analytics.totalInterviewing} interviewing out of{" "}
                          {analytics.totalShortlists} shortlists
                        </div>
                      </div>
                    </div>

                    {/* Company Activity */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h2 className="text-lg font-semibold mb-4">Top Companies by Activity</h2>
                      {analytics.companyActivity.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          No company activity data yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Conversations
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Shortlists
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Interviewing
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Conversion
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {analytics.companyActivity.map((company, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {company.companyName}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {company.conversations}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {company.shortlists}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {company.interviewing}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {Math.round(
                                      company.conversionRateInterviewingFromShortlists *
                                        1000
                                    ) / 10}
                                    %
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                  </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
