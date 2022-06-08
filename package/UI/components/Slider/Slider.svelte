<script lang="ts">
    import { spring } from 'svelte/motion'
    import _ from 'lodash'
    import { interactiveElement } from '../Cursor/interactiveCursor'
    import { onDestroy } from 'svelte'

    export let min: number = 1
    export let max: number = 10
    export let value: number = 5
    export let isLegend: boolean = true
    export let legendFrequency: number = 1

    let trackElement: HTMLElement
    let trackPageX: number = 0

    onDestroy(() => {
        document.removeEventListener('mousemove', OnMousemoveThrottled)
        document.removeEventListener('mouseup', OnMouseup)
    })

    const xSpring = spring(((value - min) / (max - min)) * 100, {
        stiffness: 0.3,
        damping: 1,
    })
    let x = $xSpring

    function onTrackMousedown(e: MouseEvent) {
        const rect = trackElement.getBoundingClientRect()
        trackPageX = rect.left
        document.addEventListener('mousemove', OnMousemoveThrottled)
        document.addEventListener('mouseup', OnMouseup)
    }

    function OnMousemove(e: MouseEvent) {
        x = (Math.min(Math.max(e.pageX - trackPageX, 0), trackElement.offsetWidth) / trackElement.offsetWidth) * 100
        $xSpring = x
    }
    const OnMousemoveThrottled = _.throttle(OnMousemove, 15)

    function OnMouseup(e: MouseEvent) {
        OnMousemoveThrottled.cancel()
        document.removeEventListener('mousemove', OnMousemoveThrottled)
        document.removeEventListener('mouseup', OnMouseup)
        value = Math.round((max - min) * (Math.min(Math.max(e.pageX - trackPageX, 0), trackElement.offsetWidth) / trackElement.offsetWidth)) + min
        x = ((value - min) / (max - min)) * 100
        $xSpring = x
    }
</script>

<div class="slider noselect">
    <div class="track" bind:this={trackElement} on:mousedown={onTrackMousedown}>
        <div class="line" />
        <div
            class="thumb"
            style="left: calc({$xSpring}% - 5.5px);"
            use:interactiveElement={{ isActive: x === $xSpring, translateFactorX: 0.5, translateFactorY: 0 }}
        />
    </div>
    {#if isLegend}
        <div class="legend">
            {#each Array(max - min + 1) as __, index}
                {#if legendFrequency === 1 || index % legendFrequency === 0}
                    <span style="left: {(index / (max - min)) * 100}%;" class="color_line6">{min + index}</span>
                {/if}
            {/each}
        </div>
    {/if}
</div>
