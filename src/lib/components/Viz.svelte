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
    let loading = true;
    let previousTick = 0;

    const classColorMapping = {
        Eudicot: "#09c",
        Ginkgoopsida: "#2cb",
        Monocot: "#4d8",
        Lycopodiopsida: "#9d5",
        Pinopsida: "#c66",
    };

    const baseRadius = 5;
    const ringThickness = 30;
    const ringSpacing = 2;
    const increase = 2;
    const reducedRingSpacing = ringSpacing * 2;
    const reducedBaseRadius = baseRadius * 0.4;

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

        const [xMin, xMax] = [Math.min(...xValues), Math.max(...xValues)];
        const [yMin, yMax] = [Math.min(...yValues), Math.max(...yValues)];
        const [xRange, yRange] = [xMax - xMin, yMax - yMin];
        const svgWidth = svg.clientWidth || 0;
        const svgHeight = svg.clientHeight || 0;
        const svgAspectRatio = svgWidth / svgHeight;
        const dataAspectRatio = xRange / yRange;

        scalingFactor =
            dataAspectRatio > svgAspectRatio
                ? svgWidth / xRange
                : svgHeight / yRange;

        return data
            .map((row) => {
                const x = parseFloat(row[xColumn]);
                const y = parseFloat(row[yColumn]);
                let maxAge = parseInt(row["MaxAge"]) * increase;

                const className = row["Class"];

                if (isNaN(x) || isNaN(y) || isNaN(maxAge)) return null;

                return {
                    x:
                        (x - xMin) * scalingFactor -
                        (xRange * scalingFactor) / 2,
                    y:
                        (y - yMin) * scalingFactor -
                        (yRange * scalingFactor) / 2,
                    rings: Math.ceil(maxAge / increase / 10), // Perhaps we will change this ;)
                    maxAge: maxAge,
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
            .force("center", d3.forceCenter(2, 2))
            .force(
                "collide",
                d3
                    .forceCollide((d) => {
                        return (
                            reducedBaseRadius +
                            d.maxAge * increase +
                            reducedRingSpacing
                        );
                    })
                    .strength(1),
            )
            .force(
                "anchor",
                d3
                    .forceX((d) => centerX + (d.x - centerX) * scalingFactor)
                    .strength(0.4),
            )
            .force(
                "anchorY",
                d3
                    .forceY((d) => centerY + (d.y - centerY) * scalingFactor)
                    .strength(0.4),
            )
            .on("tick", () => {
                tickCount++;
                if (tickCount >= 200) {
                    // loading = false;
                    ticked();
                } else {
                    loading = true;
                }
            })
            .on("end", () => {
                loading = false;
                ticked();
                // simulation.stop();
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
                    <!-- <circle
                            r={node.maxAge}
                            fill="none"
                            stroke={node.color}
                        /> -->
                    {#each Array(node.rings) as _, i}
                        <circle
                            r={reducedBaseRadius +
                                i *
                                    increase *
                                    ((node.maxAge - reducedBaseRadius) /
                                        node.rings)}
                            fill="none"
                            stroke={node.color}
                            class="inner-ring"
                        />
                    {/each}
                </g>
            {/each}
        </g>
    {/if}
</svg>

{#if loading}
    <div class="loading">Loading...</div>
{/if}

<Legend {classColorMapping} />

<style>
    svg {
        width: 100%;
        height: 100vh;
    }

    circle {
        stroke-width: 10;
    }

    .loading {
        width: 100vw;
        height: 100vh;
        color: white;
        background-color: black;
        position: absolute;
        top: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>
