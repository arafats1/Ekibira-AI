import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import Solution from "./components/Solution";
import WhoBenefits from "./components/WhoBenefits";
import AdvisorTeaser from "./components/AdvisorTeaser";
import Impact from "./components/Impact";
import Footer from "./components/Footer";

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
