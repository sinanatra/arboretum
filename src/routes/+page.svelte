<script>
  import { onMount } from "svelte";
  import Header from "@components/Header.svelte";
  import Viz from "@components/Viz.svelte";
  import Legend from "@components/Legend.svelte";

  let data = [];
  let currentYear = 2011;
  let minYear;
  let maxYear;

  onMount(async () => {
    const response = await fetch("data/ArnArbPlants2025.json");
    data = await response.json();
    // data = d3.csvParse(csvData);

    minYear = Math.min(...data.map((d) => parseInt(d.ACC_YR)));
    maxYear = Math.max(...data.map((d) => parseInt(d.ACC_YR)));
    currentYear = maxYear;
  });

  function handleYearChange(event) {
    currentYear = +event.detail;
  }

  const classColorMapping = {
    Eudicot: "#d7191c",
    Ginkgoopsida: "#fdae61",
    Monocot: "#ffffbf",
    Lycopodiopsida: "#abdda4",
    Pinopsida: "#2b83ba",
  };
</script>

<div>
  <Header on:yearChange={handleYearChange} {currentYear} {minYear} {maxYear} />
  {#if data.length > 0}
    <Viz {data} {currentYear} {classColorMapping}/>
    <Legend {classColorMapping} />
  {/if}
</div>

<style>
  :global(body) {
    background: white;
    color: black;
    overflow: hidden;
    font-family: sans-serif;
  }
</style>
