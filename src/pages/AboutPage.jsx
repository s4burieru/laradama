import { Heart, Music2, Palette } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const principles = [
  {
    icon: Music2,
    title: "Accessible Creation",
    description: "No music skills or instruments needed. Just upload an image and let AI find music that matches its mood, energy, and overall vibe.",
  },
  {
    icon: Palette,
    title: "Visual Harmony",
    description: "Turn the feeling of a visual into sound. Our AI looks at the colors, mood, and atmosphere of your image to find music that complements the moment.",
  },
  {
    icon: Heart,
    title: "Passion Project",
    description: "Built by students who love creativity and technology. We’re creating a simple and fun way for everyone to discover the perfect soundtrack for their moments.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white">
      <Navbar />

      <main className="mx-auto max-w-375 px-6 pb-48 pt-16 md:px-8 max-[1100px]:pb-16 max-[640px]:px-6 max-[640px]:pb-8 max-[640px]:pt-10">
        <section className="grid grid-cols-[1.25fr_1.1fr] items-center gap-13 max-[1100px]:grid-cols-1 max-[1100px]:gap-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-laradama-brand max-[640px]:text-[30px]">
              The Origin Story
            </h1>

            <div className="mt-7 max-w-175 text-[17px] leading-[1.6] text-[#aaa] text-justify max-[1100px]:max-w-none max-[1100px]:text-[16px] max-[640px]:text-[15px]">
              <p className="indent-8">
                It started with a simple idea: what if a picture could tell us what song it needed? A small team with a shared interest in music, design, and technology came together to explore that thought. We wondered: if every image has a mood, could we find the music that matches it? Would a sunset call for something calm, or would a night out fit better with an upbeat track?
              </p>
              <p className="mt-1 indent-8">
                We began experimenting with image analysis, mood detection, and music recommendations. After countless tests and adjustments, Laradama started to take shape. It became more than just suggesting random songs; it was about finding music that actually felt connected to the moment captured in the image.
              </p>
            </div>

            <div className="mt-7 max-w-175 border-t border-laradama-brand pt-5 max-[1100px]:max-w-none">
              <p className="font-display text-[17px] italic leading-relaxed text-laradama-brand max-[640px]:text-[15px]">
                “Every moment has a sound. We built a way to find it.”
              </p>
              <p className="mt-2 text-[13px] font-medium text-[#b7b7b7]">— THE FOUNDING TEAM</p>
            </div>
          </div>

          <figure className="mt-10 w-full max-[1100px]:mt-0">
            <div className="relative aspect-[1.72/1] overflow-hidden border-2 border-laradama-brand bg-[#171717]">
              <img
                src="/our-team.png"
                alt="The team behind Laradama"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-laradama-brand/10" aria-hidden="true" />
            </div>
            <figcaption className="mt-2 text-[13px] text-[#777] max-[640px]:text-[12px]">
              Where the idea began: the team behind Laradama.
            </figcaption>
          </figure>
        </section>

        <section className="mt-18 border border-[#808080] px-8 pb-0 pt-7 max-[1100px]:px-6 max-[1100px]:pb-8 max-[640px]:mt-12 max-[640px]:px-4 max-[640px]:pb-6 max-[640px]:pt-6">
          <div className="text-center">
            <h2 className="font-display mt-8 text-4xl font-bold text-laradama-brand max-[1100px]:text-[36px] max-[640px]:text-[30px]">
              Why We Built This
            </h2>
            <p className="mx-auto mt-3 max-w-155 text-lg leading-[1.45] text-[#777] max-[1100px]:text-[15px] max-[640px]:text-[14px]">
              Our mission is to democratize music creation. We believe that everyone is a creator, regardless of their musical background.
            </p>
          </div>

          <div className="relative mx-auto -mt-14 grid max-w-300 translate-y-1/2 grid-cols-3 gap-10 max-[1100px]:mt-6 max-[1100px]:translate-y-0 max-[1100px]:grid-cols-2 max-[1100px]:gap-6 max-[800px]:grid-cols-1 max-[800px]:gap-4">
            {principles.map(({ icon: Icon, title, description }) => (
              <article key={title} className="min-h-48 border border-laradama-brand bg-[#121212] px-6.5 py-8 max-[1100px]:min-h-42 max-[1100px]:px-5 max-[1100px]:py-6 max-[800px]:min-h-0">
                <div className="flex h-10 w-10 items-center justify-center bg-[#102a19] text-laradama-brand">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 text-[19px] font-bold text-[#e4e4e4] max-[1100px]:text-[17px]">{title}</h3>
                <p className="mt-2.5 text-[15px] leading-[1.55] text-[#777] max-[1100px]:text-[14px]">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}