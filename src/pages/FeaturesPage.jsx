import {
  Headphones,
  ImagePlus,
  Lightbulb,
  Music2,
  Share2,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Cta from "../sections/Cta";
import Footer from "../components/Footer";
import TrendingMusicPlayer from "../components/TrendingMusicPlayer";
import { renderStoryTemplate, songs, storyTemplates } from "../sections/Hero";

const features = [
  { icon: ImagePlus, title: "Image Upload & Capture", description: "Upload a photo or capture a new moment directly from your device." },
  { icon: Sparkles, title: "AI Mood & Vibe Analysis", description: "Our AI reads the colors, energy, and feeling inside every image." },
  { icon: Music2, title: "Curated Music Suggestions", description: "Get thoughtful song recommendations that feel made for your moment." },
  { icon: Headphones, title: "Listen & Explore", description: "Preview your match, discover new artists, and follow the feeling further." },
  { icon: Share2, title: "Share Your Story", description: "Turn your photo and its soundtrack into something worth sharing." },
  { icon: Lightbulb, title: "Creative Soundtracks", description: "Find a fresh perspective on familiar memories through music." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white">
      <Navbar />
      <main>
        <section className="w-full border-b border-[#808080]">
          <div className="mx-auto max-w-375 px-6 pb-16 pt-16 text-center md:px-8 md:pb-20 md:pt-20 max-[640px]:px-6 max-[640px]:pb-12 max-[640px]:pt-12">
            <span className="inline-flex items-center gap-2 border border-laradama-brand/25 bg-laradama-brand/10 px-3 py-1.5 font-mono text-xs tracking-[0.02em] text-laradama-brand">
              <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-none bg-laradama-brand" />
              SYSTEM CAPABILITIES
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-laradama-brand">Discover Music Through Your Moments</h1>
            <p className="mx-auto mt-4 max-w-175 text-base leading-[1.55] text-[#858585] sm:text-lg">Upload or capture an image, let our neural matching engine read the underlying emotion, and discover the exact soundtrack to your visual reality.</p>
            <div className="mt-12 sm:mt-14"><TrendingMusicPlayer /></div>
          </div>
        </section>

        <section id="features" className="w-full border-b border-[#808080]">
          <div className="mx-auto max-w-375 px-6 py-14 md:px-8 md:py-16 max-[640px]:px-6">
            <div className="mb-7 flex items-center justify-between"><h2 className="font-display text-4xl font-bold text-white">Core App <span className="text-laradama-brand">Features</span></h2></div>
            <div className="grid grid-cols-3 gap-4 sm:gap-5 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="min-h-48 border border-laradama-brand bg-[#151515] p-5 transition-colors hover:border-laradama-brand sm:min-h-52 sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center bg-[#102a19] text-laradama-brand"><Icon className="h-5 w-5" strokeWidth={1.8} /></div>
                  <h3 className="mt-4 text-base font-semibold leading-tight text-[#e5e5e5] sm:text-lg">{title}</h3>
                  <p className="mt-3 text-sm leading-normal text-[#777] sm:text-[15px]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="mx-auto max-w-375 px-6 py-14 md:px-8 md:py-16 max-[640px]:px-6">
            <div className="text-center"><h2 className="font-display text-4xl font-bold text-white">Share to Story <span className="text-laradama-brand">Templates</span></h2><p className="mx-auto mt-4 max-w-175 text-base leading-[1.55] text-[#858585] sm:text-lg">Pick from beautifully designed template frames to instantly export your photo and song match as an aesthetic masterpiece.</p></div>
            <div className="mx-auto mt-9 grid max-w-260 grid-cols-4 gap-4 sm:gap-5 max-[520px]:grid-cols-2">
              {storyTemplates.map((template) => (
                <article key={template.id} className="ld-thumb-wrap">
                  <div className="ld-story-card thumb" dangerouslySetInnerHTML={{ __html: renderStoryTemplate(songs[0], template.id) }} />
                  <span className="ld-thumb-label text-xs! font-normal uppercase sm:text-sm!">{template.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Cta />
      <Footer />
    </div>
  );
}