import { useEffect, useState } from "react";

const links = [
  { label: "About Laradama", href: "#about" },
  { label: "How to Use", href: "#how-it-works" },
  { label: "Features", href: "#features" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-50 mx-0 h-20 w-full font-sans transition-colors duration-200",
        open
          ? "border-b-0 bg-[#121212]"
          : "border-b border-[#808080] bg-[#121212]",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-full max-w-375 items-center justify-between px-6 md:px-8">
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
            href="/contact"
            className="border border-laradama-brand px-4 py-2 text-base font-medium text-laradama-brand transition hover:bg-laradama-brand/10"
          >
            Contact
          </a>
        </div>

        <button
          className="text-white min-[640px]:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="absolute left-0 right-0 top-20 max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-[#808080] bg-[#121212] px-8 pb-12 pt-6 backdrop-blur-xl min-[640px]:hidden">
          <ul className="flex flex-col gap-2">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-4 text-base font-medium text-[#d0d0d0] transition hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/team"
                onClick={() => setOpen(false)}
                className="block px-4 py-4 text-base font-medium text-[#d0d0d0] transition hover:bg-white/5 hover:text-white"
              >
                Team
              </a>
            </li>
            <li className="px-4 pt-6">
              <a
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center border border-laradama-brand px-4 py-3.5 text-base font-medium text-laradama-brand transition hover:bg-laradama-brand/10"
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
