<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import BaseMap from "./BaseMap.svelte";

  export let data = [];
  export let currentYear;
  export let selectedCuratorData = null;

  let svg;
  let nodes = [];
  let highlightedNodes = [];
  let xScale, yScale;
  let transform = d3.zoomIdentity;
  let zoom;

  const baseInnerRadius = 1;
  const baseRingWidth = 1;
  const maxDisplayRings = 10;
  const baseMaxOuterRadius =
    baseInnerRadius + (maxDisplayRings - 1) * baseRingWidth;
  const desiredCellSize = 4;
  const scaleFactor = desiredCellSize / 2 / baseMaxOuterRadius;
  const innerRadius = baseInnerRadius * scaleFactor;
  const ringWidth = baseRingWidth * scaleFactor;
  const maxOuterRadius = baseMaxOuterRadius * scaleFactor;
  const cellSize = desiredCellSize;

  function computeScales() {
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    const xValues = data
      .map((d) => parseFloat(d.LONGITUDE))
      .filter((v) => !isNaN(v));
    const yValues = data
      .map((d) => parseFloat(d.LATITUDE))
      .filter((v) => !isNaN(v));
    let xMin = d3.min(xValues);
    let xMax = d3.max(xValues);
    let yMin = d3.min(yValues);
    let yMax = d3.max(yValues);
    const xMargin = (xMax - xMin) * 0.2;
    const yMargin = (yMax - yMin) * 0.2;
    xMin -= xMargin;
    xMax += xMargin;
    yMin -= yMargin;
    yMax += yMargin;
    xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, svgWidth]);
    yScale = d3.scaleLinear().domain([yMin, yMax]).range([svgHeight, 0]);
  }

  function computeNodes() {
    if (!data || !svg || currentYear === undefined) return [];
    computeScales();

    const gridMap = new Map();

    data.forEach((row, i) => {
      const x = parseFloat(row.LONGITUDE);
      const y = parseFloat(row.LATITUDE);
      const accYear = parseInt(row.ACC_YR);
      const lastDate = parseInt(row.last_date);

      if (isNaN(x) || isNaN(y) || isNaN(accYear)) return;

      let numRings = 0;
      if (currentYear >= accYear) {
        numRings = Math.floor((currentYear - accYear) / 10);
        numRings = Math.min(numRings, maxDisplayRings);
      }
      let outerRadius =
        numRings > 0 ? innerRadius + (numRings - 1) * ringWidth : innerRadius;
      outerRadius = Math.min(outerRadius, maxOuterRadius);

      const rawX = xScale(x);
      const rawY = yScale(y);

      const col = Math.floor(rawX / cellSize);
      const rowGrid = Math.floor(rawY / cellSize);
      const key = `${col}-${rowGrid}`;

      const x0 = col * cellSize + cellSize / 2;
      const y0 = rowGrid * cellSize + cellSize / 2;

      const record = {
        plantType: row.KIND_OF_SPECIMEN_FULL,
        numRings,
        outerRadius,
        plantID: row.PLANTID ? String(row.PLANTID).toLowerCase() : String(i),
      };

      if (!gridMap.has(key)) {
        gridMap.set(key, {
          x: x0,
          y: y0,
          records: [record],
          count: 1,
        });
      } else {
        const cell = gridMap.get(key);
        cell.records.push(record);
        cell.count++;
      }
    });

    const aggregatedNodes = [];
    gridMap.forEach((cell, key) => {
      const { x, y, records } = cell;
      const n = records.length;

      const typeCounts = {};
      records.forEach((rec) => {
        typeCounts[rec.plantType] = (typeCounts[rec.plantType] || 0) + 1;
      });
      let avgPlantType = null;
      let maxCount = 0;
      for (let type in typeCounts) {
        if (typeCounts[type] > maxCount) {
          maxCount = typeCounts[type];
          avgPlantType = type;
        }
      }

      const totalRings = records.reduce((acc, rec) => acc + rec.numRings, 0);
      let avgNumRings = Math.floor(totalRings / n);
      let avgOuterRadius =
        avgNumRings > 0
          ? innerRadius + (avgNumRings - 1) * ringWidth
          : innerRadius;
      avgOuterRadius = Math.min(avgOuterRadius, maxOuterRadius);

      const allPlantIDs = records.map((rec) => rec.plantID);

      aggregatedNodes.push({
        id: key,
        x: x,
        y: y,
        numRings: avgNumRings,
        outerRadius: avgOuterRadius,
        plantType: avgPlantType,
        count: n,
        plantIDs: allPlantIDs,
      });
    });

    return aggregatedNodes;
  }

  onMount(() => {
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
    const tx = svgWidth / 2 - initialScale * (svgWidth / 1.8);
    const ty = svgHeight / 2 - initialScale * (svgHeight / 2.5);
    const initialTransform = d3.zoomIdentity
      .translate(tx, ty)
      .scale(initialScale);
    d3.select(svg).call(zoom.transform, initialTransform);
    transform = initialTransform;
  });

  $: if (data && svg && currentYear !== undefined) {
    nodes = computeNodes();
  }

  $: if (selectedCuratorData && selectedCuratorData.PlantDates) {
    let sortedDates = [...selectedCuratorData.PlantDates].sort(
      (a, b) => a.Date - b.Date
    );
    let highlightNodesOrdered = [];
    sortedDates.forEach((pd) => {
      const selectedID = String(pd.PlantID).toLowerCase();
      const found = nodes.find(
        (n) => n.plantIDs && n.plantIDs.includes(selectedID)
      );
      if (found && !highlightNodesOrdered.includes(found)) {
        highlightNodesOrdered.push(found);
      }
    });
    highlightedNodes = highlightNodesOrdered;
  } else {
    highlightedNodes = [];
  }

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

  const plantTypeColors = {
    "herb. - flower": "#C2185B", // deep rose
    "herb. - fruit": "#AD1457", // raspberry red
    "herb. - vegetative": "#880E4F", // dark magenta
    seed: "#D81B60", // strong pink
    "herb. - twig/buds": "#E91E63", // vivid pink
    "fruit colln": "#F06292", // light pink
    "herb. - seedling": "#EC407A", // soft rosy pink
    bark: "#B71C1C", // deep red
  };

  function getStrokeColor(plantType) {
    return plantTypeColors[plantType] || "rgb(255, 141, 1)";
  }
</script>

<svg bind:this={svg}>
  <g transform="translate({transform.x}, {transform.y}) scale({transform.k})">
    <BaseMap {transform} {xScale} {yScale} />
    {#each nodes as node}
      <g class="node" transform="translate({node.x}, {node.y})">
        {#if node.numRings > 0}
          {#each Array(node.numRings) as _, i}
            <circle
              r={innerRadius + i * ringWidth}
              fill="none"
              stroke={getStrokeColor(node.plantType)}
              class="node-ring"
            />
          {/each}
        {:else}
          <circle
            r={innerRadius}
            fill="none"
            stroke={getStrokeColor(node.plantType)}
            class="node-ring"
          />
        {/if}
      </g>
    {/each}

    {#if highlightedNodes.length > 1}
      <g class="curator-path">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" class="arrowhead" />
          </marker>
        </defs>
        {#each highlightedNodes.slice(0, highlightedNodes.length - 1) as node, i}
          {#if highlightedNodes[i + 1]}
            <path
              d={getCurvePath(node, highlightedNodes[i + 1])}
              fill="none"
              class="curator-path-line"
              marker-end="url(#arrowhead)"
            />
          {/if}
        {/each}
      </g>
    {/if}
  </g>
</svg>

<style>
  svg {
    width: 100%;
    height: 100vh;
  }

  .node circle,
  .curator-path path,
  path {
    pointer-events: none;
  }

  .node-ring {
    stroke-width: 0.1;
  }

  .curator-path-line {
    stroke: darkslateblue;
    stroke-width: 0.5;
  }

  .arrowhead {
    fill: darkslateblue;
  }
</style>
