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

  const clusterColorMapping = {
    "1870s": "#FF00F0",
    "1880s": "#E600F5",
    "1890s": "#CC00F8",
    "1900s": "#B000F8",
    "1910s": "#9600F5",
    "1920s": "#7A00FF",
    "1930s": "#5F00FF",
    "1940s": "#4400FF",
    "1950s": "#2A00FF",
    "1960s": "#1000FF",
    "1970s": "#0070FF",
    "1980s": "#0090FF",
    "1990s": "#00B0FF",
    "2000s": "#00CCFF",
    "2010s": "#00E5FF",
    Unknown: "#D0D0D0",
  };
</script>

<aside class="curator-sidebar">
  <Legend {clusterColorMapping} />

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

            {#if curator.PlantDates.length > 1}
              {@const yearCounts = curator.PlantDates.reduce((acc, pd) => {
                const y = pd.Date;
                acc[y] = (acc[y] || 0) + 1;
                return acc;
              }, {})}

              {@const entries = Object.entries(yearCounts).sort(
                (a, b) => a[0] - b[0]
              )}
              {@const maxCount = Math.max(
                ...entries.map(([_, count]) => count)
              )}

              {@const points = entries
                .map(([year, count]) => {
                  const x = dateToX(+year);
                  const height = 6 + (count / maxCount) * 6; // max spike height = 12px
                  const y = 12 - height;
                  return `${x},${y}`;
                })
                .join(" ")}

              <polyline
                fill="none"
                stroke="blue"
                stroke-width="1"
                {points}
              />
            {:else}
              {#each curator.PlantDates as pd}
                <circle cx={dateToX(pd.Date)} cy="12" r="1" />
              {/each}
            {/if}

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
    position: absolute;
    right: 10px;
    top: 10px;
    background-color: #cccccc13;
    height: 70vh;
    width: 330px;
    font-family: sans-serif;
  }

  .curator-sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow: auto;
    height: 100%;
  }

  .curator-sidebar li {
    border-bottom: 1px solid #ccc;
    border-radius: 6px;
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
  }

  .histogram line {
    stroke-dasharray: 3;
  }

  .histogram polyline {
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .histogram circle {
    transition: fill 0.3s;
  }

  .histogram circle:hover {
    fill: blue;
  }

  .histogram text {
    font-family: sans-serif;
  }
</style>
