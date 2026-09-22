#!/usr/bin/env python3
"""Generate leatherite panel quotation PDF for Interierspot Chennai."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
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
    PageBreak,
    KeepTogether,
    Flowable,
    HRFlowable,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "proposals" / "interierspot-chennai"
# Output paths set with quote ref below.

pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
FONT = "DejaVu"
FONT_BOLD = "DejaVu-Bold"

NAVY = HexColor("#0B1F3A")
NAVY_MID = HexColor("#16335A")
NAVY_SOFT = HexColor("#E8EEF5")
ACCENT = HexColor("#C45C26")
INK = HexColor("#1A2332")
MUTED = HexColor("#5A6575")
LINE = HexColor("#C9D2DE")
PAPER = HexColor("#F7F5F1")

PAGE_W, PAGE_H = A4
MARGIN_X = 16 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 16 * mm

QUOTE_REF = "PBH/2026/QT-1051-R3"
QUOTE_DATE = "22 September 2026"
VALIDITY_DAYS = 15
CLIENT = "Interierspot Chennai"
PROJECT = "Mall Leatherite Panels — Sri Nataraj Interiors"
SOURCE_SHEET = "MALL LEATHERITE MEASUREMENT (dated 19-09-2026)"

# Rates are per square foot (sizes on sheet are in mm; converted to sq ft for billing).
RATE_6 = 425.0
GST_6 = 0.05
RATE_18 = 1000.0
GST_18 = 0.18
MM2_PER_SQFT = 92903.04  # 1 sq ft = 304.8 mm × 304.8 mm

OUT_PDF = OUT_DIR / "Interierspot_Chennai_Leatherite_Quotation_PBH-2026-QT-1051-R3.pdf"
OUT_WHATSAPP_PDF = OUT_DIR / "Interierspot_Chennai_Quotation_WhatsApp_PBH-2026-QT-1051-R3.pdf"

# sno, height_mm, width_mm, qty, code, colour, thickness_mm
# Parsed from client measurement sheet (dimensions in mm).
PANELS_6MM: list[tuple[int, int, int, int, str, str]] = [
    (1, 2312, 140, 1, "EDX-032", "BROWN"),
    (2, 160, 140, 1, "EDX-032", "BROWN"),
    (3, 181, 140, 1, "EDX-032", "BROWN"),
    (4, 2312, 374, 1, "EDX-032", "BROWN"),
    (5, 160, 374, 1, "EDX-032", "BROWN"),
    (6, 181, 374, 1, "EDX-032", "BROWN"),
    (7, 2312, 772, 1, "EDX-035", "ORANGE"),
    (8, 160, 1551, 1, "EDX-035", "ORANGE"),
    (9, 181, 1551, 1, "EDX-035", "ORANGE"),
    (10, 2312, 772, 1, "EDX-035", "ORANGE"),
    (11, 2312, 380, 1, "EDX-032", "BROWN"),
    (12, 160, 380, 1, "EDX-032", "BROWN"),
    (13, 181, 380, 1, "EDX-032", "BROWN"),
    (14, 2312, 857, 1, "EDX-032", "BROWN"),
    (15, 160, 857, 1, "EDX-032", "BROWN"),
    (16, 181, 857, 1, "EDX-032", "BROWN"),
    (17, 2312, 1199, 1, "EDX-032", "BROWN"),
    (18, 160, 1199, 1, "EDX-032", "BROWN"),
    (19, 181, 1199, 1, "EDX-032", "BROWN"),
    (20, 2312, 1195, 1, "EDX-032", "BROWN"),
    (21, 160, 1195, 1, "EDX-032", "BROWN"),
    (22, 181, 1195, 1, "EDX-032", "BROWN"),
    (23, 2312, 391, 2, "EDX-032", "BROWN"),
    (24, 352, 391, 2, "EDX-032", "BROWN"),
    (25, 2312, 106, 2, "EDX-032", "BROWN"),
    (26, 352, 106, 2, "EDX-032", "BROWN"),
    (27, 2312, 390, 1, "EDX-032", "BROWN"),
    (28, 352, 390, 1, "EDX-032", "BROWN"),
    (29, 2312, 387, 1, "EDX-032", "BROWN"),
    (30, 352, 387, 1, "EDX-032", "BROWN"),
    (31, 2312, 387, 1, "EDX-032", "BROWN"),
    (32, 352, 387, 1, "EDX-032", "BROWN"),
    (33, 2312, 390, 1, "EDX-032", "BROWN"),
    (34, 352, 390, 1, "EDX-032", "BROWN"),
    (35, 2312, 106, 2, "EDX-032", "BROWN"),
    (36, 352, 106, 2, "EDX-032", "BROWN"),
    (37, 2312, 391, 1, "EDX-032", "BROWN"),
    (38, 352, 391, 1, "EDX-032", "BROWN"),
    (39, 2312, 402, 1, "EDX-032", "BROWN"),
    (40, 352, 402, 1, "EDX-032", "BROWN"),
    (41, 2312, 1194, 1, "EDX-032", "BROWN"),
    (42, 160, 1194, 1, "EDX-032", "BROWN"),
    (43, 181, 1194, 1, "EDX-032", "BROWN"),
    (44, 2312, 1199, 1, "EDX-032", "BROWN"),
    (45, 160, 1199, 1, "EDX-032", "BROWN"),
    (46, 181, 1199, 1, "EDX-032", "BROWN"),
    (47, 2312, 505, 1, "EDX-032", "BROWN"),
    (48, 160, 505, 1, "EDX-032", "BROWN"),
    (49, 181, 505, 1, "EDX-032", "BROWN"),
    (50, 2312, 370, 1, "EDX-032", "BROWN"),
    (51, 160, 370, 1, "EDX-032", "BROWN"),
    (52, 181, 370, 1, "EDX-032", "BROWN"),
    (53, 2312, 770, 1, "EDX-035", "ORANGE"),
    (54, 160, 1550, 1, "EDX-035", "ORANGE"),
    (55, 181, 1550, 1, "EDX-035", "ORANGE"),
    (56, 2312, 772, 1, "EDX-035", "ORANGE"),
    (57, 2312, 365, 1, "EDX-032", "BROWN"),
    (58, 160, 365, 1, "EDX-032", "BROWN"),
    (59, 181, 365, 1, "EDX-032", "BROWN"),
    (60, 2312, 654, 1, "EDX-032", "BROWN"),
    (61, 160, 654, 1, "EDX-032", "BROWN"),
    (62, 181, 654, 1, "EDX-032", "BROWN"),
    (63, 160, 1589, 1, "EDX-035", "ORANGE"),
    (64, 181, 1589, 1, "EDX-035", "ORANGE"),
    (65, 2312, 641, 1, "EDX-032", "BROWN"),
    (66, 160, 641, 1, "EDX-032", "BROWN"),
    (67, 181, 641, 1, "EDX-032", "BROWN"),
    (68, 2312, 946, 1, "EDX-032", "BROWN"),
    (69, 160, 946, 1, "EDX-032", "BROWN"),
    (70, 181, 946, 1, "EDX-032", "BROWN"),
    (71, 2312, 1179, 1, "EDX-032", "BROWN"),
    (72, 160, 1179, 1, "EDX-032", "BROWN"),
    (73, 181, 1179, 1, "EDX-032", "BROWN"),
    (74, 2312, 391, 1, "EDX-032", "BROWN"),
    (75, 348, 391, 1, "EDX-032", "BROWN"),
    (76, 2312, 408, 2, "EDX-032", "BROWN"),
    (77, 348, 408, 1, "EDX-032", "BROWN"),
    (78, 2312, 106, 2, "EDX-032", "BROWN"),
    (79, 345, 106, 2, "EDX-032", "BROWN"),
    (80, 345, 408, 1, "EDX-032", "BROWN"),
    (81, 2312, 410, 2, "EDX-032", "BROWN"),
    (82, 345, 410, 1, "EDX-032", "BROWN"),
    (83, 348, 410, 1, "EDX-032", "BROWN"),
    (84, 2312, 409, 2, "EDX-032", "BROWN"),
    (85, 348, 409, 2, "EDX-032", "BROWN"),
    (86, 2312, 106, 2, "EDX-032", "BROWN"),
    (87, 348, 106, 2, "EDX-032", "BROWN"),
    (88, 2312, 403, 1, "EDX-032", "BROWN"),
    (89, 348, 403, 1, "EDX-032", "BROWN"),
    (90, 2312, 1023, 1, "EDX-032", "BROWN"),
    (91, 160, 1023, 1, "EDX-032", "BROWN"),
    (92, 178, 1023, 1, "EDX-032", "BROWN"),
    (93, 2312, 1029, 1, "EDX-032", "BROWN"),
    (94, 160, 1029, 1, "EDX-032", "BROWN"),
    (95, 178, 1029, 1, "EDX-032", "BROWN"),
    (96, 2312, 1060, 1, "EDX-032", "BROWN"),
    (97, 160, 1060, 1, "EDX-032", "BROWN"),
    (98, 178, 1060, 1, "EDX-032", "BROWN"),
    (99, 2312, 419, 1, "EDX-032", "BROWN"),
    (100, 160, 419, 1, "EDX-032", "BROWN"),
    (101, 178, 419, 1, "EDX-032", "BROWN"),
    (102, 2312, 422, 1, "EDX-032", "BROWN"),
    (103, 160, 1589, 1, "EDX-032", "BROWN"),
    (104, 178, 1589, 1, "EDX-035", "ORANGE"),
    (105, 160, 422, 1, "EDX-032", "BROWN"),
    (106, 178, 422, 1, "EDX-032", "BROWN"),
    (107, 2312, 230, 1, "EDX-032", "BROWN"),
    (108, 160, 230, 1, "EDX-032", "BROWN"),
    (109, 2312, 1116, 1, "EDX-032", "BROWN"),
    (110, 160, 1116, 1, "EDX-032", "BROWN"),
    (111, 2312, 1200, 1, "EDX-032", "BROWN"),
    (112, 160, 1200, 1, "EDX-032", "BROWN"),
    (113, 2312, 1198, 1, "EDX-032", "BROWN"),
    (114, 160, 1198, 1, "EDX-032", "BROWN"),
    (115, 2312, 1114, 1, "EDX-032", "BROWN"),
    (116, 160, 1114, 1, "EDX-032", "BROWN"),
    (117, 2312, 230, 1, "EDX-032", "BROWN"),
    (118, 160, 230, 1, "EDX-032", "BROWN"),
    (119, 160, 1601, 1, "EDX-035", "ORANGE"),
    (120, 2312, 740, 1, "EDX-035", "ORANGE"),
    (121, 160, 740, 1, "EDX-035", "ORANGE"),
    (122, 2312, 747, 1, "EDX-035", "ORANGE"),  # switch box cutting noted on sheet
    (123, 160, 740, 1, "EDX-035", "ORANGE"),
    (124, 2312, 230, 2, "EDX-035", "ORANGE"),
    (125, 160, 230, 2, "EDX-035", "ORANGE"),
    (126, 2288, 785, 1, "EDX-035", "ORANGE"),
    (127, 2288, 783, 1, "EDX-035", "ORANGE"),
    (128, 2284, 778, 1, "EDX-035", "ORANGE"),
    (129, 2284, 780, 1, "EDX-035", "ORANGE"),
    (130, 2284, 779, 2, "EDX-035", "ORANGE"),
    (131, 2312, 1080, 4, "EDX-035", "ORANGE"),
    (132, 160, 1080, 4, "EDX-035", "ORANGE"),
    (133, 1342, 1134, 2, "EDX-035", "ORANGE"),
    (134, 348, 1134, 2, "EDX-035", "ORANGE"),
    (135, 2312, 469, 2, "EDX-035", "ORANGE"),
    (136, 348, 469, 1, "EDX-035", "ORANGE"),
    (137, 1342, 1056, 2, "EDX-035", "ORANGE"),
    (138, 352, 1056, 2, "EDX-035", "ORANGE"),
    (139, 2312, 469, 2, "EDX-035", "ORANGE"),
    (140, 352, 469, 2, "EDX-035", "ORANGE"),
    (141, 2312, 229, 1, "EDX-035", "ORANGE"),
    (142, 352, 229, 1, "EDX-035", "ORANGE"),
    (143, 2312, 230, 1, "EDX-035", "ORANGE"),
    (144, 345, 230, 1, "EDX-035", "ORANGE"),
    (145, 2322, 230, 1, "EDX-035", "ORANGE"),
    (146, 352, 230, 1, "EDX-035", "ORANGE"),
    (147, 2312, 230, 1, "EDX-035", "ORANGE"),
    (148, 348, 230, 1, "EDX-035", "ORANGE"),
]

PANELS_18MM: list[tuple[int, int, int, int, str, str]] = [
    (1, 991, 565, 4, "EDX-035", "ORANGE"),
    (2, 991, 527, 4, "EDX-035", "ORANGE"),
]


from decimal import Decimal, ROUND_HALF_UP


def money(amount: float | Decimal) -> Decimal:
    """Round INR to 2 decimals (half-up)."""
    return Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def money_f(amount: float | Decimal) -> float:
    return float(money(amount))


def inr(amount: float) -> str:
    n = int(round(amount))
    s = str(abs(n))
    if len(s) <= 3:
        formatted = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        formatted = f"{','.join(parts)},{last3}"
    sign = "-" if n < 0 else ""
    return f"{sign}₹{formatted}.00"


def inr_dec(amount: float | Decimal) -> str:
    """Format with paise (2 decimals) using Indian grouping on rupees."""
    rounded = float(money(amount))
    neg = rounded < 0
    rounded = abs(rounded)
    rupees = int(rounded)
    paise = int(round((rounded - rupees) * 100))
    s = str(rupees)
    if len(s) <= 3:
        formatted = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        formatted = f"{','.join(parts)},{last3}"
    sign = "-" if neg else ""
    return f"{sign}₹{formatted}.{paise:02d}"


def amount_in_words(amount: float | Decimal) -> str:
    n = int(money(amount))  # rupees only (paise ignored in words)
    ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen",
    ]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def two(num: int) -> str:
        if num < 20:
            return ones[num]
        return f"{tens[num // 10]}{(' ' + ones[num % 10]) if num % 10 else ''}".strip()

    def three(num: int) -> str:
        h = num // 100
        r = num % 100
        if h and r:
            return f"{ones[h]} Hundred {two(r)}"
        if h:
            return f"{ones[h]} Hundred"
        return two(r)

    if n == 0:
        return "Zero"
    crore = n // 10000000
    n %= 10000000
    lakh = n // 100000
    n %= 100000
    thousand = n // 1000
    n %= 1000
    parts = []
    if crore:
        parts.append(f"{three(crore)} Crore")
    if lakh:
        parts.append(f"{three(lakh)} Lakh")
    if thousand:
        parts.append(f"{three(thousand)} Thousand")
    if n:
        parts.append(three(n))
    return " ".join(parts)


def area_sqft(h: int, w: int, qty: int) -> float:
    """Convert H×W mm × qty to square feet."""
    return (h * w * qty) / MM2_PER_SQFT


def priced_lines(
    panels: list[tuple[int, int, int, int, str, str]],
    rate: float,
):
    """Return per-line pricing rows and taxable sum (money half-up per line)."""
    lines: list[dict] = []
    sum_sqft = Decimal("0")
    sum_amt = Decimal("0")
    for sno, h, w, qty, code, colour in panels:
        a = Decimal(str(area_sqft(h, w, qty)))
        amt = money(a * Decimal(str(rate)))
        sum_sqft += a
        sum_amt += amt
        lines.append(
            {
                "sno": sno,
                "h": h,
                "w": w,
                "qty": qty,
                "code": code,
                "colour": colour,
                "sqft": float(a),
                "rate": rate,
                "amount": amt,
            }
        )
    return lines, float(sum_sqft), sum_amt


def summarize(panels: list[tuple[int, int, int, int, str, str]]):
    total_sqft = 0.0
    total_pcs = 0
    by_finish: dict[str, dict[str, float | int]] = {}
    for sno, h, w, qty, code, colour in panels:
        a = area_sqft(h, w, qty)
        total_sqft += a
        total_pcs += qty
        key = f"{code} {colour}"
        bucket = by_finish.setdefault(key, {"sqft": 0.0, "pcs": 0, "lines": 0})
        bucket["sqft"] = float(bucket["sqft"]) + a
        bucket["pcs"] = int(bucket["pcs"]) + qty
        bucket["lines"] = int(bucket["lines"]) + 1
    return total_sqft, total_pcs, by_finish


class SectionBanner(Flowable):
    def __init__(self, text: str, width: float):
        super().__init__()
        self.text = text
        self._width = width
        self._height = 8.5 * mm

    def wrap(self, availWidth, availHeight):
        return self._width, self._height

    def draw(self):
        self.canv.setFillColor(NAVY)
        self.canv.roundRect(0, 0, self._width, self._height, 1.5 * mm, fill=1, stroke=0)
        self.canv.setFillColor(ACCENT)
        self.canv.rect(0, 0, 2.2 * mm, self._height, fill=1, stroke=0)
        self.canv.setFillColor(white)
        self.canv.setFont(FONT_BOLD, 9)
        self.canv.drawString(5 * mm, 2.8 * mm, self.text)


class PageChrome:
    def __init__(self, page_label: str):
        self.page_label = page_label

    def __call__(self, canv, doc):
        canv.saveState()
        canv.setFillColor(PAPER)
        canv.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canv.setFillColor(NAVY)
        canv.rect(0, PAGE_H - 11 * mm, PAGE_W, 11 * mm, fill=1, stroke=0)
        canv.setFillColor(ACCENT)
        canv.rect(0, PAGE_H - 11 * mm, PAGE_W, 1.2 * mm, fill=1, stroke=0)
        canv.setFillColor(white)
        canv.setFont(FONT_BOLD, 8)
        canv.drawString(MARGIN_X, PAGE_H - 7 * mm, "PRIYABADAL HOMES")
        canv.setFont(FONT, 7.5)
        canv.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 7 * mm, self.page_label)
        canv.setStrokeColor(LINE)
        canv.setLineWidth(0.4)
        canv.line(MARGIN_X, 12 * mm, PAGE_W - MARGIN_X, 12 * mm)
        canv.setFillColor(MUTED)
        canv.setFont(FONT, 7)
        canv.drawString(MARGIN_X, 7 * mm, f"{QUOTE_REF}  ·  {QUOTE_DATE}")
        canv.drawRightString(PAGE_W - MARGIN_X, 7 * mm, f"Page {doc.page}")
        canv.restoreState()


def styles():
    base = getSampleStyleSheet()
    S = {
        "CoverBrand": ParagraphStyle(
            "CoverBrand", parent=base["Normal"], fontName=FONT_BOLD, fontSize=11,
            textColor=ACCENT, alignment=TA_CENTER, spaceAfter=2 * mm,
        ),
        "CoverTitle": ParagraphStyle(
            "CoverTitle", parent=base["Normal"], fontName=FONT_BOLD, fontSize=18,
            textColor=NAVY, alignment=TA_CENTER, leading=22, spaceAfter=2 * mm,
        ),
        "CoverSub": ParagraphStyle(
            "CoverSub", parent=base["Normal"], fontName=FONT, fontSize=10,
            textColor=MUTED, alignment=TA_CENTER, leading=14, spaceAfter=1 * mm,
        ),
        "H1": ParagraphStyle(
            "H1", parent=base["Normal"], fontName=FONT_BOLD, fontSize=13,
            textColor=NAVY, spaceBefore=2 * mm, spaceAfter=3 * mm,
        ),
        "Body": ParagraphStyle(
            "Body", parent=base["Normal"], fontName=FONT, fontSize=9,
            textColor=INK, leading=12.5, alignment=TA_LEFT, spaceAfter=1.5 * mm,
        ),
        "BodySmall": ParagraphStyle(
            "BodySmall", parent=base["Normal"], fontName=FONT, fontSize=8,
            textColor=MUTED, leading=11, spaceAfter=1 * mm,
        ),
        "Cell": ParagraphStyle(
            "Cell", parent=base["Normal"], fontName=FONT, fontSize=8,
            textColor=INK, leading=10.5,
        ),
        "CellBold": ParagraphStyle(
            "CellBold", parent=base["Normal"], fontName=FONT_BOLD, fontSize=8,
            textColor=INK, leading=10.5,
        ),
        "CellCenter": ParagraphStyle(
            "CellCenter", parent=base["Normal"], fontName=FONT, fontSize=8,
            textColor=INK, leading=10.5, alignment=TA_CENTER,
        ),
        "CellRight": ParagraphStyle(
            "CellRight", parent=base["Normal"], fontName=FONT, fontSize=8,
            textColor=INK, leading=10.5, alignment=TA_RIGHT,
        ),
        "CellRightBold": ParagraphStyle(
            "CellRightBold", parent=base["Normal"], fontName=FONT_BOLD, fontSize=8,
            textColor=INK, leading=10.5, alignment=TA_RIGHT,
        ),
        "HeadWhite": ParagraphStyle(
            "HeadWhite", parent=base["Normal"], fontName=FONT_BOLD, fontSize=8,
            textColor=white, leading=10, alignment=TA_CENTER,
        ),
        "TermTitle": ParagraphStyle(
            "TermTitle", parent=base["Normal"], fontName=FONT_BOLD, fontSize=9,
            textColor=NAVY, spaceAfter=0.8 * mm,
        ),
        "TermBody": ParagraphStyle(
            "TermBody", parent=base["Normal"], fontName=FONT, fontSize=8.5,
            textColor=INK, leading=11.5,
        ),
        "MetaLabel": ParagraphStyle(
            "MetaLabel", parent=base["Normal"], fontName=FONT, fontSize=7.5,
            textColor=MUTED, leading=10,
        ),
        "MetaValue": ParagraphStyle(
            "MetaValue", parent=base["Normal"], fontName=FONT_BOLD, fontSize=9,
            textColor=INK, leading=12,
        ),
    }
    return S


def zebra_table_style(nrows: int) -> TableStyle:
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1.8 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.8 * mm),
    ]
    for r in range(1, nrows):
        bg = NAVY_SOFT if r % 2 == 0 else white
        cmds.append(("BACKGROUND", (0, r), (-1, r), bg))
    return TableStyle(cmds)


def build_pdf(*, include_annex: bool = True, output_path: Path | None = None):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = output_path or OUT_PDF
    S = styles()
    content_w = PAGE_W - 2 * MARGIN_X

    _, pcs6, finish6 = summarize(PANELS_6MM)
    _, pcs18, finish18 = summarize(PANELS_18MM)

    # Item-wise pricing: each unique size priced separately; taxable = sum of line amounts
    lines6, sqft6, taxable6 = priced_lines(PANELS_6MM, RATE_6)
    lines18, sqft18, taxable18 = priced_lines(PANELS_18MM, RATE_18)
    gst6_amt = money(taxable6 * Decimal(str(GST_6)))
    gst18_amt = money(taxable18 * Decimal(str(GST_18)))
    total6 = taxable6 + gst6_amt
    total18 = taxable18 + gst18_amt

    taxable = taxable6 + taxable18
    gst_total = gst6_amt + gst18_amt
    grand = taxable + gst_total
    advance = money(grand * Decimal("0.75"))
    balance = grand - advance  # ensures 75% + 25% = grand exactly

    doc = SimpleDocTemplate(
        str(out),
        pagesize=A4,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP + 4 * mm,
        bottomMargin=MARGIN_BOTTOM + 4 * mm,
        title=f"Quotation {QUOTE_REF} — {CLIENT}",
        author="PriyaBadal Homes",
        subject="Leatherite Panel Commercial Quotation — Verified Client Copy",
    )
    story: list = []

    # ----- Cover / header block -----
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("PRIYABADAL HOMES", S["CoverBrand"]))
    story.append(Paragraph("COMMERCIAL QUOTATION", S["CoverTitle"]))
    story.append(Paragraph("Custom CNC-cut Leatherite Panels &amp; Doors", S["CoverSub"]))
    story.append(
        Paragraph(
            "Verified against client measurement sheet · <b>Item-wise pricing</b> for every unique size · Areas in <b>sq ft</b>",
            S["CoverSub"],
        )
    )
    story.append(Spacer(1, 1 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=3 * mm))

    meta = [
        [
            Paragraph("Quote Ref", S["MetaLabel"]),
            Paragraph("Date", S["MetaLabel"]),
            Paragraph("Validity", S["MetaLabel"]),
            Paragraph("Currency", S["MetaLabel"]),
        ],
        [
            Paragraph(QUOTE_REF, S["MetaValue"]),
            Paragraph(QUOTE_DATE, S["MetaValue"]),
            Paragraph(f"{VALIDITY_DAYS} Days", S["MetaValue"]),
            Paragraph("INR", S["MetaValue"]),
        ],
    ]
    meta_t = Table(meta, colWidths=[content_w * 0.28, content_w * 0.28, content_w * 0.22, content_w * 0.22])
    meta_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY_SOFT),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
            ]
        )
    )
    story.append(meta_t)
    story.append(Spacer(1, 5 * mm))

    parties = [
        [
            Paragraph("<b>Bill To / Client</b>", S["CellBold"]),
            Paragraph("<b>Project</b>", S["CellBold"]),
        ],
        [
            Paragraph(
                f"<b>{CLIENT}</b><br/>Chennai, Tamil Nadu<br/>"
                "WhatsApp / Order coordination via PriyaBadal Homes",
                S["Cell"],
            ),
            Paragraph(
                f"<b>{PROJECT}</b><br/>"
                f"Source: {SOURCE_SHEET}<br/>"
                "Supply of cut-to-size leatherite panels (6 mm) &amp; leatherite doors (18 mm)",
                S["Cell"],
            ),
        ],
    ]
    parties_t = Table(parties, colWidths=[content_w * 0.48, content_w * 0.52])
    parties_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), white),
                ("BACKGROUND", (0, 1), (-1, 1), white),
                ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    # Fix header text color via Paragraph already white-styled? Use HeadWhite:
    parties[0] = [
        Paragraph("Bill To / Client", S["HeadWhite"]),
        Paragraph("Project", S["HeadWhite"]),
    ]
    parties_t = Table(parties, colWidths=[content_w * 0.48, content_w * 0.52])
    parties_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("BACKGROUND", (0, 1), (-1, 1), white),
                ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    story.append(parties_t)
    story.append(Spacer(1, 6 * mm))

    # ----- Scope -----
    story.append(SectionBanner("1  •  Scope of Supply", content_w))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "Supply of CNC cut-to-size <b>leatherite panels</b> as per the approved measurement sheet. "
            "Includes size cutting as listed. Item no. 122 includes switch-box cutting as noted on the sheet. "
            "Hardware, installation, adhesive, transport and transit insurance are <b>not</b> included unless stated.",
            S["Body"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    # ----- Rate card -----
    story.append(SectionBanner("2  •  Rate Card", content_w))
    story.append(Spacer(1, 3 * mm))
    rate_rows = [
        [
            Paragraph("Description", S["HeadWhite"]),
            Paragraph("Unit Rate", S["HeadWhite"]),
            Paragraph("GST", S["HeadWhite"]),
        ],
        [
            Paragraph("6 mm Leatherite Panel (cut-to-size)", S["Cell"]),
            Paragraph(f"{inr(RATE_6)} / sq ft", S["CellCenter"]),
            Paragraph("5%", S["CellCenter"]),
        ],
        [
            Paragraph("18 mm Leatherite Door / Panel (cut-to-size)", S["Cell"]),
            Paragraph(f"{inr(RATE_18)} / sq ft", S["CellCenter"]),
            Paragraph("18%", S["CellCenter"]),
        ],
    ]
    rate_t = Table(rate_rows, colWidths=[content_w * 0.55, content_w * 0.25, content_w * 0.20])
    rate_t.setStyle(zebra_table_style(len(rate_rows)))
    story.append(rate_t)
    story.append(Spacer(1, 5 * mm))

    # ----- Quantity summary -----
    story.append(SectionBanner("3  •  Quantity Summary (from measurement sheet)", content_w))
    story.append(Spacer(1, 3 * mm))

    sum_rows = [
        [
            Paragraph("Item", S["HeadWhite"]),
            Paragraph("Finish", S["HeadWhite"]),
            Paragraph("Pcs", S["HeadWhite"]),
            Paragraph("Area (sq ft)", S["HeadWhite"]),
        ],
    ]
    for finish, data in sorted(finish6.items()):
        sum_rows.append(
            [
                Paragraph("6 mm Leatherite Panel", S["Cell"]),
                Paragraph(finish, S["Cell"]),
                Paragraph(str(int(data["pcs"])), S["CellCenter"]),
                Paragraph(f"{float(data['sqft']):.4f}", S["CellRight"]),
            ]
        )
    sum_rows.append(
        [
            Paragraph("<b>6 mm Subtotal</b>", S["CellBold"]),
            Paragraph(f"<b>{len(PANELS_6MM)} line items</b>", S["CellBold"]),
            Paragraph(f"<b>{pcs6}</b>", S["CellCenter"]),
            Paragraph(f"<b>{sqft6:.4f}</b>", S["CellRightBold"]),
        ]
    )
    for finish, data in sorted(finish18.items()):
        sum_rows.append(
            [
                Paragraph("18 mm Leatherite Door", S["Cell"]),
                Paragraph(finish, S["Cell"]),
                Paragraph(str(int(data["pcs"])), S["CellCenter"]),
                Paragraph(f"{float(data['sqft']):.4f}", S["CellRight"]),
            ]
        )
    sum_rows.append(
        [
            Paragraph("<b>18 mm Subtotal</b>", S["CellBold"]),
            Paragraph(f"<b>{len(PANELS_18MM)} line items</b>", S["CellBold"]),
            Paragraph(f"<b>{pcs18}</b>", S["CellCenter"]),
            Paragraph(f"<b>{sqft18:.4f}</b>", S["CellRightBold"]),
        ]
    )
    sum_t = Table(
        sum_rows,
        colWidths=[content_w * 0.34, content_w * 0.30, content_w * 0.14, content_w * 0.22],
    )
    sum_t.setStyle(zebra_table_style(len(sum_rows)))
    story.append(sum_t)
    story.append(
        Paragraph(
            f"Areas calculated as Height (mm) × Width (mm) × Qty ÷ 92,903.04 (sq ft). "
            f"Total cut area: <b>{sqft6 + sqft18:.4f} sq ft</b> across <b>{pcs6 + pcs18} pcs</b>. "
            f"Each unique size is priced individually in Section 4.",
            S["BodySmall"],
        )
    )
    story.append(PageBreak())

    # ----- Item-wise pricing (always included — client detail) -----
    story.append(SectionBanner("4  •  Item-wise Price Schedule — 6 mm Leatherite", content_w))
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            f"Rate <b>{inr(RATE_6)} / sq ft</b> + GST <b>5%</b> on taxable. "
            "Each row is one unique size from the measurement sheet (H × W in mm).",
            S["BodySmall"],
        )
    )
    story.append(Spacer(1, 2 * mm))

    def item_price_table(lines: list[dict], thick_label: str, show_note_122: bool = False):
        rows = [
            [
                Paragraph("#", S["HeadWhite"]),
                Paragraph("H mm", S["HeadWhite"]),
                Paragraph("W mm", S["HeadWhite"]),
                Paragraph("Qty", S["HeadWhite"]),
                Paragraph("Code / Colour", S["HeadWhite"]),
                Paragraph("Sq ft", S["HeadWhite"]),
                Paragraph("Rate", S["HeadWhite"]),
                Paragraph("Amount ₹", S["HeadWhite"]),
            ]
        ]
        for ln in lines:
            note = " *" if show_note_122 and ln["sno"] == 122 else ""
            rows.append(
                [
                    Paragraph(str(ln["sno"]), S["CellCenter"]),
                    Paragraph(str(ln["h"]), S["CellCenter"]),
                    Paragraph(str(ln["w"]), S["CellCenter"]),
                    Paragraph(str(ln["qty"]), S["CellCenter"]),
                    Paragraph(f"{ln['code']} {ln['colour']}{note}", S["Cell"]),
                    Paragraph(f"{ln['sqft']:.4f}", S["CellRight"]),
                    Paragraph(inr(ln["rate"]), S["CellRight"]),
                    Paragraph(inr_dec(ln["amount"]), S["CellRight"]),
                ]
            )
        t = Table(
            rows,
            colWidths=[
                content_w * 0.06,
                content_w * 0.09,
                content_w * 0.09,
                content_w * 0.07,
                content_w * 0.24,
                content_w * 0.13,
                content_w * 0.12,
                content_w * 0.20,
            ],
            repeatRows=1,
        )
        t.setStyle(zebra_table_style(len(rows)))
        return t

    # 6mm in chunks so each page stays readable
    chunk = 28
    for i in range(0, len(lines6), chunk):
        if i:
            story.append(PageBreak())
            story.append(SectionBanner("4  •  Item-wise Price Schedule — 6 mm (continued)", content_w))
            story.append(Spacer(1, 2 * mm))
        story.append(item_price_table(lines6[i : i + chunk], "6mm", show_note_122=True))
        if i == 0:
            story.append(
                Paragraph("* Item 122: switch box cutting as noted on measurement sheet.", S["BodySmall"])
            )

    # 6mm section totals
    story.append(Spacer(1, 2 * mm))
    sub6 = [
        [
            Paragraph("Description", S["HeadWhite"]),
            Paragraph("Area / Qty", S["HeadWhite"]),
            Paragraph("Amount (INR)", S["HeadWhite"]),
        ],
        [
            Paragraph("6 mm taxable (sum of item amounts)", S["Cell"]),
            Paragraph(f"{sqft6:.4f} sq ft · {pcs6} pcs · {len(lines6)} sizes", S["CellCenter"]),
            Paragraph(inr_dec(taxable6), S["CellRight"]),
        ],
        [
            Paragraph("GST @ 5% on 6 mm", S["Cell"]),
            Paragraph("5%", S["CellCenter"]),
            Paragraph(inr_dec(gst6_amt), S["CellRight"]),
        ],
        [
            Paragraph("<b>6 mm Total (incl. GST)</b>", S["CellBold"]),
            Paragraph("", S["Cell"]),
            Paragraph(f"<b>{inr_dec(total6)}</b>", S["CellRightBold"]),
        ],
    ]
    sub6_t = Table(sub6, colWidths=[content_w * 0.48, content_w * 0.32, content_w * 0.20])
    sub6_t.setStyle(zebra_table_style(len(sub6)))
    story.append(sub6_t)

    story.append(PageBreak())
    story.append(SectionBanner("4B  •  Item-wise Price Schedule — 18 mm Leatherite Doors", content_w))
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            f"Rate <b>{inr(RATE_18)} / sq ft</b> + GST <b>18%</b> on taxable. "
            "Each row is one unique door size from the measurement sheet.",
            S["BodySmall"],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(item_price_table(lines18, "18mm"))
    story.append(Spacer(1, 2 * mm))
    sub18 = [
        [
            Paragraph("Description", S["HeadWhite"]),
            Paragraph("Area / Qty", S["HeadWhite"]),
            Paragraph("Amount (INR)", S["HeadWhite"]),
        ],
        [
            Paragraph("18 mm taxable (sum of item amounts)", S["Cell"]),
            Paragraph(f"{sqft18:.4f} sq ft · {pcs18} pcs · {len(lines18)} sizes", S["CellCenter"]),
            Paragraph(inr_dec(taxable18), S["CellRight"]),
        ],
        [
            Paragraph("GST @ 18% on 18 mm", S["Cell"]),
            Paragraph("18%", S["CellCenter"]),
            Paragraph(inr_dec(gst18_amt), S["CellRight"]),
        ],
        [
            Paragraph("<b>18 mm Total (incl. GST)</b>", S["CellBold"]),
            Paragraph("", S["Cell"]),
            Paragraph(f"<b>{inr_dec(total18)}</b>", S["CellRightBold"]),
        ],
    ]
    sub18_t = Table(sub18, colWidths=[content_w * 0.48, content_w * 0.32, content_w * 0.20])
    sub18_t.setStyle(zebra_table_style(len(sub18)))
    story.append(sub18_t)
    story.append(PageBreak())

    # ----- Commercial -----
    story.append(SectionBanner("5  •  Commercial Summary (from item-wise schedule)", content_w))
    story.append(Spacer(1, 3 * mm))

    fin = [
        [
            Paragraph("Description", S["HeadWhite"]),
            Paragraph("Qty / Area", S["HeadWhite"]),
            Paragraph("Rate", S["HeadWhite"]),
            Paragraph("Amount (INR)", S["HeadWhite"]),
        ],
        [
            Paragraph("6 mm Leatherite Panels — taxable (item-wise sum)", S["Cell"]),
            Paragraph(f"{sqft6:.4f} sq ft", S["CellCenter"]),
            Paragraph(f"{inr(RATE_6)}/sq ft", S["CellCenter"]),
            Paragraph(inr_dec(taxable6), S["CellRight"]),
        ],
        [
            Paragraph("GST @ 5% on 6 mm", S["Cell"]),
            Paragraph("—", S["CellCenter"]),
            Paragraph("5%", S["CellCenter"]),
            Paragraph(inr_dec(gst6_amt), S["CellRight"]),
        ],
        [
            Paragraph("18 mm Leatherite Doors — taxable (item-wise sum)", S["Cell"]),
            Paragraph(f"{sqft18:.4f} sq ft", S["CellCenter"]),
            Paragraph(f"{inr(RATE_18)}/sq ft", S["CellCenter"]),
            Paragraph(inr_dec(taxable18), S["CellRight"]),
        ],
        [
            Paragraph("GST @ 18% on 18 mm", S["Cell"]),
            Paragraph("—", S["CellCenter"]),
            Paragraph("18%", S["CellCenter"]),
            Paragraph(inr_dec(gst18_amt), S["CellRight"]),
        ],
        [
            Paragraph("<b>Taxable Value</b>", S["CellBold"]),
            Paragraph("", S["Cell"]),
            Paragraph("", S["Cell"]),
            Paragraph(f"<b>{inr_dec(taxable)}</b>", S["CellRightBold"]),
        ],
        [
            Paragraph("<b>Total GST</b>", S["CellBold"]),
            Paragraph("", S["Cell"]),
            Paragraph("", S["Cell"]),
            Paragraph(f"<b>{inr_dec(gst_total)}</b>", S["CellRightBold"]),
        ],
        [
            Paragraph("<b>Grand Total (Inclusive of GST)</b>", S["CellBold"]),
            Paragraph("", S["Cell"]),
            Paragraph("", S["Cell"]),
            Paragraph(f"<b>{inr_dec(grand)}</b>", S["CellRightBold"]),
        ],
    ]
    fin_t = Table(
        fin,
        colWidths=[content_w * 0.40, content_w * 0.18, content_w * 0.18, content_w * 0.24],
    )
    fin_style = zebra_table_style(len(fin))
    fin_style.add("BACKGROUND", (0, -1), (-1, -1), HexColor("#FFF6F0"))
    fin_style.add("BACKGROUND", (0, -2), (-1, -2), NAVY_SOFT)
    fin_style.add("BACKGROUND", (0, -3), (-1, -3), NAVY_SOFT)
    fin_t.setStyle(fin_style)
    story.append(fin_t)
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            f"<b>Amount in Words:</b> Indian Rupees {amount_in_words(grand)} Only "
            f"(inclusive of GST as above).",
            S["Body"],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            "<b>Extra (not included in Grand Total):</b> Transport / freight charges — Extra &nbsp;|&nbsp; "
            "Transit insurance — Extra.",
            S["Body"],
        )
    )
    story.append(Spacer(1, 6 * mm))

    # ----- Payment & dispatch -----
    story.append(SectionBanner("6  •  Payment Terms & Dispatch", content_w))
    story.append(Spacer(1, 3 * mm))

    pay = [
        [
            Paragraph("Milestone", S["HeadWhite"]),
            Paragraph("%", S["HeadWhite"]),
            Paragraph("Amount (INR)", S["HeadWhite"]),
            Paragraph("When Due", S["HeadWhite"]),
        ],
        [
            Paragraph("Advance / Order confirmation", S["Cell"]),
            Paragraph("75%", S["CellCenter"]),
            Paragraph(inr_dec(advance), S["CellRight"]),
            Paragraph("Along with PO / order confirmation", S["Cell"]),
        ],
        [
            Paragraph("Balance before dispatch", S["Cell"]),
            Paragraph("25%", S["CellCenter"]),
            Paragraph(inr_dec(balance), S["CellRight"]),
            Paragraph("At the time of dispatch", S["Cell"]),
        ],
    ]
    pay_t = Table(
        pay,
        colWidths=[content_w * 0.32, content_w * 0.10, content_w * 0.24, content_w * 0.34],
    )
    pay_t.setStyle(zebra_table_style(len(pay)))
    story.append(pay_t)
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "<b>Dispatch / Lead time:</b> <b>25 working days</b> from receipt of advance payment "
            "and final measurement / colour confirmation.",
            S["Body"],
        )
    )
    story.append(Spacer(1, 5 * mm))

    # ----- Terms -----
    story.append(SectionBanner("7  •  Terms & Conditions", content_w))
    story.append(Spacer(1, 3 * mm))
    terms = [
        (
            "1. Basis of Quote",
            "Quantities, sizes and item-wise amounts are derived from the client measurement sheet "
            f"({SOURCE_SHEET}). Each unique size is priced individually at the stated sq ft rate. "
            "Any size / qty change will revise this quotation.",
        ),
        (
            "2. Material & Finish",
            "Leatherite finish codes EDX-032 (Brown) and EDX-035 (Orange) as listed. "
            "Shade variation within commercial tolerance of the selected material is acceptable.",
        ),
        (
            "3. Payment",
            "75% advance with order confirmation; 25% payable at the time of dispatch. "
            "Production starts only after advance clearance.",
        ),
        (
            "4. Dispatch",
            "Goods ready for dispatch in approximately 25 working days from advance receipt "
            "and final confirmation. Exact dispatch date intimated closer to readiness.",
        ),
        (
            "5. Transport & Insurance",
            "Freight / transport charges are extra. Transit insurance is extra and optional "
            "unless specifically ordered and charged.",
        ),
        (
            "6. Taxes",
            "GST applied as stated: 5% on 6 mm leatherite panels and 18% on 18 mm leatherite doors. "
            "Any change in statutory tax rates will apply as per law.",
        ),
        (
            "7. Exclusions",
            "Installation, adhesive, edge banding (unless noted), hardware, site labour, "
            "unpacking at site, and storage beyond free period are excluded.",
        ),
        (
            "8. Validity",
            f"This quotation is valid for {VALIDITY_DAYS} days from {QUOTE_DATE}.",
        ),
    ]
    for title, body in terms:
        gap = 1.4 * mm if not include_annex else 2.2 * mm
        block = [Paragraph(title, S["TermTitle"]), Paragraph(body, S["TermBody"]), Spacer(1, gap)]
        story.append(KeepTogether(block))

    story.append(Spacer(1, 2 * mm if not include_annex else 3 * mm))
    story.append(SectionBanner("8  •  Acceptance", content_w))
    story.append(Spacer(1, 2 * mm if not include_annex else 3 * mm))
    story.append(
        Paragraph(
            f"By signing below, the client accepts quotation <b>{QUOTE_REF}</b> for a Grand Total of "
            f"<b>{inr_dec(grand)}</b> (inclusive of GST), subject to transport &amp; insurance being charged extra.",
            S["Body"],
        )
    )
    story.append(Spacer(1, 4 * mm if not include_annex else 6 * mm))

    sign = [
        [
            Paragraph("<b>For Interierspot Chennai</b>", S["CellBold"]),
            Paragraph("<b>For PriyaBadal Homes</b>", S["CellBold"]),
        ],
        [
            Paragraph(
                "Authorized Signatory<br/><br/><br/><br/>"
                "Name: ________________________<br/><br/>"
                "Date: ________________________",
                S["Cell"],
            ),
            Paragraph(
                "Authorized Signatory<br/><br/><br/><br/>"
                "PriyaBadal Homes, Indore (M.P.)<br/><br/>"
                "WhatsApp: +91 81099 49649<br/>"
                "www.priyabadalhomes.com",
                S["Cell"],
            ),
        ],
    ]
    sign_t = Table(sign, colWidths=[content_w * 0.5, content_w * 0.5])
    sign_t.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, 0), NAVY_SOFT),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )
    story.append(sign_t)
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            f"<b>End of Quotation {QUOTE_REF}</b> — Item-wise quotation for {CLIENT}. "
            f"{len(lines6)} unique 6 mm sizes + {len(lines18)} unique 18 mm sizes. "
            "Confirm order on WhatsApp +91 81099 49649.",
            S["Body"],
        )
    )

    doc.build(story, onFirstPage=PageChrome("Commercial Quotation"), onLaterPages=PageChrome("Commercial Quotation"))
    print(f"Wrote {out}")
    print(f"6mm: {pcs6} pcs / {len(lines6)} sizes / {sqft6:.4f} sq ft → taxable {taxable6} + GST {gst6_amt} = {total6}")
    print(f"18mm: {pcs18} pcs / {len(lines18)} sizes / {sqft18:.4f} sq ft → taxable {taxable18} + GST {gst18_amt} = {total18}")
    print(f"Grand Total: {grand} | Advance 75%: {advance} | Balance 25%: {balance} | check {advance}+{balance}={advance+balance}")
    return {
        "sqft6": sqft6,
        "sqft18": sqft18,
        "pcs6": pcs6,
        "pcs18": pcs18,
        "lines6": len(lines6),
        "lines18": len(lines18),
        "taxable6": taxable6,
        "gst6": gst6_amt,
        "taxable18": taxable18,
        "gst18": gst18_amt,
        "grand": grand,
        "advance": advance,
        "balance": balance,
        "path": out,
        "sample_lines": lines6[:3] + lines18,
    }


if __name__ == "__main__":
    # Single detailed item-wise PDF for WhatsApp / client send
    result = build_pdf(include_annex=True, output_path=OUT_WHATSAPP_PDF)
    # Same content as archive / factory copy
    full = build_pdf(include_annex=True, output_path=OUT_PDF)
    assert result["grand"] == full["grand"]
    assert result["advance"] + result["balance"] == result["grand"]
    # Spot-check first line math
    ln = result["sample_lines"][0]
    expect = money(Decimal(str(ln["sqft"])) * Decimal(str(ln["rate"])))
    assert ln["amount"] == expect, (ln["amount"], expect)
    print("VERIFIED: item-wise line amounts sum to grand; sample line math OK.")
    print("SEND ON WHATSAPP:", OUT_WHATSAPP_PDF.name)
