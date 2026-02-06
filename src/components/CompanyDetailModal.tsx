interface CompanyDetailModalProps {
  company: {
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
  onClose: () => void;
}

const normalizeUrl = (raw?: string | null) => {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const withScheme =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
};

export default function CompanyDetailModal({
  company,
  onClose,
}: CompanyDetailModalProps) {
  const companyUrl = normalizeUrl(company.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`${company.name} logo`}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-500">
                  {company.name?.charAt(0) || "C"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {company.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                {company.industry && <span>{company.industry}</span>}
                {company.industry && company.company_type && <span>•</span>}
                {company.company_type && <span>{company.company_type}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hiring Status & Quick Info */}
          <div className="flex flex-wrap gap-3">
            {company.is_hiring && (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                ✓ Actively Hiring
              </span>
            )}
            {company.remote_policy && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                {company.remote_policy}
              </span>
            )}
            {company.location && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                📍 {company.location}
              </span>
            )}
            {company.company_size && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                👥 {company.company_size}
              </span>
            )}
          </div>

          {/* Description */}
          {company.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                About
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {company.description}
              </p>
            </div>
          )}

          {/* Open Roles */}
          {company.open_roles && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Open Roles
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-line">
                  {company.open_roles}
                </p>
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {company.tech_stack && company.tech_stack.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {company.tech_stack.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-brand-blue/10 text-brand-blue text-sm font-medium rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What We're Looking For */}
          {company.hiring_needs && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What We're Looking For
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {company.hiring_needs}
              </p>
            </div>
          )}

          {/* Candidate Requirements */}
          {company.candidate_requirements && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ideal Candidate
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {company.candidate_requirements}
              </p>
            </div>
          )}

          {/* Perks */}
          {company.perks && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Perks & Benefits
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {company.perks}
              </p>
            </div>
          )}

          {/* Website Button */}
          {companyUrl && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() =>
                  window.open(companyUrl, "_blank", "noopener,noreferrer")
                }
                className="w-full py-3 px-4 bg-brand-blue text-white font-medium rounded-xl hover:bg-brand-blue/90 transition"
              >
                Visit Website →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
