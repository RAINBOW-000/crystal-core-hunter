import Phaser from "phaser";

export function createPrototypeTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists("player")) return;

  const graphics = scene.make.graphics({ x: 0, y: 0 });
  graphics.fillStyle(0x19141f).fillRect(4, 4, 16, 20);
  graphics.fillStyle(0xc9a06a).fillRect(7, 2, 10, 8);
  graphics.fillStyle(0x4a7b76).fillRect(5, 10, 14, 11);
  graphics.fillStyle(0x6af0d5).fillRect(15, 12, 4, 4);
  graphics.fillStyle(0x2d2939).fillRect(6, 21, 5, 7).fillRect(14, 21, 5, 7);
  graphics.generateTexture("player", 24, 28);
  graphics.clear();

  graphics.fillStyle(0x19141f).fillRect(5, 4, 14, 20);
  graphics.fillStyle(0xd8a47c).fillRect(7, 2, 10, 7);
  graphics.fillStyle(0x704d85).fillRect(5, 9, 14, 12);
  graphics.fillStyle(0xd39cff).fillRect(16, 11, 4, 4);
  graphics.fillStyle(0x292337).fillRect(6, 21, 5, 7).fillRect(14, 21, 5, 7);
  graphics.generateTexture("player-hunter", 24, 28);
  graphics.clear();

  graphics.fillStyle(0x201a1d).fillRect(4, 4, 16, 20);
  graphics.fillStyle(0xc69a70).fillRect(7, 2, 10, 8);
  graphics.fillStyle(0x8b633b).fillRect(5, 10, 14, 11);
  graphics.fillStyle(0xffc96b).fillRect(15, 11, 5, 5);
  graphics.fillStyle(0x34303a).fillRect(6, 21, 5, 7).fillRect(14, 21, 5, 7);
  graphics.generateTexture("player-prospector", 24, 28);
  graphics.clear();

  graphics.fillStyle(0x261f2e).fillRect(2, 8, 20, 12);
  graphics.fillStyle(0x6c496c).fillRect(4, 5, 16, 13);
  graphics.fillStyle(0xb781b6).fillRect(7, 3, 4, 7).fillRect(14, 1, 4, 9);
  graphics.fillStyle(0x78f3da).fillRect(5, 10, 4, 4).fillRect(15, 10, 4, 4);
  graphics.fillStyle(0x17131d).fillRect(4, 20, 5, 3).fillRect(15, 20, 5, 3);
  graphics.generateTexture("crystal-bug", 24, 24);
  graphics.clear();

  graphics.fillStyle(0x2d1d38).fillRect(3, 10, 28, 18);
  graphics.fillStyle(0x9d4eaa).fillRect(5, 6, 24, 20);
  graphics.fillStyle(0xec9bff).fillRect(8, 1, 5, 13).fillRect(20, 3, 5, 12);
  graphics.fillStyle(0x78f3da).fillRect(7, 13, 6, 5).fillRect(21, 13, 6, 5);
  graphics.fillStyle(0xffcf70).fillRect(14, 10, 6, 10);
  graphics.generateTexture("elite-crystal-bug", 34, 32);
  graphics.clear();

  graphics.fillStyle(0x21152c).fillRect(5, 17, 46, 35);
  graphics.fillStyle(0x754184).fillRect(8, 11, 40, 37);
  graphics.fillStyle(0xc36adb).fillRect(11, 4, 8, 23).fillRect(35, 1, 8, 25);
  graphics.fillStyle(0x78f3da).fillRect(11, 25, 9, 7).fillRect(36, 25, 9, 7);
  graphics.fillStyle(0xffcf70).fillRect(23, 18, 10, 19);
  graphics.fillStyle(0xf5e8ff).fillRect(26, 22, 4, 8);
  graphics.generateTexture("crystal-hive-boss", 56, 56);
  graphics.clear();

  graphics.fillStyle(0x211a2a).fillRect(1, 6, 22, 17);
  graphics.fillStyle(0x695174).fillRect(4, 3, 16, 18);
  graphics.fillStyle(0xffffff).fillRect(7, 6, 10, 10);
  graphics.generateTexture("item-drop", 24, 24);
  graphics.clear();

  graphics.fillStyle(0x211a2a).fillRect(2, 18, 36, 18);
  graphics.fillStyle(0x4f3f62).fillRect(5, 13, 30, 20);
  graphics.fillStyle(0x62d9cb).fillTriangle(6, 18, 13, 1, 18, 20);
  graphics.fillStyle(0x9d7cff).fillTriangle(15, 20, 23, 3, 29, 22);
  graphics.fillStyle(0x78f3da).fillTriangle(25, 21, 32, 8, 36, 25);
  graphics.fillStyle(0xd7fff6).fillRect(13, 8, 3, 8).fillRect(23, 9, 3, 7);
  graphics.generateTexture("rare-vein", 40, 38);
  graphics.clear();

  graphics.fillStyle(0xd986ff).fillTriangle(6, 0, 12, 14, 0, 14);
  graphics.fillStyle(0xf3c9ff).fillTriangle(6, 3, 8, 10, 4, 10);
  graphics.generateTexture("hostile-shard", 12, 14);
  graphics.clear();

  graphics.fillStyle(0x281d35).fillRect(2, 7, 24, 19);
  graphics.fillStyle(0x784d89).fillRect(5, 4, 18, 19);
  graphics.fillStyle(0xd986ff).fillRect(7, 9, 5, 5).fillRect(16, 9, 5, 5);
  graphics.fillStyle(0xf3c9ff).fillTriangle(11, 2, 16, 2, 14, 10);
  graphics.generateTexture("crystal-spitter", 28, 28);
  graphics.clear();

  graphics.fillStyle(0x2b2025).fillRect(2, 8, 28, 22);
  graphics.fillStyle(0x8b594d).fillRect(5, 5, 22, 22);
  graphics.fillStyle(0xffb06f).fillTriangle(2, 14, 12, 1, 13, 17).fillTriangle(30, 14, 20, 1, 19, 17);
  graphics.fillStyle(0xffdf9e).fillRect(10, 12, 4, 4).fillRect(19, 12, 4, 4);
  graphics.generateTexture("crystal-ram", 32, 32);
  graphics.clear();

  graphics.fillStyle(0x173438).fillRect(5, 4, 6, 10);
  graphics.fillStyle(0x78f3da).fillRect(7, 1, 4, 12);
  graphics.fillStyle(0xc8fff4).fillRect(8, 3, 2, 5);
  graphics.fillStyle(0x31565b).fillRect(4, 9, 8, 4);
  graphics.generateTexture("crystal-core", 16, 16);
  graphics.clear();

  graphics.fillStyle(0x292234).fillRect(4, 7, 32, 31);
  graphics.fillStyle(0x5a496b).fillRect(1, 12, 5, 26).fillRect(34, 12, 5, 26);
  graphics.fillStyle(0x7c668e).fillRect(7, 4, 26, 5).fillRect(4, 8, 32, 5);
  graphics.fillStyle(0x17131f).fillRect(10, 13, 20, 25);
  graphics.fillStyle(0x4b4057).fillRect(13, 17, 14, 19);
  graphics.fillStyle(0x78f3da).fillRect(17, 20, 6, 13);
  graphics.generateTexture("portal", 40, 40);
  graphics.destroy();
}
