export function interactiveElement(node: HTMLElement, isActive: boolean) {
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
        hover.classList.remove('active')
        node.classList.remove('interactive-element-hover')
    }

    function activation() {
        hover = document.createElement('div')
        hover.classList.add('interactive-cursor-hover')
        const style: CSSStyleDeclaration = window.getComputedStyle(node)
        const borderRadius: string = style.getPropertyValue('border-radius')
        hover.style.borderRadius = borderRadius
        node.appendChild(hover)
        node.classList.add('interactive-element')

        node.addEventListener('mousemove', onMousemove)
        node.addEventListener('mouseenter', onMouseenter)
        node.addEventListener('mouseleave', onMouseleave)
    }

    function deactivation() {
        node.removeEventListener('mousemove', onMousemove)
        node.removeEventListener('mouseenter', onMouseenter)
        node.removeEventListener('mouseleave', onMouseleave)
        hover.remove()
        node.classList.remove('interactive-element')
    }

    let hover: HTMLElement
    let nodeRect: DOMRect
    let isActiveState: boolean = isActive

    if (isActiveState) activation()

    return {
        update(isActive: boolean) {
            if (!isActiveState && isActive) activation()
            else if (isActiveState && !isActive) deactivation()
            isActiveState = isActive
        },
        destroy() {
            deactivation()
        },
    }
}
