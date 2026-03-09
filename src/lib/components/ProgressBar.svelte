<script lang="ts">
    import { navigating } from "$app/state";
    import { Tween } from "svelte/motion";
    import { cubicOut } from "svelte/easing";

    const progress = new Tween(0, {
        duration: 400,
        easing: cubicOut,
    });

    let visible = $state(false);

    $effect(() => {
        if (navigating) {
            visible = true;
            progress.set(0, { duration: 0 });
            progress.set(1.0, { duration: 2000 });
        } else {
            if (visible) {
                progress.set(1, { duration: 300 }).then(() => {
                    setTimeout(() => {
                        visible = false;
                        progress.target = 0;
                    }, 200);
                });
            }
        }
    });
</script>

{#if visible}
    <div id="progress-bar" class="fixed flex z-20 h-1 w-full">
        <div
            class="bg-linear-to-r/shorter from-primary from-30% via-accent to-secondary to-70% transition-opacity duration-300"
            style="width: {progress.current * 100}%; opacity: {navigating
                ? 1
                : 0};"
        ></div>
    </div>
{/if}
