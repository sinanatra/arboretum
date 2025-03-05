<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  export let currentYear;
  export let minYear;
  export let maxYear;

  function handleYearChange(event) {
    dispatch("yearChange", event.target.value);
  }
</script>

<div class="header">
  <input
    type="range"
    min={minYear}
    max={maxYear}
    bind:value={currentYear}
    on:input={handleYearChange}
  />
  <span>{currentYear}</span>
</div>

<style>
  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    gap: 10px;
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 100;
  }

  input[type="range"] {
    width: 200px;
    margin: 0 10px;
  }
</style>
