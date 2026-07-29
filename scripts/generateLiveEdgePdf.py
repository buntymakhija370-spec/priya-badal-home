#!/usr/bin/env python3
"""Generate Priyabadal Homes Live Edge Furniture PDF for WhatsApp sharing."""

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
OUT = ROOT / "public" / "catalogs" / "priyabadal-live-edge-furniture.pdf"
DATA = ROOT / "scripts" / "live-edge-products.json"
PUBLIC = ROOT / "public"

INK = HexColor("#152019")
INK_SOFT = HexColor("#3a4a40")
MOSS = HexColor("#4f6a58")
HONEY = HexColor("#7d5c30")
PAPER = HexColor("#f7faf8")
MIST = HexColor("#dce6df")
CARD = HexColor("#ffffff")

WHATSAPP = "+91 81099 49649"
WA_LINK = "https://wa.me/918109949649"
BRAND = "Priyabadal Homes"

SECTION_LABELS = {
    "seaters": "Seaters & Benches",
    "consoles": "Consoles",
    "centre-tables": "Centre Tables",
    "ball-stools": "Ball Stools",
    "basins": "Basins",
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
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
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
    c.drawString(16 * mm, 10 * mm, f"{BRAND} · Live Edge Furniture · WhatsApp {WHATSAPP}")
    c.drawRightString(w - 16 * mm, 10 * mm, f"{page} / {total}")


def cover(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    # soft panel
    c.setFillColor(HexColor("#1c2a22"))
    c.roundRect(14 * mm, 28 * mm, w - 28 * mm, h - 48 * mm, 8, fill=1, stroke=0)

    c.setFillColor(HexColor("#9db4b8"))
    c.setFont(body, 10)
    c.drawString(28 * mm, h - 48 * mm, "CATALOGUE · WHATSAPP READY")

    c.setFillColor(white)
    c.setFont(bold, 28)
    c.drawString(28 * mm, h - 68 * mm, BRAND)

    c.setFillColor(HexColor("#e8f0ea"))
    c.setFont(bold, 20)
    c.drawString(28 * mm, h - 82 * mm, "Live Edge Furniture")

    blurb = (
        "Indonesian imported solid teak live-edge pieces. "
        "Every slab is natural and one-of-a-kind — grain, shape, and size are unique. "
        "Confirm exact size and availability on WhatsApp before you order."
    )
    draw_wrapped(c, blurb, 28 * mm, h - 100 * mm, w - 56 * mm, body, 11, 16, HexColor("#c9d6cd"))

    # hero collage from first few products
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

    c.setFillColor(HexColor("#f4f8f5"))
    c.setFont(bold, 12)
    c.drawString(28 * mm, 48 * mm, f"WhatsApp {WHATSAPP}")
    c.setFont(body, 10)
    c.drawString(28 * mm, 40 * mm, WA_LINK)
    c.drawString(28 * mm, 32 * mm, f"{len(products)} pieces · Seaters · Consoles · Tables · Stools · Basins")

    footer(c, page, total, body, bold)


def notes_page(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 18)
    c.drawString(18 * mm, h - 28 * mm, "Before you order")

    notes = [
        ("Natural & unique", "Indonesian solid teak live-edge. No two pieces are identical — photos show the style of available stock."),
        ("Confirm on WhatsApp", f"Message {WHATSAPP} with the product name or SKU. We confirm size, stock, price, and delivery before booking."),
        ("Pricing", "Prices shown are indicative MRP in INR for the photographed piece. Final quote is confirmed on WhatsApp."),
        ("Shipping", "Delivery / freight is quoted separately based on city and piece size."),
        ("Care", "Wipe with a soft dry cloth. Avoid prolonged water pooling on basins and table tops."),
    ]

    y = h - 42 * mm
    for title, text in notes:
        c.setFillColor(CARD)
        c.setStrokeColor(MIST)
        c.roundRect(18 * mm, y - 28 * mm, w - 36 * mm, 30 * mm, 5, fill=1, stroke=1)
        c.setFillColor(MOSS)
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
    # 2 products per page
    i = 0
    while i < len(products):
        c.showPage()
        c.setFillColor(PAPER)
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # header
        section = products[i]["subcategoryId"]
        c.setFillColor(INK)
        c.setFont(bold, 13)
        c.drawString(16 * mm, h - 16 * mm, BRAND)
        c.setFillColor(MOSS)
        c.setFont(body, 9)
        c.drawRightString(w - 16 * mm, h - 16 * mm, SECTION_LABELS.get(section, section))
        c.setStrokeColor(MIST)
        c.setLineWidth(0.6)
        c.line(16 * mm, h - 19 * mm, w - 16 * mm, h - 19 * mm)

        slots = [(h - 24 * mm, h / 2 + 4 * mm), (h / 2 - 2 * mm, 18 * mm)]
        for slot_idx, (top, bottom) in enumerate(slots):
            if i + slot_idx >= len(products):
                break
            p = products[i + slot_idx]
            # new section banner if category changes mid-page for second slot
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

            c.setFillColor(MOSS)
            c.setFont(body, 8)
            c.drawString(tx, ty, (p.get("sku") or "") + "  ·  " + SECTION_LABELS.get(p["subcategoryId"], ""))

            c.setFillColor(INK)
            c.setFont(bold, 13)
            name_y = ty - 14
            # wrap name
            name_y = draw_wrapped(c, p["name"], tx, name_y, tw, bold, 12, 15, INK, max_lines=2) - 6

            c.setFillColor(HONEY)
            c.setFont(bold, 14)
            c.drawString(tx, name_y - 4, format_inr(p["price"]))
            c.setFillColor(INK_SOFT)
            c.setFont(body, 8)
            c.drawString(tx + c.stringWidth(format_inr(p["price"]), bold, 14) + 4, name_y - 2, "indicative")

            desc = p.get("description") or ""
            draw_wrapped(c, desc, tx, name_y - 18, tw, body, 9, 12, INK_SOFT, max_lines=5)

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
    c.drawCentredString(w / 2, h / 2 + 28, "Order on WhatsApp")
    c.setFont(body, 14)
    c.drawCentredString(w / 2, h / 2 + 6, WHATSAPP)
    c.setFont(body, 11)
    c.setFillColor(HexColor("#c9d6cd"))
    c.drawCentredString(w / 2, h / 2 - 14, WA_LINK)
    c.setFont(body, 10)
    c.drawCentredString(
        w / 2,
        h / 2 - 36,
        "Send product name or SKU · We confirm size, stock & delivery",
    )
    c.setFont(bold, 12)
    c.setFillColor(HexColor("#e8f0ea"))
    c.drawCentredString(w / 2, 40 * mm, BRAND)
    c.setFont(body, 9)
    c.setFillColor(HexColor("#9db4b8"))
    c.drawCentredString(w / 2, 32 * mm, "Live Edge · Indonesian teak · Unique natural pieces")
    footer(c, page, total, body, bold)


def main() -> None:
    products = json.loads(DATA.read_text())
    # Keep section order
    order = ["seaters", "consoles", "centre-tables", "ball-stools", "basins"]
    products.sort(key=lambda p: (order.index(p["subcategoryId"]), p.get("sku") or p["name"]))

    body, bold = register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    # Estimate pages: cover + notes + ceil(n/2) + closing
    product_pages_count = (len(products) + 1) // 2
    total = 2 + product_pages_count + 1

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("Priyabadal Homes — Live Edge Furniture")
    c.setAuthor("Priyabadal Homes")
    c.setSubject("Live Edge Furniture catalogue for WhatsApp")

    cover(c, body, bold, 1, total)
    c.showPage()
    notes_page(c, body, bold, 2, total)
    next_page = product_pages(c, products, body, bold, 3, total)
    c.showPage()
    closing(c, body, bold, next_page, total)
    c.save()

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUT} ({size_mb:.2f} MB, {total} pages, {len(products)} products)")


if __name__ == "__main__":
    main()
