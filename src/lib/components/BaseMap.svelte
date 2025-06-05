<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  export let projection;

  let geoData = null;
  let pathGenerator = null;

  onMount(async () => {
    try {
      const response = await fetch("map/grid_3px.geojson");
      const geojson = await response.json();
      geoData = geojson.features;
      pathGenerator = d3.geoPath().projection(projection);
    } catch (error) {
      console.error("Error loading map:", error);
    }
  });
</script>

{#if geoData && pathGenerator}
  <g>
    {#each geoData as feature, i (feature.id || i)}
      <path
        d={pathGenerator(feature)}
        class={"pixel " + feature.properties.type}
      />
    {/each}
  </g>
{/if}

<style>
  path.pixel {
    stroke: none;
    pointer-events: none;
  }
  path.pixel.park {
    fill: #f1f1f1;
  }
  path.pixel.water {
    fill: #e0efff;
  }
  path.pixel.other {
    fill: #dddddd;
  }
  path.pixel.street {
    fill: #f8f8f8;
  }
</style>
