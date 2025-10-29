import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-brand-line py-10 bg-brand-blue">
      <div className="container-tight flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-bg p-2">
            <img src={logo} alt="Logo" />
          </span>
          <span className="font-mono font-semibold">Reach Capital</span>
        </div>
        <div className="text-sm text-white">
          © {new Date().getFullYear()} Reach Capital. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
