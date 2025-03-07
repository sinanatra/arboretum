<script>
  import { onMount } from "svelte";
  import Header from "@components/Header.svelte";
  import Viz from "@components/Viz.svelte";
  import Legend from "@components/Legend.svelte";
  import CuratorSelector from "@components/CuratorSelector.svelte";
  import MapLayer from "@components/Map.svelte";

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

  const classColorMapping = {
    Eudicot: "#d7191c",
    Ginkgoopsida: "#fdae61",
    Monocot: "#ffffbf",
    Lycopodiopsida: "#abdda4",
    Pinopsida: "#2b83ba",
  };
</script>

{#if data.length > 0 && curatorData.length > 0}
  <div class="container">
    <div class="main">
      <Header
        on:yearChange={handleYearChange}
        {currentYear}
        {minYear}
        {maxYear}
      />
      {#if data.length > 0}
        <Viz {data} {currentYear} {selectedCuratorData} />
        <Legend {classColorMapping} />
      {/if}
    </div>
    <CuratorSelector {curatorData} on:curatorChange={handleCuratorChange} />
  </div>
{/if}

<style>
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
