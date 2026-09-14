import { Mail, MapPin, Phone } from "lucide-react";

const nav = ["About", "Features", "How to Use", "Team"];

const socialIcons = {
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"
        fill="currentColor"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
        fill="currentColor"
      />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        fill="currentColor"
      />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
        fill="currentColor"
      />
    </svg>
  ),
};

const socials = [
  { label: "LinkedIn", href: "#", icon: "linkedin" },
  { label: "Facebook", href: "#", icon: "facebook" },
  { label: "GitHub", href: "#", icon: "github" },
  { label: "X", href: "#", icon: "x" },
];

export default function Footer() {
  return (
      <footer className="relative m-0 w-full overflow-hidden border-t border-[#808080] bg-[#121212] text-[#e9e9e9] font-sans">
      <div className="mx-auto grid h-95 w-full max-w-375 grid-cols-[36%_27%_37%] box-border px-2 max-[640px]:h-auto max-[640px]:grid-cols-1 max-[640px]:px-0">
        <section className="min-w-0 p-[56px_0_10px_16px] max-[1024px]:pl-4 max-[640px]:border-[#808080] max-[640px]:p-[26px_24px_20px] max-[640px]:border-t-0">
          <div className="flex items-center gap-3 font-bold text-[clamp(18px,2.8vw,28px)] min-[1024px]:gap-4 min-[1024px]:text-[28px] max-[640px]:gap-4 max-[640px]:text-[22px]">
            <img className="h-10 w-10 shrink-0 object-cover min-[1024px]:h-12 min-[1024px]:w-12 max-[640px]:h-12 max-[640px]:w-12" src="/laradama-logo.png" alt="Laradama logo" />
            <span className="shrink-0 whitespace-nowrap">laradama.app</span>
          </div>
          <div className="mt-3.25 h-px bg-[#808080]" />
          <ul className="mt-24 grid list-none gap-2.5 p-0 text-[14px] text-[#8e8e8e]">
            <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 stroke-[2.5]" /> Rizal, Philippines</li>
            <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 stroke-[2.5]" /> +63 (950) 245-8088</li>
            <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 stroke-[2.5]" /> savvv.business@gmail.com</li>
          </ul>
        </section>

        {/* Nav */}
        <nav className="min-w-0 border-l border-[#808080] pt-14 pb-7.75 max-[640px]:border-l-0 max-[640px]:border-t max-[640px]:border-[#808080] max-[640px]:p-6" aria-label="Footer navigation">
          <ul className="m-0 grid list-none gap-3.5 border-b border-[#808080] p-0 pb-7.75">
            {nav.map((item) => (
              <li key={item} className="ml-6.5 max-[640px]:ml-0">
                <a className="text-[16px] text-[#c5c5c5] no-underline transition-colors duration-150 ease-in-out hover:text-laradama-brand" href="#">{item}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA */}
        <section className="relative z-1 flex min-w-0 flex-col overflow-hidden border-l border-[#808080] p-[56px_16px] pl-6.5 max-[640px]:border-l-0 max-[640px]:border-t max-[640px]:border-[#808080] max-[640px]:p-6">
          <p className="relative z-2 m-0 text-[28px] font-light leading-[1.35] text-[#a8a8a8] max-[640px]:text-[24px] max-[640px]:leading-[1.3]">What song matches<br />your moment?</p>
          <a className="relative z-2 mt-3.5 inline-flex w-75 max-w-full justify-between border border-laradama-brand px-5 py-3 text-[16px] text-laradama-brand no-underline transition-colors hover:bg-[rgba(30,215,96,0.1)] max-[640px]:w-full" href="/contact">Get in touch <span aria-hidden="true">→</span></a>

          <div className="relative z-2 mt-auto grid h-16.25 grid-cols-[63%_37%] items-center text-[12px] leading-[1.4] text-[#8e8e8e] max-[1100px]:h-auto max-[1100px]:grid-cols-1 max-[1100px]:gap-3 max-[1100px]:p-[18px_24px_18px_0]">
            <div className="flex items-center gap-2.5 max-[1100px]:pl-0">
              <p className="m-0 text-[12px]">© 2026 laradama.app</p>
              <span className="text-[#808080]" aria-hidden="true">•</span>
              <a className="m-0 border-0 bg-transparent p-0 text-inherit no-underline" href="#">Privacy</a>
              <span className="text-[#808080]" aria-hidden="true">•</span>
              <a className="m-0 border-0 bg-transparent p-0 text-inherit no-underline" href="#">Terms</a>
            </div>
            <div className="flex justify-end gap-2.5 pr-2.5 max-[1100px]:justify-start max-[1100px]:pr-0">
              {socials.map((s) => (
                <a
                  className="m-0 inline-flex h-auto w-auto items-center justify-center border-0 bg-transparent p-0 text-[11px] font-semibold text-[#ddd] no-underline"
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                >
                  {socialIcons[s.icon]}
                </a>
              ))}
            </div>
          </div>

          <img className="pointer-events-none absolute -bottom-20 right-0 z-0 h-90 w-90 object-cover opacity-10 saturate-[0.9]" src="/laradama-logo.png" alt="" aria-hidden="true" />
        </section>
      </div>
      </footer>
  );
}
