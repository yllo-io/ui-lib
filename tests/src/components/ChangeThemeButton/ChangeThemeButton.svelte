<script lang="ts">
    import ui, { EThemeType } from '@yllo/ui-lib'
    export let style: string = ''
    export let themeType: EThemeType
</script>

<div
    on:click={() => {
        themeType = themeType === EThemeType.light ? EThemeType.dark : EThemeType.light
        ui.setThemeOptions({
            themeType: themeType,
            isRounded: true,
            isShadow: false,
            isBorder: true,
            isInteractiveCursor: true,
            isCircleCursor: true,
        })
    }}
    class="change-theme-button"
    {style}
>
    {#if themeType === EThemeType.light}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12.5" cy="11.5" r="4.25" stroke="var(--line-3)" stroke-width="0.5" />
            <path
                d="M11 15.6875C11 15.6875 13.5 15.1875 13.5 11.6875C13.5 8.1875 11 7.1875 11 7.1875C12 7.1875 16.5 7.1875 16.5 11.1875C16.5 16.1875 12 15.6875 11 15.6875Z"
                fill="var(--line-3)"
            />
        </svg>
    {:else}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12.3563 14.3662C13.9469 14.3662 15.2363 13.0768 15.2363 11.4862C15.2363 9.89562 13.9469 8.6062 12.3563 8.6062C10.7657 8.6062 9.47632 9.89562 9.47632 11.4862C9.47632 13.0768 10.7657 14.3662 12.3563 14.3662Z"
                stroke="var(--line-3)"
                stroke-miterlimit="10"
                stroke-linecap="round"
            />
            <path d="M19.0667 11.6631H17.3987" stroke="var(--line-3)" stroke-miterlimit="10" stroke-linecap="round" />
            <path d="M7.66804 11.6631H6" stroke="var(--line-3)" stroke-miterlimit="10" stroke-linecap="round" />
            <path d="M15.7989 6L14.9648 7.45953" stroke="var(--line-3)" stroke-miterlimit="10" stroke-linecap="round" />
            <path d="M10.1001 15.8687L9.26611 17.3282" stroke="var(--line-3)" stroke-miterlimit="10" stroke-linecap="round" />
            <path d="M9.26611 6L10.1001 7.45953" stroke="var(--line-3)" stroke-miterlimit="10" stroke-linecap="round" />
            <path d="M14.9646 15.8687L15.7986 17.3282" stroke="var(--line-3)" stroke-miterlimit="10" stroke-linecap="round" />
        </svg>
    {/if}
</div>
