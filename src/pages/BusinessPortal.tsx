import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import type { TabKey } from "../tabTypes";
import StudentsSubtabs, { SubtabKey } from "../components/StudentSubtabs";
import FlexComponent from "../components/FlexComponent";
import ProjectCard from "../components/ProjectComponent";
import BiosSection from "../components/BioSection";
import MessagesSection from "../components/ConversationComponent";
import { supabase } from "../supabase";
import { useAuth } from "../useAuth";

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
  skills?: string[] | null;
  github?: string | null;
};

type StudentProfile = {
  id: string;
  name: string;
  school: string;
};

export default function BusinessPortal() {
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

  const { user } = useAuth();

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

      // Try to extract URL from text (look for http/https links)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = projectText.match(urlRegex) || [];
      const projectUrl = urls[0] || undefined;

      // Remove URLs from description
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
        let query = supabase
          .from("submissions")
          .select(
            "id, first_name, last_name, school, graduation_year, flex, skills, email"
          )
          .not("flex", "is", null)
          .neq("flex", "");

        if (sortOrder === "asc") {
          query = query.order("last_name", { ascending: false });
        } else {
          query = query.order("last_name", { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading humble flex submissions", error);
          return;
        }

        setHumbleFlexSubmissions((data as HumbleFlexSubmission[]) || []);
      } catch (err) {
        console.error("Unexpected error", err);
      } finally {
        setLoadingFlex(false);
      }
    };

    loadHumbleFlex();
  }, [activeSubtab, sortOrder]);

  useEffect(() => {
    const loadProjects = async () => {
      if (activeSubtab !== "projects") {
        setProjects([]);
        return;
      }

      setProjectsLoading(true);
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select(
            "id, first_name, last_name, school, graduation_year, side_projects, skills, github"
          )
          .not("side_projects", "is", null)
          .neq("side_projects", "");

        if (error) {
          console.error("Error loading projects:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          setProjects([]);
          return;
        }

        console.log("Raw data from Supabase:", data);
        console.log("Number of submissions fetched:", data?.length || 0);

        if (!data || data.length === 0) {
          console.log("No submissions found with side_projects");
          setProjects([]);
          return;
        }

        // Log first submission for debugging
        if (data.length > 0) {
          console.log("Sample submission:", {
            id: data[0].id,
            name: `${data[0].first_name} ${data[0].last_name}`,
            side_projects: data[0].side_projects,
            skills: data[0].skills,
          });
        }

        const parsed = parseProjects(data as SubmissionRow[]);
        console.log("Parsed projects:", parsed);

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
  }, [activeSubtab, sortOrder]);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {activeTab === "messages" ? (
        // FULL-SCREEN MESSAGES LAYOUT
        <main className="flex-1 flex justify-center items-start bg-white pt-8">
          <MessagesSection
            initialConversationId={initialConversationId ?? undefined}
          />
        </main>
      ) : (
        // EXISTING LAYOUT FOR OTHER TABS
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 mt-10">
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
                <button className="flex items-center gap-2 rounded-full border border-brand-blue px-4 py-2 font-medium text-black hover:bg-brand-blue/5 transition">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filters
                </button>
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
                <div className="flex items-center justify-center">
                  {loadingFlex ? (
                    <p className="text-gray-500 py-10">
                      Loading humble flex posts...
                    </p>
                  ) : humbleFlexSubmissions.length === 0 ? (
                    <p className="text-gray-500 py-10">
                      No humble flex posts yet.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {humbleFlexSubmissions.map((submission) => {
                        const authorName = `${submission.first_name} ${submission.last_name}`;
                        const authorSchool = `${submission.school} '${
                          submission.graduation_year?.slice(-2) || ""
                        }`;
                        const studentId = submission.email;

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
                  )}
                </div>
              )}
              {activeSubtab === "projects" && (
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
                    projects.map((project) => (
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
                      />
                    ))
                  )}
                </div>
              )}
              {activeSubtab === "bios" && <BiosSection />}
            </>
          )}

          {activeTab === "shortlist" && (
            <div>
              <h1 className="text-xl font-semibold mb-4">Shortlist</h1>

              {shortlist.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You haven&apos;t shortlisted any students yet. Click the flag
                  icon on a student profile to save it here.
                </p>
              ) : (
                <div className="space-y-4">
                  {shortlist.map((student) => (
                    <FlexComponent
                      key={student.id}
                      authorName={student.name}
                      authorSchool={student.school}
                      studentId={student.id}
                      onStartConversation={handleStartConversation}
                      isShortlisted={shortlist.some((s) => s.id === student.id)}
                      onToggleShortlist={() => toggleShortlist(student)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
