import Phaser from "phaser";

interface MinePalette { floorA: number; floorB: number; crystal: number; border: number }

function tileHash(x: number, y: number): number {
  return Math.abs(((x * 73856093) ^ (y * 19349663)) >>> 0);
}

function drawTrack(graphics: Phaser.GameObjects.Graphics, x: number, y: number, length: number, vertical = false): void {
  graphics.lineStyle(5, 0x151821, 0.95);
  if (vertical) {
    graphics.lineBetween(x - 10, y, x - 10, y + length).lineBetween(x + 10, y, x + 10, y + length);
    for (let offset = 0; offset <= length; offset += 30) graphics.fillStyle(0x493b34, 1).fillRect(x - 18, y + offset, 36, 6);
  } else {
    graphics.lineBetween(x, y - 10, x + length, y - 10).lineBetween(x, y + 10, x + length, y + 10);
    for (let offset = 0; offset <= length; offset += 30) graphics.fillStyle(0x493b34, 1).fillRect(x + offset, y - 18, 6, 36);
  }
}

/** Draws one continuous survivor-style arena. Decorations orient the player but never form rooms. */
export function drawPrototypeRoom(scene: Phaser.Scene, world: Phaser.Geom.Rectangle, palette: MinePalette = { floorA: 0x24202d, floorB: 0x211d29, crystal: 0x63d5c4, border: 0x4b4057 }): void {
  const graphics = scene.add.graphics().setDepth(-20);
  graphics.fillStyle(0x15131b).fillRect(world.x, world.y, world.width, world.height);

  for (let y = world.y; y < world.bottom; y += 32) {
    for (let x = world.x; x < world.right; x += 32) {
      const hash = tileHash(x / 32, y / 32);
      const floor = hash % 7 < 3 ? palette.floorA : palette.floorB;
      graphics.fillStyle(floor, 1).fillRect(x, y, 32, 32);
      if (hash % 17 === 0) graphics.fillStyle(palette.border, 0.32).fillRect(x + 4, y + 20, 18, 3);
      if (hash % 29 === 0) graphics.fillStyle(0x101218, 0.35).fillRect(x + 18, y + 7, 8, 6);
      if (hash % 43 === 0) {
        graphics.fillStyle(palette.crystal, 0.72).fillTriangle(x + 8, y + 25, x + 13, y + 8, x + 17, y + 25);
        graphics.fillStyle(0xd9fff7, 0.5).fillRect(x + 12, y + 12, 2, 7);
      }
    }
  }

  drawTrack(graphics, 120, 390, world.width - 240);
  drawTrack(graphics, 1780, 110, world.height - 220, true);

  const landmarks = [
    [300, 250], [720, 1040], [1130, 260], [1460, 1210], [2080, 520], [2140, 1370],
  ] as const;
  landmarks.forEach(([x, y], index) => {
    const accent = index % 2 ? 0x9d7cff : palette.crystal;
    graphics.fillStyle(0x17131d, 0.9).fillRect(x - 24, y + 18, 58, 12);
    graphics.fillStyle(accent, 0.92)
      .fillTriangle(x - 18, y + 22, x - 7, y - 18, x + 1, y + 22)
      .fillTriangle(x + 2, y + 22, x + 17, y - 32, x + 27, y + 22);
    graphics.fillStyle(0xe9fff9, 0.62).fillRect(x + 13, y - 19, 3, 15);
  });

  for (const [x, y] of [[520, 700], [990, 1330], [1340, 650], [2010, 960]] as const) {
    graphics.fillStyle(0x332b2a, 1).fillRect(x - 25, y - 18, 50, 36);
    graphics.fillStyle(0x72543d, 1).fillRect(x - 21, y - 14, 42, 7).fillRect(x - 18, y + 4, 36, 6);
    graphics.fillStyle(0x12131a, 1).fillCircle(x - 16, y + 20, 7).fillCircle(x + 16, y + 20, 7);
  }
}
