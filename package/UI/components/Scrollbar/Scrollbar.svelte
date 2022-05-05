<script>
    import _ from 'lodash'

    export let wrapper
    export let container
    export let scrollByTrackSpeed = 5 //pixels per millisecond
    export let hideNotActive = true
    export let offsetRight = 0
    export let paddingBottom = 0
    export let ThumbId = ''
    export let smooth = false

    let initialState = true

    export function Update() {
        if (!wrapper || !container) return
        scrollTop = wrapper.scrollTop
        wrapperHeight = wrapper.offsetHeight
        contentHeight = container.offsetHeight
        if (initialState === false) ShowScrollbar()
        else if (initialState === true) initialState = scrollTop
        else if (initialState !== scrollTop) initialState = false
    }
    const UpdateThrottled = _.throttle(Update, 15)

    $: wrapper, Init()
    $: container, Init()

    function Init() {
        if (wrapper && container) {
            wrapper.removeEventListener('scroll', UpdateThrottled)
            wrapper.addEventListener('scroll', UpdateThrottled)
            Update()
            return true
        }
        return false
    }

    let wrapperHeight, contentHeight, scrollTop

    let thumbHeight = 0,
        thumbYPos = 0,
        minThumbHeight = 3

    $: {
        const paddingFix = paddingBottom / wrapperHeight
        minThumbHeight = Math.max((50 / wrapperHeight) * 100, 3)
        thumbHeight = (wrapperHeight / contentHeight) * 100
        const scrollTopFixed =
            minThumbHeight > thumbHeight ? scrollTop * ((100 - (minThumbHeight - thumbHeight)) / 100 - paddingFix) : scrollTop * (1 - paddingFix)
        thumbYPos = Math.min((Math.max(Math.min(scrollTopFixed, contentHeight - wrapperHeight), 0) / contentHeight) * 100, 100 - minThumbHeight)
    }

    let visibleTimeout,
        visible = hideNotActive ? false : true

    function ShowScrollbar() {
        if (hideNotActive) {
            visible = true
            clearTimeout(visibleTimeout)
            visibleTimeout = setTimeout(() => {
                visible = false
            }, 2000)
        }
    }

    let lastPageY, initialSelectStyle, holding

    function OnThumbMousedown(e) {
        lastPageY = e.pageY
        document.addEventListener('mousemove', OnMousemoveThrottled)
        document.addEventListener('mouseup', OnMouseup)
        DisableDocSelect()
        holding = true
    }

    function OnMouseup() {
        document.removeEventListener('mousemove', OnMousemoveThrottled)
        document.removeEventListener('mouseup', OnMouseup)
        EnableDocSelect()
        holding = false
    }

    function OnMousemove(e) {
        let delta = e.pageY - lastPageY
        wrapper.scrollTop += (contentHeight / wrapperHeight) * delta
        lastPageY = e.pageY
    }
    const OnMousemoveThrottled = _.throttle(OnMousemove, 15)

    function DisableDocSelect() {
        initialSelectStyle = document.body.style['user-select']
        document.body.style['-o-user-select'] = 'none'
        document.body.style['-ms-user-select'] = 'none'
        document.body.style['-moz-user-select'] = 'none'
        document.body.style['-webkit-user-select'] = 'none'
        document.body.style['user-select'] = 'none'
    }

    function EnableDocSelect() {
        document.body.style['-o-user-select'] = initialSelectStyle
        document.body.style['-ms-user-select'] = initialSelectStyle
        document.body.style['-moz-user-select'] = initialSelectStyle
        document.body.style['-webkit-user-select'] = initialSelectStyle
        document.body.style['user-select'] = initialSelectStyle
    }

    let trackScrolling = false

    function CancelTrackScrolling() {
        trackScrolling = false
    }

    function OnTrackMousedown(e) {
        trackScrolling = true
        SmoothScrollTo((contentHeight / wrapperHeight) * (e.offsetY - (wrapperHeight * thumbHeight) / 100 / 2), scrollByTrackSpeed)
    }

    function SmoothScrollTo(scrollToY, speed) {
        const startingY = wrapper.scrollTop
        const diff = scrollToY - startingY
        const duration = Math.abs(diff) / speed
        let start

        window.requestAnimationFrame(function Step(timestamp) {
            if (!start) start = timestamp
            const time = timestamp - start
            const percent = Math.min(time / duration, 1)
            wrapper.scrollTo(0, startingY + diff * percent)
            if (time < duration && trackScrolling) window.requestAnimationFrame(Step)
            else trackScrolling = false
        })
    }
</script>

<div
    class:visible={visible && contentHeight > wrapperHeight}
    class="scrollbar"
    style="right: {offsetRight}px; height: calc(100% - {paddingBottom}px);"
    on:mousedown={OnTrackMousedown}
    on:mouseleave={CancelTrackScrolling}
    on:mouseup={CancelTrackScrolling}
>
    <div
        class="thumb"
        class:smooth
        id={ThumbId}
        on:mousedown|stopPropagation={OnThumbMousedown}
        class:holding
        style="height: {thumbHeight}%; top: {thumbYPos}%; min-height: {minThumbHeight}%;"
    />
</div>
