import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import Solution from "./components/Solution";
import LocalForecast from "./components/home/LocalForecast";
import LastMile from "./components/home/LastMile";
import Agents from "./components/home/Agents";
import ChildrenTeaser from "./components/home/ChildrenTeaser";
import AdvisorTeaser from "./components/AdvisorTeaser";
import AppCTA from "./components/home/AppCTA";
import Footer from "./components/Footer";

export const metadata = {
  title: "KibiraAI — Early warning for last-mile communities",
  description:
    "Early warnings for heavy rain, floods, landslides, dry spells and disease, sent by SMS, voice and app in local languages to last-mile communities in Uganda.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <section id="forecast" className="py-16 sm:py-20 bg-[#f6faf7]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <LocalForecast />
        </div>
      </section>
      <LastMile />
      <Agents />
      <ChildrenTeaser />
      <AdvisorTeaser />
      <AppCTA />
      <Footer />
    </>
  );
}
