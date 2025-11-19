import React from "react";

type FlexCardProps = {
  authorName: string;
  authorSchool: string;
  studentId: string;
  flexContent?: string;
  skills?: string[];
  onStartConversation?: (studentId: string) => void;
  isShortlisted?: boolean;
  onToggleShortlist?: () => void;
};


export default function FlexComponent({
  authorName,
  authorSchool,
  studentId,
  flexContent,
  skills = [],
  onStartConversation,
  isShortlisted = false,
  onToggleShortlist,
}: FlexCardProps) {
  // Extract title from first line, rest as description
  const lines = flexContent?.split("\n").filter((line) => line.trim()) || [];
  const title = lines[0] || "Humble Flex";
  const description = lines.slice(1).join("\n") || flexContent || "";

  return (
    <article className="max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Top: title + icons */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>

        {/* Comment + Bookmark icons */}
        <div className="flex items-center gap-3 text-slate-400">
          {/* Comment → tell parent to start a conversation */}
          <button
            type="button"
            className="rounded-full p-1.5 hover:bg-slate-100"
            onClick={() => onStartConversation?.(studentId)}
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
              className="text-black"
            >
              <path d="M21 11.5c0 4-3.7 7.5-8.5 7.5-1.4 0-2.8-.3-4-.9L3 20l1.3-4.1C3.5 14.3 3 12.9 3 11.5 3 7 6.7 3.5 11.5 3.5S21 7 21 11.5z" />
            </svg>
          </button>

          {/* Bookmark */}
          <button
            type="button"
            className="rounded-full p-1.5 hover:bg-slate-100 disabled:opacity-50"
            onClick={onToggleShortlist}
            disabled={!onToggleShortlist}
            aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isShortlisted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom section (unchanged) */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200">
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
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {skills.slice(0, 5).map((skill, idx) => (
            <Tag key={idx}>{skill}</Tag>
          ))}
          {skills.length > 5 && <Tag variant="outline">+{skills.length - 5}</Tag>}
        </div>
      </div>
    </article>
  );
}

type TagProps = {
  children: React.ReactNode;
  variant?: "solid" | "outline";
};

function Tag({ children, variant = "solid" }: TagProps) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium";

  if (variant === "outline") {
    return (
      <span className={`${base} border border-brand-blue text-brand-blue`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`${base} bg-opacity-10 bg-brand-blue text-brand-blue`}>
      {children}
    </span>
  );
}
