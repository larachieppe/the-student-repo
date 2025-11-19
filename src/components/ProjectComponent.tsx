type ProjectCardProps = {
  title: string;
  description: string;
  tags: string[];
  authorName: string;
  authorSchool: string;
  projectImage?: string;
  projectUrl?: string;
  studentId?: string;
  onViewProject?: () => void;
  onStartConversation?: (studentId: string) => void;
};

export default function ProjectCard({
  title,
  description,
  tags,
  authorName,
  authorSchool,
  projectImage,
  projectUrl,
  studentId,
  onViewProject,
  onStartConversation,
}: ProjectCardProps) {
  const handleViewProject = () => {
    if (projectUrl) {
      window.open(projectUrl, "_blank", "noopener,noreferrer");
    } else if (onViewProject) {
      onViewProject();
    }
  };

  const handleMessage = () => {
    if (studentId && onStartConversation) {
      onStartConversation(studentId);
    }
  };

  return (
    <article className="max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Project Image */}
      {projectImage && (
        <div className="w-full h-48 overflow-hidden bg-slate-100 rounded-t-3xl">
          <img
            src={projectImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Main content */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        {/* Tags */}
        <div className="mt-4 flex flex-nowrap gap-2">
          {tags.length > 5 ? (
            <>
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border-brand-blue bg-opacity-10 bg-brand-blue text-brand-blue px-3 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0"
                >
                  {tag}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full border-brand-blue bg-opacity-10 bg-brand-blue text-brand-blue px-3 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0">
                +{tags.length - 4}
              </span>
            </>
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border-brand-blue bg-opacity-10 bg-brand-blue text-brand-blue px-3 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0"
              >
                {tag}
              </span>
            ))
          )}
        </div>

        {/* View project button */}
        <button
          type="button"
          onClick={handleViewProject}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-blue px-4 py-2.5 text-sm font-semibold text-brand-blue hover:bg-brand-blue/5 transition"
        >
          {/* external-link style icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3h7v7" />
            <path d="M10 14 21 3" />
            <path d="M5 5h6" />
            <path d="M5 5v14h14v-6" />
          </svg>
          VIEW PROJECT
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200">
            {/* placeholder avatar circle */}
            <span className="text-xs font-semibold text-slate-600">
              {authorName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <div className="text-xs">
            <div className="font-medium text-slate-900">{authorName}</div>
            <div className="text-slate-500">{authorSchool}</div>
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 text-black">
          {/* Chat bubble */}
          <button 
            onClick={handleMessage}
            className="rounded-full p-1.5 hover:bg-slate-100"
          >
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
              <path d="M21 11.5c0 4-3.7 7.5-8.5 7.5-1.4 0-2.8-.3-4-.9L3 20l1.3-4.1C3.5 14.3 3 12.9 3 11.5 3 7 6.7 3.5 11.5 3.5S21 7 21 11.5z" />
            </svg>
          </button>

          {/* Bookmark */}
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
    </article>
  );
}
