<script lang="ts">
    import { createEventDispatcher } from 'svelte'
    import { interactiveElement } from '../Cursor/interactiveCursor'
    import { _theme } from '../../theme'
    import { _client } from '../../tools/client'

    export let state: boolean
    export let isActive: boolean = true
    export let isBinding: boolean = false

    const dispatch = createEventDispatcher()

    let stateSwitch: number = 0
    let interval: ReturnType<typeof setTimeout>
    if (state) stateSwitch = 4
    $: state, ChangeState()

    const d: string[] = [
        'M18.0736 10C16.7047 10 15.5579 10.9651 14.8492 12.1362C13.4476 14.4521 10.9046 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C10.9046 0 13.4476 1.54793 14.8492 3.86385C15.5579 5.03494 16.7047 6 18.0736 6H33C34.1046 6 35 6.89543 35 8C35 9.10457 34.1046 10 33 10H18.0736Z',
        'M18.8492 3.86385C19.5579 5.03494 20.7047 6 22.0736 6H33C34.1046 6 35 6.89543 35 8V8C35 9.10457 34.1046 10 33 10H22.0736C20.7047 10 19.5579 10.9651 18.8492 12.1362C17.4476 14.4521 14.9046 16 12 16C8.92802 16 6.26046 14.2685 4.92001 11.7282C4.40997 10.7616 3.48813 10 2.39523 10H2C0.89543 10 0 9.10457 0 8V8C0 6.89543 0.89543 6 2 6H2.39523C3.48813 6 4.40997 5.23837 4.92001 4.27179C6.26046 1.7315 8.92802 0 12 0C14.9046 0 17.4476 1.54793 18.8492 3.86385Z',
        'M24.8492 3.86385C25.5579 5.03494 26.7047 6 28.0736 6H33C34.1046 6 35 6.89543 35 8C35 9.10457 34.1046 10 33 10H28.0736C26.7047 10 25.5579 10.9651 24.8492 12.1362C23.4476 14.4521 20.9046 16 18 16C15.0954 16 12.5524 14.4521 11.1508 12.1362C10.4421 10.9651 9.29526 10 7.92641 10H2C0.895429 10 0 9.10457 0 8C0 6.89543 0.89543 6 2 6H7.92641C9.29526 6 10.4421 5.03494 11.1508 3.86385C12.5524 1.54793 15.0954 0 18 0C20.9046 0 23.4476 1.54793 24.8492 3.86385Z',
        'M30.08 4.27179C30.59 5.23837 31.5119 6 32.6048 6H33C34.1046 6 35 6.89543 35 8V8C35 9.10457 34.1046 10 33 10H32.6048C31.5119 10 30.59 10.7616 30.08 11.7282C28.7395 14.2685 26.072 16 23 16C20.0954 16 17.5524 14.4521 16.1508 12.1362C15.4421 10.9651 14.2953 10 12.9264 10H2C0.89543 10 0 9.10457 0 8V8C0 6.89543 0.895431 6 2 6H12.9264C14.2953 6 15.4421 5.03494 16.1508 3.86385C17.5524 1.54793 20.0954 0 23 0C26.072 0 28.7395 1.7315 30.08 4.27179Z',
        'M27 16C31.4183 16 35 12.4183 35 8C35 3.58172 31.4183 0 27 0C24.0954 0 21.5524 1.54793 20.1508 3.86385C19.4421 5.03494 18.2953 6 16.9264 6H2C0.895431 6 0 6.89543 0 8C0 9.10457 0.895433 10 2 10H16.9264C18.2953 10 19.4421 10.9651 20.1508 12.1362C21.5524 14.4521 24.0954 16 27 16Z',
    ]
    const colors: string[] = ['var(--line-4)', 'var(--line-4)', 'var(--line-4)', 'var(--contrast-6)', 'var(--contrast-6)']

    function ChangeState() {
        if (state) {
            if (stateSwitch < 4) {
                interval = setInterval(() => {
                    if (stateSwitch < 4) stateSwitch++
                    else clearInterval(interval)
                }, 20)
            }
        } else {
            if (stateSwitch > 0) {
                interval = setInterval(() => {
                    if (stateSwitch > 0) stateSwitch--
                    else clearInterval(interval)
                }, 20)
            }
        }
    }
</script>

<div
    class="switcher noselect"
    class:disabled={!isActive}
    use:interactiveElement={{ isActive: !$_client.isMobile && $_theme.isInteractiveCursor && isActive }}
    on:click={() => {
        if (isActive) {
            if (isBinding) state = !state
            dispatch('change', state)
        }
    }}
>
    <svg width="35" height="16" viewBox="0 0 35 16" fill={colors[stateSwitch]} xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d={d[stateSwitch]} />
    </svg>
</div>
