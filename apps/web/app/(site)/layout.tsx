import type { Metadata } from "next";
import "./globals.css";
import "./motion.css";
import "./motion-components.css";
import "./solana.css";
import SoftAurora from "@/components/soft-aurora";
import ScrollReveal from "@/components/scroll-reveal";
import SmoothScroll from "@/components/smooth-scroll";
import MotionEnhance from "@/components/motion";
import GradualBlur from "@/components/motion/gradual-blur";
import Noise from "@/components/motion/noise";
import SolanaGlow from "@/components/site/solana-glow";

export const metadata: Metadata = {
  title: "Pleiades — The real-time news API for AI agents",
  description:
    "Pleiades watches 150,000 publishers and returns a short, cited brief whenever a topic your agent follows changes. Agents pay per call over x402 on Solana, or draw down a USDC balance. English-language coverage, bounded packs, one API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="sol-glow-host" aria-hidden="true">
          <SolanaGlow />
        </div>
        <div className="aurora-layer" aria-hidden="true">
          {/* Solana brand colours: purple into green. */}
          <SoftAurora color1="#9945ff" color2="#14f195" brightness={0.9} />
        </div>
        <GradualBlur />
        <Noise />
        <ScrollReveal />
        <SmoothScroll />
        <MotionEnhance />
        {children}
      </body>
    </html>
  );
}
