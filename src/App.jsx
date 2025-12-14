import { useState, useMemo, useEffect } from 'react';
import slides from './data/slides.json';
import SlideViewer from './components/SlideViewer';
import TheoryPanel from './components/TheoryPanel';
import './styles/global.css';

function App() {
  const [selectedTissueId, setSelectedTissueId] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Process slides into hierarchical structure for sidebar
  const { tissueList, hierarchicalCategories } = useMemo(() => {
    // Create a simple list for selection
    const list = slides.map(tissue => ({
      ...tissue,
      displayName: tissue.name,
      // Combine all slides for display purposes
      allSlides: [
        ...(tissue.slides.low || []),
        ...(tissue.slides.medium || []),
        ...(tissue.slides.high || []),
        ...(tissue.slides.default || [])
      ]
    }));

    // Create hierarchical structure for sidebar
    const hierarchy = {};
    slides.forEach(tissue => {
      const cat = tissue.category || 'Uncategorized';
      if (!hierarchy[cat]) {
        hierarchy[cat] = { sections: {}, items: [] };
      }

      if (tissue.section) {
        if (!hierarchy[cat].sections[tissue.section]) {
          hierarchy[cat].sections[tissue.section] = { subsections: {}, items: [] };
        }

        if (tissue.subsection) {
          if (!hierarchy[cat].sections[tissue.section].subsections[tissue.subsection]) {
            hierarchy[cat].sections[tissue.section].subsections[tissue.subsection] = [];
          }
          hierarchy[cat].sections[tissue.section].subsections[tissue.subsection].push(tissue);
        } else {
          hierarchy[cat].sections[tissue.section].items.push(tissue);
        }
      } else {
        hierarchy[cat].items.push(tissue);
      }
    });

    return { tissueList: list, hierarchicalCategories: hierarchy };
  }, []);

  // Initialize selection
  useEffect(() => {
    if (!selectedTissueId && tissueList.length > 0) {
      setSelectedTissueId(tissueList[0].id);
    }
  }, [tissueList, selectedTissueId]);

  // Get current selection
  const selectedTissue = tissueList.find(t => t.id === selectedTissueId) || tissueList[0];

  // Filter based on search
  const filteredTissues = tissueList.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.section && t.section.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleSection = (sectionKey, singleItem = null) => {
    // If there's only one item in this section, auto-select it
    if (singleItem) {
      handleTissueSelect(singleItem);
    }
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleTissueSelect = (tissue) => {
    setSelectedTissueId(tissue.id);
    // Close sidebar on mobile after selection
    setSidebarOpen(false);
  };

  // Build filtered hierarchical categories when searching
  const getFilteredCategories = () => {
    if (!searchTerm) return hierarchicalCategories;

    // When searching, show flat list of matching tissues grouped by category
    const filtered = {};
    filteredTissues.forEach(tissue => {
      const cat = tissue.category;
      if (!filtered[cat]) {
        filtered[cat] = { sections: {}, items: [] };
      }
      filtered[cat].items.push(tissue);
    });
    return filtered;
  };

  const displayCategories = getFilteredCategories();

  return (
    <div className="layout">
      {/* Mobile Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <h1>
            <span className="brand-prefix">&gt;</span>
            <span className="brand-text">Tissue Deck</span>
            <span className="cursor"></span>
          </h1>
        </div>

        <div className="sidebar-controls">
          <div className="search-container">
            <span className="material-icon search-icon">search</span>
            <input
              type="text"
              placeholder="Search slides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>
            <span className="material-icon">close</span>
          </button>
        </div>

        <nav className="nav-list">
          {Object.entries(displayCategories).map(([category, catData]) => {
            const totalItems = catData.items.length +
              Object.values(catData.sections).reduce((sum, sec) =>
                sum + sec.items.length + Object.values(sec.subsections).reduce((s, sub) => s + sub.length, 0), 0);

            return (
              <div key={category} className="category-group">
                <button
                  className="category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex-row">
                    <span className="material-icon header-icon">
                      {expandedCategories[category] || searchTerm ? 'expand_more' : 'chevron_right'}
                    </span>
                    <span>{category}</span>
                  </div>
                  <span className="count">{totalItems}</span>
                </button>

                {(expandedCategories[category] || searchTerm) && (
                  <div className="category-items">
                    {/* Direct items under category */}
                    {catData.items.map(tissue => (
                      <button
                        key={tissue.id}
                        className={`nav-item ${selectedTissueId === tissue.id ? 'active' : ''}`}
                        onClick={() => handleTissueSelect(tissue)}
                      >
                        {tissue.name}
                      </button>
                    ))}

                    {/* Sections */}
                    {Object.entries(catData.sections).map(([sectionName, secData]) => {
                      const sectionKey = `${category}-${sectionName}`;
                      const sectionTotal = secData.items.length +
                        Object.values(secData.subsections).reduce((s, sub) => s + sub.length, 0);

                      // Find single item if section has exactly 1 item total
                      let sectionSingleItem = null;
                      if (sectionTotal === 1) {
                        if (secData.items.length === 1) {
                          sectionSingleItem = secData.items[0];
                        } else {
                          // Check subsections for single item
                          const allSubItems = Object.values(secData.subsections).flat();
                          if (allSubItems.length === 1) sectionSingleItem = allSubItems[0];
                        }
                      }

                      // If section has only 1 item, render it directly without dropdown
                      if (sectionSingleItem) {
                        return (
                          <button
                            key={sectionKey}
                            className={`nav-item ${selectedTissueId === sectionSingleItem.id ? 'active' : ''}`}
                            onClick={() => handleTissueSelect(sectionSingleItem)}
                          >
                            {sectionSingleItem.name}
                          </button>
                        );
                      }

                      return (
                        <div key={sectionKey} className="section-group">
                          <button
                            className="section-header"
                            onClick={() => toggleSection(sectionKey)}
                          >
                            <div className="flex-row">
                              <span className="material-icon header-icon" style={{ fontSize: '16px' }}>
                                {expandedSections[sectionKey] ? 'expand_more' : 'chevron_right'}
                              </span>
                              <span>{sectionName}</span>
                            </div>
                            <span className="count">{sectionTotal}</span>
                          </button>

                          {expandedSections[sectionKey] && (
                            <div className="section-items">
                              {/* Direct items under section */}
                              {secData.items.map(tissue => (
                                <button
                                  key={tissue.id}
                                  className={`nav-item ${selectedTissueId === tissue.id ? 'active' : ''}`}
                                  onClick={() => handleTissueSelect(tissue)}
                                >
                                  {tissue.name}
                                </button>
                              ))}

                              {/* Subsections */}
                              {Object.entries(secData.subsections).map(([subsectionName, tissues]) => {
                                const subKey = `${sectionKey}-${subsectionName}`;

                                // If subsection has only 1 item, render it directly without dropdown
                                if (tissues.length === 1) {
                                  return (
                                    <button
                                      key={subKey}
                                      className={`nav-item ${selectedTissueId === tissues[0].id ? 'active' : ''}`}
                                      onClick={() => handleTissueSelect(tissues[0])}
                                    >
                                      {tissues[0].name}
                                    </button>
                                  );
                                }

                                return (
                                  <div key={subKey} className="subsection-group">
                                    <button
                                      className="subsection-header"
                                      onClick={() => toggleSection(subKey)}
                                    >
                                      <div className="flex-row">
                                        <span className="material-icon header-icon" style={{ fontSize: '14px' }}>
                                          {expandedSections[subKey] ? 'expand_more' : 'chevron_right'}
                                        </span>
                                        <span>{subsectionName}</span>
                                      </div>
                                      <span className="count">{tissues.length}</span>
                                    </button>

                                    {expandedSections[subKey] && (
                                      <div className="subsection-items">
                                        {tissues.map(tissue => (
                                          <button
                                            key={tissue.id}
                                            className={`nav-item ${selectedTissueId === tissue.id ? 'active' : ''}`}
                                            onClick={() => handleTissueSelect(tissue)}
                                          >
                                            {tissue.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredTissues.length === 0 && (
            <div className="no-results">No slides found</div>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <div className="mobile-header-row">
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
                <span className="material-icon">menu</span>
              </button>
              <div className="brand mobile-brand">
                <h1>
                  <span className="brand-prefix">&gt;</span>
                  <span className="brand-text">Tissue Deck</span>
                  <span className="cursor"></span>
                </h1>
              </div>
            </div>
            <div className="breadcrumbs">
              <span className="crumb-category">{selectedTissue?.category}</span>
              {selectedTissue?.section && (
                <>
                  <span className="crumb-separator">/</span>
                  <span className="crumb-section">{selectedTissue?.section}</span>
                </>
              )}
              <span className="crumb-separator">/</span>
              <span className="crumb-name">{selectedTissue?.name}</span>
            </div>
          </div>

          <div className="view-controls">
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.9rem' }}>
              Made with ❤️ by <a href="https://pranayjuneja.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Pranay Juneja</a>
            </span>
          </div>
        </header>

        <div className="work-area">
          <div className="slide-section">
            <SlideViewer
              tissue={selectedTissue}
              showLabels={showLabels}
            />
          </div>
          <div className="info-section">
            <TheoryPanel tissue={selectedTissue} />
          </div>
        </div>

        {/* Mobile Footer */}
        <footer className="mobile-footer">
          Made with ❤️ by <a href="https://pranayjuneja.com" target="_blank" rel="noopener noreferrer">Pranay Juneja</a>
        </footer>
      </main>

      <style>{`
        .layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          height: 100vh;
          overflow: hidden;
          background-color: var(--md-sys-color-background);
          color: var(--md-sys-color-on-background);
        }

        /* Sidebar Styling */
        .sidebar {
          background-color: var(--md-sys-color-surface);
          display: flex;
          flex-direction: column;
          padding: 20px;
          border-right: 1px solid var(--md-sys-color-outline); /* Reduced opacity outline via alpha usually, or specific color */
          border-right-color: rgba(147, 143, 153, 0.2);
          overflow-y: auto;
        }

        .brand h1 {
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
          font-size: 1.4rem;
          margin: 0 0 24px 0;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
        }

        .brand-prefix {
          color: #4DB6AC;
          margin-right: 4px;
          font-weight: 500;
        }

        .brand-text {
          color: #FFFFFF;
          font-weight: 500;
        }

        .cursor {
            display: inline-block;
            color: #FFE082;
            margin-left: 2px;
            font-weight: 500;
            animation: blink 1s step-end infinite;
        }
        .cursor::after {
            content: '_';
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        .sidebar-controls {
          display: block;
          margin-bottom: 24px;
        }

        .search-container {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--md-sys-color-on-surface-variant);
          font-size: 20px;
        }

        .search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px 10px 40px;
          background-color: var(--md-sys-color-surface-variant);
          border: none;
          border-radius: var(--radius-full);
          color: var(--md-sys-color-on-surface-variant);
          font-family: var(--font-family-base);
          font-size: 0.9rem;
          outline: 2px solid transparent;
          transition: all 0.2s;
        }

        .search-input:focus {
          background-color: var(--md-sys-color-surface-variant); /* slightly lighter if needed */
          color: var(--md-sys-color-on-surface);
          outline: 2px solid var(--md-sys-color-primary);
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-group {
          margin-bottom: 4px;
        }

        .category-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--md-sys-color-on-surface);
          font-family: var(--font-family-base);
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background 0.2s;
          text-align: left;
        }

        .category-header:hover {
          background-color: rgba(230, 225, 229, 0.08);
        }

        .flex-row {
            display: flex;
            align-items: center;
            gap: 8px;
            text-align: left;
            flex: 1;
        }

        .flex-row span:not(.material-icon) {
            text-align: left;
        }

        .header-icon {
            font-size: 20px;
            color: var(--md-sys-color-on-surface-variant);
        }

        .count {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface-variant);
          background: rgba(230, 225, 229, 0.1);
          padding: 2px 8px;
          border-radius: 12px;
        }

        .category-items {
          display: flex;
          flex-direction: column;
          margin-top: 4px;
          padding-left: 12px; 
          border-left: 1px solid rgba(147, 143, 153, 0.2);
          margin-left: 20px;
        }

        /* Section and Subsection Styling */
        .section-group {
          margin-top: 4px;
        }

        .section-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: transparent;
          border: none;
          color: var(--md-sys-color-on-surface-variant);
          font-family: var(--font-family-base);
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background 0.2s;
        }

        .section-header:hover {
          background-color: rgba(230, 225, 229, 0.08);
        }

        .section-items {
          display: flex;
          flex-direction: column;
          padding-left: 12px;
          border-left: 1px solid rgba(147, 143, 153, 0.15);
          margin-left: 16px;
          margin-top: 2px;
        }

        .subsection-group {
          margin-top: 2px;
        }

        .subsection-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: var(--md-sys-color-on-surface-variant);
          font-family: var(--font-family-base);
          font-weight: 400;
          font-size: 0.8rem;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background 0.2s;
        }

        .subsection-header:hover {
          background-color: rgba(230, 225, 229, 0.08);
        }

        .subsection-items {
          display: flex;
          flex-direction: column;
          padding-left: 10px;
          border-left: 1px solid rgba(147, 143, 153, 0.1);
          margin-left: 12px;
          margin-top: 2px;
        }

        .nav-item {
          text-align: left;
          padding: 8px 16px;
          margin: 2px 0;
          background: transparent;
          border: none;
          border-radius: var(--radius-full); /* Material list item style */
          color: var(--md-sys-color-on-surface-variant);
          font-family: var(--font-family-base);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-item:hover {
          background-color: rgba(230, 225, 229, 0.08); /* Hover state */
          color: var(--md-sys-color-on-surface);
        }

        .nav-item.active {
          background-color: var(--md-sys-color-secondary-container);
          color: var(--md-sys-color-on-secondary-container);
          font-weight: 500;
        }

        /* Main Content */
        .main-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100vh;
          box-sizing: border-box;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(147, 143, 153, 0.2);
        }

        .mobile-brand {
            display: none;
        }
        
        .mobile-header-row {
            display: contents; /* On desktop, let children flow naturally */
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--md-sys-color-on-surface-variant);
          font-size: 0.9rem;
        }

        .crumb-name {
          color: var(--md-sys-color-on-surface);
          font-weight: 500;
          font-size: 1.1rem;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px 16px;
          background: var(--md-sys-color-surface-variant);
          border-radius: var(--radius-full);
          transition: 0.2s;
        }

        .toggle-label:hover {
            background: var(--md-sys-color-outline); /* Slightly darker */
        }

        .toggle-text {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--md-sys-color-on-surface-variant);
        }

        .work-area {
            display: grid;
            grid-template-columns: 3fr 1fr;
            gap: 24px;
            flex: 1;
            min-height: 0;
        }

        .slide-section {
            background: #000;
            border-radius: var(--radius-lg);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-2);
        }
        
        .info-section {
            background: var(--md-sys-color-surface);
            border-radius: var(--radius-lg);
            border: 1px solid rgba(147, 143, 153, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* ========= RESPONSIVE STYLES ========= */
        
        /* Hide mobile-only elements on desktop */
        .mobile-footer {
          display: none;
        }
        
        /* Mobile/Tablet Sidebar Overlay */
        .sidebar-overlay {
          display: none;
        }

        .sidebar-header-mobile {
          display: none;
        }

        .hamburger-btn {
          display: none;
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .close-sidebar-btn {
          display: none; /* Hidden on desktop */
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: transparent;
          border: none;
          color: var(--md-sys-color-on-surface);
          cursor: pointer;
          border-radius: var(--radius-full);
          transition: background 0.2s;
          flex-shrink: 0; /* Don't shrink in flex container */
        }

        .close-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Responsive Breakpoint: < 1024px (Tablets & Mobile) */
        @media (max-width: 1024px) {
          .layout {
            grid-template-columns: 1fr;
          }

          /* Hide sidebar by default, show as overlay when open */
          .sidebar {
            display: flex; /* Override any potential display:none */
            position: fixed;
            top: 0;
            left: 0;
            width: 85%;
            max-width: 320px;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: none;
          }

          .sidebar.sidebar-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
          }

          .sidebar-header-mobile {
              display: none; /* Removed from DOM but keeping just in case or clearing styles */
          }

          .sidebar-controls {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 16px;
              margin-top: 8px; /* Add some top spacing since brand is hidden */
          }

          .search-container {
              flex: 1;
          }

          .sidebar .brand {
             display: none;
          }

          .close-sidebar-btn {
              display: flex; /* Show on mobile */
          }

          .hamburger-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            background: transparent;
            border: none;
            color: var(--md-sys-color-on-surface);
            cursor: pointer;
            border-radius: var(--radius-full);
            transition: background 0.2s;
            flex-shrink: 0;
          }

          .hamburger-btn:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .main-content {
            padding: 16px;
            gap: 12px;
            height: 100vh;
            overflow-y: auto;
          }

          .top-bar {
            padding-bottom: 12px;
          }

          .work-area {
            grid-template-columns: 1fr;
            gap: 16px;
            flex: 1;
            min-height: 0;
          }

          .slide-section {
            min-height: 350px;
            flex: 1;
          }

          .info-section {
            max-height: 300px;
            flex-shrink: 0;
          }
          
          .view-controls {
            display: none;
          }
          
          .mobile-footer {
            display: block;
            text-align: center;
            padding: 12px 16px;
            margin-top: 8px;
            color: var(--md-sys-color-on-surface-variant);
            font-size: 0.85rem;
            flex-shrink: 0;
          }
          
          .mobile-footer a {
            color: inherit;
            text-decoration: none;
          }
        }

        /* Mobile Adjustments: < 768px */
        @media (max-width: 768px) {
          .slide-section {
            min-height: 280px;
          }

          .info-section {
            max-height: 250px;
          }

          .top-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .top-bar-left {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .mobile-header-row {
            display: flex;
            align-items: center;
            width: 100%;
            position: relative; /* For absolute centering of brand */
            justify-content: flex-start; /* Hamburger stays left */
            min-height: 44px; /* Ensure height for absolute child */
          }

          .mobile-brand {
             display: flex; /* Show on mobile */
             position: absolute;
             left: 50%;
             transform: translateX(-50%);
             white-space: nowrap;
             margin-left: 0; /* Remove previous margin */
          }
          
          .brand h1 {
            margin-bottom: 0; /* Reset sidebar margin */
            font-size: 1.2rem;
          }

          /* Breadcrumbs in translucent box */
          .breadcrumbs {
            width: 100%;
            background: rgba(var(--md-sys-color-surface-variant-rgb, 73, 69, 79), 0.4); /* Fallback or variable */
            background-color: rgba(30, 30, 30, 0.6); /* Translucent dark box */
            backdrop-filter: blur(4px);
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
            margin-top: 4px;
            
            /* Ensure text wraps if needed */
            flex-wrap: wrap;
            white-space: normal;
          }

          .crumb-category, .crumb-name {
            font-size: 0.95rem;
          }
          
          .crumb-name {
             color: #E6E1E5; /* Light text for dark translucent box */
          }
          .crumb-separator {
             color: rgba(230, 225, 229, 0.5);
          }


          /* Touch-friendly areas */
          .category-header {
            padding: 12px;
            min-height: 44px;
          }

          .nav-item {
            padding: 12px 16px;
            min-height: 44px;
          }
        }

        /* Small Mobile: < 480px */
        @media (max-width: 480px) {
          .brand h1 {
            font-size: 1.2rem;
          }

          .search-input {
            font-size: 1rem;
            padding: 12px 12px 12px 44px;
          }

          .main-content {
            padding: 8px;
          }

          .slide-section {
            min-height: 220px;
          }

          .info-section {
            max-height: 200px;
          }

          .top-bar {
            padding-bottom: 8px;
          }
        }

        /* No results styling */
        .no-results {
          text-align: center;
          padding: 24px;
          color: var(--md-sys-color-on-surface-variant);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

export default App;
