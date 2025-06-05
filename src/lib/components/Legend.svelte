<script>
  // export let classColorMapping;
  export let clusterColorMapping;

  // const classNames = Object.keys(classColorMapping);
  const groupLabels = Object.keys(clusterColorMapping);

  const numRings = 20;
  const reducedBaseRadius = 10;
  const ringSpacing = 20;
</script>

<div class="legend-container">
  <!-- <svg
    class="infographic"
    preserveAspectRatio="xMidYMid meet"
    width="100%"
    height="150"
  >
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
  </svg> -->

  <div class="color-swatch-section">
    {#each groupLabels as label}
      <div class="swatch-row">
        <div
          class="color-box"
          style="background-color: {clusterColorMapping[label]}"
        ></div>
        <span class="label">{label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .legend-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    font-size: 12px;
    color: black;
    /* background-color: white; */

    border: 1px solid #ccc;
    border-radius: 6px;
    max-width: 300px;
    margin-top: 10px;

    margin-bottom: 5px;
  }

  .infographic {
    width: 100%;
    height: auto;
  }

  .color-swatch-section {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px 10px;
  }

  .swatch-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .color-box {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    border: 1px solid #555;
    flex-shrink: 0;
  }

  .label {
    font-size: 12px;
    color: #333;
    flex: 1;
    word-break: break-word;
  }

  text {
    fill: black;
  }
</style>
