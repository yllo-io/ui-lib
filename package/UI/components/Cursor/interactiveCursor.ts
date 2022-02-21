import { setDefaultCursor } from './cursor'

let isInteractiveCursor: boolean = false
let isCircleCursor: boolean = false
let cursor: HTMLElement
let nodeHover: HTMLElement | false = false
let nodeRect: DOMRect

function onMousemove(event: MouseEvent) {
    if (nodeHover) {
        const halfHeight: number = nodeRect.height / 2
        const topOffset: number = (event.y - nodeRect.top - halfHeight) / halfHeight
        const halfWidth: number = nodeRect.width / 2
        const leftOffset: number = (event.x - nodeRect.left - halfWidth) / halfWidth

        cursor.style.setProperty('--translateX', `calc(-50% + ${Math.round(leftOffset * 3)}px)`)
        cursor.style.setProperty('--translateY', `calc(-50% + ${Math.round(topOffset * 3)}px)`)

        nodeHover.style.setProperty('--translateX', `${Math.round(leftOffset * 6)}px`)
        nodeHover.style.setProperty('--translateY', `${Math.round(topOffset * 4)}px`)
    } else if (isCircleCursor) {
        cursor.style.setProperty('--top', event.y + 'px')
        cursor.style.setProperty('--left', event.x + 'px')
    }
}

export function initInteractiveCursor(isCircle: boolean) {
    console.log('initInteractiveCursor', isCircle, isCircleCursor, isInteractiveCursor)
    if (isInteractiveCursor) {
        if (isCircleCursor && !isCircle) {
            cursor.classList.add('hidden')
            setDefaultCursor('var(--cursor-custom)', 'var(--cursor-custom-webkit)')
        } else if (!isCircleCursor && isCircle) {
            cursor.classList.remove('hidden')
            setDefaultCursor('none')
        }
        isCircleCursor = isCircle
        return
    }
    isInteractiveCursor = true
    isCircleCursor = isCircle

    cursor = document.createElement('div')
    cursor.classList.add('interactive-cursor')
    if (!isCircleCursor) {
        cursor.classList.add('hidden')
        setDefaultCursor('var(--cursor-custom)', 'var(--cursor-custom-webkit)')
    } else {
        setDefaultCursor('none')
    }
    document.body.appendChild(cursor)

    document.addEventListener('mousemove', onMousemove)
}

export function destroyInteractiveCursor() {
    setDefaultCursor('var(--cursor-custom)', 'var(--cursor-custom-webkit)')
    if (!isInteractiveCursor) return
    isInteractiveCursor = false

    cursor.remove()
    document.removeEventListener('mousemove', onMousemove)
}

export function interactiveElement(node: HTMLElement, isActive: boolean) {
    function onMouseenter() {
        nodeHover = node
        nodeRect = node.getBoundingClientRect()
        node.classList.add('interactive-element-hover')
        if (cursor) {
            const style: CSSStyleDeclaration = window.getComputedStyle(node)
            const borderRadius: string = style.getPropertyValue('border-radius')
            cursor.style.setProperty('--border-radius', borderRadius)
            cursor.classList.add('is-locked')
            cursor.style.setProperty('--top', nodeRect.top + nodeRect.height / 2 + 'px')
            cursor.style.setProperty('--left', nodeRect.left + nodeRect.width / 2 + 'px')
            cursor.style.setProperty('--width', nodeRect.width + 'px')
            cursor.style.setProperty('--height', nodeRect.height + 'px')
        }
    }

    function unlockCursor() {
        if (nodeHover === node) nodeHover = false
        cursor.classList.remove('is-locked')
        cursor.style.removeProperty('--height')
        cursor.style.removeProperty('--width')
        cursor.style.removeProperty('--border-radius')
        cursor.style.removeProperty('--translateX')
        cursor.style.removeProperty('--translateY')
    }

    function onMouseleave() {
        unlockCursor()
        node.classList.remove('interactive-element-hover')
    }

    function activation() {
        node.classList.add('interactive-element')
        node.addEventListener('mouseenter', onMouseenter)
        node.addEventListener('mouseleave', onMouseleave)
    }

    function deactivation() {
        unlockCursor()
        node.removeEventListener('mouseenter', onMouseenter)
        node.removeEventListener('mouseleave', onMouseleave)
        node.classList.remove('interactive-element')
    }

    let isActiveState: boolean = isActive

    if (isActiveState) activation()

    return {
        update(isActive: boolean) {
            if (!isActiveState && isActive) activation()
            else if (isActiveState && !isActive) deactivation()
            isActiveState = isActive
        },
        destroy() {
            if (isActiveState) deactivation()
        },
    }
}
