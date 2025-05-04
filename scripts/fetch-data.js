const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const DATA_DIR = path.join(__dirname, '../data');

// Valid feed combinations based on USGS API documentation
const FEEDS = {
    hour: ['all', 'significant'],
    day: ['all', 'significant'],
    week: ['all', 'significant'],
    month: ['all', 'significant']
};

async function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 404) {
                resolve(null); // Return null for non-existent feeds
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error(`Invalid JSON response: ${error.message}`));
                }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function saveData(data, filename) {
    if (!data) {
        console.log(`Skipping ${filename} - feed not available`);
        return;
    }

    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved ${filename}`);
}

async function main() {
    try {
        // Ensure data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Fetch data for each valid combination
        for (const [timeRange, feedTypes] of Object.entries(FEEDS)) {
            for (const feedType of feedTypes) {
                const url = `${BASE_URL}/${feedType}_${timeRange}.geojson`;
                const filename = `${feedType}_${timeRange}.json`;

                try {
                    console.log(`Fetching ${filename}...`);
                    const data = await fetchData(url);
                    await saveData(data, filename);
                } catch (error) {
                    console.error(`Error processing ${filename}:`, error.message);
                }
            }
        }

        console.log('Data fetch completed successfully');
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main(); 