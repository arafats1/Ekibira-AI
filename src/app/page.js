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
    "KibiraAI is an integrated climate intelligence platform for Africa: forest monitoring, flood and heat risk prediction, AI climate research, and community reforestation.",
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
