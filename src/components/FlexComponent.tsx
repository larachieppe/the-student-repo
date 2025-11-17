export default function FlexComponent() {
  return (
    <article className="max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Top: title + icons */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Just shipped a real-time collaboration feature!
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Built a real-time document collaboration system using WebSockets and
            CRDTs. Users can now edit together seamlessly with conflict-free
            merging. Learned so much about distributed systems! 🚀
          </p>
        </div>

        {/* Comment + Bookmark icons */}
        <div className="flex items-center gap-3 text-slate-400">
          {/* Comment */}
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
              className="text-black"
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
              className="text-black"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
      {/* Bottom section */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <div className="font-medium text-slate-900">Sarah Chen</div>
            <div className="text-slate-500">MIT ’25</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-end gap-2">
          <Tag>React</Tag>
          <Tag>TypeScript</Tag>
          <Tag>Node.js</Tag>
          <Tag>AWS</Tag>
          <Tag>PostgreSQL</Tag>
          <Tag variant="outline">+1</Tag>
        </div>
      </div>
    </article>
  );
}

function Tag({ children, variant = "solid" }) {
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
