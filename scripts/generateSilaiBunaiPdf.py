#!/usr/bin/env python3
"""Generate Priyabadal Homes Silai Bunai photo lookbook PDF (no prices, no phone)."""

from __future__ import annotations

import json
from io import BytesIO
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "catalogs" / "priyabadal-silai-bunai.pdf"
DATA = ROOT / "scripts" / "silaibunai-products.json"
PUBLIC = ROOT / "public"

INK = HexColor("#171411")
INK_SOFT = HexColor("#6a6158")
LINE = HexColor("#ddd4c8")
PAPER = HexColor("#faf7f2")
BRAND = "Priyabadal Homes"


def register_fonts() -> tuple[str, str]:
    candidates = [
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ),
        (
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        ),
    ]
    for reg, bold in candidates:
        if Path(reg).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont("Body", reg))
            pdfmetrics.registerFont(TTFont("BodyBold", bold))
            return "Body", "BodyBold"
    return "Helvetica", "Helvetica-Bold"


def load_image(rel: str, max_w: int = 1400, max_h: int = 1400) -> Image.Image | None:
    path = PUBLIC / rel.lstrip("/")
    if not path.exists():
        return None
    img = Image.open(path).convert("RGB")
    img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return img


def image_reader(img: Image.Image, quality: int = 72) -> ImageReader:
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    buf.seek(0)
    return ImageReader(buf)


def wrap_lines(
    c: canvas.Canvas,
    text: str,
    width: float,
    font: str,
    size: float,
    max_lines: int | None = None,
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for w in words:
        trial = f"{line} {w}".strip()
        if c.stringWidth(trial, font, size) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    if max_lines is not None and len(lines) > max_lines:
        lines = lines[:max_lines]
        if lines:
            # ellipsis if truncated
            last = lines[-1]
            while c.stringWidth(last + "…", font, size) > width and len(last) > 3:
                last = last[:-1]
            lines[-1] = last.rstrip() + "…"
    return lines


def draw_text_block(
    c: canvas.Canvas,
    text: str,
    x: float,
    y_top: float,
    width: float,
    font: str,
    size: float,
    leading: float,
    color: Color,
    max_lines: int | None = None,
) -> float:
    """Draw text downward from y_top; return y of last baseline."""
    lines = wrap_lines(c, text, width, font, size, max_lines)
    c.setFont(font, size)
    c.setFillColor(color)
    y = y_top
    for i, ln in enumerate(lines):
        c.drawString(x, y, ln)
        if i < len(lines) - 1:
            y -= leading
    return y


def fit_draw(
    c: canvas.Canvas,
    img: Image.Image,
    x: float,
    y: float,
    box_w: float,
    box_h: float,
    quality: int = 72,
) -> None:
    """Draw image centered in box, contain (no crop), on paper fill."""
    iw, ih = img.size
    scale = min(box_w / iw, box_h / ih)
    dw, dh = iw * scale, ih * scale
    dx = x + (box_w - dw) / 2
    dy = y + (box_h - dh) / 2
    c.setFillColor(HexColor("#f0ebe3"))
    c.rect(x, y, box_w, box_h, fill=1, stroke=0)
    c.drawImage(image_reader(img, quality), dx, dy, width=dw, height=dh, mask="auto")


def photo_cells(count: int, left: float, bottom: float, width: float, height: float, gap: float) -> list[tuple[float, float, float, float]]:
    """Return list of (x, y, w, h) cells for N photos — full page photo area."""
    cells: list[tuple[float, float, float, float]] = []
    if count <= 0:
        return cells
    if count == 1:
        return [(left, bottom, width, height)]
    if count == 2:
        # side by side
        w = (width - gap) / 2
        return [
            (left, bottom, w, height),
            (left + w + gap, bottom, w, height),
        ]
    if count == 3:
        # large top + two bottom
        top_h = height * 0.58
        bot_h = height - top_h - gap
        w = (width - gap) / 2
        return [
            (left, bottom + bot_h + gap, width, top_h),
            (left, bottom, w, bot_h),
            (left + w + gap, bottom, w, bot_h),
        ]
    if count == 4:
        # 2x2
        w = (width - gap) / 2
        h = (height - gap) / 2
        return [
            (left, bottom + h + gap, w, h),
            (left + w + gap, bottom + h + gap, w, h),
            (left, bottom, w, h),
            (left + w + gap, bottom, w, h),
        ]
    # 5+: hero left/top + grid of remaining
    # Layout: top row hero full width ~45%, then remaining in rows of 2 or 3
    hero_h = height * 0.42
    rest_h = height - hero_h - gap
    cells.append((left, bottom + rest_h + gap, width, hero_h))
    rest = count - 1
    cols = 2 if rest <= 4 else 3
    rows = (rest + cols - 1) // cols
    cell_w = (width - gap * (cols - 1)) / cols
    cell_h = (rest_h - gap * (rows - 1)) / rows
    for i in range(rest):
        r = i // cols
        col = i % cols
        # fill last row centered if incomplete? keep left-aligned for clarity
        cells.append(
            (
                left + col * (cell_w + gap),
                bottom + rest_h - (r + 1) * cell_h - r * gap,
                cell_w,
                cell_h,
            )
        )
    return cells


def footer(c: canvas.Canvas, page: int, total: int, body: str) -> None:
    w, _ = A4
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.line(14 * mm, 12 * mm, w - 14 * mm, 12 * mm)
    c.setFillColor(INK_SOFT)
    c.setFont(body, 8)
    c.drawString(14 * mm, 7 * mm, f"{BRAND}  ·  Silai Bunai Lookbook")
    c.drawRightString(w - 14 * mm, 7 * mm, f"{page} / {total}")


def cover(c: canvas.Canvas, products: list[dict], body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # reserved header band — no overlap with photos
    header_bottom = h - 42 * mm
    c.setFillColor(INK)
    c.setFont(body, 9)
    c.drawString(14 * mm, h - 16 * mm, "LOOKBOOK")
    c.setFont(bold, 26)
    c.drawString(14 * mm, h - 28 * mm, BRAND)
    c.setFont(bold, 16)
    c.setFillColor(INK_SOFT)
    c.drawString(14 * mm, h - 36 * mm, "Silai Bunai")

    # photo mosaic — all first photos, clean grid
    mosaic_top = header_bottom - 4 * mm
    mosaic_bottom = 20 * mm
    mosaic_h = mosaic_top - mosaic_bottom
    left = 14 * mm
    width = w - 28 * mm
    gap = 2.5 * mm

    thumbs: list[Image.Image] = []
    for p in products:
        img = load_image(p["image"], 700, 700)
        if img:
            thumbs.append(img)

    n = len(thumbs)
    if n:
        cols = 3
        rows = (n + cols - 1) // cols
        cell_w = (width - gap * (cols - 1)) / cols
        cell_h = (mosaic_h - gap * (rows - 1)) / rows
        for i, img in enumerate(thumbs):
            r = i // cols
            col = i % cols
            x = left + col * (cell_w + gap)
            y = mosaic_top - (r + 1) * cell_h - r * gap
            fit_draw(c, img, x, y, cell_w, cell_h, quality=70)

    c.setFillColor(INK_SOFT)
    c.setFont(body, 8.5)
    c.drawString(14 * mm, 14 * mm, f"{n} looks  ·  All photograph angles inside  ·  Custom stitch & soft finishes")
    # page mark only (no phone)
    c.drawRightString(w - 14 * mm, 14 * mm, f"{page} / {total}")


def product_page(
    c: canvas.Canvas,
    product: dict,
    body: str,
    bold: str,
    page: int,
    total: int,
    index: int,
    count: int,
) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Fixed header zone (never overlaps photos)
    margin = 12 * mm
    header_top = h - 12 * mm
    # line 1: brand + index
    c.setFillColor(INK_SOFT)
    c.setFont(body, 8)
    c.drawString(margin, header_top, BRAND)
    c.drawRightString(w - margin, header_top, f"{index} / {count}")

    # line 2: product name (max 2 lines, reserved height)
    name_top = header_top - 10 * mm
    name_bottom = draw_text_block(
        c,
        product["name"],
        margin,
        name_top,
        w - 2 * margin,
        bold,
        14,
        17,
        INK,
        max_lines=2,
    )
    # line 3: sku only (no phone, no long description)
    sku_y = name_bottom - 6 * mm
    c.setFillColor(INK_SOFT)
    c.setFont(body, 8.5)
    sku = product.get("sku") or ""
    c.drawString(margin, sku_y, sku)

    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    rule_y = sku_y - 4 * mm
    c.line(margin, rule_y, w - margin, rule_y)

    # Photo zone — everything below the rule, above footer
    photo_top = rule_y - 4 * mm
    photo_bottom = 16 * mm
    photo_h = photo_top - photo_bottom
    photo_w = w - 2 * margin

    images = product.get("images") or ([product["image"]] if product.get("image") else [])
    loaded: list[Image.Image] = []
    for rel in images:
        img = load_image(rel, 1200, 1200)
        if img:
            loaded.append(img)

    cells = photo_cells(len(loaded), margin, photo_bottom, photo_w, photo_h, gap=2.2 * mm)
    for cell, img in zip(cells, loaded):
        fit_draw(c, img, *cell, quality=70)

    footer(c, page, total, body)


def closing(c: canvas.Canvas, body: str, bold: str, page: int, total: int, count: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 22)
    c.drawCentredString(w / 2, h / 2 + 18, BRAND)
    c.setFont(bold, 14)
    c.setFillColor(INK_SOFT)
    c.drawCentredString(w / 2, h / 2 - 2, "Silai Bunai")
    c.setFont(body, 10)
    c.drawCentredString(w / 2, h / 2 - 20, f"{count} looks  ·  Every photograph angle included")
    c.drawCentredString(w / 2, h / 2 - 34, "Custom stitch & soft furnishing finishes")
    c.drawCentredString(w / 2, h / 2 - 48, "Ask for a quote after fabric choice and measure")

    footer(c, page, total, body)


def main() -> None:
    products = json.loads(DATA.read_text())
    # keep catalogue order from JSON
    for p in products:
        if not p.get("images"):
            p["images"] = [p["image"]] if p.get("image") else []

    body, bold = register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    # cover + one page per product + closing
    total = 1 + len(products) + 1

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("Priyabadal Homes — Silai Bunai Lookbook")
    c.setAuthor("Priyabadal Homes")
    c.setSubject("Silai Bunai photo lookbook for WhatsApp (no rates, no phone)")

    cover(c, products, body, bold, 1, total)
    page = 2
    for i, product in enumerate(products, start=1):
        c.showPage()
        product_page(c, product, body, bold, page, total, i, len(products))
        page += 1
    c.showPage()
    closing(c, body, bold, page, total, len(products))
    c.save()

    size_mb = OUT.stat().st_size / (1024 * 1024)
    photo_count = sum(len(p.get("images") or []) for p in products)
    print(
        f"Wrote {OUT} ({size_mb:.2f} MB, {total} pages, "
        f"{len(products)} products, {photo_count} photos, no phone, no prices)"
    )


if __name__ == "__main__":
    main()
