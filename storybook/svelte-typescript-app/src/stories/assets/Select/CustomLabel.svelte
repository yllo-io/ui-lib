<script lang="ts">
    import type { SelectValueT } from '@yllo/ui-lib'

    export let selectedItems: SelectValueT[] = []
    export let isOpen: boolean
</script>

<div on:click class="color_line7 noselect" class:background-color_contrast1={isOpen}>
    Selected: {selectedItems[0].value}
</div>