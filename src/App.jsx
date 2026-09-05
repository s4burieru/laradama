import Navbar from "./components/Navbar";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";
import WhyItMatches from "./sections/WhyItMatches";
import Cta from "./sections/Cta";
import Footer from "./components/Footer";
import TeamPage from "./pages/TeamPage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  const path = window.location.pathname;

  if (path === "/team") {
    return <TeamPage />;
  }

  if (path === "/contact") {
    return <ContactPage />;
  }

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
