<script>
  import { onMount, tick } from "svelte";
  import * as d3 from "d3";
  import BaseMap from "@components/BaseMap.svelte";

  export let data = [];
  export let currentYear;
  export let selectedCuratorData = null;
  export let projection;

  let svg;
  let transform = d3.zoomIdentity;
  let zoom;
  let nodes = [];
  let highlightedNodes = [];

  const cellSize = 2.5;
  const maxDiameter = 5;
  const minDiameter = 1;

  const clusterColorMapping = {
    "1870s": "#184A2C", // deep forest green
    "1880s": "#2A5D34", // fir green
    "1890s": "#3C713C", // pine green
    "1900s": "#4F8646", // mossy green
    "1910s": "#639C52", // leaf green
    "1920s": "#7BB35F", // olive green
    "1930s": "#9DC46C", // sage
    "1940s": "#C1D67A", // dry grass
    "1950s": "#E1C169", // light ochre
    "1960s": "#D4A55C", // bark
    "1970s": "#C68850", // clay
    "1980s": "#B86B45", // cedar bark
    "1990s": "#9C4E3A", // rich soil
    "2000s": "#80342F", // redwood
    "2010s": "#662426", // dark mulch
    Unknown: "#CCCCCC", // soft gray
  };

    const plantTypeColors = {
    "herb. - flower": "#7BB35F", // deep rose
    "herb. - fruit": "#C1D67A", // raspberry red
    "herb. - vegetative": "#E1C169", // dark magenta
    seed: "#D4A55C", // strong pink
    "herb. - twig/buds": "#D4A55C", // vivid pink
    "fruit colln": "#B86B45", // light pink
    "herb. - seedling": "#80342F", // soft rosy pink
    bark: "#662426", // deep red
  };
  

  function getFillColor(accYear) {
    if (!accYear || isNaN(accYear)) return clusterColorMapping.Unknown;
    const label = `${Math.floor(accYear / 10) * 10}s`;
    return clusterColorMapping[label] || clusterColorMapping.Unknown;
  }

  $: transformString = `translate(${transform.x}, ${transform.y}) scale(${transform.k})`;

  function computeNodes() {
    if (!data.length || !projection || currentYear == null) return [];

    const gridMap = new Map();

    data.forEach((row, i) => {
      const lon = parseFloat(row.LONGITUDE);
      const lat = parseFloat(row.LATITUDE);
      const accYear = parseInt(row.ACC_YR, 10);
      if (isNaN(lon) || isNaN(lat) || isNaN(accYear)) return;

      const [rawX, rawY] = projection([lon, lat]);
      if (rawX == null || rawY == null || isNaN(rawX) || isNaN(rawY)) return;

      const col = Math.floor(rawX / cellSize);
      const rowIdx = Math.floor(rawY / cellSize);
      const key = `${col}-${rowIdx}`;

      const x0 = col * cellSize + cellSize / 2;
      const y0 = rowIdx * cellSize + cellSize / 2;

      const age = Math.max(0, currentYear - accYear);
      const normalizedAge = Math.min(age / 100, 1);

      const diameter =
        minDiameter + normalizedAge * (maxDiameter - minDiameter);
      const radius = diameter / 2;

      const rec = {
        radius,
        accYear,
        plantID: row.PLANTID ? String(row.PLANTID).toLowerCase() : String(i),
      };

      if (!gridMap.has(key)) {
        gridMap.set(key, { x: x0, y: y0, records: [rec] });
      } else {
        gridMap.get(key).records.push(rec);
      }
    });

    const aggregated = [];
    for (const [id, cell] of gridMap) {
      const { x, y, records } = cell;
      const n = records.length;
      const avgRadius = records.reduce((s, r) => s + r.radius, 0) / n;
      const avgYear = Math.floor(
        records.reduce((s, r) => s + r.accYear, 0) / n
      );
      const plantIDs = records.map((r) => r.plantID);

      aggregated.push({ id, x, y, radius: avgRadius, avgYear, plantIDs });
    }
    return aggregated;
  }

  $: nodes = computeNodes();

  $: {
    if (selectedCuratorData?.PlantDates) {
      const ordered = [];
      const sorted = [...selectedCuratorData.PlantDates].sort(
        (a, b) => a.Date - b.Date
      );
      for (const pd of sorted) {
        const id = String(pd.PlantID).toLowerCase();
        const found = nodes.find((n) => n.plantIDs?.includes(id));
        if (found && !ordered.includes(found)) ordered.push(found);
      }
      highlightedNodes = ordered;
    } else {
      highlightedNodes = [];
    }
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

    const w = svg.clientWidth,
      h = svg.clientHeight;
    const initial = d3.zoomIdentity
      .translate(w / 2 - 2 * (w / 2.8), h / 2 - 2 * (h / 2.2))
      .scale(2);
    d3.select(svg).call(zoom.transform, initial);
  });

  // $: console.log(highlightedNodes);
</script>

<svg bind:this={svg} width="100%" height="100vh">
  <g transform={transformString}>
    <BaseMap {projection} />

    {#each nodes as node (node.id)}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius}
        fill={getFillColor(node.avgYear)}
        fill-opacity={highlightedNodes.length > 0
          ? highlightedNodes.includes(node)
            ? 1
            : 0.1
          : 0.1}
        stroke={getFillColor(node.avgYear)}
        stroke-width="0.2"
        class="dot"
      />
    {/each}
  </g>
</svg>

<style>
  svg {
    width: 100%;
    height: 100vh;
  }
  .dot {
    pointer-events: none;
  }
</style>
