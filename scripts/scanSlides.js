/**
 * Slide Scanner Script
 * Scans the public/slides folder and generates a JSON file with organized slide data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLIDES_DIR = path.join(__dirname, '..', 'public', 'slides');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'slides.json');


// Image extensions to look for
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

/**
 * Parse the power level from a filename
 * @param {string} filename - The filename to parse
 * @returns {string} - 'low', 'medium', 'high', or 'default'
 */
function parsePowerLevel(filename) {
    const lowerName = filename.toLowerCase();

    if (lowerName.includes('-low-') || lowerName.includes('_low_') || lowerName.includes('-low.') || lowerName.includes('_low.')) {
        return 'low';
    }
    if (lowerName.includes('-medium-') || lowerName.includes('_medium_') || lowerName.includes('-medium.') || lowerName.includes('_medium.') ||
        lowerName.includes('-med-') || lowerName.includes('_med_') || lowerName.includes('-med.') || lowerName.includes('_med.')) {
        return 'medium';
    }
    if (lowerName.includes('-high-') || lowerName.includes('_high_') || lowerName.includes('-high.') || lowerName.includes('_high.')) {
        return 'high';
    }

    return 'default';
}

/**
 * Parse the slide number from a filename
 * @param {string} filename - The filename to parse
 * @returns {number} - The slide number, or 0 if not found
 */
function parseSlideNumber(filename) {
    // Match patterns like: name-1.jpg, name_2.png, name-low-3.jpg
    const match = filename.match(/[-_](\d+)\.[a-zA-Z]+$/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Recursively scan a directory for slides
 * @param {string} dir - Directory path
 * @param {string} relativePath - Relative path from slides root
 * @returns {Object} - Object with slide information
 */
function scanDirectory(dir, relativePath = '') {
    const result = {
        type: 'directory',
        name: path.basename(dir),
        path: relativePath,
        children: [],
        slides: {
            low: [],
            medium: [],
            high: [],
            default: []
        }
    };

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const itemPath = path.join(dir, item.name);
        const itemRelativePath = path.join(relativePath, item.name).replace(/\\/g, '/');

        if (item.isDirectory()) {
            const child = scanDirectory(itemPath, itemRelativePath);
            result.children.push(child);
        } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                const powerLevel = parsePowerLevel(item.name);
                const slideNumber = parseSlideNumber(item.name);
                const slideUrl = `/slides/${itemRelativePath}`;

                result.slides[powerLevel].push({
                    url: slideUrl,
                    filename: item.name,
                    number: slideNumber
                });
            }
        }
    }

    // Sort slides by number
    for (const level of ['low', 'medium', 'high', 'default']) {
        result.slides[level].sort((a, b) => a.number - b.number);
    }

    return result;
}

/**
 * Flatten the directory structure into a list of tissue entries
 * @param {Object} node - Directory node
 * @param {Array} path - Current path array
 * @returns {Array} - Array of tissue entries
 */
function flattenToTissues(node, pathArray = []) {
    const tissues = [];
    const currentPath = [...pathArray, node.name];

    // Check if this node has slides directly
    const hasSlides = Object.values(node.slides).some(arr => arr.length > 0);

    if (hasSlides) {
        // Determine category: if pathArray is empty, this is a top-level folder
        // Use the node name as category in that case
        const category = pathArray.length > 0 ? pathArray[0] : node.name;
        const section = pathArray.length > 0 ? pathArray[1] || node.name : null;
        const subsection = pathArray.length > 1 ? pathArray[2] || null : null;

        const tissue = {
            id: currentPath.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            name: node.name,
            category: category,
            section: section,
            subsection: subsection,
            path: currentPath,
            slides: {
                low: node.slides.low.map(s => s.url),
                medium: node.slides.medium.map(s => s.url),
                high: node.slides.high.map(s => s.url),
                default: node.slides.default.map(s => s.url)
            }
        };
        tissues.push(tissue);
    }

    // Process children recursively
    for (const child of node.children) {
        tissues.push(...flattenToTissues(child, currentPath));
    }

    return tissues;
}

/**
 * Main function
 */
function main() {
    console.log('Scanning slides directory:', SLIDES_DIR);

    if (!fs.existsSync(SLIDES_DIR)) {
        console.error('Slides directory not found:', SLIDES_DIR);
        process.exit(1);
    }

    const rootItems = fs.readdirSync(SLIDES_DIR, { withFileTypes: true });
    const allTissues = [];

    for (const item of rootItems) {
        if (item.isDirectory()) {
            const dirPath = path.join(SLIDES_DIR, item.name);
            const scanned = scanDirectory(dirPath, item.name);
            const tissues = flattenToTissues(scanned, []);
            allTissues.push(...tissues);
        }
    }

    console.log(`Found ${allTissues.length} tissue entries`);

    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTissues, null, 2));
    console.log('Output written to:', OUTPUT_FILE);

    // Print summary
    const summary = {};
    for (const tissue of allTissues) {
        if (!summary[tissue.category]) {
            summary[tissue.category] = 0;
        }
        summary[tissue.category]++;
    }

    console.log('\nSummary by category:');
    for (const [cat, count] of Object.entries(summary)) {
        console.log(`  ${cat}: ${count}`);
    }
}

main();
