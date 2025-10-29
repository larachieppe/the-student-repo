import people from "../assets/people.png";
import work from "../assets/work.png";
import graph from "../assets/graph.png";

export default function FeatureGrid() {
  const features = [
    {
      icon: people,
      title: "FIND FLEXIBLE OPPORTUNITIES",
      body: "We add you to our private talent list for Reach-backed startups.",
    },
    {
      icon: work,
      title: "WORK ON REAL THINGS, NOW.",
      body: "Founders see you and your projects when looking for builders and talent.",
    },
    {
      icon: graph,
      title: "GET AHEAD OF THE CURVE.",
      body: "You get in the room before the job posts even go live.",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-xl border border-brand-line bg-brand-blue p-5 ring-1 ring-white/5 pt-10"
        >
          <div className="mb-2 font-semibold text-brand-lime flex justify-center">
            <img src={f.icon} alt={f.title} className="mb-2 h-8 w-8" />
          </div>
          <div className="mb-2 font-semibold text-brand-lime pb-4">
            {f.title}
          </div>
          <p className="text-brand-bg">{f.body}</p>
        </div>
      ))}
    </div>
  );
}
