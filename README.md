# Map Studio

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sams-teams-projects/v0-map-studio)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/o5qMIcsCPvW)

## Overview

Map Studio is a tool for quickly visualizing geospatial data. It allows users to upload their own datasets, map data dimensions to visual properties like color and size, and preview their custom-styled maps. The tool can produce choropleth and symbol maps and works with custom designed SVG maps.

## Features and Functionality

- **Data Input**: Paste CSV or TSV data containing US states or locations, with or without geographic coordinates (latitude and longitude).
- **Geocoding**: Automatically find geographic coordinates based on cities and states (or addresses) within symbol map data.
  - **Cached Locations**: Save geolocated date to the browser's local storage to speed up geocoding for future datasets.
- **Custom Maps**: Paste an SVG map (with the correct structure) to apply choropleth data. Map Studio automatically verifies the pasted code and closes paths as needed.
- **Geography and Projection**: Select from an expanding list of geographies and projections for your base map.
- **Data Preview**: Preview symbol map or choropleth data in an intuitive view with data type and formatting options.
  - **Intelligent Data Recognition**: Automatically match columns to data types and format. Automatically match City and State columns for geocoding.
  - **Copy or Download Data**: Copy your data as a TSV to paste back into Google Sheets or Excel with any adjustments or added geocoding data, or download as a CSV file.
- **Dimension Mapping**: Assign data columns to visual map properties such as:
  - **Color**: Map a numerical or categorical column to a color scheme for symbol colors.
  - **Fill**: Map a numerical or categorical column to a color scheme for state fills in standard US state maps or custom uploads.
  - **Size**: Map a numerical column to the size of map markers.
  - **Labels**: Add labels to symbol map or choropleth data, using a label template field and label styling panel to customize as needed.
  - **Symbol**: Choose different marker shapes or use a custom SVG path (e.g., circles, squares, map pins).
- **Map Styling**: Customize various aspects of the map's appearance, including base map styles, marker colors, and sizes.
  - **Save Styles**: Save created themes locally for use later on.
  - **Preset Color Schemes**: Choose from standard d3 sequential, diverging, or categorical color shemes or save your own in your local storage.
- **Map Preview**: See real-time updates of your map as you adjust settings and data mappings.
- **Map Export**: Copy the rendered and well-structured SVG map to paste directly into Figma or save locally.

### On the roadmap

- [ ] **Export Settings**: Save and share your settings (including data, dimensions,and styling) as a JSON file.
- [ ] **Import Settings**: Load a saved settings JSON to continue editing.
- [x] **US Counties**: Add US county outlines as a layer option in the basemap.
- [x] **Canada and Other Countries**: Add options to render different countries or a world map.
- [x] **Alternative Projections**: Add options to change the rendered projection of the map.
- [ ] **Data Upload**: Add fields to upload a dataset instead of pasting.
- [ ] **Improved Label Positioning**: Make auto-positioning setting for symbol map layers more intelligent and add support for connected labels in choropleth layers.
- [x] **Improved Error, Warning, and Success Notifications**
- [ ] **Data Checks and Verifications for Choropleth Data**
- [x] **Add scroll to map preview indicator and collapse all button**

### Getting Started

1.  **Load Data**: Begin by pasting your geospatial data file (TSV or CSV) in the "Data Input" section. Symbol Map data should have city and state or full address columns. Choropleth data should have state columns.
2.  **Geocode Data**: If your data doesn't already have coordinates, set your address or city and state columns, then run the geocoding function to generate coordinates from OpenStreetMap.
3.  **Preview Data**: Take a look at your data and make sure everything look good. Change column types and formatting as needed.
4.  **Map Dimensions**: Navigate to "Dimension Mapping" to link your data columns to visual attributes, like size, color, and fill. Add labels in the Labels panel.
5.  **Style Your Map**: Use the "Map Styling" panel to refine the appearance of your map and markers.
6.  **Preview**: Observe your customized map in the "Map Preview" area. Export or copy the SVG map using the buttons in the panel header.

For more detailed instructions and guidelines, please refer to the [GitHub Wiki](https://github.com/sams-teams-projects/v0-map-studio/wiki) (coming soon!).

## Deployment

Your project is live at:

**[https://vercel.com/sams-teams-projects/v0-map-studio](https://vercel.com/sams-teams-projects/v0-map-studio)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/o5qMIcsCPvW](https://v0.dev/chat/projects/o5qMIcsCPvW)**

## Credits

- **Sam Vickars**
- **The DataFace**
