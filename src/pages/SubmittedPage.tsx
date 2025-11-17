import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function SubmittedPage() {
  return (
    <div className="bg-white font-mono">
      <NavBar />
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-bold text-2xl md:text-3xl mb-4 font-mono">
          CONGRATULATIONS! YOUR PROFILE HAS BEEN SUCCESSFULLY SUBMITTED.
        </h1>
        <p className="text-sm md:text-base text-gray-700 max-w-xl mb-8">
          Create an account with us if you wish to save your responses and keep
          them up-to-date.
        </p>
        <Link
          to="/login"
          className="p-4 bg-brand-blue text-white rounded-lg py-2.5 font-semibold md:text-lg tracking-wide shadow hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono flex justify-center"
        >
          CREATE ACCOUNT
        </Link>
      </div>
      <Footer />
    </div>
  );
}
