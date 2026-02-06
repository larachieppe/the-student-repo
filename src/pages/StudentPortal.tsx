import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import type { TabKey } from "../tabTypes";
import FlexComponent from "../components/FlexComponent";
import { supabase } from "../supabase";
import { useAuth } from "../useAuth";
import MessagesSection from "../components/ConversationComponent";

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

type CompanyRow = {
  id: string;
  name: string | null;
  url: string | null;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  major: string | null;
  school: string | null;
  graduation_year: string | null;
  skills: string[] | null;
  flex: string | null;
  github: string | null;
  linkedin: string | null;
  profile_picture_url: string | null;
  type_of_work: string[] | null;
};

const openExternalLink = (raw?: string | null) => {
  const normalized = normalizeUrl(raw);
  if (!normalized) return;
  window.open(normalized, "_blank", "noopener,noreferrer");
};

const normalizeUrl = (raw?: string | null) => {
  const value = (raw ?? "").trim();
  if (!value) return null;

  // If user saved "example.com", add scheme
  const withScheme =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  try {
    const url = new URL(withScheme);

    // Only allow http(s)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return url.toString();
  } catch {
    return null;
  }
};

export default function StudentPortal() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [humbleFlexSubmissions, setHumbleFlexSubmissions] = useState<
    HumbleFlexSubmission[]
  >([]);
  const [loadingFlex, setLoadingFlex] = useState(false);
  const { user } = useAuth();
  const email = user?.email?.toLowerCase() ?? null;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    fullName: "",
    major: "",
    school: "",
    gradYear: "",
    workType: "",
    skills: [] as string[],
    flex: "",
    github: "" as string,
    linkedin: "" as string,
  });

  const myFlex = humbleFlexSubmissions[0];

  useEffect(() => {
    if (!email) return;

    const loadStudentId = async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id")
        .eq("email", email)
        .limit(1)
        .single();

      if (error) {
        console.error("Error loading student ID:", error);
        return;
      }

      if (data) {
        setStudentId(data.id);
      }
    };

    loadStudentId();
  }, [email]);

  useEffect(() => {
    if (!email) return;

    const loadProfileFromSubmissions = async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          "first_name,last_name,major,school,graduation_year,skills,flex,github,linkedin,type_of_work"
        )
        .eq("email", email)
        .limit(1)
        .single();
      console.log("loadProfileFromSubmissions:", { data, error, email });

      if (error) {
        console.error("Error loading profile from submissions:", error);
        return;
      }
      if (!data) return;

      const row = data as ProfileRow;

      setProfile({
        fullName: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
        major: row.major ?? "",
        school: row.school ?? "",
        gradYear: row.graduation_year ?? "",
        workType: (row.type_of_work ?? []).join(", "),
        skills: row.skills ?? [],
        flex: row.flex ?? "",
        github: row.github ?? "",
        linkedin: row.linkedin ?? "",
      });
    };

    loadProfileFromSubmissions();
  }, [email]);

  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("id,name,url")
          .order("name", { ascending: true });

        // IMPORTANT: log the error so you can see it in console
        if (error) {
          console.error("Error loading companies:", error);
          return;
        }

        console.log("Companies data:", data);
        setCompanies((data as CompanyRow[]) ?? []);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    if (!email) return;

    const loadHumbleFlex = async () => {
      setLoadingFlex(true);
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select(
            "id, first_name, last_name, school, graduation_year, flex, skills, email"
          )
          .eq("email", email)
          .not("flex", "is", null)
          .neq("flex", "");

        if (error) {
          console.error("Error loading humble flex submissions", error);
          return;
        }

        setHumbleFlexSubmissions((data as HumbleFlexSubmission[]) ?? []);
      } finally {
        setLoadingFlex(false);
      }
    };

    loadHumbleFlex();
  }, [email]);

  useEffect(() => {
    if (!myFlex) return;

    setProfile((p) => ({
      ...p,
      fullName: p.fullName || `${myFlex.first_name} ${myFlex.last_name}`.trim(),
      school: p.school || myFlex.school || "",
      gradYear: p.gradYear || myFlex.graduation_year || "",
      skills: p.skills.length ? p.skills : myFlex.skills || [],
      flex: p.flex || myFlex.flex || "",
    }));
  }, [myFlex]);

  const saveProfile = async () => {
    if (!email) return;

    setSavingProfile(true);
    try {
      const parts = profile.fullName.trim().split(" ");
      const first_name = parts.shift() ?? "";
      const last_name = parts.join(" ");

      const payload = {
        email,
        first_name,
        last_name,
        major: profile.major,
        school: profile.school,
        graduation_year: profile.gradYear,
        skills: profile.skills,
        flex: profile.flex,
        github: profile.github,
        linkedin: profile.linkedin,
        type_of_work: profile.workType
          ? profile.workType
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };

      const { error } = await supabase
        .from("submissions")
        .upsert(payload, { onConflict: "email" });

      if (error) {
        console.error("Error saving profile to submissions:", error);
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
        {activeTab === "companies" && (
          <div className="mx-2 mt-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Companies
              </h3>

              {loadingCompanies ? (
                <p className="text-gray-500 py-6">Loading companies...</p>
              ) : companies.length === 0 ? (
                <p className="text-gray-500 py-6">No companies found.</p>
              ) : (
                <div className="space-y-4">
                  {companies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "profile" && (
          <>
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
              <aside className="bg-white border border-gray-200 rounded-2xl p-6 h-fit sticky top-6 ml-2">
                <div className="flex flex-col items-center text-center">
                  {profile.fullName ? (
                    <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                      {profile.fullName}
                    </h2>
                  ) : null}
                  {profile.major ? (
                    <p className="text-gray-500 mt-1">{profile.major}</p>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col items-center gap-2 text-sm text-gray-600 text-center">
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
                </div>

                <div className="my-6 border-t border-gray-200" />

                <div className="space-y-3">
                  <button
                    onClick={() => openExternalLink(profile.github)}
                    disabled={!profile.github}
                    className="w-full rounded-xl border border-brand-blue py-2 text-sm font-medium transition
      hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    GitHub
                  </button>

                  <button
                    onClick={() => openExternalLink(profile.linkedin)}
                    disabled={!profile.linkedin}
                    className="w-full rounded-xl border border-brand-blue py-2 text-sm font-medium transition
      hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    LinkedIn
                  </button>
                </div>

                {profile.workType ? (
                  <>
                    <div className="my-6 border-t border-gray-200" />
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
                    </div>
                  </>
                ) : null}

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
              <section className="space-y-6">
                {/* HUMBLE FLEX card(s) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 mr-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Humble Flex
                  </h3>

                  {loadingFlex ? (
                    <p className="text-gray-500 py-6">
                      Loading humble flex posts...
                    </p>
                  ) : humbleFlexSubmissions.length === 0 ? (
                    <p className="text-gray-500 py-6">
                      No humble flex posts yet.
                    </p>
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
                          isShortlisted={false}
                          onToggleShortlist={() => {}}
                          showActions={false}
                        />
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
        {activeTab === "messages" && (
          <div className="mx-2 mt-6">
            <MessagesSection
              role="student"
              studentId={studentId ?? undefined}
            />
          </div>
        )}
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
                    className="mt-1 w-full bordergray-300 px-4 py-2 text-sm border border-gray-300 rounded-xl"
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

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Skills</label>
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

function CompanyCard({ company }: { company: CompanyRow }) {
  const companyUrl = normalizeUrl(company.url);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {company.name}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {companyUrl ? (
            <button
              onClick={() =>
                window.open(companyUrl, "_blank", "noopener,noreferrer")
              }
              className="px-4 py-2 text-sm font-medium rounded-xl border border-brand-blue hover:bg-brand-blue/5 transition"
            >
              Visit
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-400 cursor-not-allowed"
            >
              No site
            </button>
          )}

          <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
            🏢
          </div>
        </div>
      </div>
    </div>
  );
}
