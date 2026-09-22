from pathlib import Path
from collections import deque

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "concepts"
OUTPUT = ROOT / "public" / "art"


def clean_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 0 if value <= 4 else value)
    image.putalpha(alpha)
    return image


def remove_light_backdrop(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()
    for x in range(image.width):
        queue.extend(((x, 0), (x, image.height - 1)))
    for y in range(image.height):
        queue.extend(((0, y), (image.width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not (0 <= x < image.width and 0 <= y < image.height):
            continue
        visited.add((x, y))
        r, g, b, _ = pixels[x, y]
        if min(r, g, b) <= 155 or max(r, g, b) - min(r, g, b) >= 30:
            continue
        pixels[x, y] = (r, g, b, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    return image


def remove_dark_edge_backdrop(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()
    for x in range(image.width):
        queue.extend(((x, 0), (x, image.height - 1)))
    for y in range(image.height):
        queue.extend(((0, y), (image.width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not (0 <= x < image.width and 0 <= y < image.height):
            continue
        visited.add((x, y))
        r, g, b, alpha = pixels[x, y]
        if alpha == 0 or max(r, g, b) > 48:
            continue
        pixels[x, y] = (r, g, b, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    return image


def build_grid(source_name: str, output_name: str, columns: int, rows: int, cell_size: tuple[int, int]) -> None:
    source = clean_alpha(Image.open(SOURCE / source_name))
    source_cell = (source.width // columns, source.height // rows)
    atlas = Image.new("RGBA", (cell_size[0] * columns, cell_size[1] * rows))
    for row in range(rows):
        for column in range(columns):
            left = column * source_cell[0]
            top = row * source_cell[1]
            frame = source.crop((left, top, left + source_cell[0], top + source_cell[1]))
            frame.thumbnail(cell_size, Image.Resampling.NEAREST)
            x = column * cell_size[0] + (cell_size[0] - frame.width) // 2
            y = row * cell_size[1] + cell_size[1] - frame.height
            atlas.alpha_composite(frame, (x, y))
    atlas.save(OUTPUT / output_name, optimize=True)


def trim_visible(image: Image.Image) -> Image.Image:
    bounds = image.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
    return image.crop(bounds) if bounds else image


def center_in_cell(image: Image.Image, size: int = 72) -> Image.Image:
    image.thumbnail((size - 6, size - 6), Image.Resampling.NEAREST)
    cell = Image.new("RGBA", (size, size))
    cell.alpha_composite(image, ((size - image.width) // 2, (size - image.height) // 2))
    return cell


def join_vertical(first: Image.Image, second: Image.Image) -> Image.Image:
    width = max(first.width, second.width)
    joined = Image.new("RGBA", (width, first.height + second.height - 1))
    joined.alpha_composite(first, ((width - first.width) // 2, 0))
    joined.alpha_composite(second, ((width - second.width) // 2, first.height - 1))
    return joined


def repair_greatsword_atlas() -> None:
    path = OUTPUT / "greatsword-forms-v1.png"
    source = Image.open(path).convert("RGBA")
    atlas = Image.new("RGBA", source.size)
    for column in range(3):
        frames = [source.crop((column * 72, row * 72, (column + 1) * 72, (row + 1) * 72)) for row in range(4)]
        repaired = (
            join_vertical(trim_visible(frames[0]), trim_visible(frames[1].crop((0, 0, 72, 20)))),
            trim_visible(frames[1].crop((0, 20, 72, 72))),
            trim_visible(frames[2].crop((0, 0, 72, 48))),
            join_vertical(trim_visible(frames[2].crop((0, 48, 72, 72))), trim_visible(frames[3])),
        )
        for row, frame in enumerate(repaired):
            atlas.alpha_composite(center_in_cell(frame), (column * 72, row * 72))
    atlas.save(path, optimize=True)


build_grid("crystal-hunter-directional-source-v1.png", "crystal-hunter-directional-v1.png", 6, 4, (64, 72))
build_grid("leyline-prospector-directional-source-v1.png", "leyline-prospector-directional-v1.png", 6, 4, (64, 72))
build_grid("greatsword-forms-source-v1.png", "greatsword-forms-v1.png", 3, 4, (72, 72))
repair_greatsword_atlas()
build_grid("crystal-crossbow-forms-source-v1.png", "crystal-crossbow-forms-v1.png", 3, 4, (72, 72))
build_grid("fission-staff-forms-source-v1.png", "fission-staff-forms-v1.png", 3, 4, (72, 72))


def build_secondary_weapons() -> None:
    source = clean_alpha(Image.open(SOURCE / "secondary-weapons-source-v1.png"))
    source_cell = (source.width // 3, source.height // 3)
    atlas = Image.new("RGBA", (144, 216))
    for row in range(3):
        for column in range(2):
            frame = source.crop((column * source_cell[0], row * source_cell[1], (column + 1) * source_cell[0], (row + 1) * source_cell[1]))
            bounds = frame.getbbox()
            if bounds:
                frame = frame.crop(bounds)
            frame.thumbnail((68, 68), Image.Resampling.NEAREST)
            atlas.alpha_composite(frame, (column * 72 + (72 - frame.width) // 2, row * 72 + (72 - frame.height) // 2))
    atlas.save(OUTPUT / "secondary-weapons-v1.png", optimize=True)


build_secondary_weapons()


def clean_legacy_miner_atlas() -> None:
    path = OUTPUT / "miner-guard-directional-v1.png"
    source = remove_light_backdrop(Image.open(path))
    atlas = Image.new("RGBA", source.size)
    for row in range(4):
        for column in range(6):
            frame = source.crop((column * 64, row * 72, (column + 1) * 64, (row + 1) * 72))
            atlas.alpha_composite(remove_dark_edge_backdrop(frame), (column * 64, row * 72))
    atlas.save(path, optimize=True)


clean_legacy_miner_atlas()

concept = Image.open(SOURCE / "crystal-hunter-characters-concept-v2.png")
source_width = concept.width // 3
portraits = Image.new("RGBA", (384, 144))
for index in range(3):
    portrait = remove_light_backdrop(concept.crop((index * source_width, 0, (index + 1) * source_width, concept.height)))
    portrait.thumbnail((128, 144), Image.Resampling.NEAREST)
    portraits.alpha_composite(portrait, (index * 128 + (128 - portrait.width) // 2, 144 - portrait.height))
portraits.save(OUTPUT / "character-portraits-without-weapons-v1.png", optimize=True)
