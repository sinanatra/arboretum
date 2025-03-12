<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  export let xScale;
  export let yScale;

  export let transform = { x: 0, y: 0, k: 1 };

  let geoData = null;
  let pathGenerator = null;
  let gContainer;

  onMount(async () => {
    try {
      const response = await fetch("pixelated.geojson");
      geoData = await response.json();
      console.log(
        "Loaded pixelated geojson:",
        geoData.features.length,
        "features"
      );

      const customProjection = d3.geoTransform({
        point: function (lon, lat) {
          this.stream.point(xScale(lon), yScale(lat));
        },
      });

      pathGenerator = d3.geoPath().projection(customProjection);
    } catch (error) {
      console.error("Error loading pixelated.geojson", error);
    }
  });
</script>

{#if geoData && pathGenerator}
  <g bind:this={gContainer}>
    {#each geoData.features as feature, i (feature.id || i)}
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
