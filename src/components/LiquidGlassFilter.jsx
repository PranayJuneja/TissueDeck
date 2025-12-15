/**
 * LiquidGlassFilter.jsx
 * 
 * SVG filter definitions for Apple's Liquid Glass effect.
 * This creates realistic refraction, distortion, and specular highlights.
 * 
 * Usage: Import this component and place it once in your app (e.g., in App.jsx)
 * Then reference the filters via CSS: filter: url(#liquid-glass-filter);
 */

export default function LiquidGlassFilter() {
    return (
        <svg
            style={{
                position: 'absolute',
                width: 0,
                height: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}
            aria-hidden="true"
        >
            <defs>
                {/* Main Liquid Glass Filter - Subtle refraction distortion */}
                <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
                    {/* Create organic noise pattern for distortion */}
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.015 0.02"
                        numOctaves="3"
                        seed="42"
                        result="noise"
                    />

                    {/* Apply subtle displacement using the noise */}
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="3"
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="displaced"
                    />

                    {/* Slight blur for glass softness */}
                    <feGaussianBlur in="displaced" stdDeviation="0.3" result="softened" />

                    {/* Merge with original for subtle effect */}
                    <feBlend in="SourceGraphic" in2="softened" mode="normal" />
                </filter>

                {/* Enhanced Liquid Glass - More pronounced for hover states */}
                <filter id="liquid-glass-active" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.012 0.018"
                        numOctaves="4"
                        seed="24"
                        result="noise"
                    />

                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="5"
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="displaced"
                    />

                    <feGaussianBlur in="displaced" stdDeviation="0.4" result="softened" />

                    <feBlend in="SourceGraphic" in2="softened" mode="normal" />
                </filter>

                {/* Specular Highlight Filter - Creates the glass shine effect */}
                <filter id="liquid-glass-specular" x="-10%" y="-10%" width="120%" height="120%">
                    {/* Base blur */}
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />

                    {/* Create specular lighting effect */}
                    <feSpecularLighting
                        in="blur"
                        surfaceScale="3"
                        specularConstant="0.6"
                        specularExponent="25"
                        lightingColor="#ffffff"
                        result="specular"
                    >
                        <fePointLight x="100" y="-50" z="200" />
                    </feSpecularLighting>

                    {/* Composite the specular highlight */}
                    <feComposite
                        in="specular"
                        in2="SourceAlpha"
                        operator="in"
                        result="specularOut"
                    />

                    {/* Combine with original */}
                    <feMerge>
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode in="specularOut" />
                    </feMerge>
                </filter>

                {/* Glass Glow Filter - Soft edge glow */}
                <filter id="liquid-glass-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur1" />
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur2" />

                    {/* Colorize the glow */}
                    <feColorMatrix
                        in="blur1"
                        type="matrix"
                        values="0 0 0 0 0.4
                                0 0 0 0 0.6
                                0 0 0 0 1
                                0 0 0 0.15 0"
                        result="coloredGlow"
                    />

                    <feMerge>
                        <feMergeNode in="coloredGlow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Combined Liquid Glass Effect - Full effect */}
                <filter id="liquid-glass-full" x="-30%" y="-30%" width="160%" height="160%">
                    {/* Subtle distortion noise */}
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.01 0.015"
                        numOctaves="2"
                        seed="88"
                        result="noise"
                    />

                    {/* Very subtle displacement */}
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="2"
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="displaced"
                    />

                    {/* Outer glow */}
                    <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="outerBlur" />
                    <feColorMatrix
                        in="outerBlur"
                        type="matrix"
                        values="0 0 0 0 0.3
                                0 0 0 0 0.5
                                0 0 0 0 0.95
                                0 0 0 0.2 0"
                        result="outerGlow"
                    />

                    {/* Inner shadow for depth */}
                    <feOffset in="SourceAlpha" dx="0" dy="1" result="offsetAlpha" />
                    <feGaussianBlur in="offsetAlpha" stdDeviation="1" result="innerBlur" />
                    <feColorMatrix
                        in="innerBlur"
                        type="matrix"
                        values="0 0 0 0 1
                                0 0 0 0 1
                                0 0 0 0 1
                                0 0 0 0.12 0"
                        result="innerLight"
                    />

                    {/* Composite everything */}
                    <feMerge>
                        <feMergeNode in="outerGlow" />
                        <feMergeNode in="displaced" />
                        <feMergeNode in="innerLight" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    );
}
