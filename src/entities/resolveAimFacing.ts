export type Facing = "down" | "left" | "right" | "up";

const FACING_ANGLES: Record<Facing, number> = {
  down: Math.PI / 2,
  left: Math.PI,
  right: 0,
  up: -Math.PI / 2,
};

export function resolveAimFacing(current: Facing, dx: number, dy: number): Facing {
  if (dx * dx + dy * dy < 16 * 16) return current;

  const angle = Math.atan2(dy, dx);
  const delta = Math.abs(Math.atan2(
    Math.sin(angle - FACING_ANGLES[current]),
    Math.cos(angle - FACING_ANGLES[current]),
  ));
  if (delta <= Math.PI / 4 + 6 * Math.PI / 180) return current;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}
