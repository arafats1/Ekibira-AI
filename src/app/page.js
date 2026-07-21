import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import Solution from "./components/Solution";
import WhoBenefits from "./components/WhoBenefits";
import AdvisorTeaser from "./components/AdvisorTeaser";
import Impact from "./components/Impact";
import Footer from "./components/Footer";

export const metadata = {
  title: "Kibira AI - AI-Powered Climate Intelligence for Africa",
  description:
    "Fight deforestation, deliver urban flood and heat early warning, and turn climate data into children's health foresight — try KibiraAI free before you commit.",
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
      <WhoBenefits />
      <AdvisorTeaser />
      <Impact />
      <Footer />
    </>
  );
}
