const steps = [
  {
    n: "01 — CAPTURE",
    title: "Upload or snap a photo",
    desc: "Drop in an existing image or use your camera. Any scene works — portraits, landscapes, food, a screenshot of your mood board.",
  },
  {
    n: "02 — ANALYZE",
    title: "AI reads the vibe",
    desc: "Laradama scans color palette, lighting, composition, and motion to build a mood profile for your image.",
  },
  {
    n: "03 — MATCH",
    title: "Get a trending track",
    desc: "It's paired against songs trending right now — not a static library — so the match always feels current.",
  },
  {
    n: "04 — REFINE",
    title: "Swipe to reshuffle",
    desc: "Not feeling it? Swipe and get another match instantly. Keep it, and Laradama tells you exactly why it chose that song.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-[#121212] border-t border-laradama-line py-24">
      <div className="mx-auto max-w-295 px-8">
        <div className="mb-14 max-w-140">
          <div className="mb-4 inline-flex items-center gap-2 border border-laradama-brand px-3 py-1.5 font-mono text-xs text-laradama-brand">
            HOW IT WORKS
          </div>
          <h2 className="mb-3.5 font-display text-4xl font-bold">
            From photo to playlist in four steps.
          </h2>
          <p className="text-base leading-[1.6] text-laradama-dim">
            No manual tagging, no searching by genre. Laradama does the listening for you.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-px overflow-hidden border border-laradama-brand bg-[#121212] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          {steps.map((step) => (
            <div
              key={step.n}
              className="border border-laradama-brand px-6.5 py-8 transition-colors duration-200 hover:bg-laradama-elevated"
            >
              <div className="mb-5.5 font-mono text-xs text-laradama-dimmer">{step.n}</div>
              <h3 className="mb-2.5 font-display text-[17px] font-bold">{step.title}</h3>
              <p className="text-[13.5px] leading-[1.55] text-laradama-dim">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}