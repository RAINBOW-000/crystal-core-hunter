import Phaser from "phaser";

const CHARACTER_TEXTURE_KEYS = ["player", "player-hunter", "player-prospector"] as const;

function removeConnectedBackdrop(texture: Phaser.Textures.CanvasTexture): void {
  const context = texture.context;
  const { width, height } = texture;
  const image = context.getImageData(0, 0, width, height);
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  const isBackdrop = (pixel: number): boolean => {
    const offset = pixel * 4;
    const r = image.data[offset];
    const g = image.data[offset + 1];
    const b = image.data[offset + 2];
    return r > 160 && g > 160 && b > 160 && Math.max(r, g, b) - Math.min(r, g, b) < 24;
  };
  const enqueue = (pixel: number): void => {
    if (pixel < 0 || pixel >= width * height || visited[pixel] || !isBackdrop(pixel)) return;
    visited[pixel] = 1;
    queue.push(pixel);
  };
  for (let x = 0; x < width; x += 1) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 0; y < height; y += 1) { enqueue(y * width); enqueue(y * width + width - 1); }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixel = queue[cursor];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    image.data[pixel * 4 + 3] = 0;
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }
  context.putImageData(image, 0, 0);
  texture.refresh();
}

function createCharacterTextures(scene: Phaser.Scene): boolean {
  if (!scene.textures.exists("character-concept")) return false;
  const source = scene.textures.get("character-concept").getSourceImage() as HTMLImageElement;
  const frameWidth = source.naturalWidth / 3;
  CHARACTER_TEXTURE_KEYS.forEach((key, index) => {
    const texture = scene.textures.createCanvas(key, 48, 54);
    if (!texture) throw new Error(`Unable to create character texture: ${key}`);
    texture.context.imageSmoothingEnabled = false;
    texture.context.clearRect(0, 0, 48, 54);
    texture.context.drawImage(source, frameWidth * index, 0, frameWidth, source.naturalHeight, 0, 0, 48, 54);
    removeConnectedBackdrop(texture);
  });
  return true;
}

function createDirectionalCharacterTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("miner-guard-directional") || !scene.textures.exists("miner-guard-directional-source")) return;
  const source = scene.textures.get("miner-guard-directional-source").getSourceImage() as HTMLImageElement;
  const texture = scene.textures.createCanvas("miner-guard-directional", 384, 288);
  if (!texture) throw new Error("Unable to create miner guard directional texture");
  texture.context.imageSmoothingEnabled = false;
  texture.context.drawImage(source, 0, 0);
  removeConnectedBackdrop(texture);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      texture.add(row * 6 + column, 0, column * 64, row * 72, 64, 72);
    }
  }
}

export function createPrototypeTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists("player")) return;
  createDirectionalCharacterTexture(scene);

  const graphics = scene.make.graphics({ x: 0, y: 0 });
  if (!createCharacterTextures(scene)) {
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
  }

  if (!scene.textures.exists("crystal-bug")) {
    graphics.fillStyle(0x261f2e).fillRect(2, 8, 20, 12);
    graphics.fillStyle(0x6c496c).fillRect(4, 5, 16, 13);
    graphics.fillStyle(0xb781b6).fillRect(7, 3, 4, 7).fillRect(14, 1, 4, 9);
    graphics.fillStyle(0x78f3da).fillRect(5, 10, 4, 4).fillRect(15, 10, 4, 4);
    graphics.fillStyle(0x17131d).fillRect(4, 20, 5, 3).fillRect(15, 20, 5, 3);
    graphics.generateTexture("crystal-bug", 24, 24);
    graphics.clear();
  }

  if (!scene.textures.exists("elite-crystal-bug")) {
    graphics.fillStyle(0x2d1d38).fillRect(3, 10, 28, 18);
    graphics.fillStyle(0x9d4eaa).fillRect(5, 6, 24, 20);
    graphics.fillStyle(0xec9bff).fillRect(8, 1, 5, 13).fillRect(20, 3, 5, 12);
    graphics.fillStyle(0x78f3da).fillRect(7, 13, 6, 5).fillRect(21, 13, 6, 5);
    graphics.fillStyle(0xffcf70).fillRect(14, 10, 6, 10);
    graphics.generateTexture("elite-crystal-bug", 34, 32);
    graphics.clear();
  }

  if (!scene.textures.exists("crystal-hive-boss")) {
    graphics.fillStyle(0x21152c).fillRect(5, 17, 46, 35);
    graphics.fillStyle(0x754184).fillRect(8, 11, 40, 37);
    graphics.fillStyle(0xc36adb).fillRect(11, 4, 8, 23).fillRect(35, 1, 8, 25);
    graphics.fillStyle(0x78f3da).fillRect(11, 25, 9, 7).fillRect(36, 25, 9, 7);
    graphics.fillStyle(0xffcf70).fillRect(23, 18, 10, 19);
    graphics.fillStyle(0xf5e8ff).fillRect(26, 22, 4, 8);
    graphics.generateTexture("crystal-hive-boss", 56, 56);
    graphics.clear();
  }

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

  [4, 7, 10].forEach((radius, index) => {
    const center = 8;
    const half = Math.floor(radius / 2);
    graphics.fillStyle(0x2a1938, 0.9).fillRect(center - half - 2, center - 2, radius + 4, 4);
    graphics.fillStyle(0xd986ff, 1)
      .fillTriangle(center, center - radius, center + radius, center, center, center + radius)
      .fillTriangle(center, center - radius, center - radius, center, center, center + radius);
    graphics.fillStyle(0xf7e9ff, 1).fillRect(center - 1, center - 2, 3, 4);
    graphics.generateTexture(`vfx-charge-${index + 1}`, 16, 16);
    graphics.clear();
  });

  if (!scene.textures.exists("crystal-spitter")) {
    graphics.fillStyle(0x281d35).fillRect(2, 7, 24, 19);
    graphics.fillStyle(0x784d89).fillRect(5, 4, 18, 19);
    graphics.fillStyle(0xd986ff).fillRect(7, 9, 5, 5).fillRect(16, 9, 5, 5);
    graphics.fillStyle(0xf3c9ff).fillTriangle(11, 2, 16, 2, 14, 10);
    graphics.generateTexture("crystal-spitter", 28, 28);
    graphics.clear();
  }

  if (!scene.textures.exists("crystal-ram")) {
    graphics.fillStyle(0x2b2025).fillRect(2, 8, 28, 22);
    graphics.fillStyle(0x8b594d).fillRect(5, 5, 22, 22);
    graphics.fillStyle(0xffb06f).fillTriangle(2, 14, 12, 1, 13, 17).fillTriangle(30, 14, 20, 1, 19, 17);
    graphics.fillStyle(0xffdf9e).fillRect(10, 12, 4, 4).fillRect(19, 12, 4, 4);
    graphics.generateTexture("crystal-ram", 32, 32);
    graphics.clear();
  }

  if (!scene.textures.exists("frost-trail-beast")) {
    graphics.fillStyle(0x193247).fillRect(2, 8, 28, 20);
    graphics.fillStyle(0x78cbe8).fillRect(5, 5, 22, 20);
    graphics.fillStyle(0xd9f7ff).fillTriangle(6, 8, 12, 0, 15, 10).fillTriangle(18, 8, 24, 0, 27, 11);
    graphics.fillStyle(0x315b72).fillRect(8, 25, 6, 5).fillRect(20, 25, 6, 5);
    graphics.generateTexture("frost-trail-beast", 32, 32);
    graphics.clear();
  }

  if (!scene.textures.exists("ice-vein-caller")) {
    graphics.fillStyle(0x18283b).fillRect(4, 7, 24, 24);
    graphics.fillStyle(0x4b7997).fillRect(7, 4, 18, 24);
    graphics.fillStyle(0xc9f3ff).fillTriangle(10, 7, 16, 0, 22, 7).fillRect(12, 12, 8, 10);
    graphics.generateTexture("ice-vein-caller", 32, 32);
    graphics.clear();
  }

  if (!scene.textures.exists("frost-ridge-hunter")) {
    graphics.fillStyle(0x172c42).fillRect(3, 10, 36, 27);
    graphics.fillStyle(0x5f91ad).fillRect(6, 6, 30, 27);
    graphics.fillStyle(0xe2f9ff).fillTriangle(5, 12, 13, 0, 17, 14).fillTriangle(26, 12, 34, 0, 38, 14);
    graphics.fillStyle(0x80dcff).fillRect(12, 16, 5, 5).fillRect(27, 16, 5, 5);
    graphics.generateTexture("frost-ridge-hunter", 42, 40);
    graphics.clear();
  }

  if (!scene.textures.exists("ice-armor-colossus")) {
    graphics.fillStyle(0x102337).fillRect(4, 14, 56, 48);
    graphics.fillStyle(0x426f8b).fillRect(8, 8, 48, 48);
    graphics.fillStyle(0xbdefff).fillTriangle(8, 18, 18, 0, 24, 20).fillTriangle(40, 20, 50, 0, 57, 19);
    graphics.fillStyle(0xe8fbff).fillRect(18, 24, 9, 7).fillRect(39, 24, 9, 7);
    graphics.fillStyle(0x76cfee).fillRect(27, 36, 12, 18);
    graphics.generateTexture("ice-armor-colossus", 64, 64);
    graphics.clear();
  }

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
