from pathlib import Path
import os

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "art"
OUT = Path(os.environ.get("CORE_HUNTER_EXPORT_DIR", "/Users/a1/Desktop/素材库/core-hunter"))

CHARACTERS = (("矿卫", "荒铁大剑"), ("晶猎", "晶核弩"), ("探脉师", "裂变法杖"))
WEAPONS = (
    ("荒铁大剑", "greatsword-forms-v1.png"),
    ("晶核弩", "crystal-crossbow-forms-v1.png"),
    ("裂变法杖", "fission-staff-forms-v1.png"),
)


def crop_frame(path: Path, frame_width: int, frame_height: int, frame: int) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    columns = image.width // frame_width
    left = (frame % columns) * frame_width
    top = (frame // columns) * frame_height
    return image.crop((left, top, left + frame_width, top + frame_height))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for index, (character, _weapon) in enumerate(CHARACTERS):
        crop_frame(ART / "character-portraits-without-weapons-v1.png", 128, 144, index).save(OUT / f"角色_{character}.png", optimize=True)
    for weapon, filename in WEAPONS:
        crop_frame(ART / filename, 72, 72, 0).save(OUT / f"初始武器_{weapon}.png", optimize=True)
    manifest = "角色与初始武器\n\n" + "\n".join(f"{character}：初始武器——{weapon}" for character, weapon in CHARACTERS) + "\n"
    (OUT / "角色与初始武器清单.txt").write_text(manifest, encoding="utf-8")


if __name__ == "__main__":
    main()
