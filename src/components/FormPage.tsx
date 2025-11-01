import { useState } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { Link } from "react-router-dom";

export default function FormPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    school: "",
    graduationYear: "",
    major: "",
    github: "",
    linkedin: "",
    typeOfWork: [],
    relocating: "yes",
    skills: [],
    sideProjects: "",
    flex: "",
  });
  const [skillsList, setSkillsList] = useState([
    "Python",
    "Java",
    "C++",
    "React",
    "TensorFlow",
  ]);
  const [newSkill, setNewSkill] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const workOptions = ["Part-time", "Full-time", "Opportunistic", "Internship"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleMultiSelect = (name, option) => {
    setForm((f) => {
      const exists = f[name].includes(option);
      return {
        ...f,
        [name]: exists
          ? f[name].filter((s) => s !== option)
          : [...f[name], option],
      };
    });
  };

  const handleAddSkill = () => {
    const value = newSkill.trim();
    if (
      value &&
      !skillsList.some((s) => s.trim().toLowerCase() === value.toLowerCase())
    ) {
      setSkillsList((prev) => [...prev, value]);
      setForm((f) => ({ ...f, skills: [...f.skills, value] }));
      setNewSkill("");
    }
  };

  const handleFilesChange = (e) => {
    const input = e.target as HTMLInputElement;
    const selected = Array.from(input.files || []);
    if (selected.length === 0) return;
    // Append new files; simple de-dupe by name+size+lastModified
    setFiles((prev) => {
      const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
      const existingKeys = new Set(prev.map(key));
      const additions = selected.filter((f) => !existingKeys.has(key(f)));
      return [...prev, ...additions];
    });
    // Allow re-selecting the same file by clearing the input value
    input.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-mono">
      {/* Custom White Header */}
      <NavBar />
      {/* Blue Hero Section */}
      <section className="w-full bg-brand-blue text-white text-center py-8 px-2 border-b border-brand-blue">
        <h1 className="font-bold text-3xl md:text-4xl tracking-tight mb-4">
          THE STUDENT REPO BY REACH CAPITAL
        </h1>
        <div className="max-w-3xl mx-auto text-base md:text-sm font-normal md:font-medium">
          Reach Capital invests in early-stage founders redefining how we learn,
          live, and work. Our portfolio of 130+ startups are constantly on the
          lookout for talented builders like you. Share what you’re studying,
          building, or exploring, and we’ll connect you with career-defining
          opportunities.
        </div>
      </section>
      {/* Form Card */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 bg-transparent">
        <form className="w-full max-w-2xl bg-white p-8 border border-brand-line rounded-xl shadow mx-auto space-y-6 font-mono">
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              First Name
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              Email
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              School
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <input
              type="text"
              name="school"
              value={form.school}
              onChange={handleChange}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              Graduation Year
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <input
              type="text"
              name="graduationYear"
              value={form.graduationYear}
              onChange={handleChange}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              Major
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <input
              type="text"
              name="major"
              value={form.major}
              onChange={handleChange}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              Github
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <input
              type="text"
              name="github"
              value={form.github}
              onChange={handleChange}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              LinkedIn
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <input
              type="text"
              name="linkedin"
              value={form.linkedin}
              onChange={handleChange}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="text-s font-semibold">
              Type of Work
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <div className="flex flex-wrap mt-1 gap-2">
              {workOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`border text-xs px-2 py-1 rounded focus:outline-none font-mono transition ${
                    form.typeOfWork.includes(option)
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-gray-100 border-brand-line text-black"
                  }`}
                  onClick={() => handleMultiSelect("typeOfWork", option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-s font-semibold">
              Open to relocating?
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <div className="flex gap-6 items-center mt-1">
              <label className="flex items-center gap-1 text-xs font-mono font-medium">
                <input
                  type="radio"
                  name="relocating"
                  value="yes"
                  checked={form.relocating === "yes"}
                  onChange={handleChange}
                />{" "}
                Yes
              </label>
              <label className="flex items-center gap-1 text-xs font-mono font-medium">
                <input
                  type="radio"
                  name="relocating"
                  value="no"
                  checked={form.relocating === "no"}
                  onChange={handleChange}
                />{" "}
                No
              </label>
              <label className="flex items-center gap-1 text-xs font-mono font-medium">
                <input
                  type="radio"
                  name="relocating"
                  value="maybe"
                  checked={form.relocating === "maybe"}
                  onChange={handleChange}
                />{" "}
                Maybe
              </label>
            </div>
          </div>
          <div>
            <label className="text-s font-semibold">
              Which programming languages, frameworks, and technical areas are
              you proficient in?{" "}
              <span className="text-s text-gray-500">
                (e.g. Python, JavaScript, React, Tensorflow, frontend,
                full-stack, etc.)
              </span>
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {skillsList.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`border text-xs px-2 py-1 rounded focus:outline-none font-mono transition ${
                    form.skills.includes(option)
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-gray-100 border-brand-line text-black"
                  }`}
                  onClick={() => handleMultiSelect("skills", option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add another..."
                className="border border-gray-300 rounded px-2 py-1 text-xs font-mono bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <button
                type="button"
                className="bg-brand-blue text-white rounded px-3 py-1 text-xs font-semibold font-mono hover:brightness-95 disabled:opacity-50"
                disabled={
                  !newSkill.trim() ||
                  skillsList.some(
                    (s) =>
                      s.trim().toLowerCase() === newSkill.trim().toLowerCase()
                  )
                }
                onClick={handleAddSkill}
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              What side projects are you currently hustling on?
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <textarea
              name="sideProjects"
              value={form.sideProjects}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono resize-y mt-1 bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-s font-semibold">
              Humble flex, we want to hear the things you’re proud of! Any
              outlier things you have done in LIFE. Cool projects, hacks, viral
              moments, whatever you are most proud of. What non-traditional
              things were you doing growing up?
              <span
                style={{
                  fontSize: "0.7em",
                  verticalAlign: "super",
                  color: "blue",
                  marginLeft: "0.2px",
                }}
              >
                *
              </span>
            </label>
            <textarea
              name="flex"
              value={form.flex}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono resize-y mt-1 bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              rows={3}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="text-s font-semibold">
              Please attack any additional information you would like us to
              consider
            </label>
            <div className="mt-2">
              <input
                id="attachments"
                type="file"
                multiple
                onChange={handleFilesChange}
                className="sr-only"
              />
              <label
                htmlFor="attachments"
                className="inline-block bg-brand-blue text-white px-2 py-1 rounded cursor-pointer hover:brightness-95 text-xs"
              >
                Choose Files
              </label>
              <span className="ml-2 text-xs text-gray-600 align-middle">
                {files.length
                  ? `${files.length} file(s) selected`
                  : "No files selected"}
              </span>
            </div>
            {files.length > 0 && (
              <ul className="mt-2 text-xs list-disc pl-5 space-y-1">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${f.size}-${f.lastModified}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-red-600 hover:text-red-700 text-[11px] px-2 py-0.5 rounded border border-red-200 hover:border-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/submitted"
            className="w-full mx-auto p-4 bg-brand-blue text-white rounded-lg py-2.5 font-semibold md:text-lg tracking-wide shadow hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono flex justify-center"
          >
            SUBMIT YOUR PROFILE
          </Link>
        </form>
      </div>
      <Footer />
    </div>
  );
}
