<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    export let viewType;

    function changeView(type) {
        dispatch("changeViewType", type);
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
</div>

<style>
    .header {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        gap: 10px;
        position: absolute;
        top: 10px;
        left: 10px;
    }

    button {
        cursor: pointer;
        border: none;
    }

    .selected {
        background-color: yellow;
    }
</style>
