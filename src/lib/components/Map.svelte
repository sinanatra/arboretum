<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let svg;
  let geoData;

  const projection = d3
    .geoMercator()
    .center([-71.1167, 42.377])
    .scale(30000)
    .translate([window.innerWidth / 2, window.innerHeight / 2]);

  const pathGenerator = d3.geoPath().projection(projection);

  onMount(async () => {
    geoData = await d3.json("data/HarvardArb.geojson");
    drawMap();
  });

  function drawMap() {
    if (!geoData) return;
    d3.select(svg)
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", pathGenerator)
      .attr("fill", "#e0e0e0")
      .attr("stroke", "#999")
      .attr("stroke-width", 0.5);
  }
</script>

<svg class="map" bind:this={svg} style="width: 100%; height: 100vh;"></svg>

<style>
  .map {
    display: block;
  }
</style>
