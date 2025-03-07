<script>
  export let nodes = [];
  export let highlightPlantIDs = [];

  $: console.log("Nodes:", nodes);

  $: highlightedNodes = nodes.filter((n) =>
    highlightPlantIDs.map(String).includes(String(n.id))
  );

  $: highlightedNodes.sort(
    (a, b) =>
      highlightPlantIDs.map(String).indexOf(String(a.id)) -
      highlightPlantIDs.map(String).indexOf(String(b.id))
  );

  function getCurvePath(p1, p2, offset = 20) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = -dy / len;
    const uy = dx / len;

    const cx = mx + ux * offset;
    const cy = my + uy * offset;
    return `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
  }
</script>

<g class="curator-path">
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="0"
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 10 3.5, 0 7" fill="red" />
    </marker>
  </defs>
  {#if highlightedNodes.length > 1}
    {#each highlightedNodes.slice(0, highlightedNodes.length - 1) as node, i}
      {#if highlightedNodes[i + 1]}
        <path
          d={getCurvePath(node, highlightedNodes[i + 1])}
          fill="none"
          stroke="red"
          stroke-width="1"
          marker-end="url(#arrowhead)"
        />
      {/if}
    {/each}
  {/if}
</g>

<style>
  .curator-path path {
    pointer-events: none;
  }
</style>
