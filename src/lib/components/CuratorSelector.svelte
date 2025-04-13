<script>
  import { createEventDispatcher } from "svelte";
  import Legend from "@components/Legend.svelte";

  export let minYear;
  export let maxYear;

  export let curatorData = [];
  export let initialCurator = "";

  const dispatch = createEventDispatcher();

  function getMinDate(dates) {
    return dates && dates.length > 0 ? Math.min(...dates) : Infinity;
  }

  $: curators = curatorData
    .map((curator) => ({
      ...curator,
      minDate: getMinDate(curator.PlantDates?.map((pd) => pd.Date)),
    }))
    .sort((a, b) => a.minDate - b.minDate);

  $: selectedCurator =
    initialCurator || (curators.length > 0 ? curators[0].CuratorName : "");

  function selectCurator(curatorName) {
    selectedCurator = curatorName;
    const record = curatorData.find(
      (r) => r.CuratorName.toLowerCase() === curatorName.toLowerCase()
    );
    dispatch("curatorChange", { selectedCuratorData: record });
  }

  function dateToX(date) {
    if (maxYear === minYear) return 160;
    const padding = 10;
    const width = 300;
    return padding + ((date - minYear) / (maxYear - minYear)) * width;
  }

  const classColorMapping = {
    "herb. - flower": "#C2185B", // deep rose
    "herb. - fruit": "#AD1457", // raspberry red
    "herb. - vegetative": "#880E4F", // dark magenta
    seed: "#D81B60", // strong pink
    "herb. - twig/buds": "#E91E63", // vivid pink
    "fruit colln": "#F06292", // light pink
    "herb. - seedling": "#EC407A", // soft rosy pink
    bark: "#B71C1C", // deep red
  };
</script>

<aside class="curator-sidebar">
  <Legend {classColorMapping} />

  <ul>
    {#each curators as curator (curator.CuratorName)}
      <li
        on:click={() => selectCurator(curator.CuratorName)}
        class:selected={curator.CuratorName === selectedCurator}
      >
        {#if curator.CuratorName === selectedCurator}
          <p class="curator-name">{curator.CuratorName}</p>
        {/if}
        {#if curator.PlantDates && curator.PlantDates.length > 0}
          <svg class="histogram" width="320" height="25">
            <line
              x1="10"
              y1="12"
              x2="310"
              y2="12"
              stroke="#ccc"
              stroke-width="1"
            />

            {#each curator.PlantDates as pd}
              <circle cx={dateToX(pd.Date)} cy="12" r="2"> </circle>
            {/each}

            <text x="10" y="8" font-size="8" fill="#333">{minYear}</text>
            <text x="310" y="8" font-size="8" fill="#333" text-anchor="end">
              {maxYear}
            </text>

            <text x="160" y="23" font-size="8" fill="#333" text-anchor="middle">
              {curator.PlantDates.length} annotation{curator.PlantDates
                .length === 1
                ? ""
                : "s"}
            </text>
          </svg>
        {/if}
      </li>
    {/each}
  </ul>
</aside>

<style>
  .curator-sidebar {
    width: 330px;
    background: #f9f9f9;
    border-right: 1px solid #ddd;
    overflow-y: auto;
    font-family: sans-serif;
  }

  .curator-sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .curator-sidebar li {
    /* padding: 0.5em; */
    border-bottom: 1px solid #ccc;
    cursor: pointer;
    transition: background 0.3s;
  }

  .curator-sidebar li:hover {
    background: #eee;
  }

  .curator-sidebar li.selected {
    background: #ddd;
    font-weight: bold;
  }

  .curator-name {
    margin: 0;
    margin-bottom: 0.3em;
    font-size: 0.9em;
    text-align: center;
    width: 100%;
  }

  .histogram {
    display: block;
    /* margin-top: 0.3em; */
  }

  .histogram line {
    stroke-dasharray: 3;
  }

  .histogram circle {
    transition: fill 0.3s;
    fill: var(--annotation-color, darkslateblue);
  }

  .histogram circle:hover {
    fill: darkblue;
  }

  .histogram text {
    font-family: sans-serif;
  }
</style>
