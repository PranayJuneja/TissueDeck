/**
 * Generate slide-manifest.json for Service Worker progressive caching
 * 
 * Usage: node scripts/generateSlideManifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLIDES_DIR = path.join(__dirname, '..', 'public', 'slides');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'slide-manifest.json');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg'];

/**
 * Recursively find all image files in a directory
 */
function findImageFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findImageFiles(fullPath, files);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                // Convert to URL path
                const urlPath = fullPath
                    .replace(path.join(__dirname, '..', 'public'), '')
                    .replace(/\\/g, '/');
                files.push(urlPath);
            }
        }
    }

    return files;
}

function main() {
    console.log('🔍 Scanning for image files (webp, png, jpg)...\n');

    const slides = findImageFiles(SLIDES_DIR);
    console.log(`Found ${slides.length} slides\n`);

    // Write manifest
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(slides, null, 2));
    console.log(`✅ Generated: public/slide-manifest.json`);
    console.log(`   Total slides: ${slides.length}`);
}

main();
