# Changelog - Tissue Deck Slide System Overhaul

**Date:** December 15, 2025  
**Session Duration:** ~1 hour (11:00 PM - 12:22 AM IST)

---

## Overview

Major overhaul of the slide organization system, adding new slide viewer functionality, hierarchical sidebar navigation, and improved user experience.

---

## New Features

### 1. SlideViewer Component (NEW)
- **Created `src/components/SlideViewer.jsx`** - Complete slide viewer component that was previously missing
- Features:
  - Image display with zoom/pan support
  - Linear slide navigation with `[-] 1/n [+]` controls
  - Mouse wheel zoom support
  - Touch gesture support for mobile
  - Drag to pan at any zoom level
  - Error handling for missing images

### 2. Slide Data Organization
- **Created `scripts/scanSlides.js`** - Script to scan slide folders and generate organized JSON
- **Generated `src/data/slides.json`** - 93 tissue entries automatically categorized
- Slides organized by power level: low → medium → high → default
- Hierarchical structure: Category → Section → Subsection

### 3. Hierarchical Sidebar Navigation
- Three-level nesting: Categories, Sections, Subsections
- Expandable/collapsible sections with item counts
- **Smart single-item handling:** Sections with only 1 item render directly as buttons (no unnecessary dropdowns)

---

## UI/UX Improvements

### Controls Overlay
- Linear slide navigation: `[-] [⟳] [+] | [-] 1/n [+]`
- Single separator between zoom and slide controls (fixed double `||` issue)
- Rounded corners on controls overlay (16px border-radius)

### Sidebar
- Fixed text alignment to be consistently left-aligned
- Removed "Uncategorized" label - Breast now shows as its own category
- Proper nesting indentation with visual border lines

### Zoom & Pan
- Extended minimum zoom to 0.35x (was 0.5x)
- Enabled panning at any zoom level (was restricted to >1x)
- Added mouse wheel zoom support

### Mobile Responsiveness
- Vertical layout for controls on mobile (flex-direction: column)
- Larger touch targets for slide navigation buttons (44px on tablet, 40px on phone)
- Proper spacing adjustments for smaller screens
- **Touch Gesture Isolation:** Pinch-to-zoom and panning on the slide viewer no longer affects the whole page
- **Mobile Pinch-to-Zoom:** Added two-finger pinch gesture support for zooming slides
- **Mobile Footer Credit:** "Made with ❤️ by Pranay Juneja" now displays at the bottom on mobile

---

## Files Modified

| File | Change Type |
|------|-------------|
| `src/components/SlideViewer.jsx` | Created (new) |
| `src/components/SlideViewer.module.css` | Modified (new styles) |
| `src/App.jsx` | Modified (data handling, sidebar) |
| `src/data/slides.json` | Created (generated) |
| `scripts/scanSlides.js` | Created (utility script) |

---

## Technical Details

### Slide Organization Logic
```
Folder Structure:
public/slides/
├── Breast/
│   └── normal-breast-1.jpg, normal-breast-2.jpg
├── Cardiovascular System/
│   ├── Heart/
│   │   └── Myocardium/
│   └── Blood vessels/
│       └── Aorta/
│           ├── Aorta-Low-power-1.jpg
│           ├── Aorta-Medium-power-1.jpg
│           └── Aorta-High-power-6.jpg
```

### Power Level Detection
Files parsed by naming convention:
- `*-low-*` or `*_low_*` → Low power
- `*-medium-*` or `*-med-*` → Medium power  
- `*-high-*` or `*_high_*` → High power
- All others → Default

---

## Breaking Changes

- Removed old `tissues.json` import in favor of new `slides.json`
- Changed SlideViewer props from `group/selectedMagnification` to `tissue`
- Removed Low/Med/High buttons in favor of linear navigation

---

## Known Issues Fixed

- ✅ Missing SlideViewer component
- ✅ Double separator (`||`) in controls
- ✅ "Uncategorized" category for Breast
- ✅ Centered text in sidebar headers
- ✅ Zoom restricted to >1x for panning
