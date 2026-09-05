import { useState } from "react";
import { Check, ChevronDown, Mail, MessageSquareText } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const categories = ["Inquiry", "Support", "Partnership", "Feedback"];

function GithubIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.67"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(12 12) scale(0.9) translate(-12 -12)">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </g>
    </svg>
  );
}

function LinkedinIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(12 12) scale(1.15) translate(-12 -12)">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 11v5" />
        <path d="M8 8v.01" />
        <path d="M12 16v-5" />
        <path d="M16 16v-3a2 2 0 0 0-4 0" />
      </g>
    </svg>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    category: categories[0],
    email: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  function resetForm() {
    setSubmitted(false);
    setForm({ name: "", category: categories[0], email: "", description: "" });
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white">
      <Navbar variant="contact" />

      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-275 flex-col border border-[#555557] p-4 md:flex-row md:items-stretch 2xl:max-w-7xl">
        <aside className="flex w-full max-w-full flex-col border border-laradama-brand bg-[#121212] p-5 sm:p-7 md:max-w-90 md:min-h-130 2xl:max-w-100">
          <div className="flex justify-start">
            <img src="/laradama-logo.png" alt="Laradama logo" className="h-20 w-20 object-cover" />
          </div>

          <div className="mt-5 text-left">
            <h1 className="text-[clamp(2rem,2.8vw,3.4rem)] font-semibold tracking-[-0.06em] text-laradama-brand">
              laradama.app
            </h1>
          </div>

          <p className="mt-2 text-left text-[14px] leading-[1.4] text-[#d5d5d7]">
            Have something to say? We’re listening.
          </p>

          <div className="mt-7 flex justify-start gap-4 text-[#8e8e92]">
            <a href="mailto:savvv.business@gmail.com" aria-label="Email" className="transition hover:opacity-80">
              <Mail className="h-6 w-6" strokeWidth={1.5} />
            </a>
            <a href="https://github.com/s4burieru/laradama" aria-label="GitHub" className="transition hover:opacity-80">
              <GithubIcon className="h-6 w-6" />
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn" className="transition hover:opacity-80">
              <LinkedinIcon className="h-6 w-6" />
            </a>
          </div>

          <div className="mt-auto pt-10 text-left text-[12px] text-[#8e8e92]">© 2026 laradama.app</div>
        </aside>

        <section className="w-full max-w-full bg-[#121212] pl-2 pr-2 pt-5 pb-2 sm:pl-7 sm:pr-2 sm:py-5 md:max-w-180 2xl:max-w-210">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="mb-0 text-[clamp(1.75rem,2.4vw,2.25rem)] font-semibold tracking-[-0.04em] text-white">
                Leave us a message!
              </h2>
              <p className="text-base leading-normal text-[#bfc0c4]">
                Whether you have questions, feedback, or want to collaborate with us, we&apos;d love to hear from you.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#a7a7ab]">Name</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    placeholder="E.g. John Doe"
                    className="w-full border border-[#555557] bg-transparent px-3 py-2.5 text-base text-white placeholder:text-[#7d7f85] outline-none transition focus:border-laradama-brand focus:ring-1 focus:ring-laradama-brand/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#a7a7ab]">Category</span>
                  <div className="relative">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full appearance-none border border-[#555557] bg-transparent px-3 py-2.5 pr-10 text-base text-[#7d7f85] outline-none transition focus:border-laradama-brand focus:ring-1 focus:ring-laradama-brand/40"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category} className="bg-[#121212] text-white">
                          {category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d7f85]"
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#a7a7ab]">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="E.g. john.doe@email.com"
                  className="w-full border border-[#555557] bg-transparent px-3 py-2.5 text-base text-white placeholder:text-[#7d7f85] outline-none transition focus:border-laradama-brand focus:ring-1 focus:ring-laradama-brand/40"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#a7a7ab]">Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="E.g. I would like to know something..."
                  className="w-full resize-y border border-[#555557] bg-transparent px-3 py-2.5 text-base text-white placeholder:text-[#7d7f85] outline-none transition focus:border-laradama-brand focus:ring-1 focus:ring-laradama-brand/40"
                />
              </label>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 border border-laradama-brand bg-transparent px-5 py-3 text-base font-semibold text-laradama-brand transition hover:bg-laradama-brand/10"
              >
                Submit
              </button>
            </form>
          ) : (
            <div className="flex min-h-127.5 flex-col items-center justify-center px-4 text-center">
              <span className="mb-6 inline-flex h-16 w-16 items-center justify-center bg-laradama-brand text-[#0c1a12]">
                <Check className="h-8 w-8 stroke-[2.5]" />
              </span>
              <h3 className="text-2xl font-semibold text-white">Message sent!</h3>
              <p className="mt-3 max-w-md text-[15px] leading-[1.6] text-[#d2d4d8]">
                Thanks {form.name || "there"}. We received your {form.category.toLowerCase()} message and will reply at {form.email} soon.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 inline-flex items-center justify-center gap-2 border border-laradama-brand bg-transparent px-5 py-3 text-sm font-semibold text-laradama-brand transition hover:bg-laradama-brand/10"
              >
                <MessageSquareText className="h-4 w-4" />
                Send another message
              </button>
            </div>
          )}
        </section>
        </div>
      </main>

      <Footer variant="contact" />
    </div>
  );
}