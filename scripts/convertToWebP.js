/**
 * Convert all JPEG and PNG slides to WebP format
 * Quality: 92% (lossless-like, minimal visual loss)
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
const DELETE_ORIGINALS = true; // Set to false to keep originals

let converted = 0;
let failed = 0;
let totalSavedBytes = 0;

/**
 * Recursively find all JPG and PNG files in a directory
 */
function findImageFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findImageFiles(fullPath, files);
        } else if (entry.isFile() && /\.(jpe?g|png)$/i.test(entry.name)) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Convert a single image file to WebP
 */
async function convertFile(imagePath) {
    const webpPath = imagePath.replace(/\.(jpe?g|png)$/i, '.webp');

    try {
        const originalSize = fs.statSync(imagePath).size;
        const ext = path.extname(imagePath).toLowerCase();

        await sharp(imagePath)
            .webp({ quality: QUALITY })
            .toFile(webpPath);

        const newSize = fs.statSync(webpPath).size;
        const saved = originalSize - newSize;
        totalSavedBytes += saved;

        if (DELETE_ORIGINALS) {
            fs.unlinkSync(imagePath);
        }

        converted++;
        const percent = ((saved / originalSize) * 100).toFixed(1);
        const sign = saved >= 0 ? '' : '+';
        console.log(`✓ ${path.basename(imagePath)} (${ext}) → WebP (${sign}${percent}% size change)`);

    } catch (error) {
        failed++;
        console.error(`✗ Failed: ${path.basename(imagePath)} - ${error.message}`);
    }
}

/**
 * Update all JSON data files to reference .webp instead of .jpg/.png
 */
function updateJsonFiles() {
    const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
        const filePath = path.join(DATA_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace .jpg, .jpeg, and .png extensions with .webp
        const updated = content
            .replace(/\.jpe?g"/gi, '.webp"')
            .replace(/\.png"/gi, '.webp"');

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
    console.log('🔍 Scanning for JPEG and PNG files...\n');

    const imageFiles = findImageFiles(SLIDES_DIR);
    console.log(`Found ${imageFiles.length} image files to convert\n`);

    if (imageFiles.length === 0) {
        console.log('No JPEG/PNG files found. Already converted?');
        return;
    }

    console.log(`Converting with quality: ${QUALITY}%\n`);
    console.log('─'.repeat(60));

    // Convert files sequentially to avoid memory issues
    for (const file of imageFiles) {
        await convertFile(file);
    }

    console.log('─'.repeat(60));
    console.log(`\n✅ Conversion complete!`);
    console.log(`   Converted: ${converted} files`);
    console.log(`   Failed: ${failed} files`);

    const savedMB = (totalSavedBytes / 1024 / 1024).toFixed(2);
    if (totalSavedBytes >= 0) {
        console.log(`   Space saved: ${savedMB} MB`);
    } else {
        console.log(`   Size increase: ${Math.abs(savedMB)} MB (higher quality than originals)`);
    }

    if (DELETE_ORIGINALS) {
        console.log(`   Original files: Deleted`);
    } else {
        console.log(`   Original files: Kept`);
    }

    // Update JSON references
    console.log('\n📝 Updating JSON data files...');
    updateJsonFiles();

    console.log('\n🎉 All done!');
}

main().catch(console.error);
