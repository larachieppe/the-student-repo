import { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface CompanyProfileProps {
  companyId: string;
}

interface CompanyData {
  name: string;
  description: string;
  company_type: string;
  industry: string;
  company_size: string;
  website: string;
  logo_url: string;
  open_roles: string;
  hiring_needs: string;
  candidate_requirements: string;
  tech_stack: string[];
  perks: string;
  location: string;
  remote_policy: string;
  is_hiring: boolean;
}

export default function CompanyProfile({ companyId }: CompanyProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyData>({
    name: "",
    description: "",
    company_type: "",
    industry: "",
    company_size: "",
    website: "",
    logo_url: "",
    open_roles: "",
    hiring_needs: "",
    candidate_requirements: "",
    tech_stack: [],
    perks: "",
    location: "",
    remote_policy: "",
    is_hiring: true,
  });

  useEffect(() => {
    if (!companyId) return;

    const loadCompanyProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) {
        console.error("Error loading company profile:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setCompany({
          name: data.name || "",
          description: data.description || "",
          company_type: data.company_type || "",
          industry: data.industry || "",
          company_size: data.company_size || "",
          website: data.website || "",
          logo_url: data.logo_url || "",
          open_roles: data.open_roles || "",
          hiring_needs: data.hiring_needs || "",
          candidate_requirements: data.candidate_requirements || "",
          tech_stack: data.tech_stack || [],
          perks: data.perks || "",
          location: data.location || "",
          remote_policy: data.remote_policy || "",
          is_hiring: data.is_hiring ?? true,
        });
      }
      setLoading(false);
    };

    loadCompanyProfile();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          description: company.description,
          company_type: company.company_type,
          industry: company.industry,
          company_size: company.company_size,
          website: company.website,
          logo_url: company.logo_url,
          open_roles: company.open_roles,
          hiring_needs: company.hiring_needs,
          candidate_requirements: company.candidate_requirements,
          tech_stack: company.tech_stack,
          perks: company.perks,
          location: company.location,
          remote_policy: company.remote_policy,
          is_hiring: company.is_hiring,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyId);

      if (error) {
        console.error("Error saving company profile:", error);
        alert("Failed to save company profile. Please try again.");
        return;
      }

      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Company Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue px-5 py-2 text-black hover:bg-brand-blue/5 transition"
          >
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
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6">
        {/* Company Name (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={company.name}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
          />
        </div>

        {/* Hiring Status */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={company.is_hiring}
              onChange={(e) =>
                setCompany({ ...company, is_hiring: e.target.checked })
              }
              disabled={!isEditing}
              className="w-4 h-4 text-brand-blue rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              We are actively hiring
            </span>
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Description
          </label>
          <textarea
            value={company.description}
            onChange={(e) =>
              setCompany({ ...company, description: e.target.value })
            }
            disabled={!isEditing}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Tell students about your company..."
          />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Type
            </label>
            <select
              value={company.company_type}
              onChange={(e) =>
                setCompany({ ...company, company_type: e.target.value })
              }
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select type...</option>
              <option value="Startup">Startup</option>
              <option value="Scale-up">Scale-up</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Non-profit">Non-profit</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <input
              type="text"
              value={company.industry}
              onChange={(e) =>
                setCompany({ ...company, industry: e.target.value })
              }
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g., EdTech, HealthTech"
            />
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Size
            </label>
            <select
              value={company.company_size}
              onChange={(e) =>
                setCompany({ ...company, company_size: e.target.value })
              }
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select size...</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501+">501+ employees</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={company.location}
              onChange={(e) =>
                setCompany({ ...company, location: e.target.value })
              }
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g., San Francisco, CA"
            />
          </div>

          {/* Remote Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remote Work Policy
            </label>
            <select
              value={company.remote_policy}
              onChange={(e) =>
                setCompany({ ...company, remote_policy: e.target.value })
              }
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select policy...</option>
              <option value="Remote">Fully Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="In-office">In-office</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={company.website}
              onChange={(e) =>
                setCompany({ ...company, website: e.target.value })
              }
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="https://yourcompany.com"
            />
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo URL
          </label>
          <input
            type="url"
            value={company.logo_url}
            onChange={(e) =>
              setCompany({ ...company, logo_url: e.target.value })
            }
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="https://yourcompany.com/logo.png"
          />
        </div>

        {/* Open Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Open Roles
          </label>
          <textarea
            value={company.open_roles}
            onChange={(e) =>
              setCompany({ ...company, open_roles: e.target.value })
            }
            disabled={!isEditing}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="List your open positions (e.g., Software Engineer Intern, Product Designer, etc.)"
          />
        </div>

        {/* Hiring Needs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hiring Needs
          </label>
          <textarea
            value={company.hiring_needs}
            onChange={(e) =>
              setCompany({ ...company, hiring_needs: e.target.value })
            }
            disabled={!isEditing}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe what kind of talent you're looking for..."
          />
        </div>

        {/* What We Look For */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What We Look For in Candidates
          </label>
          <textarea
            value={company.candidate_requirements}
            onChange={(e) =>
              setCompany({
                ...company,
                candidate_requirements: e.target.value,
              })
            }
            disabled={!isEditing}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Skills, qualities, experience, etc..."
          />
        </div>

        {/* Tech Stack */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tech Stack / Required Skills
          </label>
          <input
            type="text"
            value={company.tech_stack.join(", ")}
            onChange={(e) =>
              setCompany({
                ...company,
                tech_stack: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="React, Python, Node.js, etc. (comma-separated)"
          />
        </div>

        {/* Perks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perks & Benefits
          </label>
          <textarea
            value={company.perks}
            onChange={(e) =>
              setCompany({ ...company, perks: e.target.value })
            }
            disabled={!isEditing}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Health insurance, equity, learning budget, etc..."
          />
        </div>
      </div>
    </div>
  );
}
