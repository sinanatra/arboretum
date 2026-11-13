<script>
  export let curators = [];
  export let selectedCurator;
  export let minYear;
  export let maxYear;
  export let curatorInfoData = [];

  import { createEventDispatcher, onMount } from "svelte";
  import { slide } from "svelte/transition";
  const dispatch = createEventDispatcher();

  const SORTS = [
    { key: "first", label: "first active", compare: (a, b) => a.minDate - b.minDate || a.maxDate - b.maxDate },
    { key: "last", label: "last active", compare: (a, b) => b.maxDate - a.maxDate || a.minDate - b.minDate },
    { key: "annotations", label: "plant-year entries", compare: (a, b) => b.annotations - a.annotations },
    { key: "plants", label: "plant records", compare: (a, b) => b.plants - a.plants },
    { key: "name", label: "surname", compare: (a, b) => surname(a.CuratorName).localeCompare(surname(b.CuratorName)) },
  ];
  // The last chosen sort is remembered in this browser (localStorage).
  const SORT_KEY = "arboretum:curator-sort";
  let sortKey = "first";

  onMount(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (SORTS.some((s) => s.key === saved)) sortKey = saved;
    } catch {}
  });

  function setSort(key) {
    sortKey = key;
    try {
      localStorage.setItem(SORT_KEY, key);
    } catch {}
  }

  // 'John H. "Jack" Alexander III' → 'Alexander'; 'E Paul (Paul W. Meyer)' →
  // 'Meyer'; 'Block, K.' (a ledger signer with no full name) → 'Block'
  function surname(name) {
    const n = name.replace(/,?\s+(jr\.?|ii|iii)$/i, "").trim();
    if (n.includes(",")) return n.split(",")[0].trim();
    const words = n
      .replace(/\(([^)]*)\)/g, (_, inner) => (/\s/.test(inner.trim()) ? inner : ""))
      .replace(/"[^"]*"/g, "")
      .trim()
      .split(/\s+/);
    return words[words.length - 1];
  }

  $: sort = SORTS.find((s) => s.key === sortKey);
  $: sortedCurators = [...curators].sort(
    (a, b) =>
      sort.compare(a, b) ||
      a.minDate - b.minDate ||
      a.CuratorName.localeCompare(b.CuratorName)
  );

  const SLIDE_MS = 300;

  // Keep the clicked row still while bios open and close around it: the bio
  // of a previously open curator higher up collapses during the same
  // animation, which would otherwise pull the clicked row upwards.
  function selectCurator(curatorName, event) {
    const row = event.currentTarget;
    const scroller = row.closest(".curator-sidebar");
    const startTop = row.getBoundingClientRect().top;
    dispatch("select", { curatorName });
    if (!scroller) return;
    const end = performance.now() + SLIDE_MS + 50;
    (function hold() {
      const drift = row.getBoundingClientRect().top - startTop;
      if (drift) scroller.scrollTop += drift;
      if (performance.now() < end) requestAnimationFrame(hold);
    })();
  }

  function getCuratorBio(name) {
    const match = curatorInfoData.find(
      (c) => c.Name.toLowerCase() === name.toLowerCase()
    );
    return match?.Information || "";
  }


  // Row geometry (px, matching the list-header axis): the timeline spans the
  // full row, x = 10 to width-10, under the name where they overlap.
  export let width = 320;
  $: SPARK_W = width - 20;
  const SPARK_H = 8;

  function dateToX(date) {
    return ((date - axisMin) / (axisMax - axisMin)) * SPARK_W;
  }

  // The axis is rounded out to whole decades (e.g. 1936–2012 → 1930–2020)
  // and marked every ten years, labelled every thirty plus the last year.
  $: axisMin = Math.floor(minYear / 10) * 10;
  $: axisMax = Math.max(Math.ceil(maxYear / 10) * 10, axisMin + 10);
  $: axisTicks = Array.from(
    { length: (axisMax - axisMin) / 10 + 1 },
    (_, i) => axisMin + i * 10
  );

  // Timeline shapes are computed once per curator, not on every re-sort:
  // re-sorting re-renders each row, and rebuilding the year counts from
  // ~170k annotations each time made switching order sluggish.
  $: sparkByName = buildSparks(curators, axisMin, axisMax, SPARK_W);

  // Years includes mapped and unmapped records from the retained window. Runs of
  // years closer than GAP become a line; a year on its own becomes a dot, so
  // every timeline starts where the "first active" sort puts it.
  const GAP = 2;

  function buildSparks(list) {
    const out = new Map();
    for (const c of list) {
      const entries = c.Years;
      const maxCount = Math.max(1, ...entries.map(([, n]) => n));
      const runs = [];
      entries.forEach(([year, n], i) => {
        if (i === 0 || year - entries[i - 1][0] > GAP) runs.push([]);
        runs[runs.length - 1].push([dateToX(year), countToY(n, maxCount)]);
      });
      out.set(c.CuratorName, {
        segments: runs.filter((r) => r.length > 1).map((r) => r.join(" ")),
        dots: runs.filter((r) => r.length === 1).map((r) => r[0]),
      });
    }
    return out;
  }

  // taller = more annotations that year; the lowest point sits just above the line
  function countToY(count, maxCount) {
    return SPARK_H - 1 - (count / maxCount) * (SPARK_H - 2);
  }
</script>

<div class="list-header" style:--row-w="{SPARK_W}px">
  <!-- year axis, aligned with every curator's timeline (x = 10 to width-10); its
       baseline is also the divider between the project text and the list -->
  <svg class="axis" {width} height="18" aria-hidden="true">
    <line x1="10" y1="14.5" x2={width - 10} y2="14.5" class="baseline" />
    {#each axisTicks as year}
      {@const labelled = (year - axisMin) % 30 === 0 || year === axisMax}
      <line
        x1={10 + dateToX(year)}
        y1={labelled ? 11 : 13}
        x2={10 + dateToX(year)}
        y2={labelled ? 18 : 16}
        class="tick"
      />
      {#if labelled}
        <text
          x={10 + dateToX(year)}
          y="8"
          text-anchor={year === axisMin ? "start" : year === axisMax ? "end" : "middle"}
          >{year}</text
        >
      {/if}
    {/each}
  </svg>

  <div class="title-row">
    <h2>Curators<span class="count">{curators.length}</span></h2>
    <label class="sort-select">
      <span class="visually-hidden">Sort curators by</span>
      <select value={sortKey} on:change={(e) => setSort(e.currentTarget.value)}>
        {#each SORTS as s}
          <option value={s.key}>{s.label}</option>
        {/each}
      </select>
    </label>
  </div>


</div>



<ul style:--row-w="{SPARK_W}px">
  {#each sortedCurators as curator (curator.CuratorName)}
    <li
      on:click={(e) => selectCurator(curator.CuratorName, e)}
      class:selected={curator.CuratorName === selectedCurator}
    >
      <!-- name and full-width timeline both sit on the dotted line (the name
           drawn over the timeline where they meet); the count hangs below right -->
      <div class="curator-top">
        <span class="curator-name">{curator.CuratorName}</span>
        {#if curator.PlantDates?.length}
          {@const spark = sparkByName.get(curator.CuratorName)}
          <svg class="spark" width={SPARK_W} height={SPARK_H} aria-hidden="true">
            {#each spark.segments as points}
              <polyline fill="none" stroke="green" stroke-width="1" {points} />
            {/each}
            {#each spark.dots as [cx, cy]}
              <circle {cx} {cy} r="1" fill="green" />
            {/each}
          </svg>
        {/if}
      </div>
      <svg class="dotted" {width} height="1" aria-hidden="true">
        <line x1="10" y1="0.5" x2={width - 10} y2="0.5" stroke="#ccc" stroke-width="1" />
      </svg>
      {#if curator.PlantDates?.length}
        <div class="curator-count">
          <span title="Mapped plant-year entries">{curator.annotations.toLocaleString("en-US")}</span>
          <span aria-hidden="true">·</span>
          <span title="Distinct mapped plant records">{curator.plants.toLocaleString("en-US")}</span>
        </div>
      {/if}

      {#if curator.CuratorName === selectedCurator}
        <p class="curator-info" transition:slide={{ duration: SLIDE_MS }}>
          {getCuratorBio(curator.CuratorName)}
        </p>
      {/if}
    </li>
  {/each}
</ul>

<style>
  /* stays at the top of the sidebar while the list scrolls under it */
  .list-header {
    position: sticky;
    top: -10px; /* cover the sidebar's 10px padding */
    z-index: 2;
    margin-top: 10px;
    padding: 6px 0 2px;
    background: rgba(255, 255, 255, 0.92);
  }

  /* "CURATORS 132" on the left, the "FIRST ACTIVE ▾" sort menu on the right,
     in the same small sans-serif as the axis and counts */
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    width: var(--row-w);
    padding: 0 10px 4px;
  }

  h2 {
    margin: 0;
    font-weight: 400;
    line-height: 1;
    text-transform: uppercase;
    color: #333;
  }

  h2,
  .count,
  .sort-select select,
  .axis text {
    font-family: sans-serif;
    font-size: 8px;
    letter-spacing: 0.04em;
  }

  .count {
    margin-left: 0.5em;
    color: #666;
    font-variant-numeric: tabular-nums;
  }

  /* plain uppercase label with a caret; the native menu opens on click */
  .sort-select select {
    appearance: none;
    -webkit-appearance: none;
    border: none;
    background: transparent
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4'%3E%3Cpath d='M0 0h6L3 4z' fill='%23666'/%3E%3C/svg%3E")
      no-repeat right center;
    padding: 0 10px 0 0;
    margin: 0;
    color: #666;
    text-transform: uppercase;
    text-align: right;
    cursor: pointer;
  }

  .sort-select select:hover {
    color: green;
  }

  .sort-select select:focus-visible {
    outline: 1px solid green;
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }


  .axis {
    display: block;
    margin-bottom: 4px;
  }

  .axis .baseline {
    stroke: #333;
    stroke-width: 0.5;
  }

  .axis .tick {
    stroke: #333;
    stroke-width: 0.5;
  }

  .axis text {
    fill: #666;
  }


  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    padding-top: 2px;
  }

  li {
    margin-top: 5px;
    cursor: pointer;
    transition: background 0.3s;
  }

  



  .curator-top {
    position: relative;
    width: var(--row-w);
    min-height: 8px;
    padding: 0 10px 1px;
  }

  .curator-name {
    position: relative; /* above the timeline */
    z-index: 1;
    display: block;
    font-size: 0.7em;
    line-height: 1.1;
  }

  .spark {
    position: absolute;
    left: 10px;
    bottom: 1px;
    display: block;
    overflow: visible;
  }

  .spark polyline {
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .dotted {
    display: block;
  }

  .dotted line {
    stroke-dasharray: 3;
  }

  .curator-count {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    width: var(--row-w);
    padding: 1px 10px 0;
    text-align: right;
    font-family: sans-serif;
    font-size: 8px;
    color: #333;
    font-variant-numeric: tabular-nums;
  }

  .curator-info {
    font-size: 0.9em;
    padding: 0 0.5em 0.3em;
    color: #444;
  }





</style>
