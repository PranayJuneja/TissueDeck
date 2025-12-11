import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { createWriteStream, unlink } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = 'https://histologyguide.com';
const START_URL = 'https://histologyguide.com/slidebox/slidebox.html';

// Map of IDs to high-quality external images (Wikimedia Commons / Others)
// Map of IDs to Wikimedia Commons "File:" page titles
const HIGH_RES_OVERRIDES = {
    'MH-016-simple-epithelia': 'File:Renal_corpuscle.svg', // High quality vector
    'MHS-261-common-bile-duct': 'File:Bile_duct_-_interlobular_-_high_mag.jpg',
    'MHS-227a-eye': 'File:Cornea_of_eye.jpg',
    'MHS-224-ovary-and-oviduct': 'File:Rabbit_ovary_Graafian_follicle_sec.jpg', // Good high-res ovary
    'MHS-281-pavement-epithelium': 'File:Epithel_peritoneum.jpg' // Simple squamous
};

// Helper to download an image (ESM compatible)
async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = createWriteStream(filepath);

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        protocol.get(url, options, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                unlink(filepath, () => { });
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
            } else {
                file.close();
                unlink(filepath, () => { });
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            unlink(filepath, () => { });
            reject(err);
        });
    });
}

// Function to get high-res URL from Wikimedia File page
async function getWikimediaUrl(browser, pageTitle) {
    const page = await browser.newPage();
    try {
        const url = `https://commons.wikimedia.org/wiki/${pageTitle}`;
        console.log(`    Fetching high-res URL from ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Try getting the "Original file" link
        // Selector: .fullMedia a.internal (points to the raw file)
        const imageUrl = await page.evaluate(() => {
            const link = document.querySelector('.fullMedia a.internal') || document.querySelector('.fullMedia a');
            return link ? link.href : null;
        });

        return imageUrl;
    } catch (e) {
        console.error(`    Failed to scrape Wikimedia page: ${e.message}`);
        return null;
    } finally {
        await page.close();
    }
}

async function scrape() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    const parseCoordinates = (onclickStr) => {
        if (!onclickStr) return null;
        const match = onclickStr.match(/zZoomAndPanToView\(\s*(-?\d+),\s*(-?\d+),\s*(-?[\d.]+)/);
        if (match) {
            return {
                x: parseInt(match[1]),
                y: parseInt(match[2]),
                zoom: parseFloat(match[3])
            };
        }
        return null;
    };

    try {
        // Create public/slides directory
        const publicDir = path.join(process.cwd(), 'public', 'slides');
        await fs.mkdir(publicDir, { recursive: true });
        console.log(`Created directory: ${publicDir}`);

        console.log(`Navigating to ${START_URL}...`);
        await page.goto(START_URL, { waitUntil: 'networkidle0' });

        console.log('Extracting chapters...');
        const chapters = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="slidebox/"]'));
            return links
                .filter(link => !link.href.endsWith('slidebox.html') && link.textContent.trim().length > 0)
                .map(link => ({
                    title: link.textContent.trim(),
                    url: link.href
                }));
        });

        // Filter for Epithelium chapter
        const targetChapter = chapters.find(c => c.title.toLowerCase().includes('epithelium')) || chapters[0];

        if (!targetChapter) throw new Error("No chapters found");

        console.log(`Processing chapter: ${targetChapter.title} (${targetChapter.url})`);
        await page.goto(targetChapter.url, { waitUntil: 'networkidle0' });

        const slides = await page.evaluate(() => {
            const slideLinks = Array.from(document.querySelectorAll('a[href*="/slideview/"]'));
            const unique = new Map();
            slideLinks.forEach(link => {
                const url = link.href;
                const name = link.textContent.trim();
                if (name && !unique.has(url)) {
                    unique.set(url, { name, url });
                }
            });
            return Array.from(unique.values());
        });

        console.log(`Found ${slides.length} slides. Processing first 5 for demo.`);
        const slidesToProcess = slides.slice(0, 5);
        const allTissues = [];

        for (const slide of slidesToProcess) {
            console.log(`  Scraping slide: ${slide.name}`);
            try {
                await page.goto(slide.url, { waitUntil: 'networkidle2', timeout: 60000 });

                const slideData = await page.evaluate(() => {
                    const pathParts = window.location.pathname.split('/');
                    pathParts.pop();
                    const imageBaseUrl = window.location.origin + pathParts.join('/') + '/';

                    const pages = Array.from(document.querySelectorAll('.sidebarPage'));
                    const theory = { features: [], function: [], location: [], examTips: "See distinguishing features." };
                    const markers = [];

                    pages.forEach(p => {
                        const items = Array.from(p.querySelectorAll('li, p'));
                        items.forEach(item => {
                            const text = item.textContent.trim();
                            if (!text) return;

                            const lowerText = text.toLowerCase();
                            if (lowerText.includes('function')) theory.function.push(text);
                            else if (lowerText.includes('location')) theory.location.push(text);
                            else theory.features.push(text);

                            const buttons = Array.from(item.querySelectorAll('button[onclick^="zZoomAndPanToView"]'));
                            buttons.forEach(btn => {
                                markers.push({
                                    label: btn.textContent.trim(),
                                    onclick: btn.getAttribute('onclick'),
                                    description: text
                                });
                            });
                        });
                    });

                    return { imageBaseUrl, theory, rawMarkers: markers, description: document.querySelector('h2')?.nextElementSibling?.textContent?.trim() || '' };
                });

                // Generate a clean ID from the URL
                const id = slide.url.split('/').slice(-2, -1)[0].replace(/[^a-zA-Z0-9-]/g, '');

                // DECIDE IMAGE URL: Check overrides first!
                let imageUrl = slideData.imageBaseUrl + 'imgs/slide.png';
                let isSvg = false;

                if (HIGH_RES_OVERRIDES[id]) {
                    console.log(`    ⭐ Checking High-Res Override for ${id}`);
                    const wikiUrl = await getWikimediaUrl(browser, HIGH_RES_OVERRIDES[id]);
                    if (wikiUrl) {
                        imageUrl = wikiUrl;
                        if (imageUrl.toLowerCase().endsWith('.svg')) isSvg = true;
                        console.log(`    Found High-Res URL: ${imageUrl}`);
                    }
                } else {
                    console.log(`    Using default thumbnail for ${id}`);
                }

                // If SVG, change extension
                let ext = '.png';
                if (isSvg) ext = '.svg';
                else if (imageUrl.toLowerCase().endsWith('.jpg') || imageUrl.toLowerCase().endsWith('.jpeg')) ext = '.jpg';

                let localFilename = `${id}${ext}`;
                let localImagePath = path.join(publicDir, localFilename);
                let localImageUrl = `/slides/${localFilename}`;

                console.log(`    Downloading image to ${localFilename}...`);
                try {
                    await downloadImage(imageUrl, localImagePath);
                    console.log(`    ✓ Saved to ${localImagePath}`);
                } catch (imgErr) {
                    console.error(`    ✗ Failed: ${imgErr.message}`);
                    // Fallback
                    if (HIGH_RES_OVERRIDES[id]) {
                        console.log('    Attempting fallback to thumbnail...');
                        try {
                            // Fallback to .png thumbnail
                            localFilename = `${id}.png`;
                            localImagePath = path.join(publicDir, localFilename);
                            localImageUrl = `/slides/${localFilename}`;
                            await downloadImage(slideData.imageBaseUrl + 'imgs/slide.png', localImagePath);
                            console.log('    ✓ Fallback success');
                        } catch (e) {
                            console.error('    Fallback failed:', e.message);
                        }
                    }
                }

                // If override used and successful (didn't throw), update model
                // Note: The loop updates 'allTissues' which uses 'localImageUrl'

                // ... But we need to make sure we use the correct variable in allTissues push
                // We'll fix the allTissues push below (it was using 'localImageUrl')

                const markers = slideData.rawMarkers.map((m, idx) => {
                    const coords = parseCoordinates(m.onclick);
                    return {
                        id: `m-${idx}`,
                        label: m.label,
                        description: m.description,
                        x: coords ? coords.x : 0,
                        y: coords ? coords.y : 0,
                        zoom: coords ? coords.zoom : 1
                    };
                }).filter(m => m.x !== 0 && m.y !== 0);

                allTissues.push({
                    id, name: slide.name, category: targetChapter.title, imageUrl: localImageUrl,
                    description: slideData.description || slide.name,
                    theory: { features: slideData.theory.features.slice(0, 10), function: slideData.theory.function, location: slideData.theory.location, examTips: slideData.theory.examTips },
                    markers, sourceUrl: slide.url
                });
            } catch (slideError) {
                console.error(`Failed to scrape slide ${slide.name}: ${slideError.message}`);
            }
        }

        const outputDir = path.join(process.cwd(), 'src', 'data');
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, 'scraped_tissues.json');
        await fs.writeFile(outputPath, JSON.stringify(allTissues, null, 2));
        console.log(`\n✓ Scraping complete! Saved ${allTissues.length} tissues to ${outputPath}`);
        console.log(`✓ Images saved to ${publicDir}`);

    } catch (error) {
        console.error('Scraping failed:', error);
    } finally {
        await browser.close();
    }
}

scrape().catch(console.error);
