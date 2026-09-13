"use client";

/**
 * The animated Solana gradient field — three drifting radial blooms in the
 * brand colours (Purple #9945FF, Green #14F195, Ocean #03E1FF), blurred and
 * masked to the top of the viewport. Sits under the aurora.
 *
 * Transform-only animation, so it stays on the compositor. Inert under
 * prefers-reduced-motion.
 */
export default function SolanaGlow() {
  return (
    <div className="sol-glow" aria-hidden="true">
      <span className="sol-blob sol-blob-a" />
      <span className="sol-blob sol-blob-b" />
      <span className="sol-blob sol-blob-c" />
    </div>
  );
}
