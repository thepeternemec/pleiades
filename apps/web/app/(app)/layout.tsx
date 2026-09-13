import type { Metadata } from "next";
import "./app-globals.css";

/**
 * Root layout for the news-app routes (/connect, /docs).
 *
 * These pages are Codex's front-end and carry their own design language, so
 * they live in a separate route group with their own root layout. The landing
 * page at app/(site) has a different root layout and a different stylesheet;
 * because the two groups never share a layout, neither stylesheet can leak
 * into the other — no class-name or CSS-variable collisions.
 */
export const metadata: Metadata = {
  title: { default: "Pleiades — News for your agents", template: "%s · Pleiades" },
  description:
    "Connect your agent to fresh news. Follow the topics that matter, catch new developments, and go straight to the original reporting.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
