import { ArrowDown, Image as ImageIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    number: "01",
    label: "CAPTURE",
    title: "Choose a photo",
    description:
      "Start with a photo that captures a moment or a mood. Upload an image from your device or take a new one, then get ready to see what it sounds like.",
    hint: "A portrait, a place, or a favorite memory — it's up to you.",
  },
  {
    number: "02",
    label: "ANALYZE",
    title: "Let Laradama read the mood",
    description:
      "Laradama looks at the image's visual mood, colors, and atmosphere to build a starting point for finding music that fits.",
    hint: "No tags or genre searches needed.",
  },
  {
    number: "03",
    label: "DISCOVER",
    title: "Explore your music match",
    description:
      "Get a song recommendation inspired by your image. Preview the track and see why its sound was paired with your moment.",
    hint: "A new way to find a soundtrack for what you see.",
  },
  {
    number: "04",
    label: "MAKE IT YOURS",
    title: "Find the one that feels right",
    description:
      "Keep exploring until a song clicks. Then save or share your match using the options available in Laradama.",
    hint: "Your moment, your music, your story.",
  },
];

function StepImagePlaceholder({ number, title }) {
  return (
    <div
      role="img"
      aria-label={`Image placeholder for step ${number}: ${title}`}
      className="relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden border border-dashed border-laradama-brand/50 bg-[#171717] px-6 text-center"
    >
      <span className="absolute left-4 top-4 font-mono text-xs tracking-[0.12em] text-laradama-brand">
        STEP {number}
      </span>
      <div className="flex h-14 w-14 items-center justify-center border border-laradama-brand/40 bg-laradama-brand/10 text-laradama-brand">
        <ImageIcon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <span className="mt-4 text-sm font-medium text-[#d0d0d0]">
        Image placeholder
      </span>
      <span className="mt-1 text-xs text-[#777]">
        Add a screenshot or illustration for this step
      </span>
      <span
        className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-laradama-brand/5 blur-3xl"
        aria-hidden="true"
      />
    </div>
  );
}

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white">
      <Navbar />
      <main>
        <section className="border-b border-[#383838]">
          <div className="mx-auto max-w-375 px-6 py-16 md:px-8 md:py-20 max-[640px]:py-12">
            <p className="font-mono text-xs tracking-[0.12em] text-laradama-brand">
              YOUR GUIDE / 4 SIMPLE STEPS
            </p>
            <h1 className="mt-4 max-w-200 font-display text-4xl font-bold leading-tight text-white max-[640px]:text-[32px]">
              From a photo to a{" "}
              <span className="text-laradama-brand">feeling in music.</span>
            </h1>
            <p className="mt-5 max-w-165 text-base leading-[1.7] text-[#999] sm:text-lg">
              Bring a moment to Laradama and discover music inspired by its
              mood. Here’s how to get started.
            </p>
            <a
              href="#steps"
              className="mt-8 inline-flex items-center gap-2 border border-laradama-brand px-5 py-3 text-sm font-medium text-laradama-brand transition-colors hover:bg-laradama-brand/10"
            >
              Explore the steps
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section
          id="steps"
          className="mx-auto max-w-375 px-6 py-12 md:px-8 md:py-16 max-[640px]:px-6"
          aria-label="How to use Laradama"
        >
          <div className="grid gap-5">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="grid items-center gap-8 border border-[#383838] bg-[#151515] p-5 sm:p-7 md:grid-cols-2 md:gap-12 md:p-9"
              >
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <StepImagePlaceholder number={step.number} title={step.title} />
                </div>
                <div className={index % 2 === 1 ? "md:order-1" : ""}>
                  <p className="font-mono text-xs tracking-[0.12em] text-laradama-brand">
                    {step.number} / {step.label}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                    {step.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-[1.7] text-[#999]">
                    {step.description}
                  </p>
                  <p className="mt-5 border-l border-laradama-brand pl-4 text-sm leading-relaxed text-[#c1c1c1]">
                    {step.hint}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
