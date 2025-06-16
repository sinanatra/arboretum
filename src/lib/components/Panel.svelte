<script>
  import Header from "@components/Header.svelte";
  import Legend from "@components/Legend.svelte";
  import CuratorTimeline from "@components/CuratorTimeline.svelte";

  export let minYear;
  export let maxYear;
  export let curatorData = [];
  export let curatorInfoData = [];
  export let initialCurator = "";

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function getMinDate(dates) {
    return dates && dates.length > 0 ? Math.min(...dates) : Infinity;
  }

  $: curators = curatorData
    .map((curator) => ({
      ...curator,
      minDate: getMinDate(curator.PlantDates?.map((pd) => pd.Date)),
    }))
    .sort((a, b) => a.minDate - b.minDate);

  $: selectedCurator = initialCurator;

  function handleSelect(event) {
    selectedCurator = event.detail.curatorName;
    const record = curatorData.find(
      (r) => r.CuratorName.toLowerCase() === selectedCurator.toLowerCase()
    );
    dispatch("curatorChange", { selectedCuratorData: record });
  }

  const clusterColorMapping = {
    "1870s": "#184A2C",
    "1880s": "#2A5D34",
    "1890s": "#3C713C",
    "1900s": "#4F8646",
    "1910s": "#639C52",
    "1920s": "#7BB35F",
    "1930s": "#9DC46C",
    "1940s": "#C1D67A",
    "1950s": "#E1C169",
    "1960s": "#D4A55C",
    "1970s": "#C68850",
    "1980s": "#B86B45",
    "1990s": "#9C4E3A",
    "2000s": "#80342F",
    "2010s": "#662426",
    Unknown: "#CCCCCC",
  };
</script>

<aside class="curator-sidebar">
  <Header />

  <Legend {clusterColorMapping} />

  <CuratorTimeline
    {curators}
    {selectedCurator}
    {minYear}
    {maxYear}
    {curatorInfoData}
    on:select={handleSelect}
  />
</aside>

<style>
  .curator-sidebar {
    position: absolute;
    right: 10px;
    top: 0;
    backdrop-filter: blur(5px);
    width: 330px;
    overflow-y: scroll;
    max-height: 98%;
    background-color: rgba(255, 255, 255, 0.6);
    padding: 10px;
  }
</style>
