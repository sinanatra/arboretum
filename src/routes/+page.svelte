<script>
    import { onMount } from "svelte";
    import Header from "@components/Header.svelte";
    import Viz from "@components/Viz.svelte";
    import * as d3 from "d3";

    let data = [];
    let viewType = "Geo";
    let forceParams = {
        manyBodyStrength: 3,
        xStrength: 0.1,
    };

    onMount(async () => {
        const response = await fetch("Arnarb_sample.csv");
        const csvData = await response.text();
        data = d3.csvParse(csvData);
    });

    function changeViewType(type) {
        viewType = type;
    }
</script>

<div>
    <Header
        on:changeViewType={(event) => changeViewType(event.detail)}
        {viewType}
    />
    {#if data.length > 0}
        <Viz {data} {viewType} />
    {/if}
</div>

<style>
    :global(body) {
        background: black;
        overflow: hidden;
    }
</style>
