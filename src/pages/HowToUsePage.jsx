import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    number: "01",
    title: "Capture or Upload",
    description:
      "Choose a photo from your gallery or capture a new moment. Laradama will use your image as the starting point for a soundtrack.",
  },
  {
    number: "02",
    title: "Mood Detection",
    description:
      "Laradama reads the colors, atmosphere, and feeling in your photo to understand its overall mood.",
  },
  {
    number: "03",
    title: "Music Suggestions",
    description:
      "Explore song recommendations chosen to match the energy and emotion of your image.",
  },
  {
    number: "04",
    title: "Listen on Spotify",
    description:
      "Preview a suggested track, then open it on Spotify to keep listening.",
  },
  {
    number: "05",
    title: "Share to Story",
    description:
      "Save the photo and song pairing you love, and share your new soundtrack with friends.",
  },
];

function StepImagePlaceholder({ number, title }) {
  return (
    <div
      role="img"
      aria-label={`Image placeholder for step ${number}: ${title}`}
      className="aspect-[5/4] w-full border border-[#303030] bg-[#191919]"
    />
  );
}

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white">
      <Navbar />
      <main>
        <section aria-label="How to use Laradama">
          <header className="mx-auto max-w-7xl px-6 pb-8 pt-10 text-center sm:px-8 sm:pb-10 sm:pt-12 lg:px-12">
            <h1 className="font-display text-3xl font-bold leading-tight text-laradama-brand sm:text-4xl">
              How to Use
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#858585] sm:text-base">
              Discover how Laradama turns your photos into music. From capturing
              a moment to sharing its soundtrack, your next favorite song is
              just a few steps away.
            </p>
          </header>

          <div
            id="steps"
            className="mx-auto grid max-w-7xl gap-y-8 px-6 pb-12 sm:gap-y-10 sm:px-8 sm:pb-16 lg:gap-y-12 lg:px-12"
          >
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="grid items-center gap-5 md:grid-cols-2 md:gap-10"
              >
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-laradama-brand font-mono text-sm font-bold text-[#121212]">
                    {Number(step.number)}
                  </div>
                  <h2 className="mt-2 font-display text-xl font-bold leading-tight text-white sm:text-2xl">
                    {step.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-[#929292]">
                    {step.description}
                  </p>
                </div>
                <div className={index % 2 === 1 ? "md:order-1" : ""}>
                  <StepImagePlaceholder number={step.number} title={step.title} />
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
