export default function Footer() {
  return (
    <footer className="border-t border-brand-line py-10 bg-brand-blue font-mono">
      <div className="mx-4 flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-10">
        <div className="flex items-center text-white">
          <div className="">
            <p className="text-white font-semibold">
              The Repo by Reach Capital
            </p>
            <p className="text-white">
              A live, opt-in talent list for builders, hackers, designers and
              engineers.
            </p>
          </div>
        </div>
        <div className="">
          <p className="text-white font-semibold">Resources</p>
          <p className="text-white">Privacy Policy</p>
          <p className="text-white">Terms of Service</p>
          <p className="text-white">Contact Us</p>
        </div>
        <div className="">
          <p className=" text-white font-semibold">Connect</p>
          <p className="text-white">
            Questions? Reach out to us at{" "}
            <a
              href="mailto:hi@repo.reachcapital.com"
              className="underline hover:opacity-80"
            >
              hi@repo.reachcapital.com
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-white mx-4" />
      <div className="text-sm text-white text-center mt-4">
        © {new Date().getFullYear()} Reach Capital. All rights reserved.
      </div>
    </footer>
  );
}
