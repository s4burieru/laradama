import Navbar from "./components/Navbar";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";
import WhyItMatches from "./sections/WhyItMatches";
import Cta from "./sections/Cta";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-black font-sans text-white">
      <Navbar />
      <Hero />
      <HowItWorks />
      <WhyItMatches />
      <Cta />
      <Footer />
    </div>
  );
}