import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import sabrielImage from "../assets/sabriel.png";
import aeronImage from "../assets/aeron.png";
import emersonImage from "../assets/emerson.png";
import khingImage from "../assets/khing.png";

const teamMembers = [
  {
    name: "Justin Ryo Jaudines",
    role: "Mentor",
    socials: [
      { label: "Github", href: "#", icon: "github" },
      { label: "LinkedIn", href: "#", icon: "linkedin" },
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Instagram", href: "#", icon: "instagram" },
      { label: "X", href: "#", icon: "x" },
    ],
  },
  {
    name: "Sabriel Adriel San Agustin",
    role: "PM & Full-stack Developer",
    image: sabrielImage,
    socials: [
      { label: "Github", href: "#", icon: "github" },
      { label: "LinkedIn", href: "#", icon: "linkedin" },
      { label: "Website", href: "#", icon: "website" },
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Instagram", href: "#", icon: "instagram" },
    ],
  },
  {
    name: "Aeron Christopher Martinez",
    role: "UI/UX & Front-end Developer",
    image: aeronImage,
    socials: [
      { label: "Github", href: "#", icon: "github" },
      { label: "LinkedIn", href: "#", icon: "linkedin" },
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Instagram", href: "#", icon: "instagram" },
    ],
  },
  {
    name: "Chris Emerson Salvador",
    role: "Technical Support & Developer",
    image: emersonImage,
    socials: [
      { label: "Github", href: "#", icon: "github" },
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Instagram", href: "#", icon: "instagram" },
    ],
  },
  {
    name: "Khing Jr Ulpato",
    role: "Technical Support & Developer",
    image: khingImage,
    socials: [
      { label: "Github", href: "#", icon: "github" },
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Instagram", href: "#", icon: "instagram" },
    ],
  },
];

const socialIcons = {
  website: (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-4 w-4">
      <g transform="translate(14,14) scale(1.4) translate(-12,-12)">
        <path
          d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12C2,17.5 6.5,22 12,22C17.5,22 22,17.5 22,12C22,6.5 17.5,2 12,2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
        fill="currentColor"
      />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        fill="currentColor"
      />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4026 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
        fill="currentColor"
      />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
        fill="currentColor"
      />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"
        fill="currentColor"
      />
    </svg>
  ),
};

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
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-laradama-brand sm:text-5xl">
              Meet our Development Team
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#8f8f93] sm:text-lg">
              A team working together to build and improve Laradama. Turning
              ideas into reality through creativity, technology, and
              collaboration.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                className="inline-flex items-center gap-2 border border-laradama-brand px-5 py-3 text-sm font-semibold text-laradama-brand transition hover:bg-laradama-brand/10"
                href="/contact"
              >
                Apply Now <span aria-hidden="true">→</span>
              </a>
              <a
                className="inline-flex items-center gap-2 bg-laradama-brand px-5 py-3 text-sm font-semibold text-[#06170c] transition hover:bg-laradama-brand-hover"
                href="/contact"
              >
                Contact Us <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="mt-12 w-full border border-[#808080] bg-[#121212] p-2 sm:p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member) => (
                <article
                  key={member.name}
                  className="flex h-full flex-col items-center px-2 py-6 text-center sm:px-4"
                >
                  <div className="flex h-34 w-34 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#101010] shadow-[0_0_35px_rgba(0,0,0,0.35)]">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-white">
                    {member.name}
                  </h2>
                  <p className="mt-1 text-sm text-laradama-brand">
                    {member.role}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-[#b9b9bf]">
                    {(member.socials || []).map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={`${member.name} ${social.label}`}
                        className="inline-flex h-4 w-4 items-center justify-center transition hover:text-laradama-brand"
                      >
                        {socialIcons[social.icon]}
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
