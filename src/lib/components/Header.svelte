<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    export let viewType;
    export let currentYear;
    export let minYear;
    export let maxYear;

    function changeView(type) {
        dispatch("changeViewType", type);
    }

    function handleYearChange(event) {
        dispatch("yearChange", event.target.value);
    }
</script>

<div class="header">
    <button
        class:selected={viewType === "UMAP"}
        on:click={() => changeView("UMAP")}
    >
        UMAP
    </button>
    <button
        class:selected={viewType === "Geo"}
        on:click={() => changeView("Geo")}
    >
        Geo
    </button>
    <button
        class:selected={viewType === "Rad"}
        on:click={() => changeView("Rad")}
    >
        Rad
    </button>
    <input
        type="range"
        min={minYear}
        max={maxYear}
        bind:value={currentYear}
        on:input={handleYearChange}
    />
    <span>{currentYear}</span>
</div>

<style>
    .header {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 20px;
        gap: 10px;
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 100;
        color: white;
    }

    button {
        cursor: pointer;
        border: none;
    }

    .selected {
        background-color: yellow;
    }

    input[type="range"] {
        width: 200px;
        margin: 0 10px;
    }
</style>
