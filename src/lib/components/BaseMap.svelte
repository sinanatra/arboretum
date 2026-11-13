<script>
  export let paths = [];
</script>

  <g>
    {#each paths as path (path.type)}
      <path
        d={path.d}
        class={"pixel " + path.type}
      />
    {/each}
  </g>

<style>
  path.pixel {
    stroke: none;
    pointer-events: none;
  }
  path.pixel.park {
    fill: white;
  }
  path.pixel.water {
    fill: #e0efff;
  }
  path.pixel.other {
    fill: #dddddd;
  }
  path.pixel.street {
    fill: rgba(238, 238, 238, 0.564);
  }
</style>
