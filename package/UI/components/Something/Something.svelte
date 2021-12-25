<script lang="ts" context="module">
  export enum ESomething {
    prop1,
    prop2,
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    console.log("mount something");
  });
  export let value1 = ESomething.prop1;
</script>

<div class="something">
  something
  {value1 === ESomething.prop1 ? "prop1" : "prop2"}
</div>
