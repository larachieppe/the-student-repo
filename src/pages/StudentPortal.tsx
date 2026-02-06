import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import type { TabKey } from "../tabTypes";
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

type CompanyRow = {
  id: string;
  name: string | null;
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

  const openExternalLink = (url?: string) => {
    if (!url) return;

    const normalized =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    window.open(normalized, "_blank", "noopener,noreferrer");
  };

  const [profile, setProfile] = useState({
    profilePictureUrl: "",
    fullName: "",
    major: "",
    school: "",
    gradYear: "",
    location: "",
    workType: "",
    relocating: "",
    skills: [] as string[],
    flex: "",
    github: "" as string,
    linkedin: "" as string,
    sideProjects: "",
    sideProjectLink: "",
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

    const loadProfileFromSubmissions = async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          "first_name,last_name,major,school,graduation_year,skills,flex,github,linkedin,type_of_work,profile_picture_url,relocating,side_projects,side_project_link"
        )
        .eq("email", email)
        .maybeSingle();

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
        location: "",
        workType: (row.type_of_work ?? []).join(", "),
        relocating: row.relocating ?? "",
        skills: row.skills ?? [],
        flex: row.flex ?? "",
        github: row.github ?? "",
        linkedin: row.linkedin ?? "",
        sideProjects: row.side_projects ?? "",
        sideProjectLink: row.side_project_link ?? "",
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
          .select("id,name")
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
                    className="w-full rounded-xl border border-gray-300 py-2 text-sm font-medium transition
      hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    GitHub
                  </button>

                  <button
                    onClick={() => openExternalLink(profile.linkedin)}
                    disabled={!profile.linkedin}
                    className="w-full rounded-xl border border-gray-300 py-2 text-sm font-medium transition
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
          <>
            <div className="mx-2 mt-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Messages
                </h3>
              </div>
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
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyRow }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {company.name}
          </h4>
        </div>

        <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
          🏢
        </div>
      </div>
    </div>
  );
}
