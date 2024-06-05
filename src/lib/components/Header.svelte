<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    function changeView(type) {
        dispatch("changeViewType", type);
    }
</script>

<div class="header">
    <button on:click={() => changeView("UMAP")}>UMAP</button>
    <button on:click={() => changeView("Geo")}>Geo</button>
    <button on:click={() => changeView("Rad")}>Rad</button>
</div>

<style>
    .header {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        gap: 10px;
    }

    button {
        cursor: pointer;
    }
</style>
