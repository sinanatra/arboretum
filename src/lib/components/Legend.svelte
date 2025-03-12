<script>
  export let classColorMapping;

  const classNames = Object.keys(classColorMapping);
  const maxAge = 40;
  const numRings = 20;
  const reducedBaseRadius = 10;
  const ringSpacing = 20;
</script>

<div class="legend-container">
  <svg class="infographic" preserveAspectRatio="xMidYMid meet">
    <g transform="translate(0,60)">
      {#each Array(numRings + 1) as _, i}
        <circle
          r={reducedBaseRadius + i * ringSpacing}
          fill="none"
          stroke="#888"
          stroke-width="1"
        />
        <text
          x={reducedBaseRadius + i * ringSpacing + 20}
          y={(i * ringSpacing) / 2 + 5}
          dy="0.35em"
          text-anchor="middle"
          fill="black"
          font-size="10"
        >
          {i === 0 ? "1 year" : `${i * 10} years`}
        </text>
      {/each}
    </g>
  </svg>
</div>

<style>
  .legend-container {
    display: flex;
    flex-direction: column;
    /* position: absolute;
    bottom: 10px;
    right: 10px; */
    border-bottom: 1px solid;
    padding: 5px;
    font-size: 12px;
    color: black;
    /* background-color: white; */
  }

  circle {
    stroke: rgb(255, 141, 1);
  }

  text {
    fill: black;
  }
</style>
