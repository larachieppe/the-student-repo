import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import type { TabKey } from "../tabTypes";
import { SubtabKey } from "../components/StudentSubtabs";
import FlexComponent from "../components/FlexComponent";
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

export default function StudentPortal() {
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
  const { user } = useAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState({
    profilePictureUrl: "" as string,
    fullName: "" as string,
    major: "" as string,
    school: "" as string,
    gradYear: "" as string,
    location: "" as string,
    workType: "" as string,
    workStyle: "" as string,
    skills: [] as string[],
    about: "" as string,
  });

  const myFlex = humbleFlexSubmissions[0];

  // Load from auth user_metadata on mount / when user changes
  useEffect(() => {
    if (!user) return;

    const md = (user.user_metadata ?? {}) as any;

    setProfile({
      profilePictureUrl: md.profilePictureUrl ?? "",
      fullName: md.fullName ?? "",
      major: md.major ?? "",
      school: md.school ?? "",
      gradYear: md.gradYear ?? "",
      location: md.location ?? "",
      workType: md.workType ?? "",
      workStyle: md.workStyle ?? "",
      skills: Array.isArray(md.skills) ? md.skills : [],
      about: md.about ?? "",
    });
  }, [user]);

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
    if (!user || !user.email) return; // ✅ narrow user

    const loadHumbleFlex = async () => {
      setLoadingFlex(true);
      try {
        let data: HumbleFlexSubmission[] = [];

        const { data: result, error } = await supabase
          .from("submissions")
          .select(
            "id, first_name, last_name, school, graduation_year, flex, skills, email"
          )
          .eq("email", user.email)
          .not("flex", "is", null)
          .neq("flex", "");

        if (error) {
          console.error("Error loading humble flex submissions", error);
          return;
        }

        data = result ?? [];

        setHumbleFlexSubmissions(data);
      } catch (err) {
        console.error("Unexpected error", err);
      } finally {
        setLoadingFlex(false);
      }
    };

    loadHumbleFlex();
  }, [activeSubtab, user]);

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
              "id, first_name, last_name, school, graduation_year, side_projects, skills, github"
            )
            .not("side_projects", "is", null)
            .neq("side_projects", "");
        } else {
          // Default query if no search term
          query = supabase
            .from("submissions")
            .select(
              "id, first_name, last_name, school, graduation_year, side_projects, skills, github"
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

  const saveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          profilePictureUrl: profile.profilePictureUrl,
          fullName: profile.fullName,
          major: profile.major,
          school: profile.school,
          gradYear: profile.gradYear,
          location: profile.location,
          workType: profile.workType,
          workStyle: profile.workStyle,
          skills: profile.skills,
          about: profile.about,
        },
      });

      if (error) {
        console.error("Error saving profile:", error);
        return;
      }

      setIsEditOpen(false);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />
      <div className="mb-8">
        <div className="w-full flex items-center justify-between py-6">
          <h1 className="font-sans text-xl ml-2">My Profile</h1>
          <button
            onClick={() => setIsEditOpen(true)}
            className="inline-flex font-sans items-center gap-2 rounded-full border-2 border-brand-blue px-5 py-2 text-black hover:bg-brand-blue/5 transition"
          >
            {/* simple pencil icon */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16.862 3.487a2.1 2.1 0 013 2.97L8.7 17.62l-4.2 1.2 1.2-4.2L16.862 3.487z"
              />
            </svg>
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 mt-6">
          {/* LEFT: Profile sidebar */}
          <aside className="bg-white border border-gray-200 rounded-2xl p-6 h-fit sticky top-6">
            <div className="flex flex-col items-center text-center">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-100 border border-gray-200" />
              )}
              {profile.fullName ? (
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                  {profile.fullName}
                </h2>
              ) : null}

              {profile.major ? (
                <p className="text-gray-500 mt-1">{profile.major}</p>
              ) : null}
              <p className="text-gray-500 mt-1">
                {profile.major ?? "Computer Science"}
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              {profile.school ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🎓</span>
                  <span>{profile.school}</span>
                </div>
              ) : null}

              {profile.gradYear ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📅</span>
                  <span>{`Class of ${profile.gradYear}`}</span>
                </div>
              ) : null}

              {location ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📍</span>
                  <span>{profile.location}</span>
                </div>
              ) : null}
            </div>

            <div className="my-6 border-t border-gray-200" />

            <div className="space-y-3">
              <button className="w-full rounded-xl border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50 transition">
                GitHub
              </button>

              <button className="w-full rounded-xl border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50 transition">
                LinkedIn
              </button>
            </div>

            {profile.workType || profile.workStyle ? (
              <>
                <div className="my-6 border-t border-gray-200" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Work Preferences
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    {profile.workType ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">💼</span>
                        <span>{profile.workType}</span>
                      </div>
                    ) : null}
                    {profile.workStyle ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🧭</span>
                        <span>{profile.workStyle}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            <div className="my-6 border-t border-gray-200" />

            {profile.skills.length > 0 ? (
              <>
                <div className="my-6 border-t border-gray-200" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full text-xs border border-brand-blue/30 text-brand-blue bg-brand-blue/5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </aside>

          {/* RIGHT: About + Humble Flex feed */}
          <section className="space-y-6">
            {/* ABOUT card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                About
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {profile.about ??
                  "Full-stack developer passionate about building scalable web applications. Love working with React, Node.js, and cloud infrastructure. Always excited to learn new technologies and solve challenging problems."}
              </p>
            </div>

            {/* HUMBLE FLEX card(s) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Humble Flex
              </h3>

              {loadingFlex ? (
                <p className="text-gray-500 py-6">
                  Loading humble flex posts...
                </p>
              ) : humbleFlexSubmissions.length === 0 ? (
                <p className="text-gray-500 py-6">No humble flex posts yet.</p>
              ) : (
                <div className="space-y-6">
                  {!myFlex ? (
                    <p className="text-gray-500 py-6">
                      No humble flex posts yet.
                    </p>
                  ) : (
                    <FlexComponent
                      key={myFlex.id}
                      authorName={`${myFlex.first_name} ${myFlex.last_name}`}
                      authorSchool={`${myFlex.school} '${
                        myFlex.graduation_year?.slice(-2) || ""
                      }`}
                      flexContent={myFlex.flex}
                      skills={myFlex.skills || []}
                      studentId={myFlex.email}
                      onStartConversation={handleStartConversation}
                      isShortlisted={false}
                      onToggleShortlist={() => {}}
                    />
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      {isEditOpen ? (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsEditOpen(false)}
          />

          {/* modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit profile
                </h2>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">
                    Profile picture URL
                  </label>
                  <input
                    value={profile.profilePictureUrl}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        profilePictureUrl: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Full name</label>
                  <input
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Major</label>
                  <input
                    value={profile.major}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, major: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">School</label>
                  <input
                    value={profile.school}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, school: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border bordergray-300 px-4 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Graduation year
                  </label>
                  <input
                    value={profile.gradYear}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, gradYear: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="2026"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Location</label>
                  <input
                    value={profile.location}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, location: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Work type</label>
                  <input
                    value={profile.workType}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, workType: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="Full-Time"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Work style</label>
                  <input
                    value={profile.workStyle}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, workStyle: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="Flexible"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">
                    Skills (comma-separated)
                  </label>
                  <input
                    value={profile.skills.join(", ")}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        skills: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="React, TypeScript, ..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">About</label>
                  <textarea
                    value={profile.about}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, about: e.target.value }))
                    }
                    className="mt-1 w-full min-h-[120px] rounded-xl border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
