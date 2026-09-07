#!/usr/bin/env python3
"""Bulk wardrobe catalog pricing/finish updates + handle posts + removals."""

from __future__ import annotations

import re
from pathlib import Path

CATALOG = Path("src/data/catalog.ts")

REMOVE_IDS = {
    "cream-mauve-arch-wardrobe",
    "taupe-copper-cross-wardrobe",
    "classic-taupe-copper-cross-wardrobe",
    "walnut-sky-arch-wardrobe",
    "cream-blue-j-handle-wardrobe",
    "blonde-chevron-groove-wardrobe",
}

# finish_id, thickness_id, price, handle_price (None = leave/clear), tags, notes
# handle_price: int to set, None to leave unchanged, 0 to clear handlePairPrice
UPDATES: dict[str, dict] = {
    "greige-arch-capsule-wardrobe": {
        "price": 1800,
        "finish": "ceramic-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front ceramic · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "classic-charcoal-brass-diamond-wardrobe": {
        "price": 2500,
        "finish": "ceramic-front-pu-back",
        "thickness": "25",
        "finish_prose": "Front ceramic · back PU",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "classic-walnut-woven-chevron-wardrobe": {
        "price": 1500,
        "finish": "laminated",
        "thickness": "25",
        "finish_prose": "Both-side laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "classic-walnut-cream-fluted-arch-wardrobe": {
        "price": 2200,
        "finish": "veneer-pu-half",
        "thickness": "25",
        "finish_prose": "Half veneer · half PU",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "classic-ivory-azure-arch-wardrobe": {
        "price": 1800,
        "finish": "ceramic-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front ceramic · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "handle": 5500,
        "handle_label": "single piece",
    },
    "classic-ivory-dusty-rose-capsule-wardrobe": {
        "price": 2200,
        "finish": "ceramic-both",
        "thickness": "25",
        "finish_prose": "Both-side ceramic",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "classic-oak-periwinkle-capsule-wardrobe": {
        "price": 1600,
        "finish": "laminate-pu-border",
        "thickness": "25",
        "finish_prose": "Laminated with PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "handle": 500,
        "handle_label": "single piece",
    },
    "classic-ivory-concentric-circle-wardrobe": {
        "price": 1800,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "terracotta-geometric-relief-wardrobe": {
        "price": 2000,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "teal-scalloped-oak-wardrobe": {
        "price": 1500,
        "finish": "pu",
        "thickness": "18",
        "finish_prose": "Both-side PU",
        "material": "18 mm HDHMR + BWP plywood",
    },
    "cream-neoclassical-wardrobe": {
        "price": 2800,
        "finish": "glossy-laminate-front-pu-back",
        "thickness": "25",
        "finish_prose": "Glossy lamination · back PU",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "taupe-geometric-diamond-wardrobe": {
        "price": 1800,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "grey-stone-fluted-wardrobe": {
        "price": 2000,
        "finish": "ceramic-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front ceramic · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "navy-diamond-lattice-wardrobe": {
        "price": 2200,
        "finish": "ceramic-both",
        "thickness": "25",
        "finish_prose": "Both-side ceramic",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "taupe-chevron-linen-wardrobe": {
        "price": 1100,
        "finish": "laminated",
        "thickness": "22",
        "finish_prose": "Both-side laminated",
        "material": "22 mm plywood",
        "handle": 4500,
        "handle_label": "single piece",
    },
    "oak-bronze-handle-wardrobe": {
        "price": 1100,
        "finish": "laminated",
        "thickness": "22",
        "finish_prose": "Both-side laminated",
        "material": "22 mm plywood",
        "handle": 4500,
        "handle_label": "single piece",
    },
    "white-marble-branch-wardrobe": {
        "price": 1100,
        "finish": "laminated",
        "thickness": "22",
        "finish_prose": "Both-side laminated",
        "material": "22 mm plywood",
        "handle": 4500,
        "handle_label": "single piece",
    },
    "blush-tribal-motif-wardrobe": {
        # Second listing wins for wardrobe specs; handle posted separately
        "price": 2200,
        "finish": "pu",
        "thickness": "25",
        "finish_prose": "PU · both sides",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "light-oak-linear-wardrobe": {
        "price": 1100,
        "finish": "laminated",
        "thickness": "22",
        "finish_prose": "Both-side laminated",
        "material": "22 mm plywood",
        "handle": 4500,
        "handle_label": "single piece",
    },
    "mint-radial-sunburst-wardrobe": {
        "price": 2200,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "tag": "Stainless steel inlaid",
    },
    "lavender-arabesque-grid-wardrobe": {
        "price": 2300,
        "finish": "pu",
        "thickness": "25",
        "finish_prose": "PU · both sides",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "taupe-reeded-led-wardrobe": {
        "price": 2200,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "tag": "Stainless steel inlaid",
    },
    "sand-sunburst-brick-wardrobe": {
        "price": 2500,
        "finish": "pu",
        "thickness": "25",
        "finish_prose": "PU · both sides (handle-less)",
        "material": "25 mm HDHMR + BWP plywood",
        "handle": 0,  # handle-less
        "handle_less": True,
    },
    "grey-fluted-gold-arch-wardrobe": {
        "price": 2200,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "tag": "Stainless steel inlaid",
    },
    "sage-leaf-botanical-wardrobe": {
        "price": 2200,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "tag": "Stainless steel inlaid",
    },
    "beige-spade-lattice-wardrobe": {
        "price": 2200,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "tag": "Stainless steel inlaid",
    },
    "cream-gold-linear-wardrobe": {
        "price": 2300,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
        "tag": "Stainless steel inlaid",
    },
    "dusty-rose-art-deco-wardrobe": {
        "price": 1800,
        "finish": "pu-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front PU · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
    "sand-arch-two-tone-wardrobe": {
        "price": 2200,
        "finish": "ceramic-front-laminate-back",
        "thickness": "25",
        "finish_prose": "Front ceramic · back laminated",
        "material": "25 mm HDHMR + BWP plywood",
    },
}

# Handle catalog entries (single piece). Image reused from matching wardrobe hero.
HANDLES = [
    {
        "id": "ivory-azure-arch-handle",
        "name": "Ivory Azure Arch Handle",
        "price": 5500,
        "sku": "PBH-HDL-02",
        "wardrobe_id": "classic-ivory-azure-arch-wardrobe",
        "desc": "Sculpted handle for Ivory Azure Arch Wardrobe shutters — sold as a single piece.",
    },
    {
        "id": "oak-periwinkle-capsule-handle",
        "name": "Oak & Periwinkle Capsule Handle",
        "price": 500,
        "sku": "PBH-HDL-03",
        "wardrobe_id": "classic-oak-periwinkle-capsule-wardrobe",
        "desc": "Capsule handle for Oak & Periwinkle Capsule Wardrobe — sold as a single piece.",
    },
    {
        "id": "taupe-chevron-linen-handle",
        "name": "Taupe Chevron Linen Handle",
        "price": 4500,
        "sku": "PBH-HDL-04",
        "wardrobe_id": "taupe-chevron-linen-wardrobe",
        "desc": "Handle for Taupe Chevron Linen Wardrobe shutters — sold as a single piece.",
    },
    {
        "id": "oak-bronze-handle",
        "name": "Oak Bronze Handle",
        "price": 4500,
        "sku": "PBH-HDL-05",
        "wardrobe_id": "oak-bronze-handle-wardrobe",
        "desc": "Bronze-look handle for Oak Bronze Handle Wardrobe — sold as a single piece.",
    },
    {
        "id": "white-marble-branch-handle",
        "name": "White Marble Branch Handle",
        "price": 4500,
        "sku": "PBH-HDL-06",
        "wardrobe_id": "white-marble-branch-wardrobe",
        "desc": "Branch handle for White Marble Branch-Handle Wardrobe — sold as a single piece.",
    },
    {
        "id": "blush-tribal-motif-handle",
        "name": "Blush Tribal Motif Handle",
        "price": 4500,
        "sku": "PBH-HDL-07",
        "wardrobe_id": "blush-tribal-motif-wardrobe",
        "desc": "Handle for Blush Tribal Motif Wardrobe shutters — sold as a single piece.",
    },
    {
        "id": "light-oak-linear-handle",
        "name": "Light Oak Linear Handle",
        "price": 4500,
        "sku": "PBH-HDL-08",
        "wardrobe_id": "light-oak-linear-wardrobe",
        "desc": "Linear handle for Light Oak Linear Wardrobe — sold as a single piece.",
    },
]


def fmt_inr(n: int) -> str:
    s = f"{n:,}"
    # Indian grouping optional; keep western commas for consistency with catalog
    return s


def parse_products(text: str) -> tuple[str, list[dict], str]:
    marker = "export const baseProducts: Product[] = ["
    idx = text.index(marker)
    header = text[: idx + len(marker)]
    body = text[idx + len(marker) :]
    # Find matching closing `]\n` at end of array (before helper exports)
    end = body.rfind("\n]")
    if end < 0:
        raise SystemExit("Could not find end of baseProducts array")
    array_body = body[:end]
    footer = body[end:]  # starts with \n]...

    products: list[dict] = []
    # Split on top-level product objects: `\n  {\n    id:`
    parts = re.split(r"\n  \{\n    id: '", array_body)
    # First part is leading whitespace / empty
    for i, part in enumerate(parts):
        if i == 0:
            if part.strip():
                # leading junk between [ and first {
                pass
            continue
        raw = "  {\n    id: '" + part
        # Ensure raw ends cleanly — strip trailing comma/whitespace after }
        raw = raw.rstrip()
        if raw.endswith(","):
            raw = raw[:-1].rstrip()
        m = re.match(r"\s*\{\n\s*id: '([^']+)'", raw)
        if not m:
            raise SystemExit(f"Failed to parse product id in chunk {i}")
        products.append({"id": m.group(1), "raw": raw})
    return header, products, footer


def set_field(raw: str, key: str, value_ts: str) -> str:
    """Set or insert a simple field like price: 1800 or defaultFinishId: 'x'."""
    # Match full line value (arrays may contain commas); always keep trailing comma.
    pattern = re.compile(rf"^(\s*{re.escape(key)}:\s*).*$", re.M)

    def repl(m: re.Match) -> str:
        return m.group(1) + value_ts + ","

    if pattern.search(raw):
        return pattern.sub(repl, raw, count=1)
    # Insert after currency or pricingMode block near top
    insert_after = [
        "thicknessOptionIds",
        "finishOptionIds",
        "defaultThicknessId",
        "defaultFinishId",
        "pricingMode",
        "currency",
        "carcassPrice",
        "price",
        "subcategoryId",
    ]
    for after in insert_after:
        m = re.search(rf"^(\s*{after}:.*)$", raw, re.M)
        if m:
            pos = m.end()
            indent = re.match(r"(\s*)", m.group(1)).group(1)
            return raw[:pos] + f"\n{indent}{key}: {value_ts}," + raw[pos:]
    return raw


def remove_field(raw: str, key: str) -> str:
    return re.sub(rf"^\s*{re.escape(key)}:.*\n", "", raw, count=1, flags=re.M)


def replace_spec_value(raw: str, label: str, value: str) -> str:
    """Replace {{ label: 'X', value: '...' }} value safely."""
    pattern = re.compile(
        rf"(\{{\s*label:\s*'{re.escape(label)}',\s*value:\s*')([^']*)(')",
        re.S,
    )

    def repl(m: re.Match) -> str:
        return m.group(1) + value.replace("\\", "\\\\").replace("'", "\\'") + m.group(3)

    if pattern.search(raw):
        return pattern.sub(repl, raw, count=1)
    return raw


def replace_highlight_price(raw: str, price: int) -> str:
    pattern = re.compile(r"(Shutter ₹)[\d,]+( / sq ft)")

    def repl(m: re.Match) -> str:
        return m.group(1) + fmt_inr(price) + m.group(2)

    return pattern.sub(repl, raw)


def replace_pricing_spec(raw: str, price: int, handle: int | None, handle_label: str | None) -> str:
    price_bit = f"Shutter ₹{fmt_inr(price)} / sq ft"
    if handle and handle > 0:
        hl = handle_label or "single piece"
        price_bit += f" · handle ₹{fmt_inr(handle)} ({hl})"
    price_bit += " · carcass optional (confirm on WhatsApp)"
    # Try Pricing spec row
    raw2 = replace_spec_value(raw, "Pricing", price_bit)
    if raw2 != raw:
        return raw2
    # Also try shorter patterns in specifications
    pattern = re.compile(
        r"(label:\s*'Pricing',\s*value:\s*')([^']*)(')",
        re.S,
    )

    def repl(m: re.Match) -> str:
        return m.group(1) + price_bit.replace("'", "\\'") + m.group(3)

    return pattern.sub(repl, raw, count=1)


def update_order_notes(
    raw: str,
    thickness: str,
    material: str,
    finish_prose: str,
    price: int,
    handle: int | None,
    handle_label: str | None,
    handle_less: bool,
) -> str:
    note = f"Shutter: {material} · {finish_prose} · ₹{fmt_inr(price)} / sq ft"
    handle_note = None
    if handle_less:
        handle_note = "Handle-less"
    elif handle and handle > 0:
        hl = handle_label or "single piece"
        handle_note = f"Handle: ₹{fmt_inr(handle)} ({hl})"

    m = re.search(r"orderNotes:\s*\[(.*?)\]", raw, re.S)
    if not m:
        # insert before disclaimer if present
        notes = [note]
        if handle_note:
            notes.append(handle_note)
        notes_ts = (
            "orderNotes: [\n"
            + ",\n".join(f"      '{n}'" for n in notes)
            + "\n    ],\n    "
        )
        if "disclaimer:" in raw:
            return raw.replace("disclaimer:", notes_ts + "disclaimer:", 1)
        return raw

    inner = m.group(1)
    # Rebuild orderNotes simply
    notes = [note]
    if handle_note:
        notes.append(handle_note)
    new_inner = "\n" + ",\n".join(f"      '{n}'" for n in notes) + "\n    "
    return raw[: m.start()] + f"orderNotes: [{new_inner}]" + raw[m.end() :]


def ensure_tags(raw: str, tag: str) -> str:
    if re.search(r"^\s*tags:\s*\[", raw, re.M):
        return re.sub(
            r"^\s*tags:\s*\[[^\]]*\]\,?",
            f"    tags: ['{tag}'],",
            raw,
            count=1,
            flags=re.M,
        )
    # insert after sku or collection
    for after in ("sku", "collection", "brand"):
        m = re.search(rf"^(\s*{after}:.*)$", raw, re.M)
        if m:
            pos = m.end()
            indent = re.match(r"(\s*)", m.group(1)).group(1)
            return raw[:pos] + f"\n{indent}tags: ['{tag}']," + raw[pos:]
    return raw


def ensure_style_tag(raw: str, tag: str) -> str:
    m = re.search(r"style:\s*\[([^\]]*)\]", raw)
    if not m:
        return raw
    inner = m.group(1)
    if "stainless" in inner.lower() or tag.lower() in inner.lower():
        return raw
    # add as style string slug
    slug = "stainless-steel-inlaid"
    new_inner = inner.rstrip()
    if new_inner.strip():
        if not new_inner.rstrip().endswith(","):
            # arrays like ['a', 'b']
            pass
        new_inner = new_inner.rstrip() + f", '{slug}'"
    else:
        new_inner = f"'{slug}'"
    return raw[: m.start()] + f"style: [{new_inner}]" + raw[m.end() :]


def ensure_highlight(raw: str, item: str) -> str:
    m = re.search(r"highlights:\s*\[(.*?)\]", raw, re.S)
    if not m:
        return raw
    inner = m.group(1)
    if item.lower() in inner.lower():
        return raw
    # insert after opening
    new_inner = f"\n      '{item}'," + inner
    return raw[: m.start()] + f"highlights: [{new_inner}]" + raw[m.end() :]


def update_handle_fields(raw: str, handle: int | None, handle_label: str | None, handle_less: bool) -> str:
    if handle_less or handle == 0:
        raw = remove_field(raw, "handlePairPrice")
        raw = remove_field(raw, "handlePairDefault")
        return raw
    if handle is None:
        return raw
    raw = set_field(raw, "handlePairPrice", str(handle))
    raw = set_field(raw, "handlePairDefault", "true")
    hl = handle_label or "single piece"
    # Update handle-related highlight lines
    raw = re.sub(
        r"'Handle pair ₹[\d,]+'",
        f"'Handle ₹{fmt_inr(handle)} ({hl})'",
        raw,
    )
    raw = re.sub(
        r"'Handle ₹[\d,]+[^']*'",
        f"'Handle ₹{fmt_inr(handle)} ({hl})'",
        raw,
    )
    raw = replace_spec_value(raw, "Handles", f"₹{fmt_inr(handle)} ({hl})")
    return raw


def update_finish_thickness(raw: str, finish: str, thickness: str) -> str:
    raw = set_field(raw, "defaultFinishId", f"'{finish}'")
    raw = set_field(raw, "defaultThicknessId", f"'{thickness}'")
    raw = set_field(raw, "finishOptionIds", f"['{finish}']")
    raw = set_field(raw, "thicknessOptionIds", f"['{thickness}']")
    return raw


def update_colour_finish_spec(raw: str, finish_prose: str) -> str:
    # Preserve trailing motif text after · if present? Prefer full replace with finish_prose
    # Keep existing motif by appending if Colour / Finish has more after finish type
    m = re.search(
        r"(\{\s*label:\s*'Colour / Finish',\s*value:\s*')([^']*)(')",
        raw,
    )
    if not m:
        return raw
    old = m.group(2)
    # If old has motif after · keep last parts that aren't finish words
    new_val = finish_prose
    # Try to keep design motif: take text after last finish-ish segment
    # e.g. keep " · greige matte · recessed arch" style bits if present beyond first
    parts = [p.strip() for p in old.split("·")]
    if len(parts) > 2:
        # keep trailing motif fragments (skip first 1-2 finish words)
        motif = " · ".join(parts[2:]).strip()
        if motif and len(motif) > 3:
            new_val = f"{finish_prose} · {motif}"
    return raw[: m.start()] + m.group(1) + new_val.replace("'", "\\'") + m.group(3) + raw[m.end() :]


def update_board_thickness_spec(raw: str, thickness: str) -> str:
    return replace_spec_value(raw, "Board Thickness", f"{thickness} mm")


def update_shutter_material_spec(raw: str, material: str) -> str:
    return replace_spec_value(raw, "Shutter material", material)


def patch_description_price_finish(
    raw: str,
    price: int,
    thickness: str,
    finish_prose: str,
    material: str,
    handle: int | None,
    handle_label: str | None,
    handle_less: bool,
) -> str:
    """Light-touch description updates for price/thickness/finish mentions."""
    # Price mentions like ₹3,500 / sq ft
    raw = re.sub(
        r"₹[\d,]+(\s*/\s*sq\s*ft)",
        lambda m: f"₹{fmt_inr(price)}" + m.group(1),
        raw,
    )
    # Thickness like 25 mm / 22 mm at start of material clauses
    raw = re.sub(
        r"\b(?:18|22|25|28|30|32)\s*mm\b",
        f"{thickness} mm",
        raw,
        count=3,
    )
    return raw


def apply_update(raw: str, cfg: dict) -> str:
    price = cfg["price"]
    finish = cfg["finish"]
    thickness = cfg["thickness"]
    finish_prose = cfg["finish_prose"]
    material = cfg["material"]
    handle = cfg.get("handle")
    handle_label = cfg.get("handle_label")
    handle_less = bool(cfg.get("handle_less"))
    tag = cfg.get("tag")

    raw = set_field(raw, "price", str(price))
    raw = update_finish_thickness(raw, finish, thickness)
    raw = update_handle_fields(raw, handle, handle_label, handle_less)
    raw = replace_highlight_price(raw, price)
    raw = replace_pricing_spec(raw, price, handle if not handle_less else None, handle_label)
    raw = update_colour_finish_spec(raw, finish_prose)
    raw = update_board_thickness_spec(raw, thickness)
    raw = update_shutter_material_spec(raw, material)
    raw = update_order_notes(
        raw, thickness, material, finish_prose, price, handle, handle_label, handle_less
    )
    raw = patch_description_price_finish(
        raw, price, thickness, finish_prose, material, handle, handle_label, handle_less
    )

    if handle and handle > 0 and not handle_less:
        hl = handle_label or "single piece"
        raw = ensure_highlight(raw, f"Handle ₹{fmt_inr(handle)} ({hl})")

    if handle_less:
        raw = ensure_highlight(raw, "Handle-less")

    if tag:
        raw = ensure_tags(raw, tag)
        raw = ensure_style_tag(raw, tag)
        raw = ensure_highlight(raw, tag)

    # Features line mentioning finish/price — soft update of ₹ and mm
    return raw


def wardrobe_image(products: list[dict], wid: str) -> str:
    for p in products:
        if p["id"] == wid:
            m = re.search(r"image:\s*'([^']+)'", p["raw"])
            if m:
                return m.group(1)
    return "/products/categories/handles.jpg"


def make_handle_product(h: dict, image: str) -> str:
    price = h["price"]
    return f"""  {{
    id: '{h["id"]}',
    name: '{h["name"]}',
    categoryId: 'handles',
    subcategoryId: 'sculpted',
    price: {price},
    currency: 'INR',
    pricingMode: 'unit',
    brand: 'Priyabadal Homes',
    collection: 'Handles',
    sku: '{h["sku"]}',
    description:
      '{h["desc"]} Confirm finish and fitting on WhatsApp.',
    style: ['sculpted', 'modern', 'wardrobe'],
    rooms: ['bedroom', 'wardrobe'],
    image: '{image}',
    images: [
      '{image}',
    ],
    highlights: [
      'Single piece ₹{fmt_inr(price)}',
      'Matches {h["name"].replace(" Handle", " Wardrobe")}',
      'WhatsApp to order',
    ],
    details: [
      {{ label: 'Brand', value: 'Priyabadal Homes' }},
      {{ label: 'Collection', value: 'Handles' }},
      {{ label: 'Sku', value: '{h["sku"]}' }},
      {{ label: 'Pack', value: '1 piece' }},
      {{ label: 'Assembly', value: 'Fitted on-site with shutter / door' }},
      {{ label: 'Warranty', value: "10 Years' warranty on manufacturing defects" }},
    ],
    specifications: [
      {{ label: 'Price', value: '₹{fmt_inr(price)} per piece' }},
      {{ label: 'Pack', value: 'Single piece' }},
      {{
        label: 'Pairs with',
        value: '{h["name"].replace(" Handle", " Wardrobe")} — also sold on the wardrobe quote',
      }},
      {{ label: 'Category', value: 'Handles' }},
      {{ label: 'Subcategory', value: 'Sculpted' }},
      {{ label: 'Country of Origin', value: 'India' }},
      {{ label: 'Care', value: 'Wipe with a soft dry cloth; avoid harsh cleaners' }},
    ],
    features: [
      'Sold as a single piece',
      'Designed for matching wardrobe shutters',
      'Confirm finish and fitting on WhatsApp',
    ],
    disclaimer:
      'Room settings in images are for representation only. Confirm finish and fitting on WhatsApp before order.',
  }}"""


def main() -> None:
    text = CATALOG.read_text()
    header, products, footer = parse_products(text)
    print(f"Parsed {len(products)} products")

    # Removals
    before = len(products)
    removed = [p["id"] for p in products if p["id"] in REMOVE_IDS]
    products = [p for p in products if p["id"] not in REMOVE_IDS]
    print(f"Removed {before - len(products)}: {removed}")

    # Updates
    missing = []
    updated = []
    for pid, cfg in UPDATES.items():
        found = False
        for p in products:
            if p["id"] == pid:
                p["raw"] = apply_update(p["raw"], cfg)
                updated.append(pid)
                found = True
                break
        if not found:
            missing.append(pid)
    print(f"Updated {len(updated)} wardrobes")
    if missing:
        print("MISSING updates:", missing)

    # Handles — insert after pink-lotus-handle-pair if present, else append before end
    existing_ids = {p["id"] for p in products}
    handle_blocks = []
    for h in HANDLES:
        if h["id"] in existing_ids:
            print(f"Handle exists, skip: {h['id']}")
            continue
        img = wardrobe_image(products, h["wardrobe_id"])
        handle_blocks.append(make_handle_product(h, img))
        print(f"Add handle: {h['id']} @ ₹{h['price']} img={img}")

    # Place handles after pink-lotus
    if handle_blocks:
        insert_at = None
        for i, p in enumerate(products):
            if p["id"] == "pink-lotus-handle-pair":
                insert_at = i + 1
                break
        if insert_at is None:
            insert_at = len(products)
        added_handles = [h for h in HANDLES if h["id"] not in existing_ids]
        for j, (h, block) in enumerate(zip(added_handles, handle_blocks)):
            products.insert(insert_at + j, {"id": h["id"], "raw": block})

    # Rebuild catalog
    body = ",\n\n".join(p["raw"] for p in products)
    new_text = header + "\n" + body + "," + footer
    # footer already starts with \n]
    CATALOG.write_text(new_text)
    print(f"Wrote {CATALOG} ({len(products)} products)")

    # Verify
    verify = CATALOG.read_text()
    for pid in REMOVE_IDS:
        if f"id: '{pid}'" in verify:
            print(f"WARN still present: {pid}")
    for pid, cfg in UPDATES.items():
        m = re.search(rf"id: '{pid}'.*?price: (\d+)", verify, re.S)
        if not m:
            print(f"WARN missing after write: {pid}")
        elif int(m.group(1)) != cfg["price"]:
            print(f"WARN price mismatch {pid}: {m.group(1)} != {cfg['price']}")
    for h in HANDLES:
        if f"id: '{h['id']}'" not in verify:
            print(f"WARN handle missing: {h['id']}")
    print("Done.")


if __name__ == "__main__":
    main()
