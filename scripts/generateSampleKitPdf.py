#!/usr/bin/env python3
"""Generate Priyabadal Homes Sample Kit PDF for WhatsApp partner promotion."""

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
OUT = ROOT / "public" / "catalogs" / "priyabadal-sample-kits.pdf"
DATA = ROOT / "scripts" / "sample-kit-products.json"
PUBLIC = ROOT / "public"

INK = HexColor("#152019")
INK_SOFT = HexColor("#3a4a40")
MOSS = HexColor("#4f6a58")
HONEY = HexColor("#7d5c30")
PAPER = HexColor("#f7faf8")
MIST = HexColor("#dce6df")
CARD = HexColor("#ffffff")
WARM = HexColor("#f8f1e8")

WHATSAPP = "+91 81099 49649"
WA_LINK = "https://wa.me/918109949649"
SITE = "www.priyabadalhomes.com"
BRAND = "Priyabadal Homes"


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


def load_image(rel: str, max_w: int = 1100, max_h: int = 1400) -> Image.Image | None:
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
        if len(text.split()) > 0 and max_lines and len(lines) == max_lines:
            last = lines[-1]
            while c.stringWidth(last + "…", font, size) > width and len(last) > 4:
                last = last[:-1]
            if not last.endswith("…"):
                lines[-1] = last.rstrip() + "…"
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * leading, ln)
    return y - max(len(lines) - 1, 0) * leading


def footer(c: canvas.Canvas, page: int, total: int, body: str) -> None:
    w, _ = A4
    c.setStrokeColor(MIST)
    c.setLineWidth(0.5)
    c.line(16 * mm, 14 * mm, w - 16 * mm, 14 * mm)
    c.setFillColor(INK_SOFT)
    c.setFont(body, 8)
    c.drawString(16 * mm, 9 * mm, f"{BRAND} · Sample Kit · WhatsApp {WHATSAPP}")
    c.drawRightString(w - 16 * mm, 9 * mm, f"{page} / {total}")


def cover(c: canvas.Canvas, products: list[dict], body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # warm accent bar
    c.setFillColor(HexColor("#5c3a20"))
    c.rect(0, h - 8 * mm, w, 8 * mm, fill=1, stroke=0)

    c.setFillColor(HexColor("#e4c9a8"))
    c.setFont(body, 9)
    c.drawString(18 * mm, h - 22 * mm, "PARTNER CATALOGUE · WHATSAPP READY")

    c.setFillColor(white)
    c.setFont(bold, 26)
    c.drawString(18 * mm, h - 38 * mm, BRAND)

    c.setFillColor(HexColor("#e4c9a8"))
    c.setFont(bold, 18)
    c.drawString(18 * mm, h - 50 * mm, "Sample Kit")

    blurb = (
        "Display kits for retailers, architects, OEMs, and turnkey partners. "
        "Kit MRP is for the physical sample set. Live product starting prices "
        "are catalogue rates for project orders. Confirm on WhatsApp."
    )
    draw_wrapped(c, blurb, 18 * mm, h - 64 * mm, w - 36 * mm, body, 10.5, 15, HexColor("#c9d6cd"), 4)

    # collage of 4 kit photos
    thumbs = []
    for p in products[:4]:
        img = load_image(p["image"], 520, 700)
        if img:
            thumbs.append(img)
    if thumbs:
        gap = 4 * mm
        tw = (w - 36 * mm - gap) / 2
        th = 58 * mm
        y0 = h - 88 * mm
        for i, img in enumerate(thumbs[:4]):
            col = i % 2
            row = i // 2
            x = 18 * mm + col * (tw + gap)
            y = y0 - row * (th + gap) - th
            c.setFillColor(HexColor("#1c2a22"))
            c.rect(x, y, tw, th, fill=1, stroke=0)
            iw, ih = img.size
            scale = min(tw / iw, th / ih)
            dw, dh = iw * scale, ih * scale
            c.drawImage(
                image_reader(img, 70),
                x + (tw - dw) / 2,
                y + (th - dh) / 2,
                width=dw,
                height=dh,
                mask="auto",
            )

    c.setFillColor(white)
    c.setFont(bold, 12)
    c.drawString(18 * mm, 42 * mm, f"WhatsApp {WHATSAPP}")
    c.setFont(body, 10)
    c.setFillColor(HexColor("#c9d6cd"))
    c.drawString(18 * mm, 34 * mm, WA_LINK)
    c.drawString(18 * mm, 26 * mm, f"{SITE}  ·  {len(products)} kits")
    footer(c, page, total, body)


def overview(c: canvas.Canvas, products: list[dict], body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 16)
    c.drawString(16 * mm, h - 22 * mm, "All kits at a glance")
    c.setFillColor(INK_SOFT)
    c.setFont(body, 9)
    c.drawString(16 * mm, h - 29 * mm, "Kit MRP for samples · Live starting price for project products")

    # table header
    y = h - 40 * mm
    c.setFillColor(INK)
    c.roundRect(14 * mm, y - 2 * mm, w - 28 * mm, 10 * mm, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(bold, 8)
    c.drawString(17 * mm, y + 1.5 * mm, "KIT")
    c.drawString(108 * mm, y + 1.5 * mm, "KIT MRP")
    c.drawRightString(w - 17 * mm, y + 1.5 * mm, "LIVE PRODUCT FROM")

    y -= 12 * mm
    for idx, p in enumerate(products):
        row_h = 11 * mm
        bg = CARD if idx % 2 == 0 else WARM
        c.setFillColor(bg)
        c.rect(14 * mm, y - row_h + 3 * mm, w - 28 * mm, row_h, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont(bold, 8.5)
        name = p["name"]
        if c.stringWidth(name, bold, 8.5) > 88 * mm:
            while c.stringWidth(name + "…", bold, 8.5) > 88 * mm and len(name) > 8:
                name = name[:-1]
            name = name.rstrip() + "…"
        c.drawString(17 * mm, y - 2 * mm, name)
        c.setFont(body, 8.5)
        c.setFillColor(HONEY)
        c.drawString(108 * mm, y - 2 * mm, format_inr(p["price"]))
        c.setFillColor(MOSS)
        live = p.get("liveFrom") or "—"
        c.drawRightString(w - 17 * mm, y - 2 * mm, live)
        y -= row_h

    y -= 6 * mm
    c.setFillColor(CARD)
    c.setStrokeColor(MIST)
    c.roundRect(14 * mm, 28 * mm, w - 28 * mm, y - 28 * mm - 4 * mm, 5, fill=1, stroke=1)
    c.setFillColor(MOSS)
    c.setFont(bold, 10)
    c.drawString(20 * mm, y - 12 * mm, "How to order")
    notes = [
        f"WhatsApp {WHATSAPP} with kit name or SKU.",
        "Confirm rack, optional handle sets, and dispatch city.",
        "Kit MRP = sample set. Live rates apply to project orders.",
        f"Full catalogue: {SITE}/shop/sample-kits",
    ]
    yy = y - 22 * mm
    c.setFont(body, 9)
    c.setFillColor(INK_SOFT)
    for note in notes:
        c.drawString(20 * mm, yy, f"•  {note}")
        yy -= 6 * mm

    footer(c, page, total, body)


def kit_page(
    c: canvas.Canvas,
    p: dict,
    index: int,
    total_kits: int,
    body: str,
    bold: str,
    page: int,
    total: int,
) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # header
    c.setFillColor(INK)
    c.setFont(bold, 11)
    c.drawString(16 * mm, h - 16 * mm, BRAND)
    c.setFillColor(HONEY)
    c.setFont(body, 8.5)
    c.drawRightString(w - 16 * mm, h - 16 * mm, f"Sample Kit  {index}/{total_kits}")
    c.setStrokeColor(MIST)
    c.setLineWidth(0.6)
    c.line(16 * mm, h - 19 * mm, w - 16 * mm, h - 19 * mm)

    # photo
    photo_top = h - 24 * mm
    photo_h = 118 * mm
    photo_w = w - 32 * mm
    c.setFillColor(HexColor("#ece7df"))
    c.roundRect(16 * mm, photo_top - photo_h, photo_w, photo_h, 4, fill=1, stroke=0)
    img = load_image(p["image"], 1000, 1300)
    if img:
        iw, ih = img.size
        scale = min(photo_w / iw, photo_h / ih)
        dw, dh = iw * scale, ih * scale
        c.drawImage(
            image_reader(img, 74),
            16 * mm + (photo_w - dw) / 2,
            photo_top - photo_h + (photo_h - dh) / 2,
            width=dw,
            height=dh,
            mask="auto",
        )

    # details card
    card_top = photo_top - photo_h - 6 * mm
    card_bottom = 20 * mm
    card_h = card_top - card_bottom
    c.setFillColor(CARD)
    c.setStrokeColor(MIST)
    c.roundRect(16 * mm, card_bottom, w - 32 * mm, card_h, 5, fill=1, stroke=1)

    x = 22 * mm
    tw = w - 44 * mm
    y = card_top - 10 * mm

    c.setFillColor(MOSS)
    c.setFont(body, 8)
    c.drawString(x, y, (p.get("sku") or "") + "  ·  Partner display kit")

    y -= 12
    c.setFillColor(INK)
    c.setFont(bold, 14)
    y = draw_wrapped(c, p["name"], x, y, tw, bold, 13, 16, INK, max_lines=2)

    y -= 12
    c.setFillColor(HONEY)
    c.setFont(bold, 16)
    c.drawString(x, y, format_inr(p["price"]))
    c.setFillColor(INK_SOFT)
    c.setFont(body, 9)
    c.drawString(x + c.stringWidth(format_inr(p["price"]), bold, 16) + 5, y + 1, "/ kit MRP")

    if p.get("liveFrom"):
        y -= 12
        c.setFillColor(MOSS)
        c.setFont(bold, 10)
        c.drawString(x, y, f"Live product from  {p['liveFrom']}")

    y -= 12
    if p.get("description"):
        y = draw_wrapped(c, p["description"], x, y, tw, body, 8.5, 12, INK_SOFT, max_lines=3)

    # key facts
    facts = []
    if p.get("samples"):
        facts.append(("Samples", p["samples"]))
    if p.get("includes"):
        facts.append(("Includes", p["includes"]))
    if p.get("sampleSize"):
        facts.append(("Sample size", p["sampleSize"]))
    if p.get("packaging"):
        facts.append(("Packaging", p["packaging"]))
    if p.get("optionsShown"):
        facts.append(("Options", p["optionsShown"]))
    if p.get("hardware"):
        facts.append(("Hardware", p["hardware"]))
    if p.get("thickness"):
        facts.append(("Thickness", p["thickness"]))
    if p.get("optional"):
        facts.append(("Optional", p["optional"]))

    y -= 10
    for label, value in facts[:6]:
        if y < card_bottom + 18 * mm:
            break
        c.setFillColor(HONEY)
        c.setFont(bold, 8)
        c.drawString(x, y, label)
        c.setFillColor(INK)
        c.setFont(body, 8.5)
        y = draw_wrapped(c, value, x + 28 * mm, y, tw - 28 * mm, body, 8.5, 11, INK, max_lines=2)
        y -= 10

    c.setFillColor(INK)
    c.setFont(bold, 9)
    c.drawString(x, card_bottom + 7 * mm, f"WhatsApp {WHATSAPP}")
    c.setFont(body, 8)
    c.setFillColor(INK_SOFT)
    c.drawRightString(w - 22 * mm, card_bottom + 7 * mm, SITE)

    footer(c, page, total, body)


def closing(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(HexColor("#e4c9a8"))
    c.setFont(body, 10)
    c.drawCentredString(w / 2, h / 2 + 48 * mm, "READY FOR YOUR SHOWROOM")

    c.setFillColor(white)
    c.setFont(bold, 22)
    c.drawCentredString(w / 2, h / 2 + 28 * mm, "Order Sample Kits")
    c.setFont(bold, 16)
    c.drawCentredString(w / 2, h / 2 + 8 * mm, f"WhatsApp {WHATSAPP}")

    c.setFillColor(HexColor("#c9d6cd"))
    c.setFont(body, 11)
    c.drawCentredString(w / 2, h / 2 - 8 * mm, WA_LINK)
    c.setFont(body, 10)
    c.drawCentredString(w / 2, h / 2 - 24 * mm, "Send kit name or SKU · We confirm contents & dispatch")
    c.drawCentredString(w / 2, h / 2 - 36 * mm, f"{SITE}/shop/sample-kits")

    c.setFillColor(HexColor("#e4c9a8"))
    c.setFont(bold, 12)
    c.drawCentredString(w / 2, 40 * mm, BRAND)
    c.setFont(body, 9)
    c.setFillColor(HexColor("#9db4b8"))
    c.drawCentredString(w / 2, 32 * mm, "For retailers · Architects · OEMs · Turnkey partners")
    footer(c, page, total, body)


def main() -> None:
    products = json.loads(DATA.read_text())
    body, bold = register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    # cover + overview + 1 page/kit + closing
    total = 2 + len(products) + 1

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("Priyabadal Homes — Sample Kit")
    c.setAuthor("Priyabadal Homes")
    c.setSubject("Sample Kit catalogue for WhatsApp partners")

    cover(c, products, body, bold, 1, total)
    c.showPage()
    overview(c, products, body, bold, 2, total)

    for i, p in enumerate(products, start=1):
        c.showPage()
        kit_page(c, p, i, len(products), body, bold, i + 2, total)

    c.showPage()
    closing(c, body, bold, total, total)
    c.save()

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUT} ({size_mb:.2f} MB, {total} pages, {len(products)} kits)")


if __name__ == "__main__":
    main()
