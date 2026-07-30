#!/usr/bin/env python3
"""Generate Priyabadal Homes Silai Bunai PDF for WhatsApp sharing (no prices)."""

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

INK = HexColor("#1f1a17")
INK_SOFT = HexColor("#5a5048")
CLAY = HexColor("#8a6a4f")
STONE = HexColor("#6e655c")
PAPER = HexColor("#f6f2ec")
MIST = HexColor("#e4ddd3")
CARD = HexColor("#ffffff")

WHATSAPP = "+91 81099 49649"
WA_LINK = "https://wa.me/918109949649"
BRAND = "Priyabadal Homes"

SECTION_LABELS = {
    "sofa-upholstery": "Sofa & wall upholstery",
    "custom-stitch": "Custom stitch & panels",
    "cushions": "Headboards & cushions",
}


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


def load_image(rel: str, max_w: int = 900, max_h: int = 900) -> Image.Image | None:
    path = PUBLIC / rel.lstrip("/")
    if not path.exists():
        return None
    img = Image.open(path).convert("RGB")
    img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return img


def image_reader(img: Image.Image, quality: int = 76) -> ImageReader:
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    buf.seek(0)
    return ImageReader(buf)


def draw_wrapped(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    font: str,
    size: float,
    leading: float,
    color: Color,
    max_lines: int | None = None,
) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
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
    if max_lines is not None:
        lines = lines[:max_lines]
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * leading, ln)
    return y - max(len(lines) - 1, 0) * leading


def footer(c: canvas.Canvas, page: int, total: int, body: str, bold: str) -> None:
    w, _ = A4
    c.setFillColor(INK_SOFT)
    c.setFont(body, 8)
    c.drawString(16 * mm, 10 * mm, f"{BRAND} · Silai Bunai · WhatsApp {WHATSAPP}")
    c.drawRightString(w - 16 * mm, 10 * mm, f"{page} / {total}")


def cover(c: canvas.Canvas, body: str, bold: str, page: int, total: int, count: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(HexColor("#2a221c"))
    c.roundRect(14 * mm, 28 * mm, w - 28 * mm, h - 48 * mm, 8, fill=1, stroke=0)

    c.setFillColor(HexColor("#cbb89f"))
    c.setFont(body, 10)
    c.drawString(28 * mm, h - 48 * mm, "LOOKBOOK · WHATSAPP READY")

    c.setFillColor(white)
    c.setFont(bold, 28)
    c.drawString(28 * mm, h - 68 * mm, BRAND)

    c.setFillColor(HexColor("#f0e7db"))
    c.setFont(bold, 20)
    c.drawString(28 * mm, h - 82 * mm, "Silai Bunai")

    blurb = (
        "Custom upholstery, stitch work, and soft furnishing finishes for wardrobes, "
        "walls, headboards, and lounge pieces. Measured to your space — "
        "confirm fabric and stitch on WhatsApp."
    )
    draw_wrapped(c, blurb, 28 * mm, h - 100 * mm, w - 56 * mm, body, 11, 16, HexColor("#d8cdc0"))

    products = json.loads(DATA.read_text())
    thumbs = []
    for p in products[:4]:
        img = load_image(p["image"], 480, 480)
        if img:
            thumbs.append(img)
    if thumbs:
        tw = (w - 56 * mm - 9 * mm) / 2
        th = tw * 0.85
        y0 = h - 168 * mm
        for i, img in enumerate(thumbs[:4]):
            col = i % 2
            row = i // 2
            x = 28 * mm + col * (tw + 9 * mm)
            y = y0 - row * (th + 8 * mm)
            c.drawImage(
                image_reader(img, 78),
                x,
                y - th + tw * 0.05,
                width=tw,
                height=th,
                preserveAspectRatio=True,
                anchor="c",
            )

    c.setFillColor(HexColor("#f6f2ec"))
    c.setFont(bold, 12)
    c.drawString(28 * mm, 48 * mm, f"WhatsApp {WHATSAPP}")
    c.setFont(body, 10)
    c.drawString(28 * mm, 40 * mm, WA_LINK)
    c.drawString(28 * mm, 32 * mm, f"{count} looks · Quote on WhatsApp after measure")

    footer(c, page, total, body, bold)


def notes_page(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 18)
    c.drawString(18 * mm, h - 28 * mm, "How Silai Bunai works")

    notes = [
        (
            "Custom to your piece",
            "Wardrobes, walls, headboards, tallboys, and lounge panels — measured and stitched for your furniture or wall size.",
        ),
        (
            "Confirm on WhatsApp",
            f"Message {WHATSAPP} with the look name or SKU. Share photos of your piece for fabric, stitch, and size guidance.",
        ),
        (
            "Fabric & finish",
            "Fabric colour, foam, and stitch pattern are confirmed before work begins. Photos show style and stitch character.",
        ),
        (
            "On-site measure",
            "We measure on site when needed so panels and doors fit cleanly — no guesswork from photos alone.",
        ),
        (
            "Quote after measure",
            "Final quotation is shared on WhatsApp after fabric choice and measurement. Rates are not listed in this lookbook.",
        ),
    ]

    y = h - 42 * mm
    for title, text in notes:
        c.setFillColor(CARD)
        c.setStrokeColor(MIST)
        c.roundRect(18 * mm, y - 28 * mm, w - 36 * mm, 30 * mm, 5, fill=1, stroke=1)
        c.setFillColor(CLAY)
        c.setFont(bold, 11)
        c.drawString(24 * mm, y - 8 * mm, title)
        draw_wrapped(c, text, 24 * mm, y - 16 * mm, w - 48 * mm, body, 9.5, 13, INK_SOFT, max_lines=2)
        y -= 36 * mm

    c.setFillColor(INK)
    c.setFont(bold, 12)
    c.drawString(18 * mm, 40 * mm, "Ready to enquire?")
    c.setFont(body, 10)
    c.setFillColor(INK_SOFT)
    c.drawString(18 * mm, 32 * mm, f"WhatsApp {WHATSAPP}  ·  {WA_LINK}")

    footer(c, page, total, body, bold)


def product_pages(
    c: canvas.Canvas,
    products: list[dict],
    body: str,
    bold: str,
    start_page: int,
    total: int,
) -> int:
    w, h = A4
    page = start_page
    i = 0
    while i < len(products):
        c.showPage()
        c.setFillColor(PAPER)
        c.rect(0, 0, w, h, fill=1, stroke=0)

        section = products[i]["subcategoryId"]
        c.setFillColor(INK)
        c.setFont(bold, 13)
        c.drawString(16 * mm, h - 16 * mm, BRAND)
        c.setFillColor(CLAY)
        c.setFont(body, 9)
        c.drawRightString(w - 16 * mm, h - 16 * mm, SECTION_LABELS.get(section, "Silai Bunai"))
        c.setStrokeColor(MIST)
        c.setLineWidth(0.6)
        c.line(16 * mm, h - 19 * mm, w - 16 * mm, h - 19 * mm)

        slots = [(h - 24 * mm, h / 2 + 4 * mm), (h / 2 - 2 * mm, 18 * mm)]
        for slot_idx, (top, bottom) in enumerate(slots):
            if i + slot_idx >= len(products):
                break
            p = products[i + slot_idx]
            card_h = top - bottom
            c.setFillColor(CARD)
            c.setStrokeColor(MIST)
            c.roundRect(16 * mm, bottom, w - 32 * mm, card_h - 4 * mm, 6, fill=1, stroke=1)

            img_w = 78 * mm
            img_h = card_h - 16 * mm
            img = load_image(p["image"], 720, 720)
            if img:
                c.drawImage(
                    image_reader(img, 76),
                    22 * mm,
                    bottom + 8 * mm,
                    width=img_w,
                    height=img_h,
                    preserveAspectRatio=True,
                    anchor="c",
                )

            tx = 22 * mm + img_w + 8 * mm
            tw = w - tx - 22 * mm
            ty = top - 18 * mm

            c.setFillColor(CLAY)
            c.setFont(body, 8)
            label = (p.get("sku") or "") + "  ·  " + SECTION_LABELS.get(p["subcategoryId"], "Silai Bunai")
            c.drawString(tx, ty, label)

            c.setFillColor(INK)
            name_y = draw_wrapped(c, p["name"], tx, ty - 14, tw, bold, 12, 15, INK, max_lines=2) - 8

            c.setFillColor(STONE)
            c.setFont(bold, 9)
            c.drawString(tx, name_y, "Quote on WhatsApp after measure")

            desc = p.get("description") or ""
            # Strip any accidental price wording from descriptions
            desc = desc.replace("₹", "").replace("INR", "")
            draw_wrapped(c, desc, tx, name_y - 16, tw, body, 9, 12, INK_SOFT, max_lines=6)

            c.setFillColor(INK)
            c.setFont(body, 8.5)
            c.drawString(tx, bottom + 14 * mm, f"Ask on WhatsApp: {WHATSAPP}")

        footer(c, page, total, body, bold)
        page += 1
        i += 2
    return page


def closing(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(bold, 22)
    c.drawCentredString(w / 2, h / 2 + 28, "Enquire on WhatsApp")
    c.setFont(body, 14)
    c.drawCentredString(w / 2, h / 2 + 6, WHATSAPP)
    c.setFont(body, 11)
    c.setFillColor(HexColor("#d8cdc0"))
    c.drawCentredString(w / 2, h / 2 - 14, WA_LINK)
    c.setFont(body, 10)
    c.drawCentredString(
        w / 2,
        h / 2 - 36,
        "Send look name or SKU · We confirm fabric, stitch & measure",
    )
    c.setFont(bold, 12)
    c.setFillColor(HexColor("#f0e7db"))
    c.drawCentredString(w / 2, 40 * mm, BRAND)
    c.setFont(body, 9)
    c.setFillColor(HexColor("#cbb89f"))
    c.drawCentredString(w / 2, 32 * mm, "Silai Bunai · Custom stitch · Soft furnishing finishes")
    footer(c, page, total, body, bold)


def main() -> None:
    products = json.loads(DATA.read_text())
    order = ["sofa-upholstery", "custom-stitch", "cushions"]
    products.sort(
        key=lambda p: (
            order.index(p["subcategoryId"]) if p["subcategoryId"] in order else 99,
            p.get("sku") or p["name"],
        )
    )

    body, bold = register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    product_pages_count = (len(products) + 1) // 2
    total = 2 + product_pages_count + 1

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("Priyabadal Homes — Silai Bunai")
    c.setAuthor("Priyabadal Homes")
    c.setSubject("Silai Bunai catalogue for WhatsApp (no prices)")

    cover(c, body, bold, 1, total, len(products))
    c.showPage()
    notes_page(c, body, bold, 2, total)
    next_page = product_pages(c, products, body, bold, 3, total)
    c.showPage()
    closing(c, body, bold, next_page, total)
    c.save()

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUT} ({size_mb:.2f} MB, {total} pages, {len(products)} products, no prices)")


if __name__ == "__main__":
    main()
