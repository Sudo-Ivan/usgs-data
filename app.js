const earthquakeList = document.getElementById('earthquake-list');
const timeRangeSelect = document.getElementById('timeRange');
const magnitudeSelect = document.getElementById('magnitude');
const lastUpdateSpan = document.getElementById('lastUpdate');
const earthquakeCountSpan = document.getElementById('earthquake-count');

function getDataFile() {
    const timeRange = timeRangeSelect.value;
    const magnitude = magnitudeSelect.value;
    
    let feedType = 'all';
    if (magnitude === 'significant') {
        feedType = 'significant';
    } else if (magnitude !== 'all') {
        feedType = `${magnitude}_plus`;
    }

    return `data/${feedType}_${timeRange}.json`;
}

async function loadEarthquakes() {
    try {
        const dataFile = getDataFile();
        const response = await fetch(dataFile);
        
        if (response.status === 404) {
            throw new Error('This feed combination is not available');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update last update time
        const lastUpdate = new Date(data.metadata.generated);
        lastUpdateSpan.textContent = lastUpdate.toLocaleString();
        
        // Update earthquake count
        earthquakeCountSpan.textContent = data.metadata.count;
        
        displayEarthquakes(data.features);
    } catch (error) {
        console.error('Error loading earthquake data:', error);
        earthquakeList.innerHTML = `
            <div class="error">
                <p>Error loading earthquake data. Please try a different feed combination.</p>
                <p>Details: ${error.message}</p>
            </div>`;
        lastUpdateSpan.textContent = 'Error';
        earthquakeCountSpan.textContent = '0';
    }
}

function displayEarthquakes(earthquakes) {
    if (!earthquakes || earthquakes.length === 0) {
        earthquakeList.innerHTML = '<p>No earthquakes found for the selected criteria.</p>';
        return;
    }

    earthquakeList.innerHTML = earthquakes.map(quake => `
        <div class="earthquake-item">
            <h3>${quake.properties.title}</h3>
            <p><strong>Magnitude:</strong> ${quake.properties.mag}</p>
            <p><strong>Location:</strong> ${quake.properties.place}</p>
            <p><strong>Time:</strong> ${new Date(quake.properties.time).toLocaleString()}</p>
            <p><strong>Depth:</strong> ${quake.geometry.coordinates[2]} km</p>
            <a href="${quake.properties.url}" target="_blank" rel="noopener noreferrer">View on USGS</a>
        </div>
    `).join('');
}

// Event listeners for feed changes
timeRangeSelect.addEventListener('change', loadEarthquakes);
magnitudeSelect.addEventListener('change', loadEarthquakes);

// Initial load
loadEarthquakes(); 