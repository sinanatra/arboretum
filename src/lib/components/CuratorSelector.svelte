<script>
  import { createEventDispatcher } from "svelte";

  export let curatorData = [];
  export let initialCurator = "";
  let curators = [];
  
  const dispatch = createEventDispatcher();

  $: selectedCurator =
    initialCurator || (curators.length > 0 ? curators[0] : "");

  $: curators = curatorData
    .map((item) => item.CuratorName)
    .sort((a, b) => a.localeCompare(b));
  let selectedCurator =
    initialCurator || (curators.length > 0 ? curators[0] : "");

  function selectCurator(curator) {
    selectedCurator = curator;
    const record = curatorData.find(
      (r) => r.CuratorName.toLowerCase() === curator.toLowerCase()
    );
    dispatch("curatorChange", { selectedCuratorData: record });
  }
</script>

{#if curators.length > 0}
  <aside class="curator-sidebar">
    <h2>Curators</h2>
    <ul>
      {#each curators as curator}
        <li
          class:selected={curator === selectedCurator}
          on:click={() => selectCurator(curator)}
        >
          {curator}
        </li>
      {/each}
    </ul>
  </aside>
{/if}

<style>
  .curator-sidebar {
    width: 200px;
    background: #f9f9f9;
    border-right: 1px solid #ddd;
    padding: 1em;
    overflow-y: auto;
  }
  .curator-sidebar h2 {
    margin: 0;
    font-size: 1em;
  }
  .curator-sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .curator-sidebar li {
    padding: 0.1em;
    cursor: pointer;
    border-bottom: 1px solid #ccc;
  }
  .curator-sidebar li.selected {
    background: #ddd;
    font-weight: bold;
  }
</style>
