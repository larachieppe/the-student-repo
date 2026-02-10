import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import type { TabKey } from "../tabTypes";
import FlexComponent from "../components/FlexComponent";
import { supabase } from "../supabase";
import { useAuth } from "../useAuth";
import MessagesSection from "../components/ConversationComponent";
import CompanyDetailModal from "../components/CompanyDetailModal";
import NotificationsComponent from "../components/NotificationsComponent";

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
  logo_url: string | null;
  description: string | null;
  company_type: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  remote_policy: string | null;
  open_roles: string | null;
  hiring_needs: string | null;
  candidate_requirements: string | null;
  tech_stack: string[] | null;
  perks: string | null;
  is_hiring: boolean | null;
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
  relocating: string | null;
  side_projects: string | null;
  side_project_link: string | null;
  email: string | null;
  attachment_urls: string[] | null;
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  const [companiesCurrentPage, setCompaniesCurrentPage] = useState(1);
  const companiesPerPage = 12;

  const openExternalLink = (url?: string) => {
    if (!url) return;

    const normalized =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    window.open(normalized, "_blank", "noopener,noreferrer");
  };
  const [studentId, setStudentId] = useState<string | null>(null);
  const [myCompanies, setMyCompanies] = useState<Array<{
    company_id: string;
    company_name: string;
    company_logo: string | null;
    stage: string | null;
  }>>([]);
  const [loadingMyCompanies, setLoadingMyCompanies] = useState(false);

  const [profile, setProfile] = useState({
    profilePictureUrl: "",
    fullName: "",
    major: "",
    school: "",
    gradYear: "",
    workType: "",
    relocating: "",
    skills: [] as string[],
    flex: "",
    github: "" as string,
    linkedin: "" as string,
    sideProjects: "",
    sideProjectLink: "",
    email: "",
    attachmentUrls: [] as string[],
  });

  const myFlex = humbleFlexSubmissions[0];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB for profile pictures)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    setProfileImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!profileImageFile || !email) return null;

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const fileExt = profileImageFile.name.split(".").pop();
      const fileName = `profile_${timestamp}.${fileExt}`;
      const path = `profile-pictures/${email}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("student-attachments")
        .upload(path, profileImageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: profileImageFile.type,
        });

      if (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("student-attachments")
        .getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error("Failed to generate public URL for profile image.");
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Profile image upload failed:", error);
      alert("Failed to upload profile image. Please try again.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

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
          "first_name,last_name,major,school,graduation_year,skills,flex,github,linkedin,type_of_work,profile_picture_url,relocating,side_projects,side_project_link,email,attachment_urls"
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
        profilePictureUrl: row.profile_picture_url ?? "",
        fullName: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
        major: row.major ?? "",
        school: row.school ?? "",
        gradYear: row.graduation_year ?? "",
        workType: (row.type_of_work ?? []).join(", "),
        relocating: row.relocating ?? "",
        skills: row.skills ?? [],
        flex: row.flex ?? "",
        github: row.github ?? "",
        linkedin: row.linkedin ?? "",
        sideProjects: row.side_projects ?? "",
        sideProjectLink: row.side_project_link ?? "",
        email: row.email ?? "",
        attachmentUrls: row.attachment_urls ?? [],
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
          .select(
            "id,name,url,logo_url,description,company_type,industry,company_size,location,remote_policy,open_roles,hiring_needs,candidate_requirements,tech_stack,perks,is_hiring"
          )
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

  useEffect(() => {
    if (!studentId) return;

    const loadMyCompanies = async () => {
      setLoadingMyCompanies(true);
      try {
        // Get conversations the student is part of
        const { data: conversations, error: convError } = await supabase
          .from("conversations")
          .select("company_id")
          .eq("student_id", studentId);

        if (convError) {
          console.error("Error loading conversations:", convError);
          return;
        }

        if (!conversations || conversations.length === 0) {
          setMyCompanies([]);
          return;
        }

        const companyIds = conversations.map((c) => c.company_id);

        // Get company details and pipeline status
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name, logo_url")
          .in("id", companyIds);

        if (companiesError) {
          console.error("Error loading companies:", companiesError);
          return;
        }

        // Get pipeline status for each company
        const { data: pipelineData, error: pipelineError } = await supabase
          .from("student_pipeline")
          .select("company_id, stage")
          .eq("student_id", studentId)
          .in("company_id", companyIds);

        if (pipelineError) {
          console.error("Error loading pipeline data:", pipelineError);
        }

        // Map pipeline stages by company_id
        const stageMap = (pipelineData || []).reduce((acc: any, item: any) => {
          acc[item.company_id] = item.stage;
          return acc;
        }, {});

        // Combine data
        const combined = (companiesData || []).map((company) => ({
          company_id: company.id,
          company_name: company.name,
          company_logo: company.logo_url,
          stage: stageMap[company.id] || null,
        }));

        setMyCompanies(combined);
      } catch (err) {
        console.error("Unexpected error loading my companies:", err);
      } finally {
        setLoadingMyCompanies(false);
      }
    };

    loadMyCompanies();
  }, [studentId]);

  const saveProfile = async () => {
    if (!email) return;

    setSavingProfile(true);
    try {
      // Upload new profile image if one was selected
      let finalProfilePictureUrl = profile.profilePictureUrl;
      if (profileImageFile) {
        const uploadedUrl = await uploadProfileImage();
        if (uploadedUrl) {
          finalProfilePictureUrl = uploadedUrl;
        } else {
          // Upload failed, don't proceed
          return;
        }
      }

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
        profile_picture_url: finalProfilePictureUrl,
        relocating: profile.relocating,
        side_projects: profile.sideProjects,
        side_project_link: profile.sideProjectLink,
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

      // Update local state with new profile picture URL
      setProfile((p) => ({ ...p, profilePictureUrl: finalProfilePictureUrl }));

      // Clear the file input state
      setProfileImageFile(null);
      setProfileImagePreview(null);

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
          <>
            <div className="w-full flex items-center justify-between py-6 px-2">
              <h1 className="font-sans text-3xl font-bold text-gray-900">Companies</h1>
            </div>
            <div className="mx-2">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">

              {loadingCompanies ? (
                <p className="text-gray-500 py-6">Loading companies...</p>
              ) : companies.length === 0 ? (
                <p className="text-gray-500 py-6">No companies found.</p>
              ) : (
                <>
                  {/* Companies Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companies
                      .slice(
                        (companiesCurrentPage - 1) * companiesPerPage,
                        companiesCurrentPage * companiesPerPage
                      )
                      .map((company) => (
                        <CompanyCard
                          key={company.id}
                          company={company}
                          onClick={() => setSelectedCompany(company)}
                        />
                      ))}
                  </div>

                  {/* Pagination */}
                  {companies.length > companiesPerPage && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <button
                        onClick={() =>
                          setCompaniesCurrentPage((prev) =>
                            Math.max(prev - 1, 1)
                          )
                        }
                        disabled={companiesCurrentPage === 1}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-brand-blue transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>

                      <div className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Page {companiesCurrentPage} of {Math.ceil(companies.length / companiesPerPage)}
                      </div>

                      <button
                        onClick={() =>
                          setCompaniesCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.ceil(companies.length / companiesPerPage)
                            )
                          )
                        }
                        disabled={
                          companiesCurrentPage ===
                          Math.ceil(companies.length / companiesPerPage)
                        }
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-brand-blue transition-all"
                      >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            </div>
          </>
        )}
        {activeTab === "profile" && (
          <>
            <div className="w-full flex items-center justify-between py-6 px-2">
              <h1 className="font-sans text-3xl font-bold text-gray-900">My Profile</h1>
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
                  {profile.email ? (
                    <p className="text-gray-400 text-xs mt-1">{profile.email}</p>
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

                {(profile.workType || profile.relocating) ? (
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
                      {profile.relocating ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🌍</span>
                          <span>Relocating: {profile.relocating}</span>
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

                {profile.attachmentUrls.length > 0 ? (
                  <>
                    <div className="my-6 border-t border-gray-200" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Uploaded Files
                      </h3>
                      <div className="space-y-2">
                        {profile.attachmentUrls.map((url, idx) => {
                          // Extract filename from URL
                          const filename = url.split('/').pop()?.split('?')[0] || `Attachment ${idx + 1}`;
                          const decodedFilename = decodeURIComponent(filename);

                          return (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-brand-blue hover:bg-brand-blue/5 transition text-xs group"
                            >
                              <span className="text-gray-400 group-hover:text-brand-blue">📎</span>
                              <span className="flex-1 truncate text-gray-700 group-hover:text-brand-blue">
                                {decodedFilename}
                              </span>
                              <span className="text-gray-400 group-hover:text-brand-blue">↗</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
              </aside>
              <section className="space-y-6">
                {/* COMPANIES I'M TALKING TO card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 mr-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Companies I'm Talking To
                  </h3>

                  {loadingMyCompanies ? (
                    <p className="text-gray-500 py-6">Loading...</p>
                  ) : myCompanies.length === 0 ? (
                    <p className="text-gray-500 py-6 text-sm">
                      No active conversations with companies yet. Start browsing companies to connect!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {myCompanies.map((company) => {
                        const getStageDisplay = (stage: string | null) => {
                          if (!stage) return { label: "Messaged", color: "bg-gray-100 text-gray-700" };

                          const stageMap: { [key: string]: { label: string; color: string } } = {
                            shortlisted: { label: "Shortlisted", color: "bg-blue-100 text-blue-700" },
                            contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
                            interviewing: { label: "Interviewing", color: "bg-purple-100 text-purple-700" },
                            hired: { label: "Hired", color: "bg-green-100 text-green-700" },
                            not_a_fit: { label: "Not a Fit", color: "bg-gray-100 text-gray-700" },
                          };

                          return stageMap[stage] || { label: stage, color: "bg-gray-100 text-gray-700" };
                        };

                        const stageDisplay = getStageDisplay(company.stage);

                        return (
                          <div
                            key={company.company_id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-brand-blue transition"
                          >
                            {company.company_logo ? (
                              <img
                                src={company.company_logo}
                                alt={company.company_name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-semibold text-gray-500">
                                  {company.company_name?.charAt(0) || "C"}
                                </span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {company.company_name}
                              </p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${stageDisplay.color}`}>
                                {stageDisplay.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

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

                {/* SIDE PROJECTS card */}
                {(profile.sideProjects || profile.sideProjectLink) && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 mr-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Side Projects
                    </h3>

                    {profile.sideProjects && (
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                        {profile.sideProjects}
                      </p>
                    )}

                    {profile.sideProjectLink && (
                      <a
                        href={normalizeUrl(profile.sideProjectLink) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition text-sm font-medium"
                      >
                        <span>View Project</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
        {activeTab === "messages" && (
          <>
            <div className="w-full flex items-center justify-between py-6 px-2">
              <h1 className="font-sans text-3xl font-bold text-gray-900">Messages</h1>
            </div>
            <div className="mx-2">
              <MessagesSection
                role="student"
                studentId={studentId ?? undefined}
              />
            </div>
          </>
        )}
        {activeTab === "notifications" && (
          <>
            <div className="w-full flex items-center justify-between py-6 px-2">
              <h1 className="font-sans text-3xl font-bold text-gray-900">Notifications</h1>
            </div>
            <div className="mx-2">
              {studentId ? (
                <NotificationsComponent
                  studentId={studentId}
                  onNavigateToMessages={() => {
                    setActiveTab("messages");
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {isEditOpen ? (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsEditOpen(false);
              setProfileImageFile(null);
              setProfileImagePreview(null);
            }}
          />

          {/* modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit profile
                </h2>
                <button
                  onClick={() => {
                    setIsEditOpen(false);
                    setProfileImageFile(null);
                    setProfileImagePreview(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 block mb-2">
                    Profile Picture
                  </label>

                  {/* Image Preview */}
                  <div className="flex items-center gap-4 mb-3">
                    {profileImagePreview || profile.profilePictureUrl ? (
                      <img
                        src={profileImagePreview || profile.profilePictureUrl}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">👤</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="profile-image-upload"
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="inline-block cursor-pointer rounded-xl border-2 border-brand-blue bg-white px-4 py-2 text-sm font-medium text-brand-blue hover:bg-brand-blue hover:text-white transition"
                      >
                        Choose Image
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG (max 5MB)
                      </p>
                    </div>
                  </div>

                  {/* Optional: URL input as fallback */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-500">
                      Or paste image URL
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
                      placeholder="https://"
                    />
                  </div>
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
                    placeholder="Full-Time, Part-Time, Internship"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Open to relocating?</label>
                  <select
                    value={profile.relocating}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, relocating: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Maybe">Maybe</option>
                  </select>
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

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Side Projects</label>
                  <textarea
                    value={profile.sideProjects}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, sideProjects: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="Describe your side projects..."
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Side Project Link</label>
                  <input
                    value={profile.sideProjectLink}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, sideProjectLink: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Humble Flex</label>
                  <textarea
                    value={profile.flex}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, flex: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    placeholder="Share your achievements..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsEditOpen(false);
                    setProfileImageFile(null);
                    setProfileImagePreview(null);
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile || uploadingImage}
                  className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {uploadingImage
                    ? "Uploading image..."
                    : savingProfile
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}

function CompanyCard({
  company,
  onClick,
}: {
  company: CompanyRow;
  onClick: () => void;
}) {
  const firstThreeSkills = company.tech_stack?.slice(0, 3) || [];
  const companyUrl = normalizeUrl(company.url);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-brand-blue/30 transition">
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div
          onClick={onClick}
          className="cursor-pointer"
        >
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-gray-500">
                {company.name?.charAt(0) || "C"}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          onClick={onClick}
          className="flex-1 min-w-0 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-semibold text-gray-900 truncate">
              {company.name}
            </h4>
            {company.is_hiring && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Hiring
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {company.industry && <span>{company.industry}</span>}
            {company.industry && company.remote_policy && (
              <span>•</span>
            )}
            {company.remote_policy && <span>{company.remote_policy}</span>}
          </div>

          {/* Description preview */}
          {company.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {company.description}
            </p>
          )}

          {/* Tech stack tags */}
          {firstThreeSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {firstThreeSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-xs rounded"
                >
                  {skill}
                </span>
              ))}
              {company.tech_stack && company.tech_stack.length > 3 && (
                <span className="px-2 py-0.5 text-gray-400 text-xs">
                  +{company.tech_stack.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visit Button - Right Side */}
        <div className="flex-shrink-0">
          {companyUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(companyUrl, "_blank", "noopener,noreferrer");
              }}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition"
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
        </div>
      </div>
    </div>
  );
}
