<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  import Viz from "@components/Viz.svelte";
  import Panel from "@components/Panel.svelte";
  import HabitFilter from "@components/HabitFilter.svelte";
  import { HABIT_GROUPS, habitGroup } from "@lib/habits.js";
  import { colorModeByKey } from "@lib/colors.js";
  import { fetchJson } from "@lib/data.js";
  import { base } from "$app/paths";
  import { SIDEBAR_RIGHT } from "@lib/layout.js";

  let data = [];
  let curatorData = [];
  let curatorInfoData = [];
  const currentYear = 2012; // fixed export year, independent of filters/universe
  let selectedCuratorData = null;
  let loading = true;
  let loadError = "";

  // growth-form filter: habit groups shown on the map (all by default)
  let habitFilter = new Set(HABIT_GROUPS.map((g) => g.key));
  let gridSize = 10;
  let sizeMode = "attention";
  let colorMode = "accession";
  let selectedCuratorName = ""; // restored and passed to Panel as initialCurator

  // The interface configuration (dot color and size, growth-form filter,
  // open curator) is remembered in this browser (localStorage) across reloads.
  const UI_KEY = "arboretum:ui";
  const SIZE_MODES = ["attention", "density", "sum", "age"];
  let restored = false;
  let restoredCurator = ""; // fixed after restore, so Panel isn't reset later

  function restoreUI() {
    try {
      const saved = JSON.parse(localStorage.getItem(UI_KEY) ?? "{}");
      if (colorModeByKey[saved.colorMode]) colorMode = saved.colorMode;
      if ([5, 10, 20].includes(saved.gridSize)) gridSize = saved.gridSize;
      if (SIZE_MODES.includes(saved.sizeMode)) sizeMode = saved.sizeMode;
      if (Array.isArray(saved.habits)) {
        const keys = HABIT_GROUPS.map((g) => g.key);
        habitFilter = new Set(saved.habits.filter((k) => keys.includes(k)));
      }
      if (typeof saved.curator === "string") selectedCuratorName = saved.curator;
    } catch {}
    restored = true;
  }

  $: if (restored) saveUI(colorMode, sizeMode, habitFilter, selectedCuratorName, gridSize);

  function saveUI(colorMode, sizeMode, habitFilter, curator, gridSize) {
    try {
      localStorage.setItem(
        UI_KEY,
        JSON.stringify({ colorMode, sizeMode, gridSize, habits: [...habitFilter], curator })
      );
    } catch {}
  }

  // curator annotations per plant (lower-case ID), for the "attention" dot size
  $: annotationsByPlant = countAnnotations(curatorData);

  function countAnnotations(curators) {
    const counts = new Map();
    for (const c of curators)
      for (const pd of c.PlantDates ?? []) {
        const id = String(pd.PlantID).toLowerCase();
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    return counts;
  }
  $: visibleData =
    habitFilter.size < HABIT_GROUPS.length
      ? data.filter((d) => habitFilter.has(habitGroup(d.HABIT)))
      : data;

  let projection = null;
  let backgroundPaths = [];

  onMount(() => {
    restoreUI();
    loadData();
  });

  async function loadData() {
    loading = true;
    loadError = "";
    try {
      const [plants, curators, bios, map] = await Promise.all(
        ["data/plants.json", "data/relations.json",
          "data/curators.json", "map/render.json"].map((path) => fetchJson(`${base}/${path}`))
      );
      if (![plants, curators, bios].every(Array.isArray)
          || !Number.isFinite(map?.projection?.scale) || map.projection.scale <= 0
          || !Array.isArray(map.projection.translate) || map.projection.translate.length !== 2
          || !map.projection.translate.every(Number.isFinite)
          || !Array.isArray(map.paths) || !map.paths.length
          || !map.paths.every(path => typeof path.type === "string" && typeof path.d === "string" && path.d.length)) {
        throw new Error("The map data has an unexpected format.");
      }
      data = plants;
      curatorData = curators;
      curatorInfoData = bios;

      if (selectedCuratorName) {
        const record = curatorData.find(
          (r) => r.CuratorName.toLowerCase() === selectedCuratorName.toLowerCase()
        );
        if (record) {
          selectedCuratorData = record;
          restoredCurator = record.CuratorName;
        } else selectedCuratorName = "";
      }

      projection = d3.geoMercator().scale(map.projection.scale).translate(map.projection.translate);
      backgroundPaths = map.paths;
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Unable to load the map data.";
    } finally {
      loading = false;
    }
  }

  function handleCuratorChange(event) {
    selectedCuratorData = event.detail.selectedCuratorData;
    selectedCuratorName = selectedCuratorData?.CuratorName ?? "";
  }
</script>

{#if loading}
  <p class="load-status" role="status">Loading the map…</p>
{:else if loadError}
  <div class="load-status" role="alert">
    <p>{loadError}</p>
    <button on:click={loadData}>Retry</button>
  </div>
{:else if data.length > 0 && curatorData.length > 0 && curatorInfoData.length > 0 && projection}
  <div class="container">
    <div class="main">
      <Viz
        fitData={data}
        {gridSize}
        data={visibleData}
        {sizeMode}
        {colorMode}
        {annotationsByPlant}
        {currentYear}
        {selectedCuratorData}
        {projection}
        {backgroundPaths}
      />
    </div>
    <div class="map-controls" style:right="{SIDEBAR_RIGHT + 10}px">
      {#if visibleData.length === 0}
        <p class="selection-status" role="status">
          No plant records match the current filters.
        </p>
      {/if}
      <HabitFilter
        {data}
        selected={habitFilter}
        {sizeMode}
        {colorMode}
        on:size={(e) => (sizeMode = e.detail)}
        on:color={(e) => (colorMode = e.detail)}
        on:change={(e) => (habitFilter = e.detail)}
      />
    </div>
    <Panel
      bind:gridSize
      {curatorData}
      {curatorInfoData}
      {colorMode}
      initialCurator={restoredCurator}
      on:curatorChange={handleCuratorChange}
    />
  </div>
{:else}
  <p class="load-status" role="status">No plant or curator records are available.</p>
{/if}

<style>
  .load-status { margin: 20px; line-height: 1.4; }
  .map-controls {
    position: absolute;
    left: 10px;
    bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 5;
  }
  .selection-status { align-self: flex-start; margin: 0; max-width: min(400px, 40vw); padding: 6px 8px; background: rgba(255,255,255,.9); font: 12px/1.4 sans-serif; }
  .container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #f7f7f7;
  }
  .main {
    flex: 1;
    position: relative;
  }
</style>
