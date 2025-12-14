import { useState, useEffect } from 'react';
import styles from './SlideViewer.module.css';

const SlideViewer = ({ tissue, showLabels }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageError, setImageError] = useState(false);

    // Get all slides combined into a linear list (low -> medium -> high -> default)
    const getAllSlides = () => {
        if (!tissue?.slides) return [];

        return [
            ...(tissue.slides.low || []),
            ...(tissue.slides.medium || []),
            ...(tissue.slides.high || []),
            ...(tissue.slides.default || [])
        ];
    };

    const slides = getAllSlides();
    const currentSlide = slides[currentSlideIndex] || null;
    const totalSlides = slides.length;

    // Reset slide index when tissue changes
    useEffect(() => {
        setCurrentSlideIndex(0);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setImageError(false);
    }, [tissue]);

    // Zoom controls
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.5, 5));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.5, 0.5));
    };

    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Mouse drag for panning
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch events for mobile
    const handleTouchStart = (e) => {
        if (zoom > 1 && e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    const handleTouchMove = (e) => {
        if (isDragging && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Mouse wheel for zooming
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setZoom(prev => {
            const newZoom = prev + delta;
            return Math.min(Math.max(newZoom, 0.5), 5);
        });
    };

    // Navigate slides
    const nextSlide = () => {
        if (totalSlides > 1) {
            setCurrentSlideIndex(prev => Math.min(prev + 1, totalSlides - 1));
            setImageError(false);
        }
    };

    const prevSlide = () => {
        if (totalSlides > 1) {
            setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
            setImageError(false);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    if (!tissue) {
        return (
            <div className={styles.viewerContainer}>
                <div className={styles.errorMessage}>
                    Select a tissue to view
                </div>
            </div>
        );
    }

    return (
        <div
            className={styles.viewerContainer}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Image Display */}
            <div
                className={styles.imageWrapper}
                style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                {currentSlide && !imageError ? (
                    <img
                        src={currentSlide}
                        alt={tissue.name}
                        className={styles.slideImage}
                        onError={handleImageError}
                        draggable={false}
                    />
                ) : (
                    <div className={styles.errorMessage}>
                        {imageError ? (
                            <>
                                <p>Failed to load slide image</p>
                                <p className={styles.errorDetail}>
                                    Path: {currentSlide}
                                </p>
                            </>
                        ) : (
                            <p>No slides available for this selection</p>
                        )}
                    </div>
                )}
            </div>

            {/* Controls Overlay */}
            <div className={styles.controlsOverlay}>
                {/* Zoom Controls */}
                <div className={styles.zoomControls}>
                    <button onClick={handleZoomOut} className={styles.controlBtn} title="Zoom Out">
                        <span className="material-icon">remove</span>
                    </button>
                    <button onClick={handleReset} className={styles.controlBtn} title="Reset View">
                        <span className="material-icon">refresh</span>
                    </button>
                    <button onClick={handleZoomIn} className={styles.controlBtn} title="Zoom In">
                        <span className="material-icon">add</span>
                    </button>
                </div>

                {/* Slide Navigation - Linear Scale */}
                {totalSlides > 1 && (
                    <div className={styles.slideControls}>
                        <button
                            onClick={prevSlide}
                            className={`${styles.slideBtn} ${currentSlideIndex === 0 ? styles.disabled : ''}`}
                            disabled={currentSlideIndex === 0}
                            title="Previous Slide"
                        >
                            <span className="material-icon">remove</span>
                        </button>
                        <span className={styles.slideCounter}>
                            {currentSlideIndex + 1}/{totalSlides}
                        </span>
                        <button
                            onClick={nextSlide}
                            className={`${styles.slideBtn} ${currentSlideIndex === totalSlides - 1 ? styles.disabled : ''}`}
                            disabled={currentSlideIndex === totalSlides - 1}
                            title="Next Slide"
                        >
                            <span className="material-icon">add</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Source Credit */}
            {currentSlide && (
                <div className={styles.sourceCredit}>
                    Open Source Histology
                </div>
            )}
        </div>
    );
};

export default SlideViewer;

