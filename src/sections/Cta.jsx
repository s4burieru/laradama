import { Upload } from "lucide-react";

export default function Cta() {
  const handleClick = () => {
    // On the Features page, send the user to the home page uploader.
    // On the home page, just scroll to the very top.
    if (window.location.pathname === "/features") {
      window.location.href = "/";
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="upload" className="border-t border-[#808080] bg-[#121212]">
      <div className="mx-auto max-w-375 px-8 py-24 text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Give your next photo a soundtrack.
        </h2>
        <p className="mt-4 text-gray-400">
          Free to try. No account needed to see your first match.
        </p>
        <button
          type="button"
          onClick={handleClick}
          className="mt-8 inline-flex items-center gap-2 rounded-none bg-laradama-brand px-6 py-3 text-sm font-bold text-[#06170C] transition hover:-translate-y-0.5 hover:bg-laradama-brand-hover"
        >
          <Upload size={16} strokeWidth={2.4} />
          Upload a photo
        </button>
      </div>
    </section>
  );
}