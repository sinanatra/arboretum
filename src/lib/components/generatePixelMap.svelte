<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import * as turf from "@turf/turf";

  export let xScale;
  export let yScale;
  export let width = window.innerWidth;
  export let height = window.innerHeight;

  
  export let gridSize = 2.5;
  export let streetBufferDistance = 5;

  let geoData = null;
  let gContainer;
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

  async function generateGridInChunks() {
    if (!geoData || !xScale || !yScale) return;

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

    let currentRow = 0;

    function processChunk(deadline) {
      const startTime = performance.now();

      const batchSize = 10; 
      while (
        currentRow < rows &&
        (deadline?.timeRemaining() > 0 || performance.now() - startTime < 8)
      ) {
        for (let col = 0; col < cols; col++) {
          const x = col * gridSize;
          const y = currentRow * gridSize;

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
            gridCells = [...gridCells, { x, y, type: cellType }];
          }
        }

        currentRow++;
      }

      if (currentRow < rows) {
        if (window.requestIdleCallback) {
          requestIdleCallback(processChunk);
        } else {
          requestAnimationFrame(() => processChunk());
        }
      } else {
        isProcessing = false;
        console.log("Grid generation complete!");
      }
    }

    if (window.requestIdleCallback) {
      requestIdleCallback(processChunk);
    } else {
      requestAnimationFrame(() => processChunk());
    }
  }

  function exportGridAsJSON() {
    const json = JSON.stringify(gridCells);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `pixelated-grid-g${gridSize}-b${streetBufferDistance}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
</script>

<div>
  <button on:click={generateGridInChunks} disabled={isProcessing}>
    {isProcessing ? "Processing..." : "Generate Grid"}
  </button>

  <button
    on:click={exportGridAsJSON}
    disabled={gridCells.length === 0 || isProcessing}
  >
    Export Grid JSON
  </button>
</div>

{#if gridCells.length > 0}
  <g bind:this={gContainer}>
    {#each gridCells as cell (cell.x + "-" + cell.y)}
      <rect
        x={cell.x}
        y={cell.y}
        width={gridSize}
        height={gridSize}
        class={"pixel " + cell.type}
      />
    {/each}
  </g>
{/if}

<style>
  div {
    position: fixed;
    top: 100px;
    left: 100px;
  }
  rect.pixel {
    stroke: none;
  }

  rect.pixel.park {
    fill: #e0e0e0;
  }

  rect.pixel.water {
    fill: #e0efff;
  }

  rect.pixel.other {
    fill: #dddddd;
  }

  rect.pixel.street {
    fill: rgba(236, 236, 236, 0.39);
  }

  button {
    margin-right: 1rem;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
</style>
