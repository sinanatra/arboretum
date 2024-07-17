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
    export let currentYear;

    const classColorMapping = {
        Eudicot: "#d7191c",
        Ginkgoopsida: "#fdae61",
        Monocot: "#ffffbf",
        Lycopodiopsida: "#abdda4",
        Pinopsida: "#2b83ba",
        // 1: "#d7191c",
        // 2: "#fdae61",
        // 3: "#ffffbf",
        // 4: "#abdda4",
        // 5: "#2b83ba",
    };

    const baseRadius = 100; // This is much bigger to avoid points at the center of trees
    const increase = 3; // This is the space between rings
    
    const ringSpacing = 10;
    const reducedRingSpacing = ringSpacing * 2;
    const reducedBaseRadius = baseRadius * 0.4;

    function getColorForClass(className) {
        return classColorMapping[className] || "#FFF";
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
                const year = parseInt(row["Year"]);

                // const className = row["Cluster"]; // Test UMAP clusters
                const className = row["Class"]; // Use Standard Classes

                if (isNaN(x) || isNaN(y) || isNaN(maxAge)) return null;

                return {
                    x:
                        -((x - xMin) * scalingFactor -
                        (xRange * scalingFactor) / 2),
                    y:
                        -((y - yMin) * scalingFactor -
                        (yRange * scalingFactor) / 2),
                    // rings: Math.ceil(maxAge / increase / 5), // This do not corresponds to timeline
                    rings: Math.ceil(maxAge / increase),
                    maxAge: maxAge,
                    year,
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
            // .force(
            //     "collide",
            //     d3
            //         .forceCollide((d) => {
            //             return (
            //                 reducedBaseRadius +
            //                 d.maxAge * increase +
            //                 reducedRingSpacing
            //             );
            //         })
            //         .strength(1),
            // )
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
                    {#if currentYear >= node.year}
                        <!-- {#each Array(node.rings) as _, i} -->
                        {#each Array(Math.min(Math.ceil(currentYear - node.year), node.rings)) as _, i}
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
                    {/if}
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
        stroke-width: 1;
        /* fill-opacity: .5; */
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
