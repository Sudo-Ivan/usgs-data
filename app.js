const earthquakeList = document.getElementById('earthquake-list');
const timeRangeSelect = document.getElementById('timeRange');
const magnitudeSelect = document.getElementById('magnitude');
const lastUpdateSpan = document.getElementById('lastUpdate');
const earthquakeCountSpan = document.getElementById('earthquake-count');

// Initialize map
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 2
    })
});

// Create vector layer for earthquakes
const vectorLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: 'rgba(255, 0, 0, 0.6)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(255, 0, 0, 1)',
                width: 2
            })
        })
    })
});

map.addLayer(vectorLayer);

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

function updateMap(features) {
    const vectorSource = vectorLayer.getSource();
    vectorSource.clear();

    features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        const point = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([coordinates[0], coordinates[1]])),
            properties: feature.properties
        });

        // Adjust circle size based on magnitude
        const magnitude = feature.properties.mag;
        const radius = Math.max(4, Math.min(12, magnitude * 2));
        
        point.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({
                    color: `rgba(255, ${255 - (magnitude * 20)}, 0, 0.6)`
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, 1)',
                    width: 2
                })
            })
        }));

        vectorSource.addFeature(point);
    });

    // Fit view to features if there are any
    if (features.length > 0) {
        const extent = vectorSource.getExtent();
        map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 8
        });
    }
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
        
        // Update map and list
        updateMap(data.features);
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