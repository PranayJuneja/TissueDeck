
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { createWriteStream, unlink, statSync } from 'fs';
import path from 'path';
import https from 'https';

// --- CONFIG ---
const WIKILECTURES_CATEGORY = 'https://www.wikilectures.eu/w/Category:Histological_slides';
const WIKILECTURES_BASE = 'https://www.wikilectures.eu';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
const CONCURRENCY = 4;

// --- PATHS ---
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PUBLIC_SLIDES_DIR = path.join(process.cwd(), 'public', 'slides');
const OUTPUT_FILE = path.join(DATA_DIR, 'tissues.json');

// --- CATEGORY MAP (Heuristic) ---
const CATEGORY_MAP = [
    { name: 'Endocrine', keywords: ['adrenal', 'pituitary', 'thyroid', 'parathyroid', 'pineal', 'islet', 'pancreas'] },
    { name: 'Urinary', keywords: ['kidney', 'ureter', 'bladder', 'urethra', 'renal'] },
    { name: 'Digestive', keywords: ['tongue', 'tooth', 'lip', 'esophagus', 'stomach', 'intestine', 'duodenum', 'jejunum', 'ileum', 'colon', 'rectum', 'anal', 'liver', 'gallbladder', 'salivary', 'parotid', 'submandibular', 'sublingual'] },
    { name: 'Reproductive', keywords: ['testis', 'ovary', 'uterus', 'vagina', 'placenta', 'mamm', 'prostate', 'seminal', 'epididymis', 'oviduct', 'cervix', 'sperm', 'penis'] },
    { name: 'Nervous Tissue', keywords: ['nerve', 'neuron', 'gangli', 'spinal cord', 'cerebr', 'brain', 'cerebell', 'plexus', 'myelin'] },
    { name: 'Cardiovascular', keywords: ['artery', 'vein', 'capillary', 'heart', 'valve', 'aorta', 'vessel'] },
    { name: 'Respiratory', keywords: ['nasal', 'trachea', 'bronch', 'lung', 'larynx', 'epiglottis'] },
    { name: 'Lymphatic', keywords: ['lymph', 'spleen', 'thymus', 'tonsil'] },
    { name: 'Integumentary', keywords: ['skin', 'scalp', 'hair', 'nail', 'glandula'] },
    { name: 'Muscle Tissue', keywords: ['muscle', 'skeletal', 'cardiac', 'smooth', 'myocardial'] },
    { name: 'Connective Tissue', keywords: ['connective', 'adipose', 'cartilage', 'bone', 'tendon', 'ligament', 'mesentery', 'blood', 'marrow'] },
    { name: 'The Cell', keywords: ['cell', 'mitosis', 'organelle', 'nucleus', 'golgi', 'mitochondria'] },
    { name: 'Epithelium', keywords: ['epithel', 'mesotheli', 'endotheli'] }
];

function getCategory(name, description = '') {
    const text = (name + ' ' + description).toLowerCase();
    for (const cat of CATEGORY_MAP) {
        if (cat.keywords.some(k => text.includes(k))) return cat.name;
    }
    return 'Other';
}

// --- UTILS ---
async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(filepath);
        https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
            if (res.statusCode === 200) {
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    try {
                        const size = statSync(filepath).size;
                        if (size < 10000) {
                            unlink(filepath, () => { });
                            reject(new Error(`Too small: ${size} bytes`));
                        } else resolve(size);
                    } catch (e) { reject(e); }
                });
            } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close(); unlink(filepath, () => { });
                downloadImage(res.headers.location.startsWith('http') ? res.headers.location : WIKILECTURES_BASE + res.headers.location, filepath).then(resolve).catch(reject);
            } else {
                file.close(); unlink(filepath, () => { });
                reject(new Error(`HTTP ${res.statusCode}`));
            }
        }).on('error', (e) => { file.close(); unlink(filepath, () => { }); reject(e); });
    });
}

// --- MAIN SCRAPER ---
async function scrapeWikiLectures() {
    console.log('=== WikiLectures Scraper v5 (Smarter Guessing) ===');
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(PUBLIC_SLIDES_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Always fetch fresh metadata
    const allSlides = [];

    try {
        const mainPage = await browser.newPage();
        await mainPage.setUserAgent(USER_AGENT);

        console.log('1. Fetching slide list...');
        await mainPage.goto(WIKILECTURES_CATEGORY, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const slideLinks = await mainPage.evaluate(() => {
            const links = Array.from(document.querySelectorAll('#mw-pages a'));
            return links.map(a => ({ name: a.textContent.trim(), url: a.href }))
                .filter(l => l.name && !l.name.startsWith('Category:'));
        });
        console.log(`   Found ${slideLinks.length} slides.`);
        await mainPage.close();

        const chunks = (arr, size) => arr.length > size ? [arr.slice(0, size), ...chunks(arr.slice(size), size)] : [arr];
        const batches = chunks(slideLinks, CONCURRENCY);

        let processed = 0;

        for (const batch of batches) {
            await Promise.all(batch.map(async (slide) => {
                const page = await browser.newPage();
                await page.setUserAgent(USER_AGENT);

                try {
                    // 1. Visit Slide (File) Page
                    await page.goto(slide.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    const pageData = await page.evaluate((base) => {
                        const links = Array.from(document.querySelectorAll('#mw-content-text a'));
                        let mainUrl = null;

                        const title = document.querySelector('h1')?.textContent?.trim() || '';
                        const cleanTitle = title.replace(/\s*\(image\)$/i, '').replace('File:', '').trim();

                        // Strategy 1: Look for exact link match
                        for (const l of links) {
                            if (l.textContent.trim() === cleanTitle && !l.href.includes('File:')) {
                                mainUrl = l.href; break;
                            }
                        }

                        // Strategy 2: Guess URL by stripping details (e.g. "Adrenal gland, detail" -> "Adrenal gland")
                        if (!mainUrl) {
                            // Split by comma or hyphen-surrounded-by-spaces
                            const genericTitle = cleanTitle.split(/,| - /)[0].trim();
                            const guess = genericTitle.replace(/\s+/g, '_');
                            if (guess.length > 3) {
                                mainUrl = `${base}/w/${guess}`;
                            }
                        }

                        let desc = '';
                        document.querySelectorAll('#mw-content-text p').forEach(p => {
                            if (p.textContent.trim().length > 20 && !desc) desc = p.textContent.trim();
                        });

                        let fullResUrl = null;
                        const fullResLink = document.querySelector('.fullImageLink a, a.internal[href*="/sites/"], a[href*="/images/"]');
                        if (fullResLink) {
                            const href = fullResLink.href;
                            fullResUrl = href.startsWith('http') ? href : base + href;
                        }

                        return { mainUrl, desc, fullResUrl };
                    }, WIKILECTURES_BASE);

                    let theory = {
                        features: pageData.desc ? [pageData.desc] : [],
                        function: [],
                        location: [],
                        examTips: 'Refer to WikiLectures for full details.'
                    };

                    // 2. Deep Scrape (Theory) if Main URL found
                    if (pageData.mainUrl) {
                        try {
                            const resp = await page.goto(pageData.mainUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                            const is404 = await page.evaluate(() => document.querySelector('.noarticletext') || document.title.includes('Search results'));

                            if (resp.ok() && !is404) {
                                const theoryData = await page.evaluate(() => {
                                    const t = { desc: [], func: [], loc: [] };
                                    const intro = document.querySelector('#mw-content-text > p:first-of-type')?.textContent?.trim();
                                    if (intro && intro.length > 20) t.desc.push(intro);

                                    const headers = document.querySelectorAll('h2, h3');
                                    headers.forEach(h => {
                                        const title = h.textContent.toLowerCase();
                                        let content = [];
                                        let next = h.nextElementSibling;
                                        while (next && !['H2', 'H3'].includes(next.tagName)) {
                                            if ((next.tagName === 'P' || next.tagName === 'UL') && next.textContent.trim().length > 10) {
                                                content.push(next.textContent.trim());
                                            }
                                            next = next.nextElementSibling;
                                        }

                                        const fullContent = content.join('\n\n');
                                        if (fullContent) {
                                            if (title.includes('function') || title.includes('physiology')) t.func.push(fullContent);
                                            else if (title.includes('location') || title.includes('occurrence') || title.includes('anatom')) t.loc.push(fullContent);
                                            else if (title.includes('description') || title.includes('structure')) t.desc.push(fullContent);
                                        }
                                    });
                                    return t;
                                });

                                if (theoryData.desc.length > 0) theory.features = theoryData.desc;
                                if (theoryData.func.length > 0) theory.function = theoryData.func;
                                if (theoryData.loc.length > 0) theory.location = theoryData.loc;
                            }
                        } catch (e) { }
                    }

                    // 3. Image (Skip if exists)
                    const id = slide.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    const ext = pageData.fullResUrl ? (pageData.fullResUrl.match(/\.(jpg|jpeg|png|svg)$/i)?.[1] || 'jpg') : 'jpg';
                    const filename = `${id}.${ext}`;
                    const filepath = path.join(PUBLIC_SLIDES_DIR, filename);

                    let needsDownload = true;
                    try { if (statSync(filepath).size > 10000) needsDownload = false; } catch (e) { }

                    if (needsDownload && pageData.fullResUrl) {
                        await downloadImage(pageData.fullResUrl, filepath);
                    }

                    // 4. Categorize
                    const category = getCategory(slide.name, theory.features.join(' '));

                    allSlides.push({
                        id,
                        name: slide.name.replace(/\(image\)|\(histology slide\)/i, '').trim(),
                        category,
                        description: theory.features[0] || slide.name,
                        imageUrl: `/slides/${filename}`,
                        sourceUrl: slide.url,
                        sourceName: 'WikiLectures',
                        theory,
                        markers: []
                    });

                } catch (e) {
                    console.error(`   Error processing ${slide.name}: ${e.message}`);
                } finally {
                    await page.close();
                }
            }));

            processed += batch.length;
            if (processed % 10 === 0) console.log(`   Progress: ${processed}/${slideLinks.length}`);
        }

    } catch (e) { console.error(e); }
    finally {
        await browser.close();
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(allSlides, null, 2));
        console.log(`=== DONE. Saved ${allSlides.length} slides. ===`);
    }
}

scrapeWikiLectures();
