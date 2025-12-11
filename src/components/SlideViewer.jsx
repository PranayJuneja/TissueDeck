import { useState, useRef, useEffect } from 'react';
import styles from './SlideViewer.module.css';

const SlideViewer = ({ group, selectedMagnification, onMagnificationChange, showLabels }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageError, setImageError] = useState(false);
    const containerRef = useRef(null);

    // Derive current slide from group and magnification
    const slide = group?.slides[selectedMagnification] || Object.values(group?.slides || {})[0];

    // Reset state when slide changes
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setImageError(false);
    }, [slide?.id]);

    const handleWheel = (e) => {
        e.preventDefault();
        const scaleAdjustment = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(1, scale + scaleAdjustment), 4);
        setScale(newScale);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Use local image path from scraped data
    const getImageUrl = () => {
        if (!slide?.imageUrl) return '';
        return slide.imageUrl;
    };

    if (!group || !slide) {
        return (
            <div className={styles.viewerContainer} style={{ color: 'white' }}>
                <p>Select a slide to view</p>
            </div>
        );
    }

    // Sort magnifications for display
    const availableMags = Object.keys(group.slides).sort((a, b) => {
        // Try to sort numerically if they look like numbers
        const valA = parseInt(a);
        const valB = parseInt(b);
        if (!isNaN(valA) && !isNaN(valB)) return valA - valB;
        return a.localeCompare(b);
    });

    return (
        <div
            className={styles.viewerContainer}
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className={styles.imageWrapper}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                {imageError ? (
                    <div className={styles.errorMessage}>
                        <p>⚠️ Image unavailable</p>
                        <p className={styles.errorDetail}>
                            Could not load image.
                            {slide.sourceUrl && (
                                <>
                                    <br />
                                    <a href={slide.sourceUrl} target="_blank" rel="noopener noreferrer">
                                        View original source →
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                ) : (
                    <img
                        src={getImageUrl()}
                        alt={slide.name}
                        className={styles.slideImage}
                        draggable={false}
                        onError={() => setImageError(true)}
                    />
                )}

                {showLabels && !imageError && slide.markers?.map((marker) => (
                    <div
                        key={marker.id}
                        className={`${styles.marker} ${showLabels ? styles.visible : ''}`}
                        style={{
                            // Convert absolute coordinates to percentage (approximate, assuming 30000x30000 base)
                            // Ideally we'd know the image dimensions.
                            top: `${(marker.y / 30000) * 100}%`,
                            left: `${(marker.x / 30000) * 100}%`
                        }}
                        title={marker.description}
                    >
                        <div className={styles.markerPoint} />
                        {showLabels && (
                            <span className={styles.markerLabel}>{marker.label}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Controls Overlay */}
            <div className={styles.controlsOverlay}>
                <div className={styles.zoomControls}>
                    <button className={styles.controlBtn} onClick={() => setScale(s => Math.max(s - 0.5, 1))}>
                        <span className="material-icon">remove</span>
                    </button>
                    <button className={styles.controlBtn} onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}>
                        <span className="material-icon">restart_alt</span>
                    </button>
                    <button className={styles.controlBtn} onClick={() => setScale(s => Math.min(s + 0.5, 4))}>
                        <span className="material-icon">add</span>
                    </button>
                </div>

                {/* Magnification Toggles - Only show if more than 1 option and not just 'overview' */}
                {availableMags.length > 1 && (
                    <div className={styles.magControls}>
                        {availableMags.map(mag => (
                            <button
                                key={mag}
                                className={`${styles.magBtn} ${selectedMagnification === mag ? styles.active : ''}`}
                                onClick={() => onMagnificationChange(mag)}
                            >
                                {mag}
                            </button>
                        ))}
                    </div>
                )}
                {/* Also show if length is 1 but it's a specific mag like '40x', just for info? 
                     User requirement says "user clicks there is a toggle in the place where images are there for (5x,15x,40x)"
                     If only one exists, maybe just label it? Or hide. Let's hide if only 1. 
                 */}
            </div>

            {/* Source Credit */}
            {slide.sourceName && (
                <div className={styles.sourceCredit}>
                    Source: {slide.sourceName}
                </div>
            )}
        </div>
    );
};

export default SlideViewer;
