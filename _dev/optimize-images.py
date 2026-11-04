"""Build lossless responsive WebP assets. Build-time only; requires Pillow."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
for source, widths, stem in [
    ('Retro Dotted Two-Tone J Emblem.png', [116, 232], 'logo'),
    ('JohnsJobs Team by the Service Van.png', [768, 1024, 1536], 'team'),
]:
    with Image.open(ROOT / source) as image:
        for width in widths:
            height = round(image.height * width / image.width)
            resized = image if width == image.width else image.resize((width, height), Image.Resampling.LANCZOS)
            (ROOT / 'assets').mkdir(exist_ok=True)
            resized.save(ROOT / f'assets/{stem}-{width}.webp', 'WEBP', lossless=True, method=6)
