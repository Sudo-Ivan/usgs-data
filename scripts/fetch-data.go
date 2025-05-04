package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type EarthquakeData struct {
	Type     string `json:"type"`
	Metadata struct {
		Generated int64  `json:"generated"`
		URL       string `json:"url"`
		Title     string `json:"title"`
		Status    int    `json:"status"`
		API       string `json:"api"`
		Count     int    `json:"count"`
	} `json:"metadata"`
	Features []struct {
		Type       string `json:"type"`
		Properties struct {
			Mag     float64 `json:"mag"`
			Place   string  `json:"place"`
			Time    int64   `json:"time"`
			Updated int64   `json:"updated"`
			URL     string  `json:"url"`
			Detail  string  `json:"detail"`
			Title   string  `json:"title"`
		} `json:"properties"`
		Geometry struct {
			Type        string    `json:"type"`
			Coordinates []float64 `json:"coordinates"`
		} `json:"geometry"`
	} `json:"features"`
}

func fetchData(feedType, timeRange string) (*EarthquakeData, error) {
	url := fmt.Sprintf("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/%s_%s.geojson", feedType, timeRange)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error fetching data: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	var data EarthquakeData
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("error parsing JSON: %v", err)
	}

	return &data, nil
}

func saveData(data *EarthquakeData, filename string) error {
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling JSON: %v", err)
	}

	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return fmt.Errorf("error creating directory: %v", err)
	}

	if err := os.WriteFile(filename, jsonData, 0644); err != nil {
		return fmt.Errorf("error writing file: %v", err)
	}

	return nil
}

func main() {
	feedTypes := []string{"all", "significant"}
	timeRanges := []string{"hour", "day", "week", "month"}

	for _, feedType := range feedTypes {
		for _, timeRange := range timeRanges {
			filename := fmt.Sprintf("data/%s_%s.json", feedType, timeRange)
			fmt.Printf("Fetching %s_%s...\n", feedType, timeRange)

			data, err := fetchData(feedType, timeRange)
			if err != nil {
				fmt.Printf("Error fetching %s_%s: %v\n", feedType, timeRange, err)
				continue
			}

			if err := saveData(data, filename); err != nil {
				fmt.Printf("Error saving %s: %v\n", filename, err)
				continue
			}

			fmt.Printf("Saved %s (%d earthquakes)\n", filename, data.Metadata.Count)
		}
	}
}
