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
  <div class="color-swatch-section">
    {#each groupLabels as label}
      <div class="swatch-row">
        <span class="label">{label}</span>

        <div
          class="color-box"
          style="background-color: {clusterColorMapping[label]}"
        ></div>
      </div>
    {/each}
  </div>
</div>

<style>
  .legend-container {
    display: flex;
    flex-direction: row-reverse;
    padding: 6px;
    font-size: 10px;
    color: black;
    text-align: right;
  }

  .color-swatch-section {
    /* display: grid;
    grid-template-columns: repeat(4, 1fr); */
    gap: 1px 5px;
  }

  .swatch-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .color-box {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }

  .label {
    font-size: 10px;
    flex: 1;
    word-break: break-word;
  }
</style>
