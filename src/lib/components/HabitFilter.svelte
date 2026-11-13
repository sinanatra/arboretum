<script>
  // Filter the map by growth form (the accession HABIT field).
  import { createEventDispatcher } from "svelte";
  import { HABIT_GROUPS as GROUPS, habitGroup } from "@lib/habits.js";
  import { COLOR_MODES } from "@lib/colors.js";

  export let data = [];
  export let selected; // Set of group keys currently shown
  export let sizeMode = "attention"; // dot size, see SIZES
  export let colorMode = "accession"; // dot color, see COLOR_MODES

  const SIZES = [
    { key: "attention", label: "Recorded activity" },
    { key: "density", label: "Plant record density" },
    { key: "sum", label: "Total years since accession" },
    { key: "age", label: "Mean years since accession" },
  ];

  const dispatch = createEventDispatcher();

  $: counts = countGroups(data);

  function countGroups(rows) {
    const c = Object.fromEntries(GROUPS.map((g) => [g.key, 0]));
    for (const d of rows) c[habitGroup(d.HABIT)] += 1;
    return c;
  }

  function toggle(key) {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    dispatch("change", next);
  }

  function showAll() {
    dispatch("change", new Set(GROUPS.map((g) => g.key)));
  }

  $: filtered = selected.size < GROUPS.length;
</script>

<div class="habit-filter">
  <div class="options" role="radiogroup" aria-labelledby="color-title">
    <span class="title" id="color-title">Dot color</span>
    {#each COLOR_MODES as m}
      <label>
        <input
          type="radio"
          name="color-mode"
          value={m.key}
          checked={colorMode === m.key}
          on:change={() => dispatch("color", m.key)}
        />
        <span class="label">{m.label}</span>
      </label>
    {/each}
  </div>
  <div class="options" role="radiogroup" aria-labelledby="size-title">
    <span class="title" id="size-title">Dot size</span>
    {#each SIZES as m}
      <label>
        <input
          type="radio"
          name="size-mode"
          value={m.key}
          checked={sizeMode === m.key}
          on:change={() => dispatch("size", m.key)}
        />
        <span class="label">{m.label}</span>
      </label>
    {/each}
  </div>
  <div class="options" role="group" aria-labelledby="habit-filter-title">
    <span class="title" id="habit-filter-title">Filter</span>
    {#each GROUPS as g}
      <label>
        <input
          type="checkbox"
          checked={selected.has(g.key)}
          on:change={() => toggle(g.key)}
        />
        <span class="label">{g.label}</span>
        <span class="n">{counts[g.key].toLocaleString("en-US")}</span>
      </label>
    {/each}
    {#if filtered}
      <button class="all" on:click={showAll}>Show all</button>
    {/if}
  </div>
</div>

<style>
  .habit-filter {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
    gap: 8px;
    font-family: sans-serif;
    font-size: 9px;
    letter-spacing: 0.05em;
  }


  .options {
    backdrop-filter: blur(5px);
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px 8px;
    min-width: 0;
  }

  .title {
    text-transform: uppercase;
    color: #333;
    margin-bottom: 2px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: #333;
  }

  input {
    margin: 0;
    accent-color: green;
  }

  .label {
    flex: 1;
  }

  .n {
    color: #888;
    font-variant-numeric: tabular-nums;
  }

  .all {
    align-self: flex-start;
    margin-top: 2px;
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    letter-spacing: inherit;
    text-transform: uppercase;
    color: green;
    cursor: pointer;
  }
</style>
