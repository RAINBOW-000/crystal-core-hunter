import Phaser from "phaser";

export function drawPrototypeRoom(scene: Phaser.Scene, room: Phaser.Geom.Rectangle): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x1d1925).fillRect(room.x, room.y, room.width, room.height);
  for (let y = room.y; y < room.bottom; y += 32) {
    for (let x = room.x; x < room.right; x += 32) {
      const alternating = ((x + y) / 32) % 2 === 0;
      graphics.fillStyle(alternating ? 0x24202d : 0x211d29, 1).fillRect(x, y, 31, 31);
      if ((x * 3 + y) % 160 === 0) {
        graphics.fillStyle(0x345f65, 0.7).fillRect(x + 7, y + 10, 4, 7);
        graphics.fillStyle(0x63d5c4, 0.8).fillRect(x + 11, y + 7, 3, 6);
      }
    }
  }
  graphics.lineStyle(8, 0x4b4057).strokeRect(room.x - 4, room.y - 4, room.width + 8, room.height + 8);
  graphics.lineStyle(2, 0x796787, 0.65).strokeRect(room.x, room.y, room.width, room.height);
}
