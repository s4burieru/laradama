import { useEffect, useState } from "react";

const SEEN_KEY = "laradama-intro-seen";

export default function IntroSplash() {
  const [phase, setPhase] = useState(() =>
    sessionStorage.getItem(SEEN_KEY) ? "done" : "visible"
  );

  useEffect(() => {
    if (phase === "done") return;
    const leaveTimer = setTimeout(() => setPhase("leaving"), 2000);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem(SEEN_KEY, "1");
    }, 2800);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`intro-splash ${phase === "leaving" ? "intro-splash--leaving" : ""}`}
      aria-hidden="true"
    >
      <div className="intro-splash__inner">
        <img
          src="/laradama-logo.png"
          alt="Laradama"
          className="intro-splash__logo"
        />
      </div>
    </div>
  );
}
