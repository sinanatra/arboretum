<script>
    import { onMount } from "svelte";
    import Legend from "@components/Legend.svelte";
    import * as d3 from "d3";

    export let data;
    export let viewType;

    let svg;
    let width;
    let height;
    let transform = d3.zoomIdentity;
    let simulation;
    let nodes;
    let scalingFactor;
    let centerX, centerY;

    const classColorMapping = {
        Eudicot: "#09c",
        Ginkgoopsida: "#2cb",
        Monocot: "#4d8",
        Lycopodiopsida: "#9d5",
        Pinopsida: "#c66",
    };

    const baseRadius = 50;
    const ringThickness = 10;
    const ringSpacing = 3;
    const reducedRingThickness = ringThickness * 0.05;
    const reducedRingSpacing = ringSpacing * 2;
    const reducedBaseRadius = baseRadius * 0.4;
    const maxRings = 20;

    function getColorForClass(className) {
        return classColorMapping[className] || "#000";
    }

    function getCoordinates() {
        if (!data) return [];

        centerX = svg?.clientWidth / 2;
        centerY = svg?.clientHeight / 2;

        const zoom = d3
            .zoom()
            .scaleExtent([0.01, 10])
            .on("zoom", (event) => {
                transform = event.transform;
                d3.select(svg).select("g").attr("transform", transform);
            });

        d3.select(svg)
            .call(zoom)
            .call(
                zoom.transform,
                d3.zoomIdentity.translate(centerX, centerY).scale(0.01),
            );

        const columns = {
            UMAP: ["UMAP_1", "UMAP_2"],
            Geo: ["geo_1", "geo_2"],
            Rad: ["Scaled_Rad_1", "Scaled_Rad_2"],
        };

        const [xColumn, yColumn] = columns[viewType] || [];
        if (!xColumn || !yColumn) return [];

        const xValues = data
            .map((row) => parseFloat(row[xColumn]))
            .filter((val) => !isNaN(val));
        const yValues = data
            .map((row) => parseFloat(row[yColumn]))
            .filter((val) => !isNaN(val));
        const maxAges = data
            .map((row) => parseInt(row["MaxAge"]))
            .filter((val) => !isNaN(val));

        const [xMin, xMax] = [Math.min(...xValues), Math.max(...xValues)];
        const [yMin, yMax] = [Math.min(...yValues), Math.max(...yValues)];
        const [xRange, yRange] = [xMax - xMin, yMax - yMin];
        const svgWidth = svg.clientWidth || 0;
        const svgHeight = svg.clientHeight || 0;
        const svgAspectRatio = svgWidth / svgHeight;
        const dataAspectRatio = xRange / yRange;
        const [ageMin, ageMax] = [Math.min(...maxAges), Math.max(...maxAges)];

        scalingFactor =
            dataAspectRatio > svgAspectRatio
                ? svgWidth / xRange
                : svgHeight / yRange;

        return data
            .map((row) => {
                const x = parseFloat(row[xColumn]);
                const y = parseFloat(row[yColumn]);
                // const maxAge = parseInt(row["MaxAge"]);
                let maxAge = parseInt(row["MaxAge"]);

                maxAge = Math.min(Math.max(Math.round(maxAge), 1), maxRings);
                // limit rings
                const className = row["Class"];

                if (isNaN(x) || isNaN(y) || isNaN(maxAge)) return null;

                return {
                    x:
                        (x - xMin) * scalingFactor -
                        (xRange * scalingFactor) / 2,
                    y:
                        (y - yMin) * scalingFactor -
                        (yRange * scalingFactor) / 2,
                    rings: maxAge,
                    color: getColorForClass(className),
                };
            })
            .filter(Boolean);
    }

    $: if (svg && viewType) {
        nodes = getCoordinates();
        initializeSimulation(nodes);
    }

    function initializeSimulation(nodes) {
        let tickCount = 0;
        simulation = d3
            .forceSimulation(nodes)
            .force("center", d3.forceCenter(0, 0))
            .force(
                "collide",
                d3
                    .forceCollide((d) => {
                        const totalRingSpace =
                            (reducedRingThickness + reducedRingSpacing) *
                                (d.rings - 1) +
                            reducedRingThickness;
                        return reducedBaseRadius + totalRingSpace;
                    })
                    .strength(1),
            )
            .force(
                "anchor",
                d3
                    .forceX((d) => centerX + (d.x - centerX) * scalingFactor)
                    .strength(0.1),
            )
            .force(
                "anchorY",
                d3
                    .forceY((d) => centerY + (d.y - centerY) * scalingFactor)
                    .strength(0.1),
            )
            .on("tick", () => {
                ticked();

                tickCount++;
                if (tickCount >= 400) {
                    simulation.stop();
                }
            });
    }

    function ticked() {
        d3.select(svg)
            .selectAll("g.node")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    onMount(() => {
        nodes = getCoordinates();
        initializeSimulation(nodes);
    });
</script>

<svg bind:this={svg} {width} {height}>
    {#if svg && nodes}
        <g
            transform="translate({svg?.clientWidth / 2}, {svg?.clientHeight /
                2}) scale(0.01)"
        >
            {#each nodes as node}
                <g class="node">
                    {#each Array(node.rings) as _, i}
                        <circle
                            r={reducedBaseRadius +
                                i *
                                    (reducedRingThickness +
                                        reducedRingSpacing) -
                                reducedRingSpacing}
                            fill="none"
                            stroke={node.color}
                            stroke-width={reducedRingThickness}
                        />
                    {/each}
                </g>
            {/each}
        </g>
    {/if}
</svg>

<Legend {classColorMapping} />

<style>
    svg {
        width: 100%;
        height: 100vh;
    }
</style>
