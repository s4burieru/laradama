import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import sabrielImage from "../assets/sabriel.png";
import aeronImage from "../assets/aeron.png";
import emersonImage from "../assets/emerson.png";
import khingImage from "../assets/khing.png";

const teamMembers = [
  {
    name: "Sabriel Adriel San Agustin",
    role: "PM & Full-stack Developer",
    image: sabrielImage,
  },
  {
    name: "Aeron Christopher Martinez",
    role: "UI/UX & Front-end Developer",
    image: aeronImage,
  },
  {
    name: "Chris Emerson Salvador",
    role: "Technical Support & Developer",
    image: emersonImage,
  },
  {
    name: "Khing Jr Ulpato",
    role: "Technical Support & Developer",
    image: khingImage,
  },
];

const socials = [
  { label: "Facebook", href: "#", icon: "facebook" },
  { label: "Github", href: "#", icon: "github" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
];

function SocialIcon({ name, className }) {
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M14 8.5h2V5.3c-.35-.05-1.55-.15-2.95-.15-2.9 0-4.9 1.77-4.9 5.02V13H5.3v3.6h2.85V21h3.6v-4.4h2.75l.44-3.6h-3.19V10.5c0-1.04.28-1.75 2.05-1.75z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M12 3.5a8.5 8.5 0 0 0-2.69 16.56c.42.08.58-.18.58-.4v-1.43c-2.36.52-2.86-1-2.86-1-.38-.97-.93-1.23-.93-1.23-.76-.52.06-.51.06-.51.84.06 1.28.86 1.28.86.74 1.27 1.94.9 2.42.69.08-.54.29-.9.52-1.1-1.88-.21-3.85-.94-3.85-4.18 0-.92.33-1.67.87-2.26-.09-.22-.38-1.07.08-2.23 0 0 .71-.23 2.33.86.68-.19 1.4-.29 2.12-.29s1.44.1 2.12.29c1.62-1.09 2.33-.86 2.33-.86.46 1.16.17 2.01.08 2.23.54.59.87 1.34.87 2.26 0 3.25-1.98 3.97-3.86 4.17.3.26.56.77.56 1.55v2.29c0 .22.16.48.59.4A8.5 8.5 0 0 0 12 3.5Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.36v-5.3c0-1.26-.03-2.89-1.76-2.89-1.76 0-2.03 1.37-2.03 2.8v5.39H9.94V9h3.23v1.56h.05c.45-.85 1.56-1.75 3.2-1.75 3.43 0 4.06 2.26 4.06 5.2v6.44ZM5.34 7.43a1.95 1.95 0 1 1 0-3.9 1.95 1.95 0 0 1 0 3.9Zm1.68 13.02H3.66V9h3.36v11.45ZM22.13 0H1.87A1.84 1.84 0 0 0 0 1.82v20.37A1.84 1.84 0 0 0 1.87 24h20.26A1.85 1.85 0 0 0 24 22.19V1.82A1.85 1.85 0 0 0 22.13 0Z" fill="currentColor" />
    </svg>
  );
}

export default function TeamPage() {
  return (
    <div className="min-h-[110vh] bg-[#121212] text-white">
      <Navbar variant="team" />

      <main className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-none border border-laradama-brand/25 bg-laradama-brand/10 px-3 py-1.5 font-mono text-xs tracking-[0.02em] text-laradama-brand">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-none bg-laradama-brand" />
            OUR TEAM
          </span>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-[-0.03em] text-laradama-brand sm:text-5xl">
              Meet our Development Team
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg  leading-6 text-[#8f8f93] sm:text-base">
              A team working together to build and improve Laradama. Turning ideas into reality through creativity, technology, and collaboration.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a className="inline-flex items-center gap-2 border border-laradama-brand px-5 py-3 text-sm font-semibold text-laradama-brand transition hover:bg-laradama-brand/10" href="#contact">
                Apply Now <span aria-hidden="true">→</span>
              </a>
              <a className="inline-flex items-center gap-2 bg-laradama-brand px-5 py-3 text-sm font-semibold text-[#06170c] transition hover:bg-laradama-brand-hover" href="#contact">
                Contact Us <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="mt-12 w-full border border-[#808080] bg-[#121212] p-2 sm:p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {teamMembers.map((member) => (
                <article key={member.name} className="flex h-full flex-col items-center px-2 py-6 text-center sm:px-4">
                  <div className="flex h-34 w-34 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#101010] shadow-[0_0_35px_rgba(0,0,0,0.35)]">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-white">{member.name}</h2>
                  <p className="mt-1 text-sm text-laradama-brand">{member.role}</p>

                  <div className="mt-4 flex items-center gap-4 text-[#b9b9bf]">
                    {socials.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={`${member.name} ${social.label}`}
                        className="transition hover:text-laradama-brand"
                      >
                        <SocialIcon name={social.icon} className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer variant="team" />
    </div>
  );
}
