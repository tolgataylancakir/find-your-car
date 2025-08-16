const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (index.html, script.js, style.css)
app.use(express.static(path.join(__dirname)));

function buildMarktplaatsUrl(params) {
    const baseUrl = 'https://www.marktplaats.nl/l/auto-s/';
    const url = new URL(baseUrl);
    if (params.make) {
        url.searchParams.set('query', params.make + (params.model ? ` ${params.model}` : ''));
    } else if (params.model) {
        url.searchParams.set('query', params.model);
    }
    if (params.priceMin) url.searchParams.set('priceFrom', params.priceMin);
    if (params.priceMax) url.searchParams.set('priceTo', params.priceMax);
    if (params.yearMin) url.searchParams.set('constructionYearFrom', params.yearMin);
    // Map simple fuel types to Dutch site values if needed
    // Note: Marktplaats uses facets for brandstof; direct param may not be fully supported, but we try
    // url.searchParams.set('fuel', params.fuel);
    return url.toString();
}

function extractImageObjectsFromHtml(html) {
    // Best-effort extraction of schema.org ImageObject entries present in the page metadata
    // This is a fallback when proper listing markup isn't easily accessible client-side.
    try {
        const marker = '"imageObject":[';
        const start = html.indexOf(marker);
        if (start === -1) return [];
        const after = html.slice(start + marker.length);
        const end = after.indexOf(']');
        if (end === -1) return [];
        const arrayText = after.slice(0, end + 1);
        // The content is JSON-like but may include escape sequences. Try to sanitize.
        // Wrap into a full JSON array string
        const jsonString = arrayText
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\t/g, ' ');
        let arr = [];
        try {
            arr = JSON.parse(jsonString);
        } catch (e) {
            // Attempt to fix invalid JSON keys by quoting if needed
            // As a fallback, try to split naive object patterns
            arr = [];
        }
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function toCarObjectsFromImageObjects(imgObjs) {
    // Convert ImageObject entries to our car shape (best-effort)
    return imgObjs.map((img, idx) => ({
        id: `${Date.now()}_${idx}`,
        make: img?.name?.split(' ')[0] || 'Unknown',
        model: (img?.name || '').split(' ').slice(1, 3).join(' ').trim() || '',
        variant: '',
        year: undefined,
        price: undefined,
        mileage: undefined,
        fuel: '',
        transmission: '',
        body: '',
        power: '',
        doors: undefined,
        color: '',
        location: '',
        source: 'Marktplaats',
        url: undefined,
        images: img?.contentUrl ? [img.contentUrl] : []
    }));
}

async function fetchMarktplaats(params) {
    const url = buildMarktplaatsUrl(params);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
            'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8'
        },
    });
    const html = await res.text();

    // Try to extract listing-like data (best-effort)
    const images = extractImageObjectsFromHtml(html);
    const cars = toCarObjectsFromImageObjects(images).slice(0, 20);
    return cars;
}

app.post('/api/search-cars', async (req, res) => {
    try {
        const { market, make, model, priceMin, priceMax, yearMin, fuel, transmission, body } = req.body || {};
        const params = { make, model, priceMin, priceMax, yearMin, fuel, transmission, body };

        // Only support NL for now; extend with other sources as needed
        let cars = [];
        if (!market || market === 'nl') {
            cars = await fetchMarktplaats(params);
        }

        res.json({ cars, total: cars.length, page: 1, perPage: cars.length });
    } catch (error) {
        console.error('search-cars error:', error);
        res.status(500).json({ cars: [], total: 0, page: 1, perPage: 0, error: 'Failed to fetch listings' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});