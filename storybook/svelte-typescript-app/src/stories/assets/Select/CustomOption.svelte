<script lang="ts">
    import type { SelectValueT } from '@yllo/ui-lib'

    export let item: SelectValueT
    export let isSelected: boolean
</script>

<div on:click class="color_line7 noselect" class:background-color_contrast1={isSelected}>
    - {item.value} -
</div>