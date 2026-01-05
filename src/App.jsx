import { useState, useMemo, useEffect } from 'react';
import slides from './data/slides/index.js';
import SlideViewer from './components/SlideViewer';
import TheoryPanel from './components/TheoryPanel';
import ChatBot from './components/ChatBot';
import Particles from './components/Particles';
import './styles/global.css';
import styles from './App.module.css';

// Format tissue context for AI chatbot
const formatTissueContext = (tissue) => {
  if (!tissue) return null;
  let context = `Tissue: ${tissue.name}\nCategory: ${tissue.category}`;
  if (tissue.description) context += `\nDescription: ${tissue.description}`;
  if (tissue.theory?.features) context += `\nKey Features: ${tissue.theory.features.length > 0 ? tissue.theory.features.join(', ') : 'None listed'}`;
  if (tissue.theory?.location) context += `\nLocation: ${tissue.theory.location.length > 0 ? tissue.theory.location.join(', ') : 'None listed'}`;
  if (tissue.theory?.function) context += `\nFunction: ${tissue.theory.function.length > 0 ? tissue.theory.function.join(', ') : 'None listed'}`;
  if (tissue.theory?.examTips) context += `\nExam Tips: ${tissue.theory.examTips}`;
  return context;
};

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
    <div className={styles.layout}>
      {/* Background Ambience - Globally Applied */}
      <div className={styles.aurora}></div>
      <div className={styles.gridOverlay}></div>

      {/* Floating Particles/Stars */}
      <Particles
        containerClassName={styles.particlesContainer}
        particleClassName={styles.particle}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <h1>
            <span className={styles.brandPrefix}>&gt;</span>
            <span className={styles.brandText}>Tissue Deck</span>
            <span className={styles.cursor}></span>
          </h1>
        </div>

        <div className={styles.sidebarControls}>
          <div className={styles.searchContainer}>
            <span className="material-icon" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 20 }}>search</span>
            <input
              id="slide-search-input"
              name="slide-search"
              type="text"
              placeholder="Search slides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => e.target.select()}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                className={styles.searchClearBtn}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <span className="material-icon">close</span>
              </button>
            )}
          </div>
          <button className={styles.closeSidebarBtn} onClick={() => setSidebarOpen(false)}>
            <span className="material-icon">close</span>
          </button>
        </div>

        <nav className={styles.navList}>
          {Object.entries(displayCategories).map(([category, catData]) => (
            <div key={category} className={styles.categoryGroup}>
              <button
                className={styles.categoryHeader}
                onClick={() => toggleCategory(category)}
              >
                <div className={styles.flexRow}>
                  <span className="material-icon" style={{ fontSize: 20, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {expandedCategories[category] || searchTerm ? 'expand_more' : 'chevron_right'}
                  </span>
                  <span>{category}</span>
                </div>
              </button>

              {(expandedCategories[category] || searchTerm) && (
                <div className={styles.categoryItems}>
                  {/* Direct items under category */}
                  {catData.items.map(tissue => (
                    <button
                      key={tissue.id}
                      className={`${styles.navItem} ${selectedTissueId === tissue.id ? styles.active : ''}`}
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
                          className={`${styles.navItem} ${selectedTissueId === sectionSingleItem.id ? styles.active : ''}`}
                          onClick={() => handleTissueSelect(sectionSingleItem)}
                        >
                          {sectionSingleItem.name}
                        </button>
                      );
                    }

                    return (
                      <div key={sectionKey} className={styles.sectionGroup}>
                        <button
                          className={styles.sectionHeader}
                          onClick={() => toggleSection(sectionKey)}
                        >
                          <div className={styles.flexRow}>
                            <span className="material-icon" style={{ fontSize: 16, color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {expandedSections[sectionKey] ? 'expand_more' : 'chevron_right'}
                            </span>
                            <span>{sectionName}</span>
                          </div>
                        </button>

                        {expandedSections[sectionKey] && (
                          <div className={styles.sectionItems}>
                            {/* Direct items under section */}
                            {secData.items.map(tissue => (
                              <button
                                key={tissue.id}
                                className={`${styles.navItem} ${selectedTissueId === tissue.id ? styles.active : ''}`}
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
                                    className={`${styles.navItem} ${selectedTissueId === tissues[0].id ? styles.active : ''}`}
                                    onClick={() => handleTissueSelect(tissues[0])}
                                  >
                                    {tissues[0].name}
                                  </button>
                                );
                              }

                              return (
                                <div key={subKey} className={styles.subsectionGroup}>
                                  <button
                                    className={styles.subsectionHeader}
                                    onClick={() => toggleSection(subKey)}
                                  >
                                    <div className={styles.flexRow}>
                                      <span className="material-icon" style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        {expandedSections[subKey] ? 'expand_more' : 'chevron_right'}
                                      </span>
                                      <span>{subsectionName}</span>
                                    </div>
                                  </button>

                                  {expandedSections[subKey] && (
                                    <div className={styles.subsectionItems}>
                                      {tissues.map(tissue => (
                                        <button
                                          key={tissue.id}
                                          className={`${styles.navItem} ${selectedTissueId === tissue.id ? styles.active : ''}`}
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
          ))}

          {filteredTissues.length === 0 && (
            <div className={styles.noResults}>No slides found</div>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          Made with ❤️ by <a href="https://pranayjuneja.com" target="_blank" rel="noopener noreferrer">Pranay Juneja</a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.mobileHeaderRow}>
              <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)}>
                <span className="material-icon">menu</span>
              </button>
              <div className={`${styles.brand} ${styles.mobileBrand}`}>
                <h1>
                  <span className={styles.brandPrefix}>&gt;</span>
                  <span className={styles.brandText}>Tissue Deck</span>
                  <span className={styles.cursor}></span>
                </h1>
              </div>
            </div>
            <div className={styles.breadcrumbs}>
              <span className={styles.crumbCategory}>{selectedTissue?.category}</span>
              {selectedTissue?.section && (
                <>
                  <span className={styles.crumbSeparator}>/</span>
                  <span className={styles.crumbSection}>{selectedTissue?.section}</span>
                </>
              )}
              <span className={styles.crumbSeparator}>/</span>
              <span className={styles.crumbName}>{selectedTissue?.name}</span>
            </div>
          </div>

          <div className={styles.viewControls}>
            <span>
              Made with ❤️ by <a href="https://pranayjuneja.com" target="_blank" rel="noopener noreferrer">Pranay Juneja</a>
            </span>
          </div>
        </header>

        <div className={styles.workArea}>
          <div className={styles.slideSection}>
            <SlideViewer
              tissue={selectedTissue}
              showLabels={showLabels}
            />
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoSection}>
              <TheoryPanel tissue={selectedTissue} />
            </div>
          </div>
        </div>

        {/* Chatbot floats over entire viewport */}
        <ChatBot tissueContext={formatTissueContext(selectedTissue)} />
      </main>
    </div>
  );
}

export default App;
