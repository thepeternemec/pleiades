"use client";

/**
 * A slowly drifting technical grid, masked to the top of the viewport so it
 * reads as infrastructure rather than decoration. Sits between the colour
 * blooms and the aurora.
 *
 * Grid *position* is animated rather than transform, so it stays a cheap
 * paint-on-layer effect. Static under prefers-reduced-motion.
 */
export default function GridField() {
  return <div className="grid-field" aria-hidden="true" />;
}
