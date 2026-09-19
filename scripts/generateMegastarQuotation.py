#!/usr/bin/env python3
"""White-label OEM bulk quotation for Megastar, Chandigarh — Silai panel pack."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
    KeepTogether,
    Flowable,
)
from reportlab.pdfgen import canvas
from PIL import Image as PILImage

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "proposals" / "megastar-chandigarh" / "assets"
OUT_DIR = ROOT / "proposals" / "megastar-chandigarh"
OUT_PDF = OUT_DIR / "Megastar_Chandigarh_WhiteLabel_Bulk_Quotation.pdf"

pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
FONT = "DejaVu"
FONT_BOLD = "DejaVu-Bold"

INK = HexColor("#1C1C1C")
MUTED = HexColor("#5E5E5E")
LINE = HexColor("#D0D0D0")
SOFT = HexColor("#F4F2EE")
ACCENT = HexColor("#3D4A3F")
ACCENT_SOFT = HexColor("#E6EBE7")
WARN = HexColor("#8A5A2B")

PAGE_W, PAGE_H = A4
MARGIN_X = 14 * mm
MARGIN_TOP = 16 * mm
MARGIN_BOTTOM = 14 * mm

# Quote meta
QUOTE_REF = "OEM/2026/MSG-CHD-001"
QUOTE_DATE = "16 September 2026"
VALIDITY = "30 Days"
CLIENT = "Megastar"
CLIENT_CITY = "Chandigarh"


class SectionBanner(Flowable):
    def __init__(self, text, width):
        super().__init__()
        self.text = text
        self.width = width
        self.height = 9.5 * mm

    def draw(self):
        c = self.canv
        c.setFillColor(ACCENT)
        c.roundRect(0, 0, self.width, self.height, 1.5, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 9)
        c.drawString(4 * mm, 3.2 * mm, self.text.upper())


class FooterCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        n = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw(n)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw(self, page_count):
        page = self._pageNumber
        self.setStrokeColor(LINE)
        self.setLineWidth(0.4)
        self.line(MARGIN_X, PAGE_H - 9 * mm, PAGE_W - MARGIN_X, PAGE_H - 9 * mm)
        self.setFillColor(MUTED)
        self.setFont(FONT, 7)
        self.drawString(MARGIN_X, PAGE_H - 7 * mm, "White-Label / OEM Bulk Supply Quotation")
        self.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 7 * mm, QUOTE_REF)

        self.line(MARGIN_X, 10 * mm, PAGE_W - MARGIN_X, 10 * mm)
        self.drawString(MARGIN_X, 5.5 * mm, f"{CLIENT} · {CLIENT_CITY} · Confidential")
        self.drawRightString(PAGE_W - MARGIN_X, 5.5 * mm, f"Page {page} of {page_count}")


def styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="H1", fontName=FONT_BOLD, fontSize=15, leading=19, textColor=INK, spaceAfter=4))
    ss.add(ParagraphStyle(name="H2", fontName=FONT_BOLD, fontSize=10.5, leading=13, textColor=ACCENT, spaceBefore=2, spaceAfter=3))
    ss.add(ParagraphStyle(name="Body", fontName=FONT, fontSize=8.5, leading=12, textColor=INK, alignment=TA_JUSTIFY, spaceAfter=3))
    ss.add(ParagraphStyle(name="Small", fontName=FONT, fontSize=7.5, leading=10, textColor=MUTED))
    ss.add(ParagraphStyle(name="MetaL", fontName=FONT, fontSize=7, leading=9, textColor=MUTED))
    ss.add(ParagraphStyle(name="MetaV", fontName=FONT_BOLD, fontSize=8.5, leading=11, textColor=INK))
    ss.add(ParagraphStyle(name="ProdName", fontName=FONT_BOLD, fontSize=10, leading=13, textColor=INK, spaceAfter=2))
    ss.add(ParagraphStyle(name="Cell", fontName=FONT, fontSize=7.5, leading=10, textColor=INK))
    ss.add(ParagraphStyle(name="CellB", fontName=FONT_BOLD, fontSize=7.5, leading=10, textColor=INK))
    ss.add(ParagraphStyle(name="CellC", fontName=FONT, fontSize=7.5, leading=10, textColor=INK, alignment=TA_CENTER))
    ss.add(ParagraphStyle(name="CellCB", fontName=FONT_BOLD, fontSize=7.5, leading=10, textColor=white, alignment=TA_CENTER))
    ss.add(ParagraphStyle(name="Note", fontName=FONT, fontSize=8, leading=11, textColor=WARN))
    ss.add(ParagraphStyle(name="Caption", fontName=FONT, fontSize=7.5, leading=9, textColor=MUTED, alignment=TA_CENTER))
    return ss


def fit_image(path: Path, max_w: float, max_h: float) -> Image:
    with PILImage.open(path) as im:
        w, h = im.size
    ratio = min(max_w / w, max_h / h)
    return Image(str(path), width=w * ratio, height=h * ratio)


def meta_table(S, content_w):
    data = [
        [
            Paragraph("ISSUED TO", S["MetaL"]),
            Paragraph("DOCUMENT", S["MetaL"]),
            Paragraph("SUPPLY MODE", S["MetaL"]),
            Paragraph("VALIDITY", S["MetaL"]),
        ],
        [
            Paragraph(f"{CLIENT}<br/>{CLIENT_CITY}, India", S["MetaV"]),
            Paragraph(f"Ref: {QUOTE_REF}<br/>Date: {QUOTE_DATE}", S["MetaV"]),
            Paragraph("Bulk production<br/>White-label / OEM", S["MetaV"]),
            Paragraph(f"{VALIDITY}<br/>from quote date", S["MetaV"]),
        ],
    ]
    t = Table(data, colWidths=[content_w / 4] * 4)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("TOPPADDING", (0, 0), (-1, 0), 2.2 * mm),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 3 * mm),
            ]
        )
    )
    return t


def spec_table(S, rows, content_w):
    """rows: list of (label, value)"""
    header = [
        Paragraph("<b>Parameter</b>", S["CellCB"]),
        Paragraph("<b>Commercial detail</b>", S["CellCB"]),
    ]
    data = [header]
    for label, value in rows:
        data.append([Paragraph(label, S["CellB"]), Paragraph(value, S["Cell"])])
    t = Table(data, colWidths=[content_w * 0.32, content_w * 0.68])
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1.8 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.8 * mm),
    ]
    for i in range(1, len(data)):
        cmds.append(("BACKGROUND", (0, i), (-1, i), ACCENT_SOFT if i % 2 == 0 else white))
    t.setStyle(TableStyle(cmds))
    return t


def product_block(story, S, content_w, *, title, code, images, rows, note=None):
    block = []
    block.append(Paragraph(title, S["ProdName"]))
    block.append(Paragraph(f"Design reference · {code}", S["Small"]))
    block.append(Spacer(1, 2 * mm))

    imgs = []
    for p in images:
        if Path(p).exists():
            imgs.append(fit_image(Path(p), content_w * 0.46, 48 * mm))
    if len(imgs) == 1:
        img_row = Table([[imgs[0]]], colWidths=[content_w])
    elif len(imgs) >= 2:
        img_row = Table([[imgs[0], imgs[1]]], colWidths=[content_w / 2, content_w / 2])
        img_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm)]))
    else:
        img_row = Paragraph("Product photography on file.", S["Small"])
    block.append(img_row)
    block.append(Spacer(1, 2.5 * mm))
    block.append(spec_table(S, rows, content_w))
    if note:
        block.append(Spacer(1, 1.5 * mm))
        block.append(Paragraph(note, S["Note"]))
    block.append(Spacer(1, 4 * mm))
    story.append(KeepTogether(block))


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    content_w = PAGE_W - 2 * MARGIN_X
    S = styles()
    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title=f"{CLIENT} Chandigarh — White-Label Bulk Quotation",
        author="OEM Supply",
        subject="Silai panel bulk / white-label quotation",
    )
    story = []

    # Cover / intro — white label: no manufacturer brand name
    story.append(Paragraph("COMMERCIAL QUOTATION", S["H1"]))
    story.append(Paragraph("White-Label · OEM Bulk Production · Silai Wall &amp; Wardrobe Panels", S["H2"]))
    story.append(
        Paragraph(
            "This quotation is issued for concept development and bulk production planning. "
            "Supply is offered on a <b>white-label / private-label</b> basis — finished goods carry the client’s brand only. "
            "Product names and photography below are design references for selection and coordination.",
            S["Body"],
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(meta_table(S, content_w))
    story.append(Spacer(1, 4 * mm))

    story.append(SectionBanner("1  •  Offer summary", content_w))
    story.append(Spacer(1, 2.5 * mm))
    story.append(
        Paragraph(
            "Five Silai panel designs are proposed for bulk order. MOQ, colourways, sizes and thickness are listed "
            "product-wise. <b>Unit commercial rates are pending your confirmation</b> — this pack locks design, size, "
            "thickness and minimum quantities for production planning.",
            S["Body"],
        )
    )
    summary = [
        [
            Paragraph("<b>#</b>", S["CellCB"]),
            Paragraph("<b>Product (design reference)</b>", S["CellCB"]),
            Paragraph("<b>Thickness</b>", S["CellCB"]),
            Paragraph("<b>Colours</b>", S["CellCB"]),
            Paragraph("<b>MOQ snapshot</b>", S["CellCB"]),
        ],
        [
            Paragraph("1", S["CellC"]),
            Paragraph("Ivory Stitched Lounge Wall Silai", S["CellB"]),
            Paragraph("4 mm", S["CellC"]),
            Paragraph("2", S["CellC"]),
            Paragraph("48 pc / colour (16×16\")", S["Cell"]),
        ],
        [
            Paragraph("2", S["CellC"]),
            Paragraph("Ivory Feather Bead Panel Silai", S["CellB"]),
            Paragraph("4 mm", S["CellC"]),
            Paragraph("Coordinated", S["CellC"]),
            Paragraph("32 pc (16×16\") — club with #1", S["Cell"]),
        ],
        [
            Paragraph("3", S["CellC"]),
            Paragraph("Cream Stitch Panel Wardrobe Silai", S["CellB"]),
            Paragraph("12 mm", S["CellC"]),
            Paragraph("3", S["CellC"]),
            Paragraph("3 sizes — see detail", S["Cell"]),
        ],
        [
            Paragraph("4", S["CellC"]),
            Paragraph("Graphite Mosaic Office Wall Silai", S["CellB"]),
            Paragraph("12 mm", S["CellC"]),
            Paragraph("3", S["CellC"]),
            Paragraph("12×12: 320 · 12×24: 160", S["Cell"]),
        ],
        [
            Paragraph("5", S["CellC"]),
            Paragraph("Denim Geometric Stitch Wardrobe Silai", S["CellB"]),
            Paragraph("TBC", S["CellC"]),
            Paragraph("TBC", S["CellC"]),
            Paragraph("Size / MOQ pending confirmation", S["Cell"]),
        ],
    ]
    st = Table(summary, colWidths=[content_w * 0.06, content_w * 0.34, content_w * 0.12, content_w * 0.14, content_w * 0.34])
    scmds = [
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 1.8 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1.8 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]
    for r in range(1, len(summary)):
        scmds.append(("BACKGROUND", (0, r), (-1, r), SOFT if r % 2 == 0 else white))
    st.setStyle(TableStyle(scmds))
    story.append(st)
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "<b>Coordination note:</b> Ivory Stitched Lounge Wall Silai + Ivory Feather Bead Panel Silai are intended "
            "as a <b>two-design clubbed wall-panel mix</b> for one coordinated lounge wall composition.",
            S["Note"],
        )
    )
    story.append(PageBreak())

    # Product 1
    story.append(SectionBanner("2  •  Product details &amp; MOQ", content_w))
    story.append(Spacer(1, 3 * mm))

    product_block(
        story,
        S,
        content_w,
        title="1. Ivory Stitched Lounge Wall Silai",
        code="Design ref · ivory-stitched-lounge-wall",
        images=[ASSETS / "ivory-stitched-lounge-01.jpg", ASSETS / "ivory-stitched-lounge-02.jpg"],
        rows=[
            ("Application", "Lounge / feature wall panel"),
            ("Size", "16″ × 16″"),
            ("Thickness", "4 mm"),
            ("Colourways", "2 colours in design"),
            ("MOQ", "48 pieces per colour"),
            ("Minimum total", "96 pieces (48 × 2 colours)"),
            ("Unit rate", "To be confirmed (bulk / white-label)"),
        ],
        note="Mix with Ivory Feather Bead Panel Silai as a coordinated two-design wall set.",
    )

    product_block(
        story,
        S,
        content_w,
        title="2. Ivory Feather Bead Panel Silai",
        code="Design ref · ivory-feather-bead-panel",
        images=[ASSETS / "ivory-feather-bead-01.jpg", ASSETS / "ivory-feather-bead-02.jpg"],
        rows=[
            ("Application", "Lounge wall panel — coordinated companion to #1"),
            ("Size", "16″ × 16″"),
            ("Thickness", "4 mm"),
            ("Colourways", "Matched / mixed with Ivory Stitched Lounge Wall Silai"),
            ("MOQ", "32 pieces"),
            ("Production note", "Club with #1 for one coordinated good wall-panel mix"),
            ("Unit rate", "To be confirmed (bulk / white-label)"),
        ],
        note="Same 4 mm lounge family as #1 — develop as a coordinated pair, not isolated SKUs.",
    )
    story.append(PageBreak())

    product_block(
        story,
        S,
        content_w,
        title="3. Cream Stitch Panel Wardrobe Silai",
        code="Design ref · cream-stitch-panel-wardrobe",
        images=[ASSETS / "cream-stitch-wardrobe-01.jpg", ASSETS / "cream-stitch-wardrobe-02.jpg"],
        rows=[
            ("Application", "Wardrobe shutter / panel — distributed in three size parts"),
            ("Thickness", "12 mm"),
            ("Available colours", "3 colourways"),
            ("Size A", "23.5″ × 11.5″ — MOQ 48 pc"),
            ("Size B", "23.5″ × 42″ — MOQ 20 pc"),
            ("Size C", "23.5″ × 36″ — MOQ 24 pc"),
            ("MOQ note", "Confirm whether listed MOQ is per colour or combined across 3 colours"),
            ("Unit rate", "To be confirmed (bulk / white-label)"),
        ],
    )

    product_block(
        story,
        S,
        content_w,
        title="4. Graphite Mosaic Office Wall Silai",
        code="Design ref · graphite-mosaic-office-wall",
        images=[ASSETS / "graphite-mosaic-01.jpg", ASSETS / "graphite-mosaic-02.jpg"],
        rows=[
            ("Application", "Office / commercial feature wall"),
            ("Thickness", "12 mm"),
            ("Available colours", "3 colourways"),
            ("Size A", "12″ × 12″ — MOQ 320 pc"),
            ("Size B", "12″ × 24″ — MOQ 160 pc"),
            ("Unit rate", "To be confirmed (bulk / white-label)"),
        ],
    )
    story.append(PageBreak())

    product_block(
        story,
        S,
        content_w,
        title="5. Denim Geometric Stitch Wardrobe Silai",
        code="Design ref · denim-geometric-stitch-wardrobe",
        images=[ASSETS / "denim-geometric-01.jpg", ASSETS / "denim-geometric-02.jpg"],
        rows=[
            ("Application", "Wardrobe shutter / panel"),
            ("Size(s)", "To be confirmed"),
            ("Thickness", "To be confirmed"),
            ("Colourways", "To be confirmed"),
            ("MOQ", "To be confirmed"),
            ("Unit rate", "To be confirmed (bulk / white-label)"),
        ],
        note="Design photography included for selection. Please share final size(s), thickness, colour count and MOQ to complete this line.",
    )

    story.append(SectionBanner("3  •  White-label &amp; commercial terms", content_w))
    story.append(Spacer(1, 3 * mm))
    terms = [
        (
            "1. White-label / private label",
            "Goods are supplied without supplier branding on product, packing labels (as agreed), or commercial paperwork face. Client brand / unmarked packing as instructed.",
        ),
        (
            "2. Design basis",
            "Photography and product names are design references only. Final stitch, fabric/leather look, and colour standards to be locked from approved samples before bulk.",
        ),
        (
            "3. MOQ",
            "Minimum order quantities stated per size / colour apply for production start. Orders below MOQ may be declined or re-quoted.",
        ),
        (
            "4. Coordinated lounge set",
            "Ivory Stitched Lounge Wall Silai and Ivory Feather Bead Panel Silai are planned as a two-design mix for one coordinated wall composition.",
        ),
        (
            "5. Pricing",
            "Bulk white-label unit rates are not printed in this revision — to be inserted after commercial confirmation. GST / freight / packing extra as applicable.",
        ),
        (
            "6. Lead time",
            "From sample approval + advance + locked colour/size matrix. Exact weeks to be confirmed with final quantity.",
        ),
        (
            "7. Validity",
            f"This quotation pack is valid for {VALIDITY} from {QUOTE_DATE}.",
        ),
    ]
    for title, body in terms:
        story.append(Paragraph(title, S["CellB"]))
        story.append(Paragraph(body, S["Body"]))
        story.append(Spacer(1, 1.5 * mm))

    story.append(Spacer(1, 4 * mm))
    story.append(SectionBanner("4  •  Acceptance", content_w))
    story.append(Spacer(1, 3 * mm))
    sig = [
        [
            Paragraph("<b>Accepted for Megastar (Chandigarh)</b>", S["CellB"]),
            Paragraph("<b>For OEM / White-Label Supply</b>", S["CellB"]),
        ],
        [
            Paragraph(
                "Name: ____________________________<br/><br/>"
                "Designation: ______________________<br/><br/>"
                "Date: _____________________________<br/><br/>"
                "Signature / Stamp: ________________",
                S["Small"],
            ),
            Paragraph(
                "Name: ____________________________<br/><br/>"
                "Date: _____________________________<br/><br/>"
                "Signature / Stamp: ________________<br/><br/>"
                "Rates annexure attached: Yes / No",
                S["Small"],
            ),
        ],
    ]
    sig_t = Table(sig, colWidths=[content_w / 2] * 2, rowHeights=[8 * mm, 42 * mm])
    sig_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), SOFT),
                ("BACKGROUND", (1, 0), (1, 0), ACCENT_SOFT),
                ("BOX", (0, 0), (-1, -1), 0.6, ACCENT),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
            ]
        )
    )
    story.append(sig_t)
    story.append(Spacer(1, 5 * mm))
    story.append(
        Paragraph(
            "Pending from client to complete commercial annexure: (a) unit rates for lines 1–5, "
            "(b) Denim Geometric size / thickness / colours / MOQ, "
            "(c) confirm Cream Stitch MOQ is per colour or total across 3 colours.",
            S["Note"],
        )
    )

    doc.build(story, canvasmaker=FooterCanvas)
    print(f"Wrote {OUT_PDF} ({OUT_PDF.stat().st_size / 1024:.1f} KB)")
    return OUT_PDF


if __name__ == "__main__":
    build()
