const fs = require('fs').promises;
const path = require('path');

function getDataFile(timeRange = 'hour', magnitude = 'all') {
    let feedType = 'all';
    if (magnitude === 'significant') {
        feedType = 'significant';
    } else if (magnitude !== 'all') {
        feedType = `${magnitude}_plus`;
    }

    return path.join(process.cwd(), 'data', `${feedType}_${timeRange}.json`);
}

export default async function handler(req, res) {
    try {
        const { timeRange = 'hour', magnitude = 'all' } = req.query;
        const dataFile = getDataFile(timeRange, magnitude);
        
        const data = await fs.readFile(dataFile, 'utf8');
        
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        
        res.status(200).json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load earthquake data' });
    }
} 