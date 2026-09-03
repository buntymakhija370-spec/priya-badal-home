#!/usr/bin/env python3
"""Generate Atithi Hotel guest-room furniture proposal PDF for PriyaBadal Homes."""

from __future__ import annotations

import os
from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm, inch
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
    HRFlowable,
)
from reportlab.pdfgen import canvas
from PIL import Image as PILImage

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "proposals" / "atithi-hotel" / "assets"
OUT_DIR = ROOT / "proposals" / "atithi-hotel"
OUT_PDF = OUT_DIR / "Atithi_Hotel_Guest_Room_Proposal_PBH-2026-QT-1048-R3.pdf"

# Register fonts with INR / Unicode support
pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
FONT = "DejaVu"
FONT_BOLD = "DejaVu-Bold"

# Brand palette (matches commercial quotation navy + accent)
NAVY = HexColor("#0B1F3A")
NAVY_MID = HexColor("#16335A")
NAVY_SOFT = HexColor("#E8EEF5")
ACCENT = HexColor("#C45C26")
INK = HexColor("#1A2332")
MUTED = HexColor("#5A6575")
LINE = HexColor("#C9D2DE")
PAPER = HexColor("#F7F5F1")
GREEN_OK = HexColor("#2F5D4A")

PAGE_W, PAGE_H = A4
MARGIN_X = 16 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 16 * mm


def inr(amount: float) -> str:
    """Format Indian currency with grouping."""
    n = int(round(amount))
    s = str(n)
    if len(s) <= 3:
        return f"₹{s}.00"
    last3 = s[-3:]
    rest = s[:-3]
    parts = []
    while len(rest) > 2:
        parts.insert(0, rest[-2:])
        rest = rest[:-2]
    if rest:
        parts.insert(0, rest)
    return f"₹{','.join(parts)},{last3}.00"


ITEMS = [
    {
        "no": 1,
        "name": "Bed with cushioning",
        "spec": "6 × 6.5 ft platform bed with upholstered terracotta base, cushioned headboard integration, mattress-ready frame",
        "qty": "1 Unit",
        "unit": 42000,
        "zone": "Sleeping",
    },
    {
        "no": 2,
        "name": "Bed-back panels",
        "spec": "Custom headboard wall in 1 mm laminate with horizontal slats / cane niches, integrated warm LED backlight niches",
        "qty": "1 Set",
        "unit": 28000,
        "zone": "Sleeping",
    },
    {
        "no": 3,
        "name": "Bedside units",
        "spec": "Pair of floating bedside tables in 1 mm laminate with soft-close storage; phone & control panel ready",
        "qty": "2 Units",
        "unit": 18000,
        "zone": "Sleeping",
    },
    {
        "no": 4,
        "name": "Wardrobe",
        "spec": "Full-height guest wardrobe in matching 1 mm laminate finish; hanging + shelf zones, soft-close hardware",
        "qty": "1 Unit",
        "unit": 38000,
        "zone": "Storage",
    },
    {
        "no": 5,
        "name": "Luggage rack",
        "spec": "Hospitality luggage bench / rack in 1 mm laminate with protective top surface",
        "qty": "1 Unit",
        "unit": 8000,
        "zone": "Storage",
    },
    {
        "no": 6,
        "name": "TV unit",
        "spec": "Floor-to-ceiling media wall with 1 mm laminate panel, recessed TV niche, fluted console & cove lighting",
        "qty": "1 Unit",
        "unit": 22000,
        "zone": "Media",
    },
    {
        "no": 7,
        "name": "Study table",
        "spec": "Wall-mounted / built-in study desk in 1 mm laminate with light stone / marble-look top and power-data panel provision",
        "qty": "1 Unit",
        "unit": 16000,
        "zone": "Work",
    },
    {
        "no": 8,
        "name": "Chair",
        "spec": "Upholstered bucket chair in terracotta fabric with tapered timber legs",
        "qty": "1 Unit",
        "unit": 9000,
        "zone": "Work",
    },
    {
        "no": 9,
        "name": "Bar unit",
        "spec": "In-room beverage / mini-bar cabinet in 1 mm laminate with matching stone countertop & lower storage",
        "qty": "1 Unit",
        "unit": 18000,
        "zone": "Refreshment",
    },
    {
        "no": 10,
        "name": "Hanging bar",
        "spec": "Ceiling-suspended black metal dual-tier shelving with integrated warm downlight",
        "qty": "1 Unit",
        "unit": 7500,
        "zone": "Refreshment",
    },
    {
        "no": 11,
        "name": "Dressing mirror (aluminium frame)",
        "spec": "Full-height / oval dressing mirror with slim aluminium / black metal frame",
        "qty": "1 Unit",
        "unit": 8500,
        "zone": "Dressing",
    },
    {
        "no": 12,
        "name": "Sofa — 2 seater",
        "spec": "Compact loveseat in cream / oatmeal upholstery, hospitality-grade foam",
        "qty": "1 Unit",
        "unit": 28000,
        "zone": "Lounge",
    },
    {
        "no": 13,
        "name": "Sofa back panels",
        "spec": "Vertical fluted / ribbed feature wall panel in 1 mm laminate behind lounge seating",
        "qty": "1 Set",
        "unit": 12000,
        "zone": "Lounge",
    },
    {
        "no": 14,
        "name": "Center table (without stone)",
        "spec": "Round center table base & structure; stone / marble top by client or optional add-on",
        "qty": "1 Unit",
        "unit": 8000,
        "zone": "Lounge",
    },
    {
        "no": 15,
        "name": "Bathroom vanity",
        "spec": "Custom bathroom vanity carcass & shutters in 1 mm laminate; countertop-ready structure",
        "qty": "1 Unit",
        "unit": 16000,
        "zone": "Bathroom",
    },
    {
        "no": 16,
        "name": "Curtains pelmet",
        "spec": "Window pelmet box in 1 mm laminate for sheer + blackout curtain tracks (fabric by client / separate)",
        "qty": "1 Unit",
        "unit": 6000,
        "zone": "Window",
    },
]

assert sum(i["unit"] for i in ITEMS) == 285000


class ColoredRect(Flowable):
    def __init__(self, width, height, fill, radius=0):
        super().__init__()
        self.width = width
        self.height = height
        self.fill = fill
        self.radius = radius

    def draw(self):
        self.canv.setFillColor(self.fill)
        if self.radius:
            self.canv.roundRect(0, 0, self.width, self.height, self.radius, fill=1, stroke=0)
        else:
            self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)


class SectionBanner(Flowable):
    def __init__(self, text, width, accent=True):
        super().__init__()
        self.text = text
        self.width = width
        self.height = 11 * mm
        self.accent = accent

    def draw(self):
        c = self.canv
        c.setFillColor(NAVY)
        c.roundRect(0, 0, self.width, self.height, 2, fill=1, stroke=0)
        if self.accent:
            c.setFillColor(ACCENT)
            c.rect(0, 0, 3.2 * mm, self.height, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 10)
        c.drawString(6 * mm, 3.6 * mm, self.text.upper())


class FooterCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self._page_label = kwargs.pop("page_label", "PriyaBadal Homes • Commercial Proposal")
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_page_decorations(self, page_count):
        page = self._pageNumber
        # Skip heavy chrome on cover (page 1)
        if page == 1:
            self.setFillColor(MUTED)
            self.setFont(FONT, 7)
            self.drawCentredString(PAGE_W / 2, 8 * mm, f"Confidential • For Atithi Hotel, Ujjain • Page {page} of {page_count}")
            return

        # Top thin rule
        self.setStrokeColor(LINE)
        self.setLineWidth(0.4)
        self.line(MARGIN_X, PAGE_H - 10 * mm, PAGE_W - MARGIN_X, PAGE_H - 10 * mm)
        self.setFillColor(NAVY)
        self.setFont(FONT_BOLD, 7.5)
        self.drawString(MARGIN_X, PAGE_H - 8 * mm, "PRIYABADAL HOMES")
        self.setFillColor(MUTED)
        self.setFont(FONT, 7)
        self.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 8 * mm, "PBH/2026/QT-1048-R3")

        # Footer
        self.setStrokeColor(LINE)
        self.line(MARGIN_X, 11 * mm, PAGE_W - MARGIN_X, 11 * mm)
        self.setFillColor(MUTED)
        self.setFont(FONT, 7)
        self.drawString(MARGIN_X, 6.5 * mm, "Atithi Hotel, Ujjain • Guest Room Furniture Package")
        self.drawRightString(PAGE_W - MARGIN_X, 6.5 * mm, f"Page {page} of {page_count}")


def styles():
    ss = getSampleStyleSheet()
    ss.add(
        ParagraphStyle(
            name="CoverBrand",
            fontName=FONT_BOLD,
            fontSize=26,
            leading=30,
            textColor=white,
            alignment=TA_LEFT,
            spaceAfter=2,
        )
    )
    ss.add(
        ParagraphStyle(
            name="CoverTag",
            fontName=FONT,
            fontSize=8.5,
            leading=12,
            textColor=HexColor("#F0C9A8"),
            alignment=TA_LEFT,
            spaceAfter=8,
        )
    )
    ss.add(
        ParagraphStyle(
            name="CoverTitle",
            fontName=FONT_BOLD,
            fontSize=20,
            leading=24,
            textColor=white,
            alignment=TA_LEFT,
            spaceAfter=6,
        )
    )
    ss.add(
        ParagraphStyle(
            name="CoverSub",
            fontName=FONT,
            fontSize=10,
            leading=14,
            textColor=HexColor("#D7E0EC"),
            alignment=TA_LEFT,
        )
    )
    ss.add(
        ParagraphStyle(
            name="H1",
            fontName=FONT_BOLD,
            fontSize=16,
            leading=20,
            textColor=NAVY,
            spaceBefore=2,
            spaceAfter=6,
        )
    )
    ss.add(
        ParagraphStyle(
            name="H2",
            fontName=FONT_BOLD,
            fontSize=11,
            leading=14,
            textColor=NAVY,
            spaceBefore=4,
            spaceAfter=4,
        )
    )
    ss.add(
        ParagraphStyle(
            name="Body",
            fontName=FONT,
            fontSize=9,
            leading=13,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=4,
        )
    )
    ss.add(
        ParagraphStyle(
            name="BodySmall",
            fontName=FONT,
            fontSize=8,
            leading=11,
            textColor=MUTED,
            alignment=TA_LEFT,
        )
    )
    ss.add(
        ParagraphStyle(
            name="MetaLabel",
            fontName=FONT,
            fontSize=7.5,
            leading=9,
            textColor=MUTED,
        )
    )
    ss.add(
        ParagraphStyle(
            name="MetaValue",
            fontName=FONT_BOLD,
            fontSize=9,
            leading=12,
            textColor=NAVY,
        )
    )
    ss.add(
        ParagraphStyle(
            name="CellName",
            fontName=FONT_BOLD,
            fontSize=8,
            leading=10,
            textColor=INK,
        )
    )
    ss.add(
        ParagraphStyle(
            name="CellSpec",
            fontName=FONT,
            fontSize=7,
            leading=9.5,
            textColor=MUTED,
        )
    )
    ss.add(
        ParagraphStyle(
            name="CellCenter",
            fontName=FONT,
            fontSize=8,
            leading=10,
            textColor=INK,
            alignment=TA_CENTER,
        )
    )
    ss.add(
        ParagraphStyle(
            name="CellRight",
            fontName=FONT_BOLD,
            fontSize=8,
            leading=10,
            textColor=NAVY,
            alignment=TA_RIGHT,
        )
    )
    ss.add(
        ParagraphStyle(
            name="Caption",
            fontName=FONT,
            fontSize=8,
            leading=10,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceBefore=3,
        )
    )
    ss.add(
        ParagraphStyle(
            name="TermTitle",
            fontName=FONT_BOLD,
            fontSize=8.5,
            leading=11,
            textColor=NAVY,
        )
    )
    ss.add(
        ParagraphStyle(
            name="TermBody",
            fontName=FONT,
            fontSize=8,
            leading=11,
            textColor=INK,
        )
    )
    return ss


def fit_image(path: Path, max_w: float, max_h: float) -> Image:
    with PILImage.open(path) as im:
        w, h = im.size
    ratio = min(max_w / w, max_h / h)
    return Image(str(path), width=w * ratio, height=h * ratio)


def cover_page(story, S, content_w):
    hero = ASSETS / "view-suite-overview.jpg"

    price_style = ParagraphStyle(
        "PriceBig",
        fontName=FONT_BOLD,
        fontSize=15,
        leading=18,
        textColor=NAVY,
    )
    price_note = ParagraphStyle(
        "PriceNote",
        fontName=FONT,
        fontSize=7.5,
        leading=10,
        textColor=MUTED,
    )

    header_inner = [
        Paragraph("PRIYABADAL HOMES", S["CoverBrand"]),
        Paragraph(
            "ARCHITECTURAL JOINERY &amp; CUSTOM HOSPITALITY FURNITURE",
            S["CoverTag"],
        ),
        Spacer(1, 2 * mm),
        Paragraph("CLIENT PROPOSAL &amp; COMMERCIAL QUOTATION", S["CoverTitle"]),
        Paragraph(
            "Guest Room Furniture Package &nbsp;•&nbsp; Atithi Hotel, Ujjain<br/>"
            "Ref: PBH/2026/QT-1048-R3 &nbsp;•&nbsp; 03 September 2026 &nbsp;•&nbsp; Validity: 30 Days",
            S["CoverSub"],
        ),
    ]

    header_t = Table([[header_inner]], colWidths=[content_w])
    header_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("LEFTPADDING", (0, 0), (-1, -1), 8 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 8 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8 * mm),
            ]
        )
    )
    story.append(header_t)
    story.append(Spacer(1, 3 * mm))
    story.append(ColoredRect(content_w, 2 * mm, ACCENT))
    story.append(Spacer(1, 4 * mm))

    meta = [
        [
            Paragraph("ISSUED TO", S["MetaLabel"]),
            Paragraph("PROJECT", S["MetaLabel"]),
            Paragraph("EXECUTION", S["MetaLabel"]),
            Paragraph("LEAD TIME", S["MetaLabel"]),
        ],
        [
            Paragraph("Atithi Hotel<br/>Management &amp; Procurement<br/>Ujjain, M.P., India", S["MetaValue"]),
            Paragraph("Guest Room<br/>Furniture Package<br/>16 custom items", S["MetaValue"]),
            Paragraph("Custom<br/>Manufacturing<br/>Client design basis", S["MetaValue"]),
            Paragraph("2 Months<br/>from confirmed<br/>order date", S["MetaValue"]),
        ],
    ]
    meta_t = Table(meta, colWidths=[content_w / 4] * 4)
    meta_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY_SOFT),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("TOPPADDING", (0, 0), (-1, 0), 2.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 0.5 * mm),
                ("TOPPADDING", (0, 1), (-1, 1), 0.5 * mm),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 3 * mm),
            ]
        )
    )
    story.append(meta_t)
    story.append(Spacer(1, 4 * mm))

    story.append(fit_image(hero, content_w, 78 * mm))
    story.append(
        Paragraph(
            "Proposed guest suite atmosphere — lounge, sleeping, and work zones in a warm hospitality palette.",
            S["Caption"],
        )
    )
    story.append(Spacer(1, 4 * mm))

    left_cell = [
        Paragraph("TOTAL ROOM PACKAGE (16 ITEMS)", S["MetaLabel"]),
        Spacer(1, 1.2 * mm),
        Paragraph(inr(285000), price_style),
        Paragraph("Exclusive of applicable GST / taxes", price_note),
    ]
    right_cell = [
        Paragraph("AMOUNT IN WORDS", S["MetaLabel"]),
        Spacer(1, 1.2 * mm),
        Paragraph(
            "Indian Rupees Two Lakh Eighty-Five Thousand Only (Plus Applicable Tax)",
            S["MetaValue"],
        ),
    ]
    price_t = Table([[left_cell, right_cell]], colWidths=[content_w * 0.42, content_w * 0.58])
    price_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FFF6F0")),
                ("BOX", (0, 0), (-1, -1), 1.2, ACCENT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("LINEAFTER", (0, 0), (0, 0), 0.5, HexColor("#E8C4B0")),
            ]
        )
    )
    story.append(price_t)
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "Studio &amp; Facility: Indore, Madhya Pradesh &nbsp;•&nbsp; +91 8109949649",
            S["Caption"],
        )
    )
    story.append(PageBreak())


def about_page(story, S, content_w):
    story.append(SectionBanner("1  •  Project Overview", content_w))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Guest Room Furniture Package — Atithi Hotel", S["H1"]))
    story.append(
        Paragraph(
            "PriyaBadal Homes is pleased to submit this client proposal and commercial quotation for the "
            "complete guest-room joinery and custom hospitality furniture package for <b>Atithi Hotel, Ujjain</b>. "
            "All items will be custom-manufactured to the client’s proposed design, with finishes coordinated "
            "across sleeping, lounge, media, work, refreshment, and bathroom zones.",
            S["Body"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("Design Intent", S["H2"]))
    story.append(
        Paragraph(
            "A warm, contemporary hospitality suite finished in <b>1 mm laminate</b> (not veneer), soft terracotta upholstery, "
            "stone-look worktops, matte black metal accents, and integrated LED cove lighting. The package "
            "delivers a cohesive room identity suitable for premium guest experience and efficient housekeeping.",
            S["Body"],
        )
    )

    story.append(Spacer(1, 3 * mm))
    story.append(SectionBanner("2  •  Scope of Supply", content_w))
    story.append(Spacer(1, 3 * mm))

    scope_rows = [
        [
            Paragraph("<b>INCLUDED</b>", S["CellName"]),
            Paragraph("<b>EXCLUDED / BY CLIENT</b>", S["CellName"]),
        ],
        [
            Paragraph(
                "• Custom carcass, shutters &amp; frames as listed<br/>"
                "• Specified 1 mm laminate finishes &amp; fabrics for furniture<br/>"
                "• Soft-close hardware &amp; installation of supplied items<br/>"
                "• On-site fitting within agreed lead time<br/>"
                "• Design coordination to client drawings",
                S["BodySmall"],
            ),
            Paragraph(
                "• Civil, electrical, AC &amp; plumbing works<br/>"
                "• Mattress, bedding &amp; soft furnishings (curtains fabric)<br/>"
                "• TV, appliances, kettle &amp; guest accessories<br/>"
                "• Stone top for center table (quoted without stone)<br/>"
                "• GST / statutory taxes (extra as applicable)",
                S["BodySmall"],
            ),
        ],
    ]
    scope_t = Table(scope_rows, colWidths=[content_w / 2] * 2)
    scope_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), HexColor("#E8F2EC")),
                ("BACKGROUND", (1, 0), (1, 0), HexColor("#F5F0EA")),
                ("BACKGROUND", (0, 1), (0, 1), HexColor("#F4FAF6")),
                ("BACKGROUND", (1, 1), (1, 1), HexColor("#FAF7F3")),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    story.append(scope_t)
    story.append(Spacer(1, 5 * mm))

    story.append(SectionBanner("3  •  Material & Finish Direction", content_w))
    story.append(Spacer(1, 3 * mm))
    mats = [
        ["Element", "Proposed Direction"],
        ["Primary finish", "1 mm laminate on all exposed panels, wardrobe & cabinetry (veneer not included)"],
        ["Stone / tops", "Light beige marble / travertine look for desk & bar counter"],
        ["Upholstery", "Terracotta bed base & chair; cream/oatmeal sofa fabric"],
        ["Metal", "Matte black for hanging bar, pendants & mirror frames"],
        ["Lighting niches", "Warm LED cove / backlight integrated with joinery (driver by electrical)"],
        ["Flooring note", "Dark or light timber flooring by client — furniture laminate finishes coordinate"],
    ]
    mat_data = []
    for i, (a, b) in enumerate(mats):
        if i == 0:
            mat_data.append(
                [
                    Paragraph(f"<b>{a}</b>", ParagraphStyle("th", parent=S["CellCenter"], textColor=white)),
                    Paragraph(f"<b>{b}</b>", ParagraphStyle("th2", parent=S["CellCenter"], textColor=white)),
                ]
            )
        else:
            mat_data.append(
                [
                    Paragraph(a, S["CellName"]),
                    Paragraph(b, S["CellSpec"]),
                ]
            )
    mat_t = Table(mat_data, colWidths=[content_w * 0.28, content_w * 0.72])
    mat_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("BACKGROUND", (0, 1), (-1, 1), white),
                ("BACKGROUND", (0, 2), (-1, 2), NAVY_SOFT),
                ("BACKGROUND", (0, 3), (-1, 3), white),
                ("BACKGROUND", (0, 4), (-1, 4), NAVY_SOFT),
                ("BACKGROUND", (0, 5), (-1, 5), white),
                ("BACKGROUND", (0, 6), (-1, 6), NAVY_SOFT),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm),
            ]
        )
    )
    story.append(mat_t)
    story.append(PageBreak())


def gallery_page(story, S, content_w):
    story.append(SectionBanner("4  •  Design Visuals — Proposed Room Views", content_w))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "The following visuals illustrate the intended guest-room composition. Final finishes and dimensions "
            "will follow client-approved drawings and site measurements.",
            S["Body"],
        )
    )
    story.append(Spacer(1, 2 * mm))

    views = [
        (
            ASSETS / "view-media-bar.jpg",
            "View A — Media wall, study desk & beverage station",
            "TV feature panel with fluted console, floating stone-top desk, terracotta chair, and mini-bar with hanging shelf.",
        ),
        (
            ASSETS / "view-bed-lounge.jpg",
            "View B — Sleeping zone with lounge seating",
            "Upholstered bed, laminate headboard with LED backlight, 2-seater sofa, round center table, and pendant lighting.",
        ),
    ]

    for path, title, caption in views:
        block = []
        block.append(Paragraph(title, S["H2"]))
        block.append(fit_image(path, content_w, 78 * mm))
        block.append(Paragraph(caption, S["Caption"]))
        block.append(Spacer(1, 4 * mm))
        story.append(KeepTogether(block))

    story.append(PageBreak())

    # Second gallery page
    story.append(SectionBanner("4  •  Design Visuals (continued)", content_w))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("View C — Full suite overview", S["H2"]))
    story.append(fit_image(ASSETS / "view-suite-overview.jpg", content_w, 88 * mm))
    story.append(
        Paragraph(
            "Integrated cane / laminate bed wall, floating bedside units, lounge with fluted back panel, "
            "and floor-to-ceiling window treatments with pelmet.",
            S["Caption"],
        )
    )
    story.append(Spacer(1, 6 * mm))

    # Zone map
    story.append(Paragraph("Functional Zoning Covered by This Package", S["H2"]))
    zones = [
        ["Zone", "Key Products"],
        ["Sleeping", "Bed, bed-back panels, bedside units (×2)"],
        ["Storage / Entry", "Wardrobe, luggage rack, dressing mirror"],
        ["Media & Work", "TV unit, study table, chair"],
        ["Refreshment", "Bar unit, hanging bar"],
        ["Lounge", "Sofa 2-seater, sofa back panels, center table"],
        ["Bathroom / Window", "Bathroom vanity, curtains pelmet"],
    ]
    zdata = []
    for i, (a, b) in enumerate(zones):
        if i == 0:
            zdata.append(
                [
                    Paragraph(f"<b>{a}</b>", ParagraphStyle("zh", parent=S["CellCenter"], textColor=white)),
                    Paragraph(f"<b>{b}</b>", ParagraphStyle("zh2", parent=S["CellCenter"], textColor=white)),
                ]
            )
        else:
            zdata.append([Paragraph(a, S["CellName"]), Paragraph(b, S["CellSpec"])])
    zt = Table(zdata, colWidths=[content_w * 0.28, content_w * 0.72])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm),
    ]
    for r in range(1, len(zones)):
        if r % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, r), (-1, r), NAVY_SOFT))
    zt.setStyle(TableStyle(style_cmds))
    story.append(zt)
    story.append(PageBreak())


def quotation_pages(story, S, content_w):
    story.append(SectionBanner("5  •  Schedule of Items — Guest Room Package", content_w))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "Quote Ref: <b>PBH/2026/QT-1048-R3</b> &nbsp;|&nbsp; Date: <b>03 September 2026</b> &nbsp;|&nbsp; "
            "Validity: <b>30 Days</b> &nbsp;|&nbsp; Currency: <b>INR</b>",
            S["BodySmall"],
        )
    )
    story.append(
        Paragraph(
            "The following items are included in the <b>complete guest room package</b>. "
            "Pricing is quoted as a <b>single whole-room package</b> only (not item-wise).",
            S["Body"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    header = [
        Paragraph("<b>#</b>", ParagraphStyle("h", parent=S["CellCenter"], textColor=white)),
        Paragraph("<b>Item &amp; Specification</b>", ParagraphStyle("h2", parent=S["CellCenter"], textColor=white)),
        Paragraph("<b>Zone</b>", ParagraphStyle("h3", parent=S["CellCenter"], textColor=white)),
        Paragraph("<b>Qty</b>", ParagraphStyle("h4", parent=S["CellCenter"], textColor=white)),
    ]

    def build_item_rows(items):
        rows = [header]
        for it in items:
            name_block = [
                Paragraph(it["name"], S["CellName"]),
                Paragraph(it["spec"], S["CellSpec"]),
            ]
            rows.append(
                [
                    Paragraph(str(it["no"]), S["CellCenter"]),
                    name_block,
                    Paragraph(it["zone"], S["CellCenter"]),
                    Paragraph(it["qty"], S["CellCenter"]),
                ]
            )
        return rows

    col_w = [
        content_w * 0.07,
        content_w * 0.58,
        content_w * 0.18,
        content_w * 0.17,
    ]

    def table_style(nrows):
        cmds = [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 2.2 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2.2 * mm),
            ("TOPPADDING", (0, 0), (-1, 0), 2.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 2.5 * mm),
            ("TOPPADDING", (0, 1), (-1, -1), 2 * mm),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 2 * mm),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 0), (3, -1), "CENTER"),
        ]
        for r in range(1, nrows):
            if r % 2 == 0:
                cmds.append(("BACKGROUND", (0, r), (-1, r), NAVY_SOFT))
            else:
                cmds.append(("BACKGROUND", (0, r), (-1, r), white))
        return TableStyle(cmds)

    # All 16 items in one schedule (no per-item amounts)
    rows = build_item_rows(ITEMS)
    t = Table(rows, colWidths=col_w, repeatRows=1)
    t.setStyle(table_style(len(rows)))
    story.append(t)
    story.append(Spacer(1, 5 * mm))

    # Financial summary — whole package only
    story.append(SectionBanner("6  •  Package Pricing (Whole Room)", content_w))
    story.append(Spacer(1, 3 * mm))

    fin = [
        [
            Paragraph("<b>Description</b>", ParagraphStyle("f1", parent=S["CellCenter"], textColor=white)),
            Paragraph("<b>Amount</b>", ParagraphStyle("f2", parent=S["CellCenter"], textColor=white)),
        ],
        [
            Paragraph("Complete Guest Room Furniture Package (all 16 items as listed above)", S["CellName"]),
            Paragraph(inr(285000), S["CellRight"]),
        ],
        [
            Paragraph("Applicable Taxes (GST)", S["CellName"]),
            Paragraph("Extra as applicable", S["CellRight"]),
        ],
        [
            Paragraph("<b>Total Package Price (Exclusive of Tax)</b>", S["CellName"]),
            Paragraph(f"<b>{inr(285000)}</b>", S["CellRight"]),
        ],
        [
            Paragraph(
                "<b>Amount in Words:</b> Indian Rupees Two Lakh Eighty-Five Thousand Only (Plus Applicable Tax)",
                S["CellSpec"],
            ),
            Paragraph("", S["CellSpec"]),
        ],
    ]
    fin_t = Table(fin, colWidths=[content_w * 0.72, content_w * 0.28])
    fin_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("BACKGROUND", (0, 1), (-1, 1), white),
                ("BACKGROUND", (0, 2), (-1, 2), NAVY_SOFT),
                ("BACKGROUND", (0, 3), (-1, 3), HexColor("#FFF6F0")),
                ("BACKGROUND", (0, 4), (-1, 4), HexColor("#F4F7FB")),
                ("SPAN", (0, 4), (1, 4)),
                ("BOX", (0, 0), (-1, -1), 0.8, NAVY),
                ("INNERGRID", (0, 0), (-1, 3), 0.35, LINE),
                ("LINEBELOW", (0, 4), (-1, 4), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    story.append(fin_t)
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "This quotation is for <b>one complete guest room package</b> as a whole. "
            "Individual item rates are not quoted separately. Multi-room project pricing "
            "can be extended on the same specification upon confirmation of room count and final drawings.",
            S["BodySmall"],
        )
    )
    story.append(Spacer(1, 6 * mm))
    # Continue into terms on the same page when space allows (no forced page break)


def terms_page(story, S, content_w):
    story.append(SectionBanner("7  •  Terms & Conditions", content_w))
    story.append(Spacer(1, 4 * mm))

    terms = [
        (
            "1. Design Compliance",
            "All items will be manufactured according to the design proposed / approved by the client. "
            "Any design change after production start may revise cost and lead time.",
        ),
        (
            "2. Payment Terms",
            "50% advance at the time of order confirmation &nbsp;|&nbsp; 25% during production "
            "&nbsp;|&nbsp; 25% during installation / before handover.",
        ),
        (
            "3. Taxes",
            "Quoted amount is exclusive of applicable statutory taxes / GST, which will be charged extra as applicable.",
        ),
        (
            "4. Lead Time",
            "Approximately 2 months from the date of confirmed order, advance receipt, and final drawing approval.",
        ),
        (
            "5. Site Readiness",
            "Client shall ensure clear access, completed civil/electrical readiness, and uninterrupted working hours "
            "for installation. Delays attributable to site conditions may shift the handover schedule.",
        ),
        (
            "6. Validity",
            "This quotation remains valid for 30 days from 03 September 2026 unless extended in writing by PriyaBadal Homes.",
        ),
        (
            "7. Variation / Extra Work",
            "Items outside the listed 16-product schedule, additional rooms, or material upgrades will be quoted separately.",
        ),
    ]

    for title, body in terms:
        block = []
        block.append(Paragraph(title, S["TermTitle"]))
        block.append(Paragraph(body, S["TermBody"]))
        block.append(Spacer(1, 2.5 * mm))
        story.append(KeepTogether(block))

    story.append(Spacer(1, 3 * mm))
    story.append(SectionBanner("8  •  Acceptance & Confirmation", content_w))
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "By signing below, the client accepts this proposal and commercial quotation "
            "<b>PBH/2026/QT-1048-R3</b> for the Guest Room Furniture Package totaling "
            f"<b>{inr(285000)}</b> (exclusive of applicable taxes).",
            S["Body"],
        )
    )
    story.append(Spacer(1, 8 * mm))

    sig = [
        [
            Paragraph("<b>Accepted &amp; Confirmed By</b>", S["CellName"]),
            Paragraph("<b>For PriyaBadal Homes</b>", S["CellName"]),
        ],
        [
            Paragraph(
                "Authorized Signatory<br/>Atithi Hotel, Ujjain<br/><br/><br/><br/>"
                "Name: _______________________________<br/><br/>"
                "Designation: _________________________<br/><br/>"
                "Date: _______________________________<br/><br/>"
                "Signature / Stamp: ___________________",
                S["BodySmall"],
            ),
            Paragraph(
                "Authorized Signatory<br/>PriyaBadal Homes, Indore (M.P.)<br/><br/><br/><br/>"
                "Name: _______________________________<br/><br/>"
                "Contact: +91 8109949649<br/><br/>"
                "Date: _______________________________<br/><br/>"
                "Signature / Stamp: ___________________",
                S["BodySmall"],
            ),
        ],
    ]
    sig_t = Table(sig, colWidths=[content_w / 2] * 2, rowHeights=[8 * mm, 55 * mm])
    sig_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), NAVY_SOFT),
                ("BACKGROUND", (1, 0), (1, 0), HexColor("#FFF6F0")),
                ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    story.append(sig_t)
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "Studio &amp; Facility: Indore, Madhya Pradesh &nbsp;•&nbsp; +91 8109949649<br/>"
            "Architectural Joinery &amp; Custom Hospitality Furniture",
            ParagraphStyle("foot", parent=S["Caption"], textColor=MUTED),
        )
    )


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
        title="Atithi Hotel — Guest Room Furniture Proposal | PBH/2026/QT-1048-R3",
        author="PriyaBadal Homes",
        subject="Commercial Quotation & Client Proposal — Guest Room Furniture Package",
    )
    story = []
    cover_page(story, S, content_w)
    about_page(story, S, content_w)
    gallery_page(story, S, content_w)
    quotation_pages(story, S, content_w)
    terms_page(story, S, content_w)

    doc.build(story, canvasmaker=FooterCanvas)
    print(f"Wrote {OUT_PDF}")
    print(f"Size: {OUT_PDF.stat().st_size / 1024:.1f} KB")
    return OUT_PDF


if __name__ == "__main__":
    build()
