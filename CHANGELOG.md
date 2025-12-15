# Changelog - Tissue Deck Slide System Overhaul


---

## 🏷️ v6.5 - BRANDING UPDATE
**Date:** December 15, 2025 (6:20 PM IST)

### 📝 Slide Viewer Branding
- **Updated footer** — Changed slide viewer credit from "MIT Licensed" to "MIT License | ©2025 PJ"

---

## 🪟 v6.1 - GLASS UI REFINEMENTS
**Date:** December 15, 2025 (6:00 PM IST)

### 🎨 Glassmorphism Improvements
Applied cohesive glass effects to major UI containers:

- **Sidebar Container** — Glass effect with gradient overlay, backdrop blur (20px), and subtle border
- **Theory Panel Container** — Matching glass effect for visual consistency
- **Chatbot UI** — Increased blur from 32px → 64px and opacity from 0.35 → 0.88 for better text coverage

### 📜 Sleeker Scrollbars
Completely redesigned scrollbars for a minimal, modern look:
- Width reduced from 10px → 6px
- Track now transparent
- Thumb uses subtle 8% opacity (15% on hover)
- Removed heavy gradients and borders

### 📌 Fixed Sidebar Header (Desktop)
- "Tissue Deck" title and search bar now stay fixed at top
- Only the navigation list scrolls independently below
- Better UX for long category lists

### 🧭 Navigation Alignment
- All nav items, section headers, and subsection headers now align on the same vertical axis
- Consistent left padding (40px) across all levels

### 📱 Tablet Mode Chatbot Fix
- Chatbot now uses `position: fixed` with `z-index: 1000`
- Floats above both slide viewer and theory panel
- Proper viewport-aware max-height with `calc()`

### ⚡ Font Loading
- Added `display=swap` for non-blocking font loading
- Fonts load in background while showing fallback text immediately

#### Files Changed
| File | Change |
|------|--------|
| `src/App.module.css` | Glass sidebar, fixed header, sleeker scrollbars, nav alignment |
| `src/components/ChatBot.module.css` | Increased blur, tablet mode fixes |
| `src/styles/global.css` | Minimal scrollbar styling |
| `index.html` | Font display swap |

---

## 🧹 v6.0 - THE GREAT DEBLOAT
**Date:** December 15, 2025 (5:35 PM IST)

### 🪶 Major Codebase Cleanup
Massive refactoring effort to reduce bloat and improve maintainability.

#### Metrics
| Metric | Before | After |
|--------|--------|-------|
| `App.jsx` lines | 1,278 | 330 |
| Total lines removed | — | **1,135** |
| CSS organization | Inline | Module |

#### Changes
- **Extracted Inline CSS** — Moved ~900 lines of inline CSS from `App.jsx` to new `App.module.css`
- **Removed Unused Component** — Deleted `LiquidGlassFilter.jsx` (187 lines) — SVG filters were never used
- **Removed Duplicate Code** — Eliminated duplicate `@keyframes blink` animation
- **Consolidated Responsive Styles** — Merged repeated media query rules

#### Files Changed
| File | Change |
|------|--------|
| `src/App.jsx` | Refactored from 1,278 → 330 lines |
| `src/App.module.css` | **NEW** — Extracted CSS module |
| `src/components/LiquidGlassFilter.jsx` | **DELETED** — Unused |

---

## 🔒 v5.6 - BOUNDARY LOCK & UI POLISH
**Date:** December 15, 2025 (4:35 PM IST)

### 🖼️ Slide Viewer Improvements
- **Pan Boundary Constraints** — The slide image can no longer be dragged beyond the edges of the viewer box
  - Image edges will stop at the container edges when panning
  - Works seamlessly with all zoom levels
  - Position automatically re-clamps when zooming out
  - Prevents "losing" the image off-screen during navigation

### 🐛 Bug Fixes
- **Fixed Passive Event Listener Error** — Resolved console errors for `preventDefault` inside passive touch/wheel events
  - Touch and wheel events now use native `addEventListener` with `{ passive: false }`
  - Pinch-to-zoom and scroll-to-zoom now work without console warnings
- **Form Accessibility** — Added `id` and `name` attributes to search and chat input fields
  - Fixes browser autofill warnings

### 📱 Tablet Layout Improvements
- **Consistent Header Layout** — Tablet view (768px - 1024px) now matches mobile layout:
  - "Tissue Deck" branding centered in top row
  - Breadcrumbs displayed in a translucent box below
  - Previously the branding would disappear at tablet widths
- **Hidden Zoom Controls on Tablet** — Removed zoom buttons (-/↻/+) on tablet view since pinch-to-zoom is available
  - Consistent with mobile behavior
  - Fixed slide controls padding after removing zoom buttons

### 🔍 Search UX Improvements
- **Clear Button** — Added an (X) button inside the search input that appears when text is present
  - One-tap clearing of search queries
  - Circular button with subtle hover effects
- **Auto-Select on Focus** — Tapping/clicking the search input now selects all text
  - Makes it easy to replace the current search on mobile
  - Standard UX pattern for search fields

### 🔧 Technical Details
- Added `clampPosition` function to calculate maximum allowed pan distance
- Boundary calculation considers container dimensions, image aspect ratio, and zoom level
- Refactored touch/wheel handlers into `useEffect` with `stateRef` for proper state access

---

## �🔍 v5.5 - VIEWER POLISH
**Date:** December 15, 2025 (12:17 PM IST)

### 🖼️ Slide Viewer Improvements
- **Zoom Limit** — Maximum zoom-out now stops at 100% (image never shrinks smaller than the viewport)
- **Slide Navigation Reset** — Switching between slides (1/n, 2/n, etc.) now resets zoom and position to default

### 📜 Theory Panel Improvements
- **Scroll Reset** — Changing tissue sections now scrolls the theory panel back to the top automatically

---

## 💅 v5.4 - THE LAYOUT POLISH
**Date:** December 15, 2025 (5:08 AM IST)

### 🖥️ Desktop UI Refinements
- **ChatBot Constraint** — The AI ChatBot is now strictly encapsulated within the "Theory Panel" column on desktop.
  - No longer floats over other content or obscures the slide.
  - Resizes dynamically with the layout.
  - Maintains `position: absolute` context relative to the info column.

### 📱 Mobile UI Refinements
- **Sticky Sidebar Footer** — The "Made with ❤️" footer in the sidebar is now permanently visible at the bottom of the list.
  - Added aggressive padding to prevent it from being cut off by browser URL bars.
  - Improved contrast (bright white text).
- **Docked ChatBot** — On mobile, the ChatBot remains docked to the bottom-right of the viewport for easy access.
- **Unified Layout** — Refactored internal component structure (`info-column`) to handle both desktop constraints and mobile flexibility cleanly.

---

## 📱 v5.3 - APP-SOLUTELY NATIVE (PWA)
**Date:** December 15, 2025 (4:45 AM IST)

### 📲 Installable App Experience
Tissue Deck is now a full-fledged **Progressive Web App (PWA)**!
- **Add to Home Screen** — Install the app on Android and iOS devices.
- **Standalone Mode** — Launches without the browser address bar/UI for a native app feel.
- **Native Integration** — configured with correct icons, meta tags, and manifest for seamless mobile OS integration.

---

## 💎 v5.269 - THE POLISHED GEM UPDATE
**Date:** December 15, 2025 (4:15 AM IST)

### ✨ Meded AI & Visual Polish
This update solidifies the platform's identity, refining the user experience from the smallest pixel (favicon) to the core learning interactions (Meded AI).

### 🤖 Meded AI Rebranding
- **Identity Shift** — Officially renamed "Histology AI" to **"Meded AI"**.
- **Secure Logging** — Implemented chat logging for security and analytics.
- **Model Verification** — Validated system prompts and model IDs to ensure high-quality responses.

### 🎨 Visual & UI Refinements
- **🔬 New Favicon** — Updated site icon to a custom microscope glyph.
- **📱 Mobile Perfection** — 
  - Isolated touch gestures (zooming the slide won't scroll the page).
  - Fixed non-responsive buttons on mobile.
  - Maximized data box usage for better reading on small screens.
- **🧹 Sidebar Cleanup** — Removed count numbers for a cleaner, modern aesthetic; improved folder navigation logic for single-item categories.
- **💬 Chat Interface** — Fixed padding and layout issues in `ChatBot.module.css`.
- **📜 Footer Quote** — Added "_To err is human, to forgive is design._"

### 📚 Content Expansion (Phase 5 Complete)
- **Haematolymphoid System** — Full data (features, location, function, exam tips) for all 4 slides.
- **Musculoskeletal System** — Complete histology coverage for all 7 slides including Skeletal, Smooth, Cardiac Muscle, and Bone/Cartilage types.

### 🔧 Technical Tuning
- **Scroll Zoom** — Fine-tuned minimum zoom level to `0.35x` for better context.
- **Navigation Logic** — Smarter sidebar expansion for smoother browsing.

---

## 🤖 v5.0 - AI HISTOLOGY ASSISTANT 🤖
**Date:** December 15, 2025 (2:20 AM IST)

### 🎉 THE BOLDEST UPDATE YET - AI-POWERED LEARNING

Tissue Deck now features an **AI chatbot** that helps students understand histology in context! Ask questions about any tissue you're viewing and get instant, exam-relevant answers.

---

### ✨ New Features

#### AI Chatbot Integration
- **🔬 Context-Aware AI** — The chatbot automatically receives information about the tissue you're viewing
- **💬 Floating Chat Interface** — Beautiful glassmorphism design floating over the slide viewer
- **📱 Mobile-Friendly** — Works seamlessly on all devices
- **⚡ Streaming Responses** — Watch the AI type responses in real-time
- **🔐 Firebase Authentication** — Secure Google sign-in required
- **📊 Rate Limiting** — 100 messages per user per month (tracked per account)

#### Technical Stack
- **Vercel AI Gateway** — Unified API for AI model access
- **OpenAI GPT-5 Nano** — Fast, affordable AI model ($0.05/1M input tokens)
- **Firebase Auth** — Free tier with 50K MAUs
- **Vercel Serverless Functions** — Backend API routes

---

### 📁 Files Added

| File | Purpose |
|------|---------|
| `src/firebase.js` | Firebase initialization |
| `src/contexts/AuthContext.jsx` | React auth context provider |
| `src/components/ChatBot.jsx` | AI chat interface component |
| `src/components/ChatBot.module.css` | Glassmorphism styling |
| `api/chat.js` | Vercel serverless API endpoint |
| `vercel.json` | Serverless function config |
| `.env.example` | Environment variables template |

### 📝 Files Modified

| File | Change |
|------|--------|
| `src/main.jsx` | Wrapped app with AuthProvider |
| `src/components/SlideViewer.jsx` | Integrated ChatBot component |
| `package.json` | Added firebase, ai, @ai-sdk/react deps |

---

### 🛠️ Setup Required

To enable the AI chatbot, you need to:
1. Create a Vercel account and get an AI Gateway API key
2. Create a Firebase project and enable Google Authentication
3. Add environment variables to `.env.local` (see `.env.example`)
4. Deploy to Vercel for serverless functions to work

---

### 💡 Usage Tips

- Click the chat input to expand the full chat interface
- Ask about tissue features, clinical correlations, exam tips
- The AI knows exactly which tissue you're viewing
- Works best with specific questions like "What are the key features of this tissue?"

---

## v4.21 - Mobile UI Improvements
**Date:** December 15, 2025 (2:00 AM IST)

### UI/UX Improvements

- **📱 Expanded Info Panel on Mobile** — Removed restrictive max-height on the data box so it fills all available space until the footer
- **🔍 Hidden Zoom Controls on Mobile** — Removed zoom buttons (-/↻/+) on mobile view since pinch-to-zoom is available
- **📏 Taller Slide Viewer on Mobile** — Increased min-height from 280px→350px (768px) and 220px→280px (480px) for better slide visibility
- **🔘 Smaller Navigation Buttons** — Shrunk slide navigation controls from 44px→36px (768px) and 40px→32px (480px) to be less obtrusive
- **🧹 Less Wasted Space** — Mobile layout now uses screen real estate more efficiently

### Files Modified
| File | Change |
|------|--------|
| `src/App.jsx` | Increased slide-section min-height on mobile breakpoints |
| `src/components/SlideViewer.module.css` | Smaller control buttons, reduced padding, hidden zoomControls |

---

## 🚀 v4.20 - THE KNOWLEDGE EXPLOSION UPDATE 🚀
**Date:** December 15, 2025 (1:20 AM IST)  
**Session Duration:** ~2 hours  

### 🎉 THE BIGGEST UPDATE IN TISSUE DECK HISTORY

This release transforms Tissue Deck from a simple slide viewer into a **comprehensive histology learning platform** for 1st-year MBBS students.

---

### 📊 By The Numbers

| Metric | Count |
|--------|-------|
| **Total Slides Enhanced** | **100+** |
| **Categories Completed** | **13** |
| **Exam Tips Written** | **100+** |
| **Key Features Documented** | **500+** |
| **Lines of Data Added** | **4,000+** |

---

### 🧠 Full Theory Integration

Every slide now includes:
- **📝 Description** — Concise overview of the tissue
- **🔬 Key Identification Features** — 4-5 diagnostic features for spotting exams
- **📍 Anatomical Location** — Where to find it in the body
- **⚙️ Function** — What it does
- **💡 Exam Tips** — High-yield points straight from the examiner's perspective

---

### 📚 Systems Completed

#### Phase 1 — Core Systems ✅
| System | Slides |
|--------|--------|
| Cardiovascular System | 12 |
| Central Nervous System | 32+ |
| Respiratory Tract | 3 |
| Breast | 1 |

#### Phase 2 — Digestive & Accessory ✅
| System | Slides |
|--------|--------|
| Gastrointestinal Tract | 14 |
| Hepatobiliary System & Pancreas | 8 |

#### Phase 3 — Specialized Organs ✅
| System | Slides |
|--------|--------|
| Eye | 8 |
| Skin | 2 |
| Thyroid & Endocrine System | 3 |

#### Phase 4 — Reproductive & Urinary ✅
| System | Slides |
|--------|--------|
| Female Genital Tract | 3 |
| Urogenital & Male Reproductive | 7 |

#### Phase 5 — Support Systems ✅
| System | Slides |
|--------|--------|
| Haematolymphoid System | 4 |
| Musculoskeletal System | 6 |

---

### 🛠️ Technical Improvements

#### Data Architecture Overhaul
- **Refactored** monolithic `slides.json` into **13 category-specific JSON files**
- Created centralized `src/data/slides/index.js` aggregator
- Improved maintainability and load performance
- Original `slides.json` backed up as `slides.original.json`

#### UI Refinements
- **Fixed** Key Identification Points padding for better readability
- **Improved** Exam Tips layout with proper text wrapping
- **Changed** Location/Function display to separate rows
- **Added** proper `margin-bottom` spacing between Function section and Exam Tips
- **Removed** count badges from sidebar categories/sections (cleaner look)
- **Changed** slide viewer branding from "Open Source Histology" to "MIT Licensed"

---

### 💎 Sample Exam Tips

> **Liver**: "Blood flows Centripetally (Triad → Central Vein). Bile flows Centrifugally (Hepatocytes → Triad). Kupffer cells are liver macrophages."

> **Thymus**: "Hassall's Corpuscles are DIAGNOSTIC (look like pink onions in the medulla)."

> **Kidney**: "Differentiate PCT vs DCT: PCT has messy lumen (brush border) and is very pink. DCT has clean lumen and is paler."

> **Cornea**: "AVASCULAR (gets O2 from air/aqueous humor). Transparency due to regular collagen arrangement + dehydration."

---

### 📁 Files Added/Modified

| File | Change |
|------|--------|
| `src/data/slides/*.json` | 13 new category-specific JSON files |
| `src/data/slides/index.js` | New aggregator module |
| `src/components/TheoryPanel.module.css` | UI spacing fixes |
| `src/App.jsx` | Updated import path |

---

### 🎯 Perfect For

- ✅ Histology practical exams
- ✅ Spotting tests
- ✅ Viva voce preparation
- ✅ Quick revision before exams
- ✅ Understanding slide identification

---


## v1.0.1 - Mobile Button Fix
**Date:** December 15, 2025 (12:38 AM IST)

### Bug Fixes
- ✅ **Fixed mobile control buttons not responding to taps** - Touch events on zoom/slide navigation buttons were being blocked by the parent container's gesture handling. Added `stopPropagation()` to the controls overlay to isolate button interactions from drag/zoom gestures.

---

## v1.0.0 - Initial Release
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
