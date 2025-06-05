<script>
  import { onMount } from "svelte";
  import * as turf from "@turf/turf";
  import * as d3 from "d3";

  export let projection;
  export let width = window.innerWidth;
  export let height = window.innerHeight;
  export let gridSize = 50;
  export let streetBufferDistance = 5;
  export let transform;

  let geoData = null;
  let gridCells = [];
  let isProcessing = false;

  const pathGenerator = d3.geoPath().projection(projection);

  onMount(async () => {
    try {
      const response = await fetch("/map.geojson");
      geoData = await response.json();
      console.log("GeoJSON loaded.");
    } catch (error) {
      console.error("Error loading map.geojson", error);
    }
  });

  async function generateGrid() {
    if (!geoData || !projection) {
      console.warn("Missing required data");
      return;
    }

    gridCells = [];
    isProcessing = true;

    const cols = Math.ceil(width / gridSize);
    const rows = Math.ceil(height / gridSize);

    const areaFeatures = geoData.features.filter(
      (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
    );

    const lineFeatures = geoData.features.filter(
      (f) =>
        (f.geometry.type === "LineString" ||
          f.geometry.type === "MultiLineString") &&
        f.properties?.highway
    );

    const bufferedLines = lineFeatures
      .map((feature) => {
        try {
          return turf.buffer(feature, streetBufferDistance, {
            units: "meters",
          });
        } catch (error) {
          console.error("Buffer error", error);
          return null;
        }
      })
      .filter(Boolean);

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * gridSize;
        const y = row * gridSize;

        const [lon, lat] = projection.invert([
          x + gridSize / 2,
          y + gridSize / 2,
        ]);
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
          const [lonMin, latMax] = projection.invert([x, y]);
          const [lonMax, latMin] = projection.invert([
            x + gridSize,
            y + gridSize,
          ]);

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
              id: `${col}-${row}`,
              type: cellType,
            },
          };

          gridCells.push(feature);
        }
      }
    }

    isProcessing = false;
    console.log(`Grid generated with ${gridCells.length} cells.`);
  }

  function exportGridAsGeoJSON() {
    if (!gridCells.length) return;

    const geojson = {
      type: "FeatureCollection",
      features: gridCells,
    };

    const blob = new Blob([JSON.stringify(geojson)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `grid_${gridSize}px.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getFill(type) {
    if (type === "street") return "#888";
    if (type === "park") return "#a3d9a5";
    if (type === "water") return "#87cfff";
    return "#ddd";
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

<svg style="width: 100%; height: 100%;">
  <g transform="translate({transform.x}, {transform.y}) scale({transform.k})">
    {#each gridCells as cell (cell.properties.id)}
      <path
        d={pathGenerator(cell)}
        fill={getFill(cell.properties.type)}
        stroke="#000"
        stroke-width="0.2"
      />
    {/each}
  </g>
</svg>

{#if gridCells.length > 0}
  <p style="position: absolute; top: 10px; left: 200px;">
    {gridCells.length} cells generated.
  </p>
{/if}

<style>
  .controls {
    position: absolute;
    top: 80px;
    left: 10px;
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
    border: none;
    cursor: pointer;
  }

  button:disabled {
    background: #aaa;
    cursor: not-allowed;
  }

  svg {
    width: 100%;
    height: 100%;
  }
</style>
