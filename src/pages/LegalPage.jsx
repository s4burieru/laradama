import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const lastUpdated = "October 7, 2026";

const legalContent = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains how Laradama handles information when you visit our website or use its image-to-music discovery features. Please avoid sharing information you do not want processed, especially in images.",
    sections: [
      {
        title: "Information you provide",
        paragraphs: [
          "If you contact us, we receive the details you choose to include in your message, such as your name, email address, and the message itself.",
          "If you use an image upload or capture feature, the image you select may be processed to analyze its mood and suggest music. Images can contain personal information, so only submit images you have the right to use and are comfortable sharing for this purpose.",
        ],
      },
      {
        title: "Information collected automatically",
        paragraphs: [
          "When you visit the site, our hosting and delivery providers may receive technical information such as your IP address, browser and device details, requested pages, and request timestamps in routine server logs. The information collected depends on the services and configuration used to operate the site.",
        ],
      },
      {
        title: "How information is used",
        paragraphs: [
          "Information may be used to operate and improve Laradama, analyze submitted images for music recommendations, respond to messages, protect the service, and meet applicable legal requirements.",
        ],
      },
      {
        title: "Service providers and links",
        paragraphs: [
          "Some features may rely on third-party providers, such as hosting, image analysis, or music services. Information needed to provide a feature may be handled by those providers under their own privacy policies and terms. Music previews and links may take you to third-party services; their practices are not controlled by Laradama.",
        ],
      },
      {
        title: "Retention and your choices",
        paragraphs: [
          "Information is kept only for as long as it is needed for the purpose it was collected, subject to applicable legal and operational requirements. Actual retention can vary depending on the service involved. You can choose not to submit an image or contact form details, though some features may then be unavailable.",
          "To ask about personal information you have shared with us, contact savvv.business@gmail.com. We may need to verify your request and may be unable to fulfill it where an exception under applicable law applies.",
        ],
      },
      {
        title: "Children's privacy",
        paragraphs: [
          "Laradama is not intended for children under 13, and we do not knowingly seek to collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review the request.",
        ],
      },
      {
        title: "Changes to this policy",
        paragraphs: [
          "We may update this policy as Laradama or its providers change. The updated date at the top of this page indicates when the current version was published.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    intro:
      "These terms apply when you visit or use Laradama. By using the site, you agree to these terms. If you do not agree, do not use the service.",
    sections: [
      {
        title: "About Laradama",
        paragraphs: [
          "Laradama helps you explore music inspired by an image. Recommendations and explanations are generated or curated for discovery and entertainment; they are subjective and may not always be accurate, available, or suitable for your needs.",
        ],
      },
      {
        title: "Your images and responsibilities",
        paragraphs: [
          "You are responsible for the images you submit. You must own them or have permission to use them, and submitting them must not violate another person's rights or any law. Do not submit images containing sensitive personal information unless you are entitled to share it and accept the processing needed to provide the feature.",
          "You must not use Laradama to break the law, infringe rights, interfere with the service, or attempt to access it or its systems without authorization.",
        ],
      },
      {
        title: "Music and third-party services",
        paragraphs: [
          "Music, previews, artwork, and links may be provided by or lead to third parties. They remain subject to the applicable third-party terms and rights. Laradama does not grant you a license to download, reproduce, distribute, or otherwise use third-party music or artwork.",
        ],
      },
      {
        title: "Availability and changes",
        paragraphs: [
          "We may change, suspend, or discontinue features at any time. We work to keep the service useful, but do not promise uninterrupted access or that recommendations will be error-free.",
        ],
      },
      {
        title: "Disclaimer and liability",
        paragraphs: [
          "To the extent permitted by law, Laradama is provided as available without warranties of any kind. To the extent permitted by law, we are not liable for indirect or consequential loss arising from your use of the service. Nothing in these terms excludes rights or liability that cannot legally be excluded.",
        ],
      },
      {
        title: "Changes and contact",
        paragraphs: [
          "We may update these terms by publishing a revised version on this page. Continued use after the update means you accept the revised terms. Questions about these terms can be sent to savvv.business@gmail.com.",
        ],
      },
    ],
  },
};

export default function LegalPage({ type }) {
  const content = legalContent[type];

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white">
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-5rem)] max-w-375 px-6 py-16 md:px-8 max-[640px]:px-6 max-[640px]:py-10">
        <article className="mx-auto max-w-190">
          <p className="font-mono text-xs tracking-[0.12em] text-laradama-brand">
            LARADAMA / LEGAL
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-laradama-brand max-[640px]:text-[32px]">
            {content.title}
          </h1>
          <p className="mt-3 text-sm text-[#858585]">Last updated: {lastUpdated}</p>
          <p className="mt-8 border-l-2 border-laradama-brand pl-5 text-base leading-[1.75] text-[#b7b7b7]">
            {content.intro}
          </p>

          <div className="mt-10 divide-y divide-[#383838] border-y border-[#383838]">
            {content.sections.map((section, index) => (
              <section key={section.title} className="py-7">
                <h2 className="text-xl font-semibold text-[#e9e9e9]">
                  <span className="mr-3 font-mono text-sm text-laradama-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-[15px] leading-[1.75] text-[#a0a0a0]"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
