<script>
    import { onMount } from "svelte";
    import { select } from "d3-selection";
    import { zoom, zoomIdentity } from "d3-zoom";
    import { range } from "d3-array";
    import {
        forceSimulation,
        forceCollide,
        forceCenter,
        forceX,
        forceY,
    } from "d3-force";

    export let data;
    export let viewType;

    let svg;

    const classColorMapping = {
        Eudicot: "#09c",
        Ginkgoopsida: "#2cb",
        Monocot: "#4d8",
        Lycopodiopsida: "#9d5",
        Pinopsida: "#c66",
    };

    function getColorForClass(className) {
        return classColorMapping[className] || "#000";
    }

    function plotCircles() {
        if (!data || !svg) return;

        const svgElement = select(svg);
        svgElement.selectAll("*").remove();

        const svgWidth = svg.clientWidth;
        const svgHeight = svg.clientHeight;

        const centerX = svgWidth / 2;
        const centerY = svgHeight / 2;

        const baseRadius = 50;
        const ringThickness = 1;
        const ringSpacing = 3;
        const reducedRingThickness = ringThickness * 0.05;
        const reducedRingSpacing = ringSpacing * 1;
        const reducedBaseRadius = baseRadius * 0.4;

        const g = svgElement
            .append("g")
            .attr("transform", `translate(${centerX}, ${centerY})`);

        const zoomBehavior = zoom()
            .scaleExtent([0.01, 10])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svgElement.call(zoomBehavior);
        svgElement.call(
            zoomBehavior.transform,
            zoomIdentity.translate(centerX, centerY).scale(0.01),
        );

        let xColumn, yColumn;
        if (viewType === "UMAP") {
            xColumn = "UMAP_1";
            yColumn = "UMAP_2";
        } else if (viewType === "Geo") {
            xColumn = "geo_1";
            yColumn = "geo_2";
        } else if (viewType === "Rad") {
            xColumn = "Scaled_Rad_1";
            yColumn = "Scaled_Rad_2";
        }

        const xValues = data
            .map((row) => parseFloat(row[xColumn]))
            .filter((val) => !isNaN(val));
        const yValues = data
            .map((row) => parseFloat(row[yColumn]))
            .filter((val) => !isNaN(val));

        const xMax = Math.max(...xValues);
        const xMin = Math.min(...xValues);
        const yMax = Math.max(...yValues);
        const yMin = Math.min(...yValues);

        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        const svgAspectRatio = svgWidth / svgHeight;
        const dataAspectRatio = xRange / yRange;

        let scalingFactor;
        if (dataAspectRatio > svgAspectRatio) {
            scalingFactor = svgWidth / xRange;
        } else {
            scalingFactor = svgHeight / yRange;
        }

        let nodes = data
            .map((row) => {
                const x = parseFloat(row[xColumn]);
                const y = parseFloat(row[yColumn]);
                const maxAge = parseInt(row["MaxAge"]);
                const className = row["Class"];

                return !isNaN(x) && !isNaN(y) && !isNaN(maxAge)
                    ? {
                          x:
                              (x - xMin) * scalingFactor -
                              (xRange * scalingFactor) / 2,
                          y:
                              (y - yMin) * scalingFactor -
                              (yRange * scalingFactor) / 2,
                          rings: maxAge,
                          color: getColorForClass(className),
                      }
                    : null;
            })
            .filter(Boolean);

        const simulation = forceSimulation(nodes)
            .force("center", forceCenter(0, 0))
            .force(
                "collide",
                forceCollide((d) => {
                    const totalRingSpace =
                        (reducedRingThickness + reducedRingSpacing) *
                            (d.rings - 1) +
                        reducedRingThickness;
                    return reducedBaseRadius + totalRingSpace;
                }).strength(1),
            )
            .force(
                "anchor",
                forceX(
                    (d) => centerX + (d.x - centerX) * scalingFactor,
                ).strength(0.1),
            )
            .force(
                "anchorY",
                forceY(
                    (d) => centerY + (d.y - centerY) * scalingFactor,
                ).strength(0.1),
            )
            .on("tick", ticked);

        simulation.tick(400);

        function ticked() {
            nodeGroups.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
        }

        const nodeGroups = g
            .selectAll("g.node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node");

        nodeGroups.each(function (d) {
            select(this)
                .selectAll("circle")
                .data(range(1, d.rings + 1))
                .enter()
                .append("circle")
                .attr(
                    "r",
                    (i) =>
                        reducedBaseRadius +
                        i * (reducedRingThickness + reducedRingSpacing) -
                        reducedRingSpacing,
                )
                .attr("fill", "none")
                .attr("stroke", d.color)
                .attr("stroke-width", reducedRingThickness);
        });
    }

    $: if (viewType) {
        plotCircles();
    }

    onMount(() => {
        plotCircles();
    });
</script>

<svg bind:this={svg} id="visualization"></svg>

<style>
    svg {
        width: 100%;
        height: 100vh;
    }
</style>
