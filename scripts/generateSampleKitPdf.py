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
OUT = ROOT / "public" / "catalogs" / "priyabadal-sample-kits-partner-v3.pdf"
# Keep legacy filename in sync so old WhatsApp links still get fresh content
OUT_LEGACY = ROOT / "public" / "catalogs" / "priyabadal-sample-kits.pdf"
DATA = ROOT / "scripts" / "sample-kit-products.json"
RANGE = ROOT / "scripts" / "sample-kit-range-showcase.json"
PUBLIC = ROOT / "public"

INK = HexColor("#152019")
INK_SOFT = HexColor("#3a4a40")
MOSS = HexColor("#4f6a58")
HONEY = HexColor("#7d5c30")
PAPER = HexColor("#f7faf8")
MIST = HexColor("#dce6df")
CARD = HexColor("#ffffff")
WARM = HexColor("#f8f1e8")
CREAM = HexColor("#e4c9a8")

WHATSAPP = "+91 81095 55863"
WA_LINK = "https://wa.me/918109555863"
SITE = "www.priyabadalhomes.com"
BRAND = "Priyabadal Homes"

# Partner captions — clear growth script for general partners
KIT_CAPTIONS = {
    "sample-kit-silaibunai": (
        "Explore Silai Bunai in your studio with real boards. No need to keep full "
        "stock — invest in this kit and earn better margin on every wall & shutter order."
    ),
    "sample-kit-wall-panels-8x8": (
        "Show 25 wall-panel looks in one kit. Clients pick faster in your showroom, "
        "you book more panel projects — without holding finished panels in stock."
    ),
    "sample-kit-mouldings-50": (
        "50 moulding samples in a box for architects and retailers. Touch-and-choose "
        "in meetings, then convert into frame & trim orders with strong partner profit."
    ),
    "sample-kit-kitchen-luxury-pu": (
        "Luxury PU kitchen kit with rack — handle-less, 3D and moulding options. "
        "Invest in the kit only; grow kitchen revenue for turnkey and studio partners."
    ),
    "sample-kit-kitchen-laminate-asa": (
        "Laminate + ASA kitchen kit for high-volume quotes. Perfect for OEMs and "
        "showrooms — more kitchen sales, no inventory of full kitchens."
    ),
    "sample-kit-wardrobe-luxury-pu": (
        "Big wardrobe shutter samples that sell the façade look. Use this kit in your "
        "studio to grow bedroom project value and protect your margin."
    ),
    "sample-kit-leather-wardrobe": (
        "Leena leather shutter kit for premium wardrobe talks. One kit investment "
        "helps your showroom quote high-value leather façades with confidence."
    ),
    "sample-kit-temple": (
        "Temple / Mandir kit for a high-value category. Display once in your studio, "
        "then convert devotion projects into steady partner revenue."
    ),
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


def format_price(p: dict) -> str:
    price = p.get("price")
    if price is None:
        return "Ask"
    mode = p.get("pricingMode") or "fixed"
    if mode == "per-sqft":
        return f"from {format_inr(price)} / sq ft"
    return format_inr(price)


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


def image_reader(img: Image.Image, quality: int = 70) -> ImageReader:
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
        truncated = len(lines) > max_lines
        lines = lines[:max_lines]
        if truncated and lines:
            last = lines[-1]
            while c.stringWidth(last + "…", font, size) > width and len(last) > 4:
                last = last[:-1]
            lines[-1] = last.rstrip() + "…"
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * leading, ln)
    return y - max(len(lines) - 1, 0) * leading


def fit_image(
    c: canvas.Canvas,
    img: Image.Image,
    x: float,
    y: float,
    box_w: float,
    box_h: float,
    quality: int = 68,
    fill: Color | None = None,
) -> None:
    if fill is not None:
        c.setFillColor(fill)
        c.rect(x, y, box_w, box_h, fill=1, stroke=0)
    iw, ih = img.size
    scale = min(box_w / iw, box_h / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(
        image_reader(img, quality),
        x + (box_w - dw) / 2,
        y + (box_h - dh) / 2,
        width=dw,
        height=dh,
        mask="auto",
    )


def footer(c: canvas.Canvas, page: int, total: int, body: str) -> None:
    w, _ = A4
    c.setStrokeColor(MIST)
    c.setLineWidth(0.5)
    c.line(16 * mm, 14 * mm, w - 16 * mm, 14 * mm)
    c.setFillColor(INK_SOFT)
    c.setFont(body, 7.5)
    c.drawString(16 * mm, 9 * mm, f"{BRAND} · Partner Sample Kit · WhatsApp {WHATSAPP}")
    c.drawRightString(w - 16 * mm, 9 * mm, f"{page} / {total}")


def cover(c: canvas.Canvas, products: list[dict], body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(HexColor("#5c3a20"))
    c.rect(0, h - 7 * mm, w, 7 * mm, fill=1, stroke=0)

    c.setFillColor(CREAM)
    c.setFont(body, 9)
    c.drawString(18 * mm, h - 22 * mm, "FOR RETAILERS · ARCHITECTS · OEMs · TURNKEY PARTNERS")

    c.setFillColor(white)
    c.setFont(bold, 24)
    c.drawString(18 * mm, h - 38 * mm, BRAND)

    c.setFillColor(CREAM)
    c.setFont(bold, 17)
    c.drawString(18 * mm, h - 50 * mm, "Sample Kit Partner Book")

    blurb = (
        "For general partners: explore our full product range without keeping full stock. "
        "Just invest in Sample Kits for your studio or showroom — show finishes, "
        "book more projects, and grow with a better profit margin."
    )
    draw_wrapped(c, blurb, 18 * mm, h - 64 * mm, w - 36 * mm, body, 10.5, 15, HexColor("#c9d6cd"), 4)

    thumbs = []
    for p in products[:4]:
        img = load_image(p["image"], 520, 700)
        if img:
            thumbs.append(img)
    if thumbs:
        gap = 4 * mm
        tw = (w - 36 * mm - gap) / 2
        th = 52 * mm
        y0 = h - 88 * mm
        for i, img in enumerate(thumbs[:4]):
            col = i % 2
            row = i // 2
            x = 18 * mm + col * (tw + gap)
            y = y0 - row * (th + gap) - th
            fit_image(c, img, x, y, tw, th, 68, HexColor("#1c2a22"))

    # growth strip
    c.setFillColor(HexColor("#1c2a22"))
    c.roundRect(18 * mm, 22 * mm, w - 36 * mm, 30 * mm, 4, fill=1, stroke=0)
    c.setFillColor(CREAM)
    c.setFont(bold, 9)
    c.drawString(24 * mm, 45 * mm, "Kit investment  →  Showroom sales  →  Project revenue")
    c.setFillColor(HexColor("#c9d6cd"))
    c.setFont(body, 8.5)
    c.drawString(24 * mm, 35 * mm, f"WhatsApp {WHATSAPP}  ·  {len(products)} kits")
    c.setFont(body, 8)
    c.drawString(24 * mm, 26 * mm, WA_LINK)
    footer(c, page, total, body)


def partner_pitch(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 16)
    c.drawString(16 * mm, h - 24 * mm, "Grow with Sample Kits")
    c.setFillColor(INK_SOFT)
    c.setFont(body, 9.5)
    draw_wrapped(
        c,
        "Built for general partners who want more project flow — without warehouse risk.",
        16 * mm,
        h - 32 * mm,
        w - 32 * mm,
        body,
        9.5,
        13,
        INK_SOFT,
        2,
    )

    cards = [
        (
            "No full stock needed",
            "You do not need to keep finished goods. One Sample Kit gives your studio "
            "real boards clients can see, touch, and choose from.",
        ),
        (
            "Invest in kits, make more revenue",
            "Your only investment is the kit. When a client selects a look, you place "
            "the live project order — kitchen, wardrobe, panel, Silai, or temple.",
        ),
        (
            "Better profit margin",
            "Present premium looks early and quote with confidence. Retailers, "
            "architects, OEMs, and turnkey partners grow margin without warehouse risk.",
        ),
        (
            "Studio & showroom growth",
            "Use kits in meetings and display walls. Same finishes power our live "
            "product range on the next pages — explore more, sell more.",
        ),
    ]

    y = h - 48 * mm
    for title, text in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(MIST)
        c.roundRect(16 * mm, y - 32 * mm, w - 32 * mm, 34 * mm, 5, fill=1, stroke=1)
        c.setFillColor(HONEY)
        c.setFont(bold, 11)
        c.drawString(22 * mm, y - 10 * mm, title)
        draw_wrapped(c, text, 22 * mm, y - 18 * mm, w - 44 * mm, body, 9, 12.5, INK_SOFT, 3)
        y -= 38 * mm

    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(16 * mm, 28 * mm, "Next: pick the kits that match your studio focus.")
    c.setFont(body, 9)
    c.setFillColor(MOSS)
    c.drawString(16 * mm, 20 * mm, f"Click WhatsApp {WHATSAPP} · we guide kit + live order mix")
    footer(c, page, total, body)


def overview(c: canvas.Canvas, products: list[dict], body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 15)
    c.drawString(16 * mm, h - 22 * mm, "Kit investment menu")
    c.setFillColor(INK_SOFT)
    c.setFont(body, 9)
    c.drawString(
        16 * mm,
        h - 29 * mm,
        "Kit MRP = display set for your showroom · Live price = catalogue start for project orders",
    )

    y = h - 40 * mm
    c.setFillColor(INK)
    c.roundRect(14 * mm, y - 2 * mm, w - 28 * mm, 10 * mm, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(bold, 8)
    c.drawString(17 * mm, y + 1.5 * mm, "SAMPLE KIT")
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
        name_max = 90 * mm
        if c.stringWidth(name, bold, 8.5) > name_max:
            while c.stringWidth(name + "…", bold, 8.5) > name_max and len(name) > 8:
                name = name[:-1]
            name = name.rstrip() + "…"
        c.drawString(17 * mm, y - 2 * mm, name)
        c.setFont(body, 8.5)
        c.setFillColor(HONEY)
        c.drawString(110 * mm, y - 2 * mm, format_inr(p["price"]))
        c.setFillColor(MOSS)
        live = p.get("liveFrom") or "—"
        # Short display labels for the menu table (full text stays on kit pages)
        short_live = {
            "₹300 per piece · 8 ft length": "₹300 / pc · 8 ft",
            "₹600 / sq ft": "₹600 / sq ft",
        }.get(live, live)
        live_max = 48 * mm
        if c.stringWidth(short_live, body, 8.5) > live_max:
            while c.stringWidth(short_live + "…", body, 8.5) > live_max and len(short_live) > 6:
                short_live = short_live[:-1]
            short_live = short_live.rstrip() + "…"
        c.drawRightString(w - 17 * mm, y - 2 * mm, short_live)
        y -= row_h

    y -= 4 * mm
    c.setFillColor(CARD)
    c.setStrokeColor(MIST)
    c.roundRect(14 * mm, 22 * mm, w - 28 * mm, y - 22 * mm - 2 * mm, 5, fill=1, stroke=1)
    c.setFillColor(MOSS)
    c.setFont(bold, 10)
    c.drawString(20 * mm, y - 12 * mm, "Partner tip")
    tip = (
        "Start with 1–2 kits for your studio (kitchen / wardrobe / panels). "
        "Explore our product range with clients from the kit — then book live project "
        f"orders on WhatsApp {WHATSAPP}. No full stock required."
    )
    draw_wrapped(c, tip, 20 * mm, y - 22 * mm, w - 40 * mm, body, 9, 12.5, INK_SOFT, 5)
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

    c.setFillColor(INK)
    c.setFont(bold, 11)
    c.drawString(16 * mm, h - 16 * mm, BRAND)
    c.setFillColor(HONEY)
    c.setFont(body, 8.5)
    c.drawRightString(w - 16 * mm, h - 16 * mm, f"Partner kit  {index}/{total_kits}")
    c.setStrokeColor(MIST)
    c.setLineWidth(0.6)
    c.line(16 * mm, h - 19 * mm, w - 16 * mm, h - 19 * mm)

    photo_top = h - 24 * mm
    photo_h = 100 * mm
    photo_w = w - 32 * mm
    img = load_image(p["image"], 1000, 1200)
    if img:
        fit_image(c, img, 16 * mm, photo_top - photo_h, photo_w, photo_h, 74, HexColor("#ece7df"))
    else:
        c.setFillColor(HexColor("#ece7df"))
        c.roundRect(16 * mm, photo_top - photo_h, photo_w, photo_h, 4, fill=1, stroke=0)

    card_top = photo_top - photo_h - 5 * mm
    card_bottom = 18 * mm
    card_h = card_top - card_bottom
    c.setFillColor(CARD)
    c.setStrokeColor(MIST)
    c.roundRect(16 * mm, card_bottom, w - 32 * mm, card_h, 5, fill=1, stroke=1)

    x = 22 * mm
    tw = w - 44 * mm
    y = card_top - 10 * mm
    # Reserve strip for WhatsApp CTA so facts never collide with it
    content_floor = card_bottom + 14 * mm

    c.setFillColor(MOSS)
    c.setFont(body, 8)
    c.drawString(x, y, (p.get("sku") or "") + "  ·  Showroom display kit")

    y -= 14
    c.setFillColor(INK)
    y = draw_wrapped(c, p["name"], x, y, tw, bold, 12, 15, INK, max_lines=2)

    # Clear gap below title baseline before price (avoids title/price overlap)
    y -= 18
    c.setFillColor(HONEY)
    c.setFont(bold, 14)
    price_txt = format_inr(p["price"])
    c.drawString(x, y, price_txt)
    c.setFillColor(INK_SOFT)
    c.setFont(body, 8.5)
    c.drawString(x + c.stringWidth(price_txt, bold, 14) + 5, y + 1, "kit investment")

    if p.get("liveFrom"):
        y -= 14
        c.setFillColor(MOSS)
        c.setFont(bold, 9)
        live_line = f"Live product from  {p['liveFrom']}"
        if c.stringWidth(live_line, bold, 9) > tw:
            live_line = f"Live from  {p['liveFrom']}"
        c.drawString(x, y, live_line)

    caption = KIT_CAPTIONS.get(p["id"]) or (p.get("description") or "")
    y -= 14
    y = draw_wrapped(c, caption, x, y, tw, body, 8.5, 11.5, INK_SOFT, max_lines=2)

    facts = []
    if p.get("samples"):
        facts.append(("Samples", p["samples"]))
    if p.get("includes"):
        facts.append(("Includes", p["includes"]))
    if p.get("sampleSize"):
        facts.append(("Size", p["sampleSize"]))
    if p.get("packaging"):
        facts.append(("Pack", p["packaging"]))
    if p.get("optionsShown"):
        facts.append(("Options", p["optionsShown"]))
    if p.get("hardware"):
        facts.append(("Hardware", p["hardware"]))
    if p.get("thickness"):
        facts.append(("Thickness", p["thickness"]))
    if p.get("optional"):
        facts.append(("Optional", p["optional"]))

    y -= 12
    for label, value in facts[:4]:
        if y < content_floor + 4 * mm:
            break
        c.setFillColor(HONEY)
        c.setFont(bold, 8)
        c.drawString(x, y, label)
        y = draw_wrapped(c, value, x + 26 * mm, y, tw - 26 * mm, body, 8.5, 11, INK, max_lines=2)
        y -= 11

    c.setFillColor(INK)
    c.setFont(bold, 8.5)
    c.drawString(x, card_bottom + 6 * mm, f"WhatsApp {WHATSAPP} to book this kit")
    c.setFont(body, 8)
    c.setFillColor(INK_SOFT)
    c.drawRightString(w - 22 * mm, card_bottom + 6 * mm, SITE)

    footer(c, page, total, body)


def range_page(
    c: canvas.Canvas,
    title: str,
    subtitle: str,
    products: list[dict],
    body: str,
    bold: str,
    page: int,
    total: int,
) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(bold, 14)
    c.drawString(16 * mm, h - 20 * mm, title)
    c.setFillColor(INK_SOFT)
    c.setFont(body, 9)
    draw_wrapped(c, subtitle, 16 * mm, h - 27 * mm, w - 32 * mm, body, 9, 12, INK_SOFT, 2)

    # 2x3 grid
    gap = 4 * mm
    cols, rows = 3, 2
    grid_top = h - 36 * mm
    grid_bottom = 20 * mm
    grid_h = grid_top - grid_bottom
    cell_w = (w - 32 * mm - gap * (cols - 1)) / cols
    cell_h = (grid_h - gap * (rows - 1)) / rows
    img_h = cell_h - 18 * mm

    for i, p in enumerate(products[:6]):
        col = i % cols
        row = i // cols
        x = 16 * mm + col * (cell_w + gap)
        y = grid_top - (row + 1) * cell_h - row * gap
        c.setFillColor(CARD)
        c.setStrokeColor(MIST)
        c.roundRect(x, y, cell_w, cell_h, 3, fill=1, stroke=1)
        img = load_image(p["image"], 420, 420)
        if img:
            fit_image(c, img, x + 2 * mm, y + 16 * mm, cell_w - 4 * mm, img_h, 58, HexColor("#ece7df"))
        c.setFillColor(INK)
        c.setFont(bold, 7.5)
        name = p["name"]
        max_w = cell_w - 6 * mm
        if c.stringWidth(name, bold, 7.5) > max_w:
            while c.stringWidth(name + "…", bold, 7.5) > max_w and len(name) > 6:
                name = name[:-1]
            name = name.rstrip() + "…"
        c.drawString(x + 3 * mm, y + 9 * mm, name)
        c.setFillColor(HONEY)
        c.setFont(body, 7)
        c.drawString(x + 3 * mm, y + 3.5 * mm, format_price(p))

    footer(c, page, total, body)


def closing(c: canvas.Canvas, body: str, bold: str, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(HexColor("#5c3a20"))
    c.rect(0, 0, w, 18 * mm, fill=1, stroke=0)

    c.setFillColor(CREAM)
    c.setFont(body, 9)
    c.drawCentredString(w / 2, h - 28 * mm, "PARTNER GROWTH PATH")

    c.setFillColor(white)
    c.setFont(bold, 20)
    c.drawCentredString(w / 2, h - 44 * mm, "Start with kits.")
    c.drawCentredString(w / 2, h - 56 * mm, "Scale with projects.")

    pitch = (
        "Explore Priyabadal Homes products with Sample Kits. Convert studio and "
        "showroom interest into live orders. Better profit margin — "
        "you do not need to keep full stock."
    )
    draw_wrapped(c, pitch, 24 * mm, h - 72 * mm, w - 48 * mm, body, 10.5, 15, HexColor("#c9d6cd"), 4)

    steps = [
        ("01", "Choose kits", "Match kitchen, wardrobe, panels, Silai, temple to your traffic."),
        ("02", "Display & pitch", "Use boards in meetings — clients decide faster with real samples."),
        ("03", "Book live work", "WhatsApp the kit SKU + project — we support production & dispatch."),
    ]
    y = h - 105 * mm
    for num, title, text in steps:
        c.setFillColor(HexColor("#1c2a22"))
        c.roundRect(22 * mm, y - 24 * mm, w - 44 * mm, 28 * mm, 4, fill=1, stroke=0)
        c.setFillColor(CREAM)
        c.setFont(bold, 12)
        c.drawString(28 * mm, y - 8 * mm, num)
        c.setFillColor(white)
        c.setFont(bold, 11)
        c.drawString(42 * mm, y - 8 * mm, title)
        c.setFillColor(HexColor("#c9d6cd"))
        c.setFont(body, 8.5)
        draw_wrapped(c, text, 42 * mm, y - 17 * mm, w - 72 * mm, body, 8.5, 11, HexColor("#c9d6cd"), 1)
        y -= 34 * mm

    # CTA panel — generous line spacing so headline / number / link never overlap
    c.setFillColor(HexColor("#5c3a20"))
    c.roundRect(22 * mm, 24 * mm, w - 44 * mm, 58 * mm, 5, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(bold, 12)
    c.drawCentredString(w / 2, 70 * mm, "WhatsApp to become a partner")
    c.setFont(bold, 18)
    c.setFillColor(CREAM)
    c.drawCentredString(w / 2, 54 * mm, WHATSAPP)
    c.setFillColor(HexColor("#f0dcc0"))
    c.setFont(body, 8.5)
    c.drawCentredString(w / 2, 40 * mm, WA_LINK)
    c.setFont(body, 8)
    c.drawCentredString(w / 2, 30 * mm, f"{SITE}/shop/sample-kits")

    c.setFillColor(HexColor("#f0dcc0"))
    c.setFont(body, 8)
    c.drawCentredString(w / 2, 10 * mm, f"{BRAND}  ·  Sample kits for studio growth")
    c.setFillColor(HexColor("#c9b59a"))
    c.setFont(body, 8)
    c.drawRightString(w - 16 * mm, 10 * mm, f"{page} / {total}")


def unique_range_sections(showcase: dict) -> list[tuple[str, str, list[dict]]]:
    """Deduplicate by categoryId; keep first title."""
    seen: dict[str, tuple[str, list[dict]]] = {}
    order: list[str] = []
    for kit_id, block in showcase.items():
        cat = block["categoryId"]
        if cat in seen:
            continue
        seen[cat] = (block["title"], block["products"])
        order.append(cat)
    sections = []
    subtitles = {
        "silaibunai": "Same family your Silai Bunai kit sells — wall & shutter looks clients can order live.",
        "wall-panels": "Live wall-panel looks your kit helps you present — grow panel & trim project revenue.",
        "kitchmock": "KitchMock kitchen looks powered by your PU / laminate kits — quote full kitchens from the showroom.",
        "wardrobe": "Wardrobe shutter range your luxury kit opens — bedroom projects with stronger margins.",
        "leather-shutters": "Leena leather shutter range — premium upgrades from the leather kit conversation.",
        "temple": "Temple / Mandir live range — high-value projects started from your temple kit.",
    }
    for cat in order:
        title, products = seen[cat]
        sections.append((title, subtitles.get(cat, "Explore live looks from this family."), products))
    return sections


def main() -> None:
    products = json.loads(DATA.read_text())
    showcase = json.loads(RANGE.read_text()) if RANGE.exists() else {}
    sections = unique_range_sections(showcase)
    body, bold = register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    # cover + pitch + overview + kits + range sections + closing
    total = 3 + len(products) + len(sections) + 1

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("Priyabadal Homes — Sample Kit Partner Book")
    c.setAuthor("Priyabadal Homes")
    c.setSubject("Sample Kit catalogue for WhatsApp partners")

    page = 1
    cover(c, products, body, bold, page, total)
    c.showPage()
    page += 1
    partner_pitch(c, body, bold, page, total)
    c.showPage()
    page += 1
    overview(c, products, body, bold, page, total)

    for i, p in enumerate(products, start=1):
        c.showPage()
        page += 1
        kit_page(c, p, i, len(products), body, bold, page, total)

    for title, subtitle, items in sections:
        c.showPage()
        page += 1
        range_page(c, f"Explore · {title}", subtitle, items, body, bold, page, total)

    c.showPage()
    page += 1
    closing(c, body, bold, page, total)
    c.save()
    # Mirror to legacy path so older WhatsApp links also get the new file bytes
    OUT_LEGACY.write_bytes(OUT.read_bytes())

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(
        f"Wrote {OUT} (+ legacy {OUT_LEGACY.name}) "
        f"({size_mb:.2f} MB, {page} pages, {len(products)} kits, {len(sections)} range pages)"
    )


if __name__ == "__main__":
    main()
