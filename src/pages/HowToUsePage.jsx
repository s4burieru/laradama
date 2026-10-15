import { ArrowDown } from "lucide-react";
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
  if (number === "01") {
    return (
      <img
        src="/how-to-choose-photo.png"
        alt="Step 01: Choose a photo and upload it to Laradama"
        className="aspect-video w-full border border-[#383838] bg-[#121212] object-contain"
      />
    );
  }

  if (number === "02") {
    return (
      <img
        src="/how-to-analyze-mood.png"
        alt="Step 02: Laradama analyzes a photo's mood"
        className="aspect-video w-full border border-[#383838] bg-[#121212] object-contain"
      />
    );
  }

  if (number === "03") {
    return (
      <img
        src="/how-to-explore-match.png"
        alt="Step 03: Explore a music match inspired by your photo"
        className="aspect-video w-full border border-[#383838] bg-[#121212] object-contain"
      />
    );
  }

  if (number === "04") {
    return (
      <img
        src="/how-to-make-it-yours.png"
        alt="Step 04: Find and save or share your music match"
        className="aspect-video w-full border border-[#383838] bg-[#121212] object-contain"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Image placeholder for step ${number}: ${title}`}
      className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden border border-dashed border-laradama-brand/50 bg-[#171717] px-6 text-center"
    >
      <span className="absolute left-4 top-4 font-mono text-xs tracking-[0.12em] text-laradama-brand">
        STEP {number}
      </span>
      <span className="text-sm font-medium text-[#d0d0d0]">
        Image placeholder
      </span>
      <span className="mt-1 text-xs text-[#777]">
        Add a screenshot or illustration for this step
      </span>
    </div>
  );
}

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white">
      <Navbar />
      <main>
        <section aria-label="How to use Laradama">
          <header>
            <div className="mx-auto max-w-375 px-6 pb-6 pt-12 text-center md:px-8 md:pb-8 md:pt-16 max-[640px]:pb-4 max-[640px]:pt-10">
              <h1 className="mx-auto mt-4 max-w-200 font-display text-4xl font-bold leading-tight text-laradama-brand max-[640px]:text-[36px]">
                From a photo to{" "}
                <span className="text-laradama-brand">feeling in music.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-240 text-base leading-[1.7] text-[#858585] sm:text-lg">
                Upload or take a photo. Laradama App checks its mood, colors,
                and movement to find a trending song that matches its vibe.
                Don&apos;t like the song? Just tap next to find another one you
                might like.
              </p>
              <a
                href="#steps"
                className="mt-8 inline-flex items-center gap-2 border border-laradama-brand px-5 py-3 text-sm font-medium text-laradama-brand transition-colors hover:bg-laradama-brand/10"
              >
                Explore the steps
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </header>

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
        </section>
      </main>
      <Footer />
    </div>
  );
}
