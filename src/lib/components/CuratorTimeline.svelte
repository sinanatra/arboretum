<script>
  export let curators = [];
  export let selectedCurator;
  export let minYear;
  export let maxYear;
  export let curatorInfoData = [];

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function selectCurator(curatorName) {
    dispatch("select", { curatorName });
  }

  function getCuratorBio(name) {
    const match = curatorInfoData.find(
      (c) => c.Name.toLowerCase() === name.toLowerCase()
    );
    return match?.Information || "";
  }

  function toTitleCase(name) {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  function dateToX(date) {
    if (maxYear === minYear) return 160;
    const padding = 10;
    const width = 300;
    return padding + ((date - minYear) / (maxYear - minYear)) * width;
  }

  function getPolylineSegments(entries, maxCount, gapThreshold = 5) {
    if (entries.length === 0) return [];

    const segments = [];
    let currentSegmentPoints = [];

    const [firstYear, firstCount] = entries[0];
    const firstX = dateToX(+firstYear);
    const firstHeight = 6 + (firstCount / maxCount) * 6;
    const firstY = 12 - firstHeight;
    currentSegmentPoints.push(`${firstX},${firstY}`);

    for (let i = 1; i < entries.length; i++) {
      const [currentYearStr, currentCount] = entries[i];
      const currentYear = +currentYearStr;
      const [prevYearStr] = entries[i - 1];
      const prevYear = +prevYearStr;

      if (currentYear - prevYear > gapThreshold) {
        if (currentSegmentPoints.length > 0) {
          segments.push(currentSegmentPoints.join(" "));
        }

        currentSegmentPoints = [];
      }

      const x = dateToX(currentYear);
      const height = 6 + (currentCount / maxCount) * 6;
      const y = 12 - height;
      currentSegmentPoints.push(`${x},${y}`);
    }

    if (currentSegmentPoints.length > 0) {
      segments.push(currentSegmentPoints.join(" "));
    }

    return segments;
  }
</script>

<ul>
  <p class="curator-description">
    A list of all the Curators who contributed to the arboretum. Click a name to view the trees they worked on.
  </p>
  {#each curators as curator (curator.CuratorName)}
    <li
      on:click={() => selectCurator(curator.CuratorName)}
      class:selected={curator.CuratorName === selectedCurator}
    >
      <p class="curator-name">{toTitleCase(curator.CuratorName)}</p>

      {#if curator.CuratorName === selectedCurator}
        <p class="curator-info">{getCuratorBio(curator.CuratorName)}</p>
      {/if}

      {#if curator.PlantDates?.length}
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
              (a, b) => +a[0] - +b[0]
            )}
            {@const maxCount = Math.max(...entries.map(([_, c]) => c))}
            {@const polylineSegments = getPolylineSegments(
              entries,
              maxCount,
              2
            )}

            {#each polylineSegments as segmentPoints}
              <polyline
                fill="none"
                stroke="green"
                stroke-width="1"
                points={segmentPoints}
                class="histogram-segment"
              />
            {/each}
          {:else}
            {#each curator.PlantDates as pd}
              <circle cx={dateToX(pd.Date)} cy="12" r="1" />
            {/each}
          {/if}

          <text x="10" y="8" font-size="8" fill="#333">{minYear}</text>
          <text x="310" y="8" font-size="8" fill="#333" text-anchor="end"
            >{maxYear}</text
          >
          <text x="160" y="23" font-size="8" fill="#333" text-anchor="middle">
            {curator.PlantDates.length} annotation{curator.PlantDates.length ===
            1
              ? ""
              : "s"}
          </text>
        </svg>
      {/if}
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    padding-top: 10px;
  }

  li {
    margin-top: 1px;
    cursor: pointer;
    transition: background 0.3s;
  }

  li.selected {
    padding-top: 10px;
  }
  
  .curator-description {
    font-size: .8em;
    /* border-top: 1px solid; */
    padding-top: 1em;
  }

  .curator-name {
    margin: 1px 0;
    font-size: 0.8em;
    text-align: center;
    width: 100%;
  }

  .curator-info {
    font-size: 1.2em;
    padding: 0 0.5em 0.3em;
    color: #444;
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

  .histogram circle:hover {
    fill: green;
  }

  .histogram text {
    font-family: sans-serif;
  }
</style>
