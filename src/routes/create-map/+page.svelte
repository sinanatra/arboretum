<script>
  import { onMount } from "svelte";
  import Header from "@components/Header.svelte";
  import Viz from "@components/Viz.svelte";
  import Legend from "@components/Legend.svelte";
  import CuratorSelector from "@components/CuratorSelector.svelte";
  import GeneratePixelMap from "@components/generatePixelMap.svelte";
  import * as d3 from "d3";

  let data = [];
  let curatorData = [];
  let currentYear = 2011;
  let minYear;
  let maxYear;
  let selectedCuratorData = null;

  onMount(async () => {
    const res = await fetch("data/ArnArbPlantsGEO.json");
    data = await res.json();
    minYear = Math.min(...data.map((d) => parseInt(d.ACC_YR)));
    maxYear = Math.max(...data.map((d) => parseInt(d.ACC_YR)));
    currentYear = maxYear;

    const res2 = await fetch("data/Curator_Plants_Dates.json");
    curatorData = await res2.json();
    if (curatorData.length > 0) {
      selectedCuratorData = curatorData[0];
    }
  });

  $: console.log(curatorData);

  function handleYearChange(event) {
    currentYear = +event.detail;
  }

  function handleCuratorChange(event) {
    selectedCuratorData = event.detail.selectedCuratorData;
  }

  const classColorMapping = {
    Eudicot: "#d7191c",
    Ginkgoopsida: "#fdae61",
    Monocot: "#ffffbf",
    Lycopodiopsida: "#abdda4",
    Pinopsida: "#2b83ba",
  };

  let svg;
  let nodes = [];
  let xScale, yScale;
  let transform = d3.zoomIdentity;
  let zoom;

  const baseInnerRadius = 1;
  const baseRingWidth = 1;
  const maxDisplayRings = 10;
  const baseMaxOuterRadius =
    baseInnerRadius + (maxDisplayRings - 1) * baseRingWidth;
  const desiredCellSize = 5;
  const scaleFactor = desiredCellSize / 2 / baseMaxOuterRadius;
  const innerRadius = baseInnerRadius * scaleFactor;
  const ringWidth = baseRingWidth * scaleFactor;
  const maxOuterRadius = baseMaxOuterRadius * scaleFactor;
  const cellSize = desiredCellSize;

  function getColorForData(row) {
    return "DarkSeaGreen";
  }

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
    xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, svg.clientWidth]);
    yScale = d3.scaleLinear().domain([yMin, yMax]).range([svg.clientHeight, 0]);
  }

  function computeNodes() {
    if (!data || !svg || currentYear === undefined) return [];
    computeScales();
    const computed = data
      .map((row, i) => {
        const x = parseFloat(row.LONGITUDE);
        const y = parseFloat(row.LATITUDE);
        const accYear = parseInt(row.ACC_YR);
        const lastDate = parseInt(row.last_date);
        if (isNaN(x) || isNaN(y) || isNaN(accYear) || isNaN(lastDate))
          return null;
        const maxRings = Math.floor((lastDate - accYear) / 10);
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
        const x0 = col * cellSize + cellSize / 2;
        const y0 = rowGrid * cellSize + cellSize / 2;
        return {
          id: row.PLANTID ? row.PLANTID : i,
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

  $: highlightedNodes = [];
  $: if (selectedCuratorData && selectedCuratorData.PlantDates) {
    let sortedDates = [...selectedCuratorData.PlantDates].sort(
      (a, b) => a.Date - b.Date
    );
    const highlightIDs = sortedDates.map((pd) =>
      String(pd.PlantID).toLowerCase()
    );
    highlightedNodes = nodes.filter((n) =>
      highlightIDs.includes(String(n.id).toLowerCase())
    );
    highlightedNodes.sort(
      (a, b) =>
        highlightIDs.indexOf(String(a.id).toLowerCase()) -
        highlightIDs.indexOf(String(b.id).toLowerCase())
    );
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
</script>

{#if data.length > 0 && curatorData.length > 0}
  <div class="container">
    <div class="main">
      <!-- <Header
          on:yearChange={handleYearChange}
          {currentYear}
          {minYear}
          {maxYear}
        /> -->
      {#if data.length > 0}
        <GeneratePixelMap {transform} {xScale} {yScale} />
        <svg bind:this={svg} style="width: 100%; height: 100vh;">
          <g
            transform="translate({transform.x}, {transform.y}) scale({transform.k})"
          >
            {#each nodes as node (node.id)}
              <g class="node" transform="translate({node.x}, {node.y})">
                {#if node.numRings > 0}
                  {#each Array(node.numRings) as _, i}
                    <circle
                      r={innerRadius + i * ringWidth}
                      fill="none"
                      stroke={node.color}
                      stroke-width="0.1"
                    />
                  {/each}
                {:else}
                  <circle
                    r={innerRadius}
                    fill="none"
                    stroke={node.color}
                    stroke-width="0.1"
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
                    <polygon points="0 0, 6 2, 0 4" fill="blue" />
                  </marker>
                </defs>
                {#each highlightedNodes.slice(0, highlightedNodes.length - 1) as node, i}
                  {#if highlightedNodes[i + 1]}
                    <path
                      d={getCurvePath(node, highlightedNodes[i + 1])}
                      fill="none"
                      stroke="blue"
                      stroke-width=".5"
                      marker-end="url(#arrowhead)"
                    />
                  {/if}
                {/each}
              </g>
            {/if}
          </g>
        </svg>

        <!-- <Legend {classColorMapping} /> -->
      {/if}
    </div>
    <!-- <CuratorSelector {curatorData} on:curatorChange={handleCuratorChange} /> -->
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
  }
  .main {
    flex: 1;
    position: relative;
  }

  svg {
    width: 100%;
    height: 100vh;
  }
  .node circle,
  .curator-path path,
  path {
    pointer-events: none;
  }
</style>
