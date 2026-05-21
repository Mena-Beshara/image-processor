"""Image processing utilities for trial and final generation."""
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import io
from typing import Tuple


def validate_image(file_bytes: bytes, max_mb: float = 50.0) -> Image.Image:
    """Validate size and open image."""
    if len(file_bytes) > max_mb * 1024 * 1024:
        raise ValueError(f"File exceeds {max_mb}MB limit")
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode not in ("RGB", "RGBA", "L"):
        img = img.convert("RGB")
    return img


def _autocontrast_rgba(img: Image.Image) -> Image.Image:
    """ImageOps.autocontrast doesn't support RGBA; split, process, re-merge."""
    if img.mode != "RGBA":
        return ImageOps.autocontrast(img, cutoff=1)
    r, g, b, a = img.split()
    rgb = Image.merge("RGB", (r, g, b))
    rgb = ImageOps.autocontrast(rgb, cutoff=1)
    r, g, b = rgb.split()
    return Image.merge("RGBA", (r, g, b, a))


def enhance_style_1(img: Image.Image) -> Image.Image:
    """Style 1: Auto contrast + sharpness boost."""
    img = _autocontrast_rgba(img)
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.5)
    return img


def enhance_style_2(img: Image.Image) -> Image.Image:
    """Style 2: 4x upscale with high-quality resampling."""
    w, h = img.size
    img = img.resize((w * 4, h * 4), Image.Resampling.LANCZOS)
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.2)
    return img


def enhance_style_3(img: Image.Image) -> Image.Image:
    """Style 3: Denoise (blur) + 2x upscale."""
    img = img.filter(ImageFilter.SMOOTH_MORE)
    w, h = img.size
    img = img.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
    return img


def generate_trials(img: Image.Image) -> Tuple[bytes, bytes, bytes]:
    """Generate 3 trial outputs as PNG bytes."""
    trial1 = enhance_style_1(img.copy())
    trial2 = enhance_style_2(img.copy())
    trial3 = enhance_style_3(img.copy())

    def to_png(image: Image.Image) -> bytes:
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        return buf.getvalue()

    return to_png(trial1), to_png(trial2), to_png(trial3)


def generate_final(
    img: Image.Image,
    style: int,
    canvas_w: int,
    canvas_h: int,
) -> bytes:
    """Generate final PNG: enhance, fit + center on transparent canvas."""
    if style == 1:
        img = enhance_style_1(img)
    elif style == 2:
        img = enhance_style_2(img)
    elif style == 3:
        img = enhance_style_3(img)
    else:
        raise ValueError("style must be 1, 2, or 3")

    img_w, img_h = img.size
    scale = min(canvas_w / img_w, canvas_h / img_h)
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)

    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    if img.mode != "RGBA":
        img = img.convert("RGBA")

    x = (canvas_w - new_w) // 2
    y = (canvas_h - new_h) // 2
    canvas.paste(img, (x, y), img)

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()