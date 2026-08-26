import { useState } from "react";

const links = [
  { label: "About Laradama", href: "#about" },
  { label: "How to Use", href: "#how-it-works" },
  { label: "Features", href: "#features" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 mx-0 h-20 w-full border-b border-[#808080] bg-[#121212]">
      <nav className="mx-auto flex h-full max-w-375 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-10">
          <a href="/" className="flex shrink-0 items-center gap-4 text-[36px] font-bold">
            <img src="/laradama-logo.png" alt="Laradama logo" className="h-12 w-12 object-cover" />
          </a>

          <ul className="hidden items-center gap-8 text-base text-[#d0d0d0] min-[640px]:flex">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="transition hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden items-center gap-4 min-[640px]:flex">
          <a href="/team" className="text-base text-[#d0d0d0] transition hover:text-white">
            Team
          </a>
          <a
            href="#contact"
            className="border border-laradama-brand px-4 py-2 text-base font-medium text-laradama-brand transition hover:bg-laradama-brand/10"
          >
            Contact
          </a>
        </div>

        <button
          className="text-white min-[640px]:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-8 py-4 min-[640px]:hidden">
          <ul className="flex flex-col gap-4 text-base text-gray-300">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
            <li>
              <a href="/team">Team</a>
            </li>
            <li>
              <a
                href="#contact"
                className="inline-block border border-laradama-brand px-4 py-2 text-laradama-brand"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
