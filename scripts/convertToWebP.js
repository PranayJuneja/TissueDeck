/**
 * Convert all JPEG slides to WebP format
 * Quality: 92% (lossless-like, ~30% smaller files)
 * 
 * Usage: node scripts/convertToWebP.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLIDES_DIR = path.join(__dirname, '..', 'public', 'slides');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'slides');
const QUALITY = 92; // High quality, minimal visual loss
const DELETE_ORIGINALS = true; // Set to false to keep JPGs

let converted = 0;
let failed = 0;
let totalSavedBytes = 0;

/**
 * Recursively find all JPG files in a directory
 */
function findJpgFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findJpgFiles(fullPath, files);
        } else if (entry.isFile() && /\.jpe?g$/i.test(entry.name)) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Convert a single JPG file to WebP
 */
async function convertFile(jpgPath) {
    const webpPath = jpgPath.replace(/\.jpe?g$/i, '.webp');

    try {
        const originalSize = fs.statSync(jpgPath).size;

        await sharp(jpgPath)
            .webp({ quality: QUALITY })
            .toFile(webpPath);

        const newSize = fs.statSync(webpPath).size;
        const saved = originalSize - newSize;
        totalSavedBytes += saved;

        if (DELETE_ORIGINALS) {
            fs.unlinkSync(jpgPath);
        }

        converted++;
        const percent = ((saved / originalSize) * 100).toFixed(1);
        console.log(`✓ ${path.basename(jpgPath)} → WebP (${percent}% smaller)`);

    } catch (error) {
        failed++;
        console.error(`✗ Failed: ${path.basename(jpgPath)} - ${error.message}`);
    }
}

/**
 * Update all JSON data files to reference .webp instead of .jpg
 */
function updateJsonFiles() {
    const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
        const filePath = path.join(DATA_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace .jpg and .jpeg extensions with .webp
        const updated = content.replace(/\.jpe?g"/gi, '.webp"');

        if (content !== updated) {
            fs.writeFileSync(filePath, updated);
            console.log(`📝 Updated: ${file}`);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🔍 Scanning for JPEG files...\n');

    const jpgFiles = findJpgFiles(SLIDES_DIR);
    console.log(`Found ${jpgFiles.length} JPEG files to convert\n`);

    if (jpgFiles.length === 0) {
        console.log('No JPEG files found. Already converted?');
        return;
    }

    console.log(`Converting with quality: ${QUALITY}%\n`);
    console.log('─'.repeat(50));

    // Convert files sequentially to avoid memory issues
    for (const file of jpgFiles) {
        await convertFile(file);
    }

    console.log('─'.repeat(50));
    console.log(`\n✅ Conversion complete!`);
    console.log(`   Converted: ${converted} files`);
    console.log(`   Failed: ${failed} files`);
    console.log(`   Space saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);

    if (DELETE_ORIGINALS) {
        console.log(`   Original JPGs: Deleted`);
    } else {
        console.log(`   Original JPGs: Kept`);
    }

    // Update JSON references
    console.log('\n📝 Updating JSON data files...');
    updateJsonFiles();

    console.log('\n🎉 All done!');
}

main().catch(console.error);
