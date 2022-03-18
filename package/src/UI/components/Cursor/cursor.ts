let cursor: string = 'default'

export function setCursor(newCursor: string): void {
    if (cursor === newCursor) return
    document.body.classList.remove('cursor-' + cursor)
    cursor = newCursor
    document.body.classList.add('cursor-' + newCursor)
}

export function setDefaultCursor(defaultCursorVarValue: string, defaultCursorVarValueWebkit?: string): void {
    document.documentElement.style.setProperty('--cursor-default', defaultCursorVarValue)
    if (!defaultCursorVarValueWebkit) defaultCursorVarValueWebkit = defaultCursorVarValue
    document.documentElement.style.setProperty('--cursor-default-webkit', defaultCursorVarValueWebkit)
}
