<script lang="ts">
    export let rounded: boolean = true
    export let shadow: boolean = true
    export let shadowStrong: boolean = false
</script>

<div class="paper" class:rounded class:shadow_strong={shadowStrong} class:shadow>
    <slot></slot>
</div>
