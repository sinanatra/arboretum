<script>
  export let items = []; // [{ label, color }]
  export let explanation = "";
</script>

<div class="legend-container">
  <div class="color-swatch-section">
    <details>
      <summary>About dot colors</summary>
      <p>{explanation}</p>
      <p>Selecting a curator highlights whole dots. Their colors and sizes still describe all plant records in each dot.</p>
    </details>
    {#each items as item (item.label)}
      <div class="swatch-row">
        <div class="color-box" style="background-color: {item.color}"></div>
        <span class="label">{item.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  details { max-width: 180px; margin-bottom: 6px; }
  details p { line-height: 1.4; }
  .legend-container {
    display: flex;
    flex-direction: row-reverse;
    padding: 6px;
    font-size: 10px;
    color: black;
    text-align: left;
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
