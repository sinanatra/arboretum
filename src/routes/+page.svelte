<script>
  import { onMount } from "svelte";
  import Header from "@components/Header.svelte";
  import Viz from "@components/Viz.svelte";

  import CuratorSelector from "@components/CuratorSelector.svelte";

  let data = [];
  let curatorData = [];
  let currentYear = 2011;
  let minYear;
  let maxYear;
  let selectedCuratorData = null;

  onMount(async () => {
    const res = await fetch("data/ArnArbPlantsGEO.json");
    data = await res.json();
    minYear = Math.min(...data.map((d) => parseInt(d.ACC_YR)));
    maxYear = Math.max(...data.map((d) => parseInt(d.ACC_YR)));
    currentYear = maxYear;

    const res2 = await fetch("data/Curator_Plants_Dates.json");
    curatorData = await res2.json();
    if (curatorData.length > 0) {
      selectedCuratorData = curatorData[0];
    }
  });

  $: console.log(curatorData);

  function handleYearChange(event) {
    currentYear = +event.detail;
  }

  function handleCuratorChange(event) {
    selectedCuratorData = event.detail.selectedCuratorData;
  }
</script>

{#if data.length > 0 && curatorData.length > 0}
  <div class="container">
    <div class="main">
      <!-- <Header
        on:yearChange={handleYearChange}
        {currentYear}
        {minYear}
        {maxYear}
      /> -->
      {#if data.length > 0}
        <Viz {data} {currentYear} {selectedCuratorData} />
      {/if}
    </div>
    <CuratorSelector {curatorData} on:curatorChange={handleCuratorChange} />
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
  }
  .main {
    flex: 1;
    position: relative;
  }
</style>
