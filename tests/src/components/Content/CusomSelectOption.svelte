<script lang="ts">
    export let item
    export let isSelected: boolean = false
</script>

<div class="noselect" class:selected={isSelected}>
    {item.value}
    {#if item.props && item.props.name}
        <span>
            &nbsp;{item.props.name}
        </span>
    {/if}
</div>

<style>
    div:not(.selected) span {
        color: var(--line-4);
    }
</style>
