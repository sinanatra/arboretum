<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import * as turf from "@turf/turf";

  export let xScale;
  export let yScale;
  export let width = window.innerWidth;
  export let height = window.innerHeight;

  export let gridSize = 5;

  let geoData = null;
  let gContainer;
  let gridCells = [];

  const streetBufferDistance = 10;

  onMount(async () => {
    try {
      const response = await fetch("/map1.geojson");
      geoData = await response.json();

      if (xScale && yScale) {
        generateGridInChunks();
      }
    } catch (error) {
      console.error("Error loading map.geojson", error);
    }
  });

  function generateGridInChunks() {
    gridCells = [];

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
      }
    }

    if (window.requestIdleCallback) {
      requestIdleCallback(processChunk);
    } else {
      requestAnimationFrame(() => processChunk());
    }
  }
</script>

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
  rect.pixel {
    stroke: none;
  }

  rect.pixel.park {
    fill: #f1f1f1;
  }

  rect.pixel.water {
    fill: #e0efff;
  }

  rect.pixel.other {
    fill: #dddddd;
  }

  rect.pixel.street {
    fill: #f8f8f8;
  }
</style>
