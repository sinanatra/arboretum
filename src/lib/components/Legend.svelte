<script>
  export let classColorMapping;

  const classNames = Object.keys(classColorMapping);
  const maxAge = 40; // Maximum age to be represented
  const numRings = 4; // Number of rings in the infographic
  const reducedBaseRadius = 10;
  const ringSpacing = 20; // 10 years per ring
</script>

<div class="legend-container">
  <!-- <div class="legend">
        {#each classNames as className}
            <div class="legend-item">
                <div
                    class="legend-color"
                    style="background-color: {classColorMapping[className]};"
                ></div>
                <span>{className}</span>
            </div>
        {/each}
    </div> -->

  <svg class="infographic" width="150" height="120">
    <g transform="translate(75, 60)">
      {#each Array(numRings + 1) as _, i}
        <circle
          r={reducedBaseRadius + i * ringSpacing}
          fill="none"
          stroke="#888"
          stroke-width="1"
        />
        {#if i > 0}
          <text
            x="0"
            y={-(reducedBaseRadius + i * ringSpacing)}
            dy="1.6em"
            text-anchor="middle"
            fill="black"
            font-size="10"
          >
            {i * 10} years
          </text>
        {/if}
      {/each}
    </g>
  </svg>
</div>

<style>
  .legend-container {
    display: flex;
    flex-direction: column;
    position: absolute;
    bottom: 10px;
    right: 10px;
    border: 1px solid;
    padding: 5px;
    font-size: 12px;
    color: black;
  }

  .legend {
    display: flex;
    flex-direction: column;
    padding: 5px;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
  }

  .legend-color {
    width: 10px;
    height: 10px;
    margin-right: 10px;
  }

  /* 
  .infographic {
    border: 1px dashed;
  } */
</style>
