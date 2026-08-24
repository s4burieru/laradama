import { useState } from "react";

const links = [
  { label: "About Laradama", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How to Use", href: "#how-it-works" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <nav className="mx-auto flex max-w-295 items-center justify-between gap-8 px-8 py-4">
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-2 shrink-0">
            <img src="/laradama-logo.png" alt="Laradama logo" className="h-8 w-auto" />
          </a>

          <ul className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="transition hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#team" className="text-sm text-gray-300 transition hover:text-white">
            Team
          </a>
          <a
            href="#contact"
            className="rounded-md border border-laradama-brand px-4 py-2 text-sm font-medium text-laradama-brand transition hover:bg-laradama-brand/10"
          >
            Contact
          </a>
        </div>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-8 py-4 md:hidden">
          <ul className="flex flex-col gap-4 text-sm text-gray-300">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
            <li><a href="#team">Team</a></li>
            <li>
              <a
                href="#contact"
                className="inline-block rounded-md border border-laradama-brand px-4 py-2 text-laradama-brand"
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