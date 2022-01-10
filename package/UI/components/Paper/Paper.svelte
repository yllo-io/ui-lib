<script lang="ts">
    export let rounded: boolean = true
    export let shadow: boolean = true
    export let shadowStrong: boolean = false
    export let column: boolean = false
</script>

<div class="paper body1" class:rounded class:shadow_strong={shadowStrong} class:shadow class:column>
    <slot></slot>
</div>
