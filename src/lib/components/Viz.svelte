<script>
  import { onMount, tick } from "svelte";
  import * as d3 from "d3";
  import BaseMap from "@components/BaseMap.svelte";

  export let data = [];
  export let currentYear;
  export let selectedCuratorData = null;
  export let projection;

  let svg;
  let nodes = [];
  let highlightedNodes = [];
  let transform = d3.zoomIdentity;
  let zoom;

  const cellSize = 4;
  const maxDisplayRings = 10;
  const baseInnerRadius = 1;
  const baseRingWidth = 1;
  const baseMaxOuterRadius =
    baseInnerRadius + (maxDisplayRings - 1) * baseRingWidth;

  const scaleFactor = cellSize / 2 / baseMaxOuterRadius;
  const innerRadius = baseInnerRadius * scaleFactor;
  const ringWidth = baseRingWidth * scaleFactor;
  const maxOuterRadius = baseMaxOuterRadius * scaleFactor;

  function computeNodes() {
    if (!data || !svg || !projection || currentYear === undefined) return [];

    const gridMap = new Map();

    data.forEach((row, i) => {
      const lon = parseFloat(row.LONGITUDE);
      const lat = parseFloat(row.LATITUDE);
      const accYear = parseInt(row.ACC_YR);
      if (isNaN(lon) || isNaN(lat) || isNaN(accYear)) return;

      const [rawX, rawY] = projection([lon, lat]);
      if (!rawX || !rawY) return;

      const col = Math.floor(rawX / cellSize);
      const rowGrid = Math.floor(rawY / cellSize);
      const key = `${col}-${rowGrid}`;
      const x0 = col * cellSize + cellSize / 2;
      const y0 = rowGrid * cellSize + cellSize / 2;

      let numRings =
        currentYear >= accYear
          ? Math.min(Math.floor((currentYear - accYear) / 10), maxDisplayRings)
          : 0;

      const outerRadius =
        numRings > 0 ? innerRadius + (numRings - 1) * ringWidth : innerRadius;

      const record = {
        accYear,
        numRings,
        outerRadius,
        plantID: row.PLANTID ? String(row.PLANTID).toLowerCase() : String(i),
      };

      if (!gridMap.has(key)) {
        gridMap.set(key, { x: x0, y: y0, records: [record] });
      } else {
        gridMap.get(key).records.push(record);
      }
    });

    const aggregatedNodes = [];
    for (const [key, cell] of gridMap.entries()) {
      const { x, y, records } = cell;
      const n = records.length;
      const totalRings = records.reduce((sum, r) => sum + r.numRings, 0);
      const totalYear = records.reduce((sum, r) => sum + r.accYear, 0);
      const avgNumRings = Math.floor(totalRings / n);
      const avgOuterRadius = Math.min(
        avgNumRings > 0
          ? innerRadius + (avgNumRings - 1) * ringWidth
          : innerRadius,
        maxOuterRadius
      );
      const avgYear = Math.floor(totalYear / n);
      const allPlantIDs = records.map((r) => r.plantID);

      aggregatedNodes.push({
        id: key,
        x,
        y,
        avgYear,
        numRings: avgNumRings,
        outerRadius: avgOuterRadius,
        plantIDs: allPlantIDs,
        count: n,
      });
    }

    return aggregatedNodes;
  }

  onMount(async () => {
    await tick();
    if (!svg) return;

    zoom = d3
      .zoom()
      .scaleExtent([2, 14])
      .on("zoom", (event) => {
        transform = event.transform;
      });

    d3.select(svg).call(zoom);

    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    const initialScale = 2;
    const tx = svgWidth / 2 - initialScale * (svgWidth / 2.8);
    const ty = svgHeight / 2 - initialScale * (svgHeight / 2.2);
    const initialTransform = d3.zoomIdentity
      .translate(tx, ty)
      .scale(initialScale);

    d3.select(svg).call(zoom.transform, initialTransform);
    transform = initialTransform;
  });

  $: if (data && svg && currentYear !== undefined) {
    nodes = computeNodes();
  }

  $: if (selectedCuratorData?.PlantDates) {
    const highlightNodesOrdered = [];
    const sortedDates = [...selectedCuratorData.PlantDates].sort(
      (a, b) => a.Date - b.Date
    );
    for (const pd of sortedDates) {
      const id = String(pd.PlantID).toLowerCase();
      const found = nodes.find((n) => n.plantIDs?.includes(id));
      if (found && !highlightNodesOrdered.includes(found)) {
        highlightNodesOrdered.push(found);
      }
    }
    highlightedNodes = highlightNodesOrdered;
  } else {
    highlightedNodes = [];
  }

  const clusterColorMapping = {
    "1870s": "#154406",
    "1880s": "#2E5912",
    "1890s": "#4A6F1D",
    "1900s": "#67862A",
    "1910s": "#839E38",
    "1920s": "#9FB748",
    "1930s": "#BCCF5A",
    "1940s": "#DAC86A",
    "1950s": "#F5B94F",
    "1960s": "#E0963C",
    "1970s": "#C06B2B",
    "1980s": "#A34826",
    "1990s": "#883421",
    "2000s": "#6E241D",
    "2010s": "#541916",
    Unknown: "#A0A0A0",
  };

  function getStrokeColor(accYear) {
    if (!accYear || isNaN(accYear)) return clusterColorMapping.Unknown;
    const label = `${Math.floor(accYear / 10) * 10}s`;
    return clusterColorMapping[label] || clusterColorMapping.Unknown;
  }
</script>

<svg bind:this={svg}>
  <g transform="translate({transform.x}, {transform.y}) scale({transform.k})">
    <BaseMap {projection} />
    {#each nodes as node}
      <g class="node" transform="translate({node.x}, {node.y})">
        {#each Array(node.numRings || 1) as _, i}
          <circle
            r={innerRadius + (node.numRings > 0 ? i * ringWidth : 0)}
            fill="none"
            stroke={getStrokeColor(node.avgYear)}
            stroke-opacity={highlightedNodes.length
              ? highlightedNodes.includes(node)
                ? 1
                : 0.4
              : 1}
            class="node-ring"
          />
        {/each}
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

  .node-ring {
    stroke-width: 0.4;
  }
</style>
