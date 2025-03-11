<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import * as turf from "@turf/turf";

  export let xScale;
  export let yScale;
  export let width = window.innerWidth;
  export let height = window.innerHeight;

  export let gridSize = 4;
  export let streetBufferDistance = 10;

  let geoData = null;
  let gridCells = [];
  let isProcessing = false;

  onMount(async () => {
    try {
      const response = await fetch("/map.geojson");
      geoData = await response.json();

      console.log("GeoJSON loaded! Ready to process.");
    } catch (error) {
      console.error("Error loading map.geojson", error);
    }
  });

  async function generateGrid() {
    if (!geoData || !xScale || !yScale) {
      console.warn("Missing xScale/yScale/geoData");
      return;
    }

    gridCells = [];
    isProcessing = true;

    const cols = Math.ceil(width / gridSize);
    const rows = Math.ceil(height / gridSize);

    const areaFeatures = geoData.features.filter(
      (feature) =>
        feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon"
    );

    const lineFeatures = geoData.features.filter(
      (feature) =>
        (feature.geometry.type === "LineString" ||
          feature.geometry.type === "MultiLineString") &&
        feature.properties?.highway
    );

    const bufferedLines = lineFeatures
      .map((feature, i) => {
        try {
          const buffered = turf.buffer(feature, streetBufferDistance, {
            units: "meters",
          });
          buffered.id = feature.id || i;
          return buffered;
        } catch (error) {
          console.error("Buffer error", error);
          return null;
        }
      })
      .filter((f) => f);

    console.log("Starting grid generation...");

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * gridSize;
        const y = row * gridSize;

        const lon = xScale.invert(x + gridSize / 2);
        const lat = yScale.invert(y + gridSize / 2);
        const pt = turf.point([lon, lat]);

        let cellType = null;

        for (let line of bufferedLines) {
          if (turf.booleanPointInPolygon(pt, line)) {
            cellType = "street";
            break;
          }
        }

        if (!cellType) {
          for (let area of areaFeatures) {
            if (turf.booleanPointInPolygon(pt, area)) {
              if (area.properties?.leisure === "park") {
                cellType = "park";
              } else if (
                area.properties?.natural === "water" ||
                area.properties?.waterway
              ) {
                cellType = "water";
              } else {
                cellType = "other";
              }
              break;
            }
          }
        }

        if (cellType) {
          const lonMin = xScale.invert(x);
          const lonMax = xScale.invert(x + gridSize);
          const latMin = yScale.invert(y + gridSize);
          const latMax = yScale.invert(y);

          const coordinates = [
            [
              [lonMin, latMin],
              [lonMin, latMax],
              [lonMax, latMax],
              [lonMax, latMin],
              [lonMin, latMin],
            ],
          ];

          const feature = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: coordinates,
            },
            properties: {
              type: cellType,
            },
          };

          gridCells.push(feature);
        }
      }
    }

    isProcessing = false;
    console.log(`Grid generated! ${gridCells.length} cells.`);
  }

  function exportGridAsGeoJSON() {
    if (!gridCells.length) {
      console.warn("No grid cells to export!");
      return;
    }

    const geojson = {
      type: "FeatureCollection",
      features: gridCells,
    };

    const json = JSON.stringify(geojson);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `pixelated_grid_${gridSize}grid_${streetBufferDistance}buffer.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log("Export complete!");
  }
</script>

<div class="controls">
  <button on:click={generateGrid} disabled={isProcessing}>
    {isProcessing ? "Processing..." : "Generate Grid"}
  </button>
  <button
    on:click={exportGridAsGeoJSON}
    disabled={!gridCells.length || isProcessing}
  >
    Export GeoJSON
  </button>
</div>

{#if gridCells.length > 0}
  <p>{gridCells.length} cells generated. Ready to export!</p>
{/if}

<style>
  .controls {
    position: fixed;
    top: 100px;
    left: 1rem;
    background: rgba(255, 255, 255, 0.95);
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  button {
    display: block;
    margin-bottom: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    background: #444;
    color: #fff;
    border: none;
    cursor: pointer;
  }

  button:disabled {
    background: #aaa;
    cursor: not-allowed;
  }

  p {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #333;
  }
</style>
