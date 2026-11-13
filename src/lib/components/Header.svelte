<script>
  import { onMount, tick } from "svelte";
  import { slide } from "svelte/transition";

  // The open/closed choice is remembered in this browser (localStorage).
  const KEY = "arboretum:project-description-open";
  let open = true;
  let duration = 0; // no animation while restoring the saved state on load

  onMount(async () => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved !== null) open = saved === "true";
    } catch {}
    await tick();
    duration = 300;
  });

  function toggle() {
    open = !open;
    try {
      localStorage.setItem(KEY, String(open));
    } catch {}
  }
</script>

<section>
  <div class="title-row">
    <h1>Living<br />Library<br />of Trees</h1>
    <button
      class="toggle"
      class:open
      class:ready={duration > 0}
      aria-expanded={open}
      aria-controls="project-description"
      aria-label={open ? "Hide project description" : "Show project description"}
      on:click={toggle}>&lt;</button
    >
  </div>

  {#if open}
    <div id="project-description" transition:slide={{ duration }}>
      <p>
        A <a href="https://mlml.io/p/arnold-arboretum/" target="_blank" rel="noopener">metaLAB</a>
        project tracing the intertwined histories of plants and curators at the
        Arnold Arboretum. Archival records connect this living collection to the
        observers who studied and cared for it.
      </p>
      <p>
        Select an observer to highlight plants associated with their records.
        Counts show mapped plant-year entries and distinct plants. Repeat visits
        within a year count once. Map filters do not change these counts.
      </p>
      <p>
        Timelines also include unmapped records within each observer’s retained
        activity window. Each timeline is scaled independently, so heights cannot
        be compared across observers. First and last active mark retained records,
        rather than career&nbsp;dates.
      </p>
    </div>
  {/if}
</section>

<style>
  .title-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5em;
  }

  h1 {
    font-size: 2.3em;
    font-weight: 400;
    margin: 0;
    padding: 0;
  }

  /* "<" when closed, turned to point down when open */
  .toggle {
    flex-shrink: 0;
    border: none;
    background: none;
    padding: 0 0.2em;
    font: inherit;
    font-size: 1.6em;
    line-height: 1;
    color: inherit;
    cursor: pointer;
  }

  .toggle.ready {
    transition: transform 0.3s; /* only after the saved state is restored */
  }

  .toggle.open {
    transform: rotate(-90deg);
  }

  .toggle:hover {
    color: green;
  }

  p {
    font-size: 0.9em;
    line-height: 1.05;
    margin: 0.35em 0;
    hyphens: auto;
    -webkit-hyphens: auto;
    /* fill lines instead of balancing them, so more words break */
    text-wrap: wrap;
    /* allow breaks in words of 4+ letters, keeping 2 letters on each side */
    hyphenate-limit-chars: 4 2 2;
    -webkit-hyphenate-limit-before: 2;
    -webkit-hyphenate-limit-after: 2;
  }
</style>
