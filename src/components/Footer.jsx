const nav = ["About", "Features", "How to Use", "Team"];

const socials = [
  { label: "X", href: "#" },
  { label: "Threads", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Portfolio", href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black">
      <div className="mx-auto grid max-w-295 grid-cols-1 gap-10 px-8 py-14 md:grid-cols-3">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src="/laradama-logo.png" alt="Laradama logo" className="h-7 w-auto" />
            <span className="text-lg font-bold text-white">laradama.ai</span>
          </div>
          <div className="h-px w-full bg-white/10" />
          <ul className="space-y-2 text-sm text-gray-400">
            <li>Rizal, Philippines</li>
            <li>+63 9XX XXX XXXX</li>
            <li>name@email.com</li>
          </ul>
        </div>

        {/* Nav */}
        <div className="border-t border-white/10 pt-6 md:border-t-0 md:border-l md:pl-10 md:pt-0">
          <ul className="space-y-3 text-sm text-gray-400">
            {nav.map((item) => (
              <li key={item}>
                <a href="#" className="transition hover:text-white">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="border-t border-white/10 pt-6 md:border-t-0 md:border-l md:pl-10 md:pt-0">
          <p className="text-lg font-semibold text-white">
            What song matches your moment?
          </p>
          <a
            href="#upload"
            className="mt-4 inline-block rounded-md border border-laradama-brand px-4 py-2 text-sm text-laradama-brand transition hover:bg-laradama-brand/10"
          >
            Get Started →
          </a>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-295 flex-col items-center justify-between gap-4 border-t border-white/10 px-8 py-6 text-xs text-gray-500 md:flex-row">
        <p>© 2026 laradama.ai</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
        </div>
        <div className="flex gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={s.label}
            >
              <span className="text-[10px]">{s.label[0]}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}