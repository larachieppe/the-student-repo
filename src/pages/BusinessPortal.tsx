import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import NavBar from "../components/NavBar";
import type { TabKey } from "../tabTypes";
import StudentsSubtabs, { SubtabKey } from "../components/StudentSubtabs";
import FlexComponent from "../components/FlexComponent";
import ProjectCard from "../components/ProjectComponent";
import BiosSection from "../components/BioSection";
import MessagesSection from "../components/ConversationComponent";
import CompanyProfile from "../components/CompanyProfile";
import { supabase } from "../supabase";
import { useAuth } from "../useAuth";

type OutletContext = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
};

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

export default function BusinessPortal() {
  const { activeTab, setActiveTab } = useOutletContext<OutletContext>();
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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { user } = useAuth();

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

  // Load user's company_id
  useEffect(() => {
    const loadUserCompany = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading user company:", error);
        return;
      }

      setCompanyId(data?.company_id || null);
    };

    loadUserCompany();
  }, [user]);

  // Load shortlist from database
  useEffect(() => {
    const loadShortlist = async () => {
      if (!companyId) return;

      // First, get the shortlisted student IDs
      const { data: shortlistData, error: shortlistError } = await supabase
        .from("shortlists")
        .select("student_id")
        .eq("company_id", companyId);

      if (shortlistError) {
        console.error("Error loading shortlist:", shortlistError);
        return;
      }

      if (!shortlistData || shortlistData.length === 0) {
        setShortlist([]);
        return;
      }

      // Get the student IDs
      const studentIds = shortlistData.map((item) => item.student_id);

      // Then fetch the student details for those IDs
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("id, first_name, last_name, school, graduation_year")
        .in("id", studentIds);

      if (submissionsError) {
        console.error("Error loading submissions:", submissionsError);
        return;
      }

      // Map to StudentProfile format
      const profiles: StudentProfile[] = (submissions || []).map((sub: any) => {
        const graduationYear = sub.graduation_year?.slice(-2) || "";
        return {
          id: sub.id,
          name: `${sub.first_name} ${sub.last_name}`,
          school: `${sub.school}${graduationYear ? ` '${graduationYear}` : ""}`,
        };
      });

      setShortlist(profiles);
    };

    loadShortlist();
  }, [companyId]);

  const toggleShortlist = async (student: StudentProfile) => {
    if (!companyId) {
      console.error("No company_id found for user");
      return;
    }

    const alreadyInList = shortlist.some((s) => s.id === student.id);

    if (alreadyInList) {
      // Remove from database
      const { error } = await supabase
        .from("shortlists")
        .delete()
        .eq("company_id", companyId)
        .eq("student_id", student.id);

      if (error) {
        console.error("Error removing from shortlist:", error);
        return;
      }

      // Update local state
      setShortlist((current) => current.filter((s) => s.id !== student.id));
    } else {
      // Add to database
      const { error } = await supabase.from("shortlists").insert({
        company_id: companyId,
        student_id: student.id,
      });

      if (error) {
        console.error("Error adding to shortlist:", error);
        return;
      }

      // Update local state
      setShortlist((current) => [...current, student]);
    }
  };

  const handleStartConversation = async (studentId: string) => {
    if (!user || !companyId) return; // not logged in or no company

    try {
      // Check if a conversation already exists for this company and student
      const { data: existingConv, error: searchError } = await supabase
        .from("conversations")
        .select("id")
        .eq("company_id", companyId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (searchError) {
        console.error("Error searching conversations:", searchError);
        return;
      }

      let conversationId: string;

      if (existingConv) {
        // Conversation already exists
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            company_id: companyId,
            student_id: studentId,
            title: `Conversation with student`,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          return;
        }

        conversationId = newConv.id;

        // Add business user as participant
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "business",
          });

        if (participantsError) {
          console.error("Error adding participant:", participantsError);
          return;
        }
      }

      setInitialConversationId(conversationId);
      setActiveTab("messages");
    } catch (err) {
      console.error("Unexpected error starting conversation:", err);
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />
      <div className="mb-8">
        {activeTab === "messages" ? (
          // FULL-SCREEN MESSAGES LAYOUT
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 mt-6">
            <MessagesSection
              role="business"
              initialConversationId={initialConversationId ?? undefined}
              companyId={companyId ?? undefined}
            />
          </main>
        ) : (
          // EXISTING LAYOUT FOR OTHER TABS
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 mt-10">
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
                  />
                )}
              </>
            )}

            {activeTab === "shortlist" && (
              <div>
                <h1 className="text-xl font-semibold mb-4">Shortlist</h1>

                {shortlist.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    You haven&apos;t shortlisted any students yet. Click the
                    bookmark icon on a student profile to save it here.
                  </p>
                ) : (
                  <BiosSection
                    searchTerm=""
                    shortlist={shortlist}
                    onStartConversation={handleStartConversation}
                    onToggleShortlist={toggleShortlist}
                    filterToShortlist={true}
                  />
                )}
              </div>
            )}

            {activeTab === "profile" && companyId && (
              <CompanyProfile companyId={companyId} />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
