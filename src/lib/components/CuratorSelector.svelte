<script>
  import { createEventDispatcher } from "svelte";

  import * as d3 from "d3";

  export let curatorData = [];
  export let initialCurator = "";

  const dispatch = createEventDispatcher();

  $: curators = curatorData
    .slice()
    .sort((a, b) => a.CuratorName.localeCompare(b.CuratorName));

  $: selectedCurator =
    initialCurator || (curators.length > 0 ? curators[0] : "");

  function selectCurator(curator) {
    selectedCurator = curator;
    const record = curatorData.find(
      (r) => r.CuratorName.toLowerCase() === curator.toLowerCase()
    );
    dispatch("curatorChange", { selectedCuratorData: record });
  }

  function getStats(curator) {
    const dates = curator.PlantDates.map((pd) => pd.Date);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    return { minDate, maxDate, count: dates.length, dates };
  }

  function dateToX(date, minDate, maxDate) {
    if (maxDate === minDate) return 100;
    return 10 + ((date - minDate) / (maxDate - minDate)) * 180;
  }
</script>

<aside class="curator-sidebar">
  <ul>
    {#each curators as curator (curator.CuratorName)}
      <li
        on:click={() => selectCurator(curator.CuratorName)}
        class:selected={curator.CuratorName === selectedCurator}
      >
        <div class="curator-name">{curator.CuratorName}</div>
        {#if curator.PlantDates && curator.PlantDates.length > 0}
          {@const stats = getStats(curator)}
          <svg class="histogram" width="320" height="40">
            <line
              x1="10"
              y1="20"
              x2="280"
              y2="20"
              stroke="#ccc"
              stroke-width="2"
            />
            {#if stats.maxDate !== stats.minDate}
              {#each stats.dates as d}
                <circle
                  cx={dateToX(d, stats.minDate, stats.maxDate)}
                  cy="20"
                  r="2"
                  fill="blue"
                />
              {/each}
            {:else}
              <circle cx="100" cy="20" r="4" fill="blue" />
            {/if}

            <text x="10" y="15" font-size="10" fill="#333">{stats.minDate}</text
            >
            <text x="280" y="15" font-size="10" fill="#333" text-anchor="end"
              >{stats.maxDate}</text
            >

            <text
              x="100"
              y="35"
              font-size="10"
              fill="#333"
              text-anchor="middle"
            >
              {stats.count} annotation{stats.count === 1 ? "" : "s"}
            </text>
          </svg>
        {/if}
      </li>
    {/each}
  </ul>
</aside>

<style>
  .curator-sidebar {
    width: 320px;
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
    padding: 1em;
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
    margin-bottom: 0.5em;
  }
  .histogram {
    display: block;
    margin-top: 0.5em;
  }
  .histogram line {
    stroke-dasharray: 4;
  }
  .histogram circle {
    transition: fill 0.3s;
  }
  .histogram circle:hover {
    fill: darkblue;
  }
  .histogram text {
    font-family: sans-serif;
  }
</style>
