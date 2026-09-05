import { Briefcase, Mail, MapPin, Phone, Play } from "lucide-react";

const nav = ["About", "Features", "How to Use", "Team"];

const socials = [
  { label: "X", href: "#", icon: "X" },
  { label: "Threads", href: "#", icon: "@" },
  { label: "LinkedIn", href: "#", icon: Briefcase },
  { label: "YouTube", href: "#", icon: Play },
];

export default function Footer() {
  return (
      <footer className="relative m-0 w-full overflow-hidden border-t border-[#808080] bg-[#121212] text-[#e9e9e9] font-sans">
      <div className="mx-auto grid h-95 w-full max-w-375 grid-cols-[36%_27%_37%] box-border px-2 max-[640px]:h-auto max-[640px]:grid-cols-1 max-[640px]:px-0">
        <section className="min-w-0 p-[56px_0_10px_16px] max-[1024px]:pl-4 max-[640px]:border-[#808080] max-[640px]:p-[26px_24px_20px] max-[640px]:border-t-0">
          <div className="flex items-center gap-4 text-[28px] font-bold">
            <img className="h-12 w-12 object-cover" src="/laradama-logo.png" alt="Laradama logo" />
            <span>laradama.app</span>
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
                  {typeof s.icon === "string" ? s.icon : <s.icon className="h-3.5 w-3.5 stroke-[2.5]" />}
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
