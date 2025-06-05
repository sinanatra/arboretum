<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  import Viz from "@components/Viz.svelte";
  import CuratorSelector from "@components/CuratorSelector.svelte";

  let data = [];
  let curatorData = [];
  let curatorInfoData = [];
  let currentYear = 2011;
  let minYear;
  let maxYear;
  let selectedCuratorData = null;

  let geoFeatures = [];
  let projection = null;
  let svgWidth = 1000;
  let svgHeight = 800;

  onMount(async () => {
    const plantRes = await fetch("data/ArnArbPlantsinfo.json");
    data = await plantRes.json();
    minYear = Math.min(...data.map((d) => parseInt(d.ACC_YR)));
    maxYear = Math.max(...data.map((d) => parseInt(d.ACC_YR)));
    currentYear = maxYear;

    const curatorRes = await fetch("data/Curator_Plants_Dates.json");
    curatorData = await curatorRes.json();
    if (curatorData.length > 0) {
      selectedCuratorData = curatorData[0];
    }

    const curatorBio = await fetch("data/Curatorinfo.json");
    curatorInfoData = await curatorBio.json();
    console.log(curatorInfoData)

    const geoRes = await fetch("map/grid_3px.geojson");
    const geoData = await geoRes.json();
    geoFeatures = geoData.features;

    projection = d3.geoMercator().fitExtent(
      [
        [0, 0],
        [svgWidth, svgHeight],
      ],
      { type: "FeatureCollection", features: geoFeatures }
    );
  });

  function handleCuratorChange(event) {
    selectedCuratorData = event.detail.selectedCuratorData;
  }
</script>

{#if data.length > 0 && curatorData.length > 0 && curatorInfoData.length > 0 && projection}
  <div class="container">
    <div class="main">
      <Viz
        {data}
        {currentYear}
        {selectedCuratorData}
        {minYear}
        {maxYear}
        {projection}
      />
    </div>
    <CuratorSelector
      {curatorData}
      {curatorInfoData}
      on:curatorChange={handleCuratorChange}
      {minYear}
      {maxYear}
    />
  </div>
{/if}

<style>
  .container {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  .main {
    flex: 1;
    position: relative;
  }
</style>
