<script>
  import Header from "@components/Header.svelte";
  import Legend from "@components/Legend.svelte";
  import CuratorTimeline from "@components/CuratorTimeline.svelte";

  export let gridSize = 10;
  export let curatorData = [];
  export let curatorInfoData = [];
  export let initialCurator = "";
  export let colorMode = "accession"; // dot color, shown in the legend

  import { SIDEBAR_W, SIDEBAR_RIGHT } from "@lib/layout.js";
  import { COLOR_MODES, colorModeByKey, colorExplanation } from "@lib/colors.js";

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  // per-curator figures used for sorting the list (see CuratorTimeline)
  // From/To include retained unmapped records; counts below are mapped only.
  $: curators = curatorData.map((curator) => ({
    ...curator,
    minDate: curator.From,
    maxDate: curator.To,
    annotations: curator.PlantDates.length,
    plants: new Set(curator.PlantDates.map((pd) => pd.PlantID)).size,
  }));

  // the timeline axis runs from the first to the last annotation
  $: firstYear = Math.min(...curators.map((c) => c.minDate));
  $: lastYear = Math.max(...curators.map((c) => c.maxDate));

  $: selectedCurator = initialCurator;

  function handleSelect(event) {
    const name = event.detail.curatorName;
    // clicking the open curator again closes it and clears the highlight
    selectedCurator = name === selectedCurator ? "" : name;
    const record = curatorData.find((r) => r.CuratorName === selectedCurator) ?? null;
    dispatch("curatorChange", { selectedCuratorData: record });
  }

  $: legendItems = (colorModeByKey[colorMode] ?? COLOR_MODES[0]).legend;
</script>

<aside class="curator-sidebar" style:width="{SIDEBAR_W}px">
  <Header />

  <CuratorTimeline
    width={SIDEBAR_W - 10}
    {curators}
    {selectedCurator}
    minYear={firstYear}
    maxYear={lastYear}
    {curatorInfoData}
    on:select={handleSelect}
  />
</aside>

<div class="grid-float" style:right="{SIDEBAR_RIGHT + 10}px">
    <div class="grid-key" title="Each circle groups plant records within one geographic cell. Symbol is schematic.">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <rect x="1.5" y="1.5" width="15" height="15" fill="none" stroke="currentColor" stroke-width="0.7" stroke-dasharray="2 2" />
        <circle cx="9" cy="9" r="3" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="0.7" />
      </svg>
      <span><label>Grid <select bind:value={gridSize} aria-label="Geographic grid size">
        {#each [5, 10, 20] as meters}
          <option value={meters}>{meters} × {meters} m</option>
        {/each}
      </select></label><span class="grid-note">One circle per occupied cell</span></span>
    </div>

</div>

<div class="legend-float">
  <Legend items={legendItems} explanation={colorExplanation(colorMode)} />
</div>

<style>
  .grid-float { position: absolute; top: 10px; padding: 8px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(5px); font: 10px sans-serif; }
  .grid-key { display: flex; align-items: center; gap: 5px;  color: #444; }
  .grid-key select { font: inherit; color: inherit; border: 0; border-bottom: 1px solid #aaa; background: transparent; cursor: pointer; }
  .grid-key svg { flex-shrink: 0; }
  .grid-note { display: block; font-size: 9px; color: #666; margin-top: 2px; }

  .curator-sidebar {
    position: absolute;
    right: 10px;
    top: 0;
    backdrop-filter: blur(5px);
    overflow-y: scroll;
    overflow-anchor: none; /* row position is managed in CuratorTimeline */
    max-height: 98%;
    background-color: rgba(255, 255, 255, 0.6);
    padding: 10px;
  }

  .legend-float {
    position: absolute;
    left: 10px;
    top: 10px;
    backdrop-filter: blur(5px);
    background-color: rgba(255, 255, 255, 0.6);
    padding: 4px;
  }

</style>
