<script>
    import { onMount } from "svelte";
    import Header from "@components/Header.svelte";
    import Viz from "@components/Viz.svelte";
    import * as d3 from "d3";

    let data = [];
    let viewType = "Geo";
    let currentYear = 2011; 
    let minYear;
    let maxYear;

    onMount(async () => {
        const response = await fetch("Arnarb.csv");
        const csvData = await response.text();
        data = d3.csvParse(csvData);

        minYear = Math.min(...data.map((d) => parseInt(d.Year)));
        maxYear = Math.max(...data.map((d) => parseInt(d.Year)));
        currentYear = maxYear; 
    });

    function changeViewType(type) {
        viewType = type;
    }

    function handleYearChange(event) {
        currentYear = +event.detail;
    }
</script>

<div>
    <Header
        on:changeViewType={(event) => changeViewType(event.detail)}
        on:yearChange={handleYearChange}
        {viewType}
        {currentYear}
        {minYear}
        {maxYear}
    />
    {#if data.length > 0}
        <Viz {data} {viewType} {currentYear} />
    {/if}
</div>

<style>
    :global(body) {
        background: black;
        overflow: hidden;
        font-family: sans-serif;
    }
</style>
