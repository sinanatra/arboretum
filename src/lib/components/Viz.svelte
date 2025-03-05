<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  export let data;
  export let currentYear;

  let svg;
  let nodes = [];
  let xScale, yScale;
  let transform = d3.zoomIdentity;

  const innerRadius = 1;
  const ringWidth = 2;
  const collisionMargin = 2;
  const maxDisplayRings = 5;
  
  const maxOuterRadius = innerRadius + (maxDisplayRings - 1) * ringWidth;

  function getColorForData(row) {
    return "black";
  }

  function computeNodes() {
    if (!data || !svg || currentYear === undefined) return [];
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;

    const xValues = data
      .map((d) => parseFloat(d.X_COORD))
      .filter((v) => !isNaN(v));
    const yValues = data
      .map((d) => parseFloat(d.Y_COORD))
      .filter((v) => !isNaN(v));
    const xMin = d3.min(xValues);
    const xMax = d3.max(xValues);
    const yMin = d3.min(yValues);
    const yMax = d3.max(yValues);
    xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, svgWidth]);
    yScale = d3.scaleLinear().domain([yMin, yMax]).range([svgHeight, 0]);

    const computed = data
      .map((row, i) => {
        const x = parseFloat(row.X_COORD);
        const y = parseFloat(row.Y_COORD);
        const accYear = parseInt(row.ACC_YR);
        const lastDate = parseInt(row.last_date);
        if (isNaN(x) || isNaN(y) || isNaN(accYear) || isNaN(lastDate))
          return null;
        if (currentYear > lastDate) return null;
        const maxRings = Math.floor((lastDate - accYear) / 10);
        let numRings = 0;
        if (currentYear >= accYear) {
          numRings = Math.floor((currentYear - accYear) / 10);
          if (numRings > maxRings) numRings = maxRings;
          numRings = Math.min(numRings, maxDisplayRings);
        }

        let outerRadius =
          numRings > 0 ? innerRadius + (numRings - 1) * ringWidth : innerRadius;

        outerRadius = Math.min(outerRadius, maxOuterRadius);
        const x0 = xScale(x);
        const y0 = yScale(y);
        return {
          id: row.PLANTID ? row.PLANTID : i,
          x0,
          y0,
          x: x0,
          y: y0,
          accYear,
          lastDate,
          numRings,
          outerRadius,
          color: getColorForData(row),
        };
      })
      .filter(Boolean);
    return computed;
  }

  function runSimulation(nodesArray) {
    const simulation = d3
      .forceSimulation(nodesArray)
      .force("x", d3.forceX((d) => d.x0).strength(0.8))
      .force("y", d3.forceY((d) => d.y0).strength(0.8))
      .force(
        "collide",
        d3.forceCollide((d) => d.outerRadius + collisionMargin)
      )
      .stop();

    for (let i = 0; i < 500; i++) simulation.tick();
  }

  $: if (data && svg && currentYear !== undefined) {
    nodes = computeNodes();
    runSimulation(nodes);
  }

  onMount(() => {
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        transform = event.transform;
      });
    d3.select(svg).call(zoom);
  });
</script>

<svg bind:this={svg} style="width: 100%; height: 100vh;">
  <g transform="translate({transform.x}, {transform.y}) scale({transform.k})">
    {#each nodes as node (node.id)}
      <g class="node" transform="translate({node.x}, {node.y})">
        {#if node.numRings > 0}
          {#each Array(node.numRings) as _, i}
            <circle
              r={innerRadius + i * ringWidth}
              fill="none"
              stroke={node.color}
              stroke-width="0.2"
            />
          {/each}
        {:else}
          <circle
            r={innerRadius}
            fill="none"
            stroke={node.color}
            stroke-width="0.2"
          />
        {/if}
      </g>
    {/each}
  </g>
</svg>

<style>
  svg {
    width: 100%;
    height: 100vh;
  }
  .node circle {
    pointer-events: none;
  }
</style>
