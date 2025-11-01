import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import TabsNav from "../components/TabsNav";

export default function SubmittedPage() {
  return (
    <div className="bg-white">
      <NavBar />
      <div className="min-h-[70vh] flex flex-col items-center justify">
        <h1 className="font-bold text-2xl md:text-3xl mb-4 font-mono">
          WELCOME [STUDENT NAME]!
        </h1>
        <div className="w-full flex justify-center">
          <TabsNav />
        </div>
      </div>
      <Footer />
    </div>
  );
}
