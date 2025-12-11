# Version History

## v1.0 - Mobile UX Overhaul
**Date:** 2025-12-11
- **Feature:** Enhanced Mobile Header
    - Moved "Tissue Deck" brand to top-center of mobile view.
    - Added breadcrumbs directly beneath the header in a styled translucent box.
- **Feature:** Mobile Sidebar Refinement
    - Removed duplicate "Tissue Deck" brand from sidebar on mobile.
    - Aligned Search Bar and Close button on same row for better space utilization (Search | X).

## v0.01 - Mobile Responsiveness
**Date:** 2025-12-11
- **Feature:** Full mobile and tablet responsiveness.
  - Implemented hamburger menu for sidebar toggling on screens < 1024px.
  - Added sidebar overlay behavior with slide-in animation.
  - Updated `App.jsx` layout to stack "Slide Viewer" and "Theory Panel" vertically on mobile devices.
  - Adjusted `SlideViewer` controls for better touch accessibility (larger buttons, optimized placement).
  - Configured `TheoryPanel` to use a single-column grid on mobile for better readability.
- **Fix:** Resolved sidebar visibility issue on tablet widths (around 850px) by removing conflicting legacy CSS.

## v0.00 - Initial Release
**Date:** 2025-12-11
- Initial release of Tissue Deck website.
- Core features:
  - Slide viewing with zoom and pan.
  - Tissue theory panel with description, features, location, function, and exam tips.
  - Categorized sidebar navigation.
  - Search functionality.
  - Desktop-optimized layout.
