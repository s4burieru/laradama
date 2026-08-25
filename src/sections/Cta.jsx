import { Upload } from "lucide-react";

export default function Cta() {
  return (
    <section id="upload" className="border-t border-[#808080] bg-[#121212]">
      <div className="mx-auto max-w-375 px-8 py-24 text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Give your next photo a soundtrack.
        </h2>
        <p className="mt-4 text-gray-400">
          Free to try. No account needed to see your first match.
        </p>
        <a
          href="#upload"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-laradama-brand px-6 py-3 text-sm font-semibold text-black transition hover:bg-laradama-brand/80"
        >
          <Upload size={16} />
          Upload a photo
        </a>
      </div>
    </section>
  );
}