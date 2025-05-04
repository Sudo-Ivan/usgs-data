const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const DATA_DIR = path.join(__dirname, '../data');

const timeRanges = ['hour', 'day', 'week', 'month'];
const magnitudes = ['all', 'significant', '4.5', '2.5', '1.0'];

async function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function saveData(data, filename) {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function main() {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Fetch data for each combination
    for (const timeRange of timeRanges) {
        for (const magnitude of magnitudes) {
            let feedType = 'all';
            if (magnitude === 'significant') {
                feedType = 'significant';
            } else if (magnitude !== 'all') {
                feedType = `${magnitude}_plus`;
            }

            const url = `${BASE_URL}/${feedType}_${timeRange}.geojson`;
            const filename = `${feedType}_${timeRange}.json`;

            try {
                console.log(`Fetching ${filename}...`);
                const data = await fetchData(url);
                await saveData(data, filename);
                console.log(`Saved ${filename}`);
            } catch (error) {
                console.error(`Error fetching ${filename}:`, error);
            }
        }
    }
}

main().catch(console.error); 