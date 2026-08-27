#!/usr/bin/env python3
"""Generate Priyabadal Homes Kitchen photo catalogue PDF (website only, no phone)."""

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
OUT = ROOT / "public" / "catalogs" / "priyabadal-kitchen.pdf"
DATA = ROOT / "scripts" / "kitchen-products.json"
PUBLIC = ROOT / "public"

INK = HexColor("#152019")
INK_SOFT = HexColor("#3a4a40")
HONEY = HexColor("#7d5c30")
MOSS = HexColor("#4f6a58")
LINE = HexColor("#c5d4cb")
PAPER = HexColor("#f7faf8")
BRAND = "Priyabadal Homes"
WEBSITE = "www.priyabadalhomes.com"
WEBSITE_URL = "https://www.priyabadalhomes.com"
COLLECTION = "Kitchen"

SECTION_LABELS = {
    "modular": "Modular Kitchen",
}


def format_inr(n: int | float) -> str:
    s = f"{int(n)}"
    if len(s) <= 3:
        return f"₹{s}"
    last3 = s[-3:]
    rest = s[:-3]
    parts = []
    while rest:
        parts.append(rest[-2:])
        rest = rest[:-2]
    return "₹" + ",".join(reversed(parts)) + "," + last3


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


def load_image(rel: str, max_w: int = 1000, max_h: int = 1000) -> Image.Image | None:
    path = PUBLIC / rel.lstrip("/")
    if not path.exists() or rel.lower().endswith(".svg"):
        return None
    img = Image.open(path).convert("RGB")
    img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return img


def image_reader(img: Image.Image, quality: int = 58) -> ImageReader:
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
    quality: int = 58,
) -> None:
    iw, ih = img.size
    scale = min(box_w / iw, box_h / ih)
    dw, dh = iw * scale, ih * scale
    dx = x + (box_w - dw) / 2
    dy = y + (box_h - dh) / 2
    c.setFillColor(HexColor("#eef2ef"))
    c.rect(x, y, box_w, box_h, fill=1, stroke=0)
    c.drawImage(image_reader(img, quality), dx, dy, width=dw, height=dh, mask="auto")


def photo_cells(count: int, left: float, bottom: float, width: float, height: float, gap: float) -> list[tuple[float, float, float, float]]:
    cells: list[tuple[float, float, float, float]] = []
    if count <= 0:
        return cells
    if count == 1:
        return [(left, bottom, width, height)]
    if count == 2:
        w = (width - gap) / 2
        return [
            (left, bottom, w, height),
            (left + w + gap, bottom, w, height),
        ]
    if count == 3:
        top_h = height * 0.58
        bot_h = height - top_h - gap
        w = (width - gap) / 2
        return [
            (left, bottom + bot_h + gap, width, top_h),
            (left, bottom, w, bot_h),
            (left + w + gap, bottom, w, bot_h),
        ]
    if count == 4:
        w = (width - gap) / 2
        h = (height - gap) / 2
        return [
            (left, bottom + h + gap, w, h),
            (left + w + gap, bottom + h + gap, w, h),
            (left, bottom, w, h),
            (left + w + gap, bottom, w, h),
        ]
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
        cells.append(
            (
                left + col * (cell_w + gap),
                bottom + rest_h - (r + 1) * cell_h - r * gap,
                cell_w,
                cell_h,
            )
        )
    return cells


def shutter_rate(product: dict) -> str:
    return f"Shutter {format_inr(product['price'])} / sq ft"


def carcass_rate(product: dict) -> str | None:
    carcass = product.get("carcassPrice")
    if carcass is None:
        return None
    return f"Carcass {format_inr(carcass)} / sq ft"


def thickness_line(product: dict) -> str:
    mm_val = product.get("thicknessMm")
    if mm_val:
        return f"{int(mm_val)} mm HDHMR"
    return ""


def footer(c: canvas.Canvas, page: int, total: int, body: str) -> None:
    w, _ = A4
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.line(14 * mm, 12 * mm, w - 14 * mm, 12 * mm)
    c.setFillColor(INK_SOFT)
    c.setFont(body, 8)
    c.drawString(14 * mm, 7 * mm, f"{BRAND}  ·  {COLLECTION}  ·  {WEBSITE}")
    c.drawRightString(w - 14 * mm, 7 * mm, f"{page} / {total}")


def cover(c: canvas.Canvas, products: list[dict], body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    header_bottom = h - 46 * mm
    c.setFillColor(MOSS)
    c.setFont(body, 9)
    c.drawString(14 * mm, h - 16 * mm, "CATALOGUE")
    c.setFillColor(INK)
    c.setFont(bold, 26)
    c.drawString(14 * mm, h - 28 * mm, BRAND)
    c.setFont(bold, 16)
    c.setFillColor(INK_SOFT)
    c.drawString(14 * mm, h - 36 * mm, COLLECTION)

    mosaic_top = header_bottom - 4 * mm
    mosaic_bottom = 28 * mm
    mosaic_h = mosaic_top - mosaic_bottom
    left = 14 * mm
    width = w - 28 * mm
    gap = 2.5 * mm

    thumbs: list[Image.Image] = []
    for p in products:
        img = load_image(p["image"], 520, 520)
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
            fit_draw(c, img, x, y, cell_w, cell_h, quality=58)

    c.setFillColor(INK)
    c.setFont(bold, 11)
    c.drawString(14 * mm, 20 * mm, WEBSITE)
    c.setFont(body, 9)
    c.setFillColor(INK_SOFT)
    c.drawString(14 * mm, 14 * mm, WEBSITE_URL)
    c.drawRightString(
        w - 14 * mm,
        20 * mm,
        f"{len(products)} kitchens  ·  shutter + carcass rates  ·  all façades inside",
    )
    c.drawRightString(w - 14 * mm, 14 * mm, f"{page} / {total}")


def notes_page(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 18)
    c.drawString(18 * mm, h - 28 * mm, "Before you order")

    notes = [
        (
            "Modular kitchens",
            "Made-to-measure shutter and carcass units — loft, base, tall, and island runs as shown in each photograph.",
        ),
        (
            "Enquire on the website",
            f"Visit {WEBSITE} — open Kitchen, choose the design name or SKU, and send your enquiry from the product page.",
        ),
        (
            "Pricing",
            "Shutter and carcass are priced separately per sq ft in INR. Final quote is confirmed after kitchen measure.",
        ),
        (
            "What's included",
            "25 mm HDHMR shutters with catalogued finish. Carcass in BWP plywood · laminate both sides · 2 mm edge banding.",
        ),
    ]

    y = h - 42 * mm
    for title, text in notes:
        c.setFillColor(HexColor("#ffffff"))
        c.setStrokeColor(LINE)
        c.roundRect(18 * mm, y - 28 * mm, w - 36 * mm, 30 * mm, 5, fill=1, stroke=1)
        c.setFillColor(MOSS)
        c.setFont(bold, 11)
        c.drawString(24 * mm, y - 8 * mm, title)
        draw_text_block(c, text, 24 * mm, y - 16 * mm, w - 48 * mm, body, 9.5, 13, INK_SOFT, max_lines=2)
        y -= 36 * mm

    c.setFillColor(INK)
    c.setFont(bold, 12)
    c.drawString(18 * mm, 40 * mm, "Ready to enquire?")
    c.setFont(body, 10)
    c.setFillColor(INK_SOFT)
    c.drawString(18 * mm, 32 * mm, WEBSITE_URL)

    footer(c, page, total, body)


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

    margin = 12 * mm
    header_top = h - 12 * mm
    section = SECTION_LABELS.get(product.get("subcategoryId", ""), COLLECTION)

    c.setFillColor(INK_SOFT)
    c.setFont(body, 8)
    c.drawString(margin, header_top, f"{BRAND}  ·  {section}")
    c.drawRightString(w - margin, header_top, f"{index} / {count}")

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

    meta_y = name_bottom - 6 * mm
    c.setFillColor(HONEY)
    c.setFont(bold, 11)
    shutter = shutter_rate(product)
    c.drawString(margin, meta_y, shutter)
    thick = thickness_line(product)
    if thick:
        c.setFillColor(INK_SOFT)
        c.setFont(body, 9)
        c.drawString(margin + c.stringWidth(shutter, bold, 11) + 8, meta_y + 1, f"·  {thick}")

    carcass = carcass_rate(product)
    sku_y = meta_y - 5 * mm
    if carcass:
        c.setFillColor(INK_SOFT)
        c.setFont(body, 9)
        c.drawString(margin, sku_y, carcass)
        sku_y -= 5 * mm

    c.setFillColor(INK_SOFT)
    c.setFont(body, 8.5)
    sku = product.get("sku") or ""
    c.drawString(margin, sku_y, sku)

    rule_y = sku_y - 4 * mm
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(margin, rule_y, w - margin, rule_y)

    photo_top = rule_y - 4 * mm
    photo_bottom = 16 * mm
    photo_h = photo_top - photo_bottom
    photo_w = w - 2 * margin

    images = product.get("images") or ([product["image"]] if product.get("image") else [])
    loaded: list[Image.Image] = []
    for rel in images:
        img = load_image(rel, 900, 900)
        if img:
            loaded.append(img)

    cells = photo_cells(len(loaded), margin, photo_bottom, photo_w, photo_h, gap=2.2 * mm)
    for cell, img in zip(cells, loaded):
        fit_draw(c, img, *cell, quality=58)

    footer(c, page, total, body)


def closing(c: canvas.Canvas, body: str, bold: str, page: int, total: int, count: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(white)
    c.setFont(bold, 22)
    c.drawCentredString(w / 2, h / 2 + 28, "Visit our website")
    c.setFont(body, 14)
    c.drawCentredString(w / 2, h / 2 + 6, WEBSITE)
    c.setFont(body, 11)
    c.setFillColor(HexColor("#c9d6cd"))
    c.drawCentredString(w / 2, h / 2 - 14, WEBSITE_URL)
    c.setFont(body, 10)
    c.drawCentredString(
        w / 2,
        h / 2 - 36,
        "Browse Kitchen · Share design name or SKU · We confirm measure & quote",
    )
    c.setFont(bold, 12)
    c.setFillColor(HexColor("#e8f0ea"))
    c.drawCentredString(w / 2, 40 * mm, BRAND)
    c.setFont(body, 9)
    c.setFillColor(HexColor("#9db4b8"))
    c.drawCentredString(w / 2, 32 * mm, f"{COLLECTION} · {count} designs · Modular made to measure")

    footer(c, page, total, body)


def main() -> None:
    products = json.loads(DATA.read_text())
    for p in products:
        if not p.get("images"):
            img = p.get("image")
            p["images"] = [img] if img and not str(img).lower().endswith(".svg") else []

    body, bold = register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    total = 2 + len(products) + 1

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle(f"{BRAND} — {COLLECTION}")
    c.setAuthor(BRAND)
    c.setSubject(f"{COLLECTION} catalogue")

    cover(c, products, body, bold, 1, total)
    c.showPage()
    notes_page(c, body, bold, 2, total)
    page = 3
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
        f"{len(products)} products, {photo_count} photos, {WEBSITE})"
    )


if __name__ == "__main__":
    main()
