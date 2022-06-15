<script lang="ts">
    import { spring } from 'svelte/motion'
    import { onDestroy } from 'svelte'
    import _ from 'lodash'
    import { _theme } from '../../theme'
    import { _client } from '../../tools/client'
    import { interactiveElement } from '../Cursor/interactiveCursor'

    export let min: number = 1
    export let max: number = 10
    export let value: number = 5
    export let isLegend: boolean = true
    export let legendFrequency: number = 1

    let trackElement: HTMLElement
    let trackPageX: number = 0
    let isDrag: boolean = false

    onDestroy(() => {
        document.removeEventListener('mousemove', onMousemoveThrottled)
        document.removeEventListener('mouseup', onMouseup)
    })

    const xSpring = spring(((value - min) / (max - min)) * 100, {
        stiffness: 0.3,
        damping: 1,
    })
    let x = $xSpring

    function onTrackMousedown() {
        if (isDrag) return
        isDrag = true
        const rect = trackElement.getBoundingClientRect()
        trackPageX = rect.left
        document.addEventListener('mousemove', onMousemoveThrottled)
        document.addEventListener('mouseup', onMouseup)
    }

    function onMousemove(e: MouseEvent) {
        x = (Math.min(Math.max(e.pageX - trackPageX, 0), trackElement.offsetWidth) / trackElement.offsetWidth) * 100
        $xSpring = x
    }
    const onMousemoveThrottled = _.throttle(onMousemove, 15)

    function onMouseup(e: MouseEvent) {
        if (!isDrag) return
        onMousemoveThrottled.cancel()
        document.removeEventListener('mousemove', onMousemoveThrottled)
        document.removeEventListener('mouseup', onMouseup)
        value = Math.round((max - min) * (Math.min(Math.max(e.pageX - trackPageX, 0), trackElement.offsetWidth) / trackElement.offsetWidth)) + min
        x = ((value - min) / (max - min)) * 100
        $xSpring = x
        isDrag = false
    }

    function onTrackTouchstart() {
        if (isDrag) return
        isDrag = true
        const rect = trackElement.getBoundingClientRect()
        trackPageX = rect.left
    }

    function onTouchmove(e: TouchEvent) {
        if (e.touches[0]) {
            x = (Math.min(Math.max(e.touches[0].pageX - trackPageX, 0), trackElement.offsetWidth) / trackElement.offsetWidth) * 100
            $xSpring = x
        }
    }
    const onTouchmoveThrottled = _.throttle(onTouchmove, 15)

    function onTouchend(e: TouchEvent) {
        if (!isDrag) return
        onTouchmoveThrottled.cancel()
        value = Math.round((x / 100) * (max - min)) + min
        x = ((value - min) / (max - min)) * 100
        $xSpring = x
        isDrag = false
    }
</script>

<div class="slider noselect">
    <div
        class="track"
        bind:this={trackElement}
        on:mousedown={onTrackMousedown}
        on:touchstart={onTrackTouchstart}
        on:touchmove={onTouchmoveThrottled}
        on:touchend={onTouchend}
    >
        <div class="line" />
        <div
            class="thumb"
            style="left: calc({$xSpring}% - 5.5px);"
            use:interactiveElement={{
                isActive: !$_client.isMobile && $_theme.isInteractiveCursor && x === $xSpring,
                translateFactorX: 0.5,
                translateFactorY: 0,
            }}
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
