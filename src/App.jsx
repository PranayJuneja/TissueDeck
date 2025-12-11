import { useState, useMemo, useEffect } from 'react';
import tissues from './data/tissues.json';
import SlideViewer from './components/SlideViewer';
import TheoryPanel from './components/TheoryPanel';
import './styles/global.css';

function App() {
    const [selectedGroupName, setSelectedGroupName] = useState(null);
    const [selectedMagnification, setSelectedMagnification] = useState(null);
    const [showLabels, setShowLabels] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    // 1. Group Tissues by Base Name
    const groupedSlides = useMemo(() => {
        const groups = {};

        tissues.forEach(tissue => {
            // Extract magnification from name, e.g., "Thyroid (40x)" -> Base: "Thyroid", Mag: "40x"
            // If no magnification found, use 'Default' or 'Overview'
            const match = tissue.name.match(/^(.*?)\s*\(?(\d+x)\)?$/i);
            const baseName = match ? match[1].trim() : tissue.name;
            const mag = match ? match[2].toLowerCase() : 'overview';

            if (!groups[baseName]) {
                groups[baseName] = {
                    name: baseName,
                    category: tissue.category || 'Uncategorized',
                    slides: {}
                };
            }
            groups[baseName].slides[mag] = tissue;
        });

        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    // Initialize selection
    useEffect(() => {
        if (!selectedGroupName && groupedSlides.length > 0) {
            const firstGroup = groupedSlides[0];
            setSelectedGroupName(firstGroup.name);
            // Select first available magnification (numerically sorted if possible)
            const mags = Object.keys(firstGroup.slides).sort((a, b) => parseInt(a) - parseInt(b));
            setSelectedMagnification(mags[0]);
        }
    }, [groupedSlides, selectedGroupName]);

    // Get current selection
    const selectedGroup = groupedSlides.find(g => g.name === selectedGroupName) || groupedSlides[0];
    const currentSlide = selectedGroup?.slides[selectedMagnification] || Object.values(selectedGroup?.slides || {})[0];

    // Group groupedSlides by Category for Sidebar
    const filteredGroups = groupedSlides.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarCategories = useMemo(() => {
        return filteredGroups.reduce((acc, group) => {
            if (!acc[group.category]) acc[group.category] = [];
            acc[group.category].push(group);
            return acc;
        }, {});
    }, [filteredGroups]);

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const handleGroupSelect = (group) => {
        setSelectedGroupName(group.name);
        // Try to keep current magnification if it exists in new group, else default to lowest
        const availableMags = Object.keys(group.slides).sort((a, b) => parseInt(a) - parseInt(b));
        if (!group.slides[selectedMagnification]) {
            setSelectedMagnification(availableMags[0]);
        }
    };

    return (
        <div className="layout">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="brand">
                    <h1>
                        <span>Tissue Deck</span>
                        <span className="cursor">_</span>
                    </h1>
                </div>

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

                <nav className="nav-list">
                    {Object.entries(sidebarCategories).map(([category, items]) => (
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
                                <span className="count">{items.length}</span>
                            </button>

                            {(expandedCategories[category] || searchTerm) && (
                                <div className="category-items">
                                    {items.map(group => (
                                        <button
                                            key={group.name}
                                            className={`nav-item ${selectedGroupName === group.name ? 'active' : ''}`}
                                            onClick={() => handleGroupSelect(group)}
                                        >
                                            {group.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredGroups.length === 0 && (
                        <div className="no-results">No slides found</div>
                    )}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="top-bar">
                    <div className="breadcrumbs">
                        <span className="crumb-category">{selectedGroup?.category}</span>
                        <span className="crumb-separator">/</span>
                        <span className="crumb-name">{selectedGroup?.name}</span>
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
                            group={selectedGroup}
                            selectedMagnification={selectedMagnification}
                            onMagnificationChange={setSelectedMagnification}
                            showLabels={showLabels}
                        />
                    </div>
                    <div className="info-section">
                        <TheoryPanel tissue={currentSlide} />
                    </div>
                </div>
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
          font-family: var(--font-family-display);
          font-size: 1.5rem;
          margin: 0 0 24px 0;
          color: var(--md-sys-color-primary);
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
        }

        .cursor {
            display: inline-block;
            margin-left: 2px;
            color: var(--md-sys-color-tertiary);
            font-weight: bold;
            animation: blink 1s step-end infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        .search-container {
          position: relative;
          margin-bottom: 24px;
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
        }

        .category-header:hover {
          background-color: rgba(230, 225, 229, 0.08);
        }

        .flex-row {
            display: flex;
            align-items: center;
            gap: 8px;
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

        @media (max-width: 900px) {
            .layout { grid-template-columns: 1fr; }
            .sidebar { display: none; /* Hide on mobile for now or make collapsible */ }
            /* ... mobile adaptations ... */
        }
      `}</style>
        </div>
    );
}

export default App;
