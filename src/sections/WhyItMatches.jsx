const tags = ["color analysis", "lighting & mood", "tempo matching", "genre trend data"];

const matchedTrack = {
  title: "Static Bloom",
  artist: "Nightflor",
};

export default function WhyItMatches() {
  return (
    <section id="why" className="bg-[#121212] border-t border-[#808080] py-24">
      <div className="mx-auto grid max-w-295 grid-cols-2 items-center gap-14 px-8 max-[900px]:grid-cols-1">
        {/* Why-it-matched mock card */}
        <div className="border border-laradama-brand bg-laradama-elevated p-5.5">
          <div className="mb-4.5 flex items-center gap-3.5">
            <div className="h-14 w-14 shrink-0 bg-[linear-gradient(135deg,#1ED760,#0f8a3f)]" />
            <div>
              <p className="text-[15px] font-bold text-laradama-ink">
                {matchedTrack.title}
              </p>
              <p className="text-[12.5px] text-laradama-dim">{matchedTrack.artist}</p>
            </div>
          </div>

          <div className="my-4 h-px bg-laradama-line" />

          <span className="mb-2.5 block font-mono text-[10.5px] text-laradama-coral">
            ◆ WHY LARADAMA PICKED THIS
          </span>
          <p className="text-[14px] leading-[1.65] text-[#D6D6D9]">
            Your photo&apos;s{" "}
            <strong className="font-semibold text-laradama-ink">cool blue tones</strong> and{" "}
            <strong className="font-semibold text-laradama-ink">high-contrast backlighting</strong>{" "}
            read as moody and electric. This track&apos;s{" "}
            <strong className="font-semibold text-laradama-ink">slow synth build</strong> and{" "}
            <strong className="font-semibold text-laradama-ink">restrained tempo</strong> mirror
            that same tension — it&apos;s trending this week among late-night, city-lights edits.
          </p>
        </div>

        {/* Explanation copy */}
        <div className="mx-auto max-w-140 ">
          <h2 className="mb-4 font-display text-[34px] font-bold leading-tight text-laradama-brand">
            Not just a match — a reason.
          </h2>
          <p className="mb-5.5 text-base leading-[1.65] text-laradama-dim">
            Every pick comes with a plain-language explanation: what Laradama saw in your image, and
            what it heard in the track that made the pairing click. It&apos;s a second layer once you
            keep a song — read the mood behind the mix, or learn something new about the track
            itself.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border border-laradama-line px-3 py-1.5 font-mono text-[11.5px] text-laradama-dim"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}