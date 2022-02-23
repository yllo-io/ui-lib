export function interactiveElement(node: HTMLElement, { isActive, onClick }: { isActive: boolean; onClick?: () => void }) {
    function onMousemove(event: MouseEvent) {
        const halfHeight: number = nodeRect.height / 2
        const topOffset: number = (event.y - nodeRect.top - halfHeight) / halfHeight
        const halfWidth: number = nodeRect.width / 2
        const leftOffset: number = (event.x - nodeRect.left - halfWidth) / halfWidth

        hover.style.setProperty('--translateX', `${Math.round(-leftOffset * 3)}px`)
        hover.style.setProperty('--translateY', `${Math.round(-topOffset)}px`)

        node.style.setProperty('--translateX', `${Math.round(leftOffset * 6)}px`)
        node.style.setProperty('--translateY', `${Math.round(topOffset * 4)}px`)
    }

    function onMouseenter() {
        nodeRect = node.getBoundingClientRect()
        hover.classList.add('active')
        node.classList.add('interactive-element-hover')
    }

    function onMouseleave() {
        if (hover) hover.classList.remove('active')
        if (node) node.classList.remove('interactive-element-hover')
    }

    // function onDOMNodeRemoved(event) {
    //     if (isActiveState && event.target === hover) {
    //         deactivation()
    //         activation()
    //     }
    // }

    function activation() {
        isActiveState = true
        hover = document.createElement('div')
        hover.classList.add('interactive-cursor-hover')
        const style: CSSStyleDeclaration = window.getComputedStyle(node)
        const borderRadius: string = style.getPropertyValue('border-radius')
        if (borderRadius !== '0px') hover.style.setProperty('--border-radius', borderRadius)
        node.appendChild(hover)
        node.classList.add('interactive-element')

        node.addEventListener('mousemove', onMousemove)
        node.addEventListener('mouseenter', onMouseenter)
        node.addEventListener('mouseleave', onMouseleave)
        // node.addEventListener('DOMNodeRemoved', onDOMNodeRemoved)
        if (onClick) node.addEventListener('click', onClick)
    }

    function deactivation() {
        isActiveState = false
        node.removeEventListener('mousemove', onMousemove)
        node.removeEventListener('mouseenter', onMouseenter)
        node.removeEventListener('mouseleave', onMouseleave)
        // node.removeEventListener('DOMNodeRemoved', onDOMNodeRemoved)
        if (onClick) node.removeEventListener('click', onClick)
        if (hover) hover.remove()
        if (node) {
            node.classList.remove('interactive-element')
            node.classList.remove('interactive-element-hover')
        }
    }

    let hover: HTMLElement
    let nodeRect: DOMRect
    let isActiveState: boolean = isActive

    if (isActiveState) activation()

    return {
        update({ isActive, onClick }: { isActive: boolean; onClick?: () => void }) {
            if (!isActiveState && isActive) activation()
            else if (isActiveState && !isActive) deactivation()
        },
        destroy() {
            deactivation()
        },
    }
}
