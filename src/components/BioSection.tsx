import { useEffect, useState } from "react";
import { supabase } from "../supabase";

interface Submission {
  id: string;
  first_name: string;
  last_name: string;
  school: string;
  major: string;
  graduation_year: string;
  type_of_work: string[];   
  relocating: string;      
  skills: string[];         
  side_projects: string;
  flex: string;
}

interface Student {
  id: string;
  name: string;
  university: string;
  major: string;
  bio: string;
  location: string;
  graduationYear: string;
  employmentType: string;
  workPreference: string;
  skills: string[];
}

// this code is basically the translation between the submission data and the student data used in the component
function mapSubmissionToStudent(sub: Submission): Student {
  return {
    id: sub.id,
    name: `${sub.first_name} ${sub.last_name}`,
    university: sub.school,
    major: sub.major,
    bio: sub.side_projects || sub.flex,
    location: "Open to opportunities",
    graduationYear: sub.graduation_year,
    employmentType: sub.type_of_work.join(", "),
    workPreference:
      sub.relocating === "yes"
        ? "Open to relocating"
        : sub.relocating === "maybe"
        ? "Maybe relocating"
        : "Prefers not to relocate",
    skills: sub.skills ?? [],
  };
}

export default function BiosSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("id", { ascending: false }); // newest first (optional)

      if (error) {
        console.error("Error fetching submissions:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped =
        (data as Submission[] | null)?.map(mapSubmissionToStudent) ?? [];
      setStudents(mapped);
      setLoading(false);
    };

    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="w-full font-inter">
        <p className="text-sm text-gray-500">Loading student profiles…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full font-inter">
        <p className="text-sm text-red-600">
          There was a problem loading student profiles: {error}
        </p>
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="w-full font-inter">
        <p className="text-sm text-gray-500">
          No student profiles yet. Once someone submits the form, their profile
          will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full font-inter">
      <div className="space-y-6">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-gray-500">
                    {student.name.charAt(0)}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {student.university} • {student.major}
                    </p>
                  </div>

                  {/* Action Icons (unchanged) */}
                  <div className="flex items-center gap-3">
                    <button className="rounded-full p-1.5 hover:bg-slate-100">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-black"
                      >
                        <path d="M21 11.5c0 4-3.7 7.5-8.5 7.5-1.4 0-2.8-.3-4-.9L3 20l1.3-4.1C3.5 14.3 3 12.9 3 11.5 3 7 6.7 3.5 11.5 3.5S21 7 21 11.5z" />
                      </svg>
                    </button>

                    <button className="rounded-full p-1.5 hover:bg-slate-100">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-700 mb-4">{student.bio}</p>

                {/* Info Icons Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    {/* location icon */}
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-black">{student.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* calendar icon */}
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-black">
                      Graduating {student.graduationYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* briefcase icon */}
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
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-black">{student.employmentType}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* globe icon */}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 3a15 15 0 0 1 0 18"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 3a15 15 0 0 0 0 18"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 12h18"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-black">{student.workPreference}</span>
                  </div>
                </div>

                {/* Skill Tags */}
                <div className="flex flex-wrap gap-2">
                  {student.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-brand-blue text-xs rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}