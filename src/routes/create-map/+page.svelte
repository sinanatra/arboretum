<script>
  import { onMount } from "svelte";
  import GeneratePixelMap from "@components/GeneratePixelMap.svelte";
  import * as d3 from "d3";

  let data = [];
  let svg;
  let transform = d3.zoomIdentity;
  let projection;
  let gridSize = 50;

  onMount(async () => {
    try {
      const res = await fetch("data/ArnArbPlantsinfo.json");
      const text = await res.text();
      data = JSON.parse(text);

      computeProjection();

      const zoom = d3
        .zoom()
        .scaleExtent([2, 14])
        .on("zoom", (event) => {
          transform = event.transform;
        });

      d3.select(svg).call(zoom);

      const initialScale = 2;
      const tx = svg.clientWidth / 2 - initialScale * (svg.clientWidth / 1.8);
      const ty = svg.clientHeight / 2 - initialScale * (svg.clientHeight / 2.5);
      const initialTransform = d3.zoomIdentity
        .translate(tx, ty)
        .scale(initialScale);

      d3.select(svg).call(zoom.transform, initialTransform);
      transform = initialTransform;
    } catch (e) {
      console.error("Invalid JSON or fetch failed:", e.message);
    }
  });

  function computeProjection() {
    if (!svg || !data.length) return;

    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;

    const geoPoints = data
      .map((d) => {
        const lon = parseFloat(d.LONGITUDE);
        const lat = parseFloat(d.LATITUDE);
        return isNaN(lon) || isNaN(lat) ? null : [lon, lat];
      })
      .filter(Boolean);

    const geoFeatures = geoPoints.map(([lon, lat]) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
    }));

    projection = d3.geoMercator()
      .fitExtent([[0, 0], [svgWidth, svgHeight]], {
        type: "FeatureCollection",
        features: geoFeatures,
      });
  }
</script>

<div class="controls">
  <label for="gridSize">Grid Size:</label>
  <input id="gridSize" type="number" min="5" max="200" bind:value={gridSize} />
</div>

<div class="container">
  <svg bind:this={svg} style="width: 100%; height: 100vh;">
    {#if transform && projection}
      <foreignObject x="0" y="0" width="100%" height="100%">
        <GeneratePixelMap {transform} {projection} {gridSize} />
      </foreignObject>
    {/if}
  </svg>
</div>

<style>
  .controls {
    position: fixed;
    top: 10px;
    left: 10px;
    background: white;
    padding: 0.5rem 1rem;
    z-index: 1000;
  }

  .container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  svg {
    display: block;
  }
</style>
