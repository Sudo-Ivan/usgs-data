# USGS Earthquake Data Viewer

A static site for viewing USGS earthquake data with an interactive map.

## Features

- Real-time earthquake data from USGS.
- Interactive OpenLayers map visualization.
- Static data files updated hourly.
- Multiple time ranges (hour, day, week, month)
- Data stored historically using git history.

## Data Files

Data is stored in the `data/` directory with the following format:
```
data/{feedType}_{timeRange}.json
```

Where:
- `feedType`: all, significant
- `timeRange`: hour, day, week, month

Example: `data/all_hour.json`

## Local Development

1. Clone the repository
2. Open `index.html` in your browser
3. For local development, use a local server (e.g., `python -m http.server`)

## Data Updates

Data is automatically updated every hour using GitHub Actions. The workflow:
1. Fetches latest earthquake data from USGS
2. Saves data as static JSON files
3. Commits and pushes changes to the repository

## Data Source

All data is sourced from the [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/).
