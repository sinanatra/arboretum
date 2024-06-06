<script>
    export let classColorMapping;

    const classNames = Object.keys(classColorMapping);
</script>

<div class="legend">
    {#each classNames as className}
        <div class="legend-item">
            <div
                class="legend-color"
                style="background-color: {classColorMapping[className]};"
            ></div>
            <span>{className}</span>
        </div>
    {/each}
</div>

<style>
    .legend {
        display: flex;
        flex-direction: column;
        position: absolute;
        bottom: 10px;
        right: 10px;
        background-color: white;
        padding: 5px;
        font-size: 12px;
    }

    .legend-item {
        display: flex;
    }

    .legend-color {
        width: 10px;
        height: 10px;
        margin-right: 10px;
    }
</style>
