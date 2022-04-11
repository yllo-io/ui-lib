<script lang="ts">
  import type { ThemeOptions } from "@yllo/ui-lib";

  import { setThemeOptions } from "@yllo/ui-lib/dist/UI/main";
  import { EThemeType } from "@yllo/ui-lib/dist/UI/types";
  import { onMount } from "svelte";

  onMount(() => {
    setThemeOptions({
      themeType: EThemeType.light,
      // isRounded: boolean;
      // isShadow: boolean;
      // isBorder: boolean;
      isInteractiveCursor: true,
      // isCircleCursor: boolean;
    } as ThemeOptions);
  });
</script>

<style lang="scss" global>
  @import "../node_modules/@yllo/ui-lib/UI/theme.scss";
  @import "../node_modules/@yllo/ui-lib/UI/lib.scss";
  @import "./assets/css/global.css";
</style>
