import IntroSplash from "./components/IntroSplash";
import Navbar from "./components/Navbar";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";
import WhyItMatches from "./sections/WhyItMatches";
import Cta from "./sections/Cta";
import Footer from "./components/Footer";
import TeamPage from "./pages/TeamPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import FeaturesPage from "./pages/FeaturesPage";

export default function App() {
  const path = window.location.pathname;

  let page;
  if (path === "/team") {
    page = <TeamPage />;
  } else if (path === "/contact") {
    page = <ContactPage />;
  } else if (path === "/about") {
    page = <AboutPage />;
  } else if (path === "/features") {
    page = <FeaturesPage />;
  } else {
    page = (
      <div className="min-h-screen bg-black font-sans text-white">
        <IntroSplash />
        <Navbar />
        <Hero />
        <HowItWorks />
        <WhyItMatches />
        <Cta />
        <Footer />
      </div>
    );
  }

  return page;
}
