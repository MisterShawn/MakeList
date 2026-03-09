<script lang="ts">
    import type { Snippet } from "svelte";

    let { heading, type, children } = $props<{
        heading?: Snippet;
        type?: string;
        children?: Snippet;
    }>();
</script>

{#if type === "form"}
    <section class="flex-1 min-w-sm lg:max-w-lg">
        <fieldset
            class="border-2 p-4 bg-base-100 bg-linear-to-b from-base-100 to-secondary/5 border-primary/20 shadow-md rounded-2xl"
        >
            <legend class="text-center">
                <h1
                    class="w-max max-w-[32ch] text-[clamp(1rem,2vw,1.75rem)] truncate text-base-100 font-bold bg-primary px-4 py-2 rounded-2xl md:max-w-[46ch]"
                >
                    {@render heading()}
                </h1>
            </legend>
            {#if children}
                {@render children()}
            {/if}
        </fieldset>
    </section>
{:else if type === "list"}
    <section class="flex-1 min-w-sm mt-7 lg:max-w-lg">
        <div
            class="indicator w-full border-2 p-4 bg-base-100 bg-linear-to-b from-base-100 to-secondary/5 border-primary/20 shadow-md rounded-2xl"
        >
            <h1
                class="indicator-item indicator-center w-max max-w-[32ch] text-[clamp(1rem,2vw,1.75rem)] truncate text-base-100 font-bold bg-primary px-4 py-2 rounded-2xl md:max-w-[46ch]"
            >
                {@render heading()}
            </h1>

            {#if children}
                {@render children()}
            {/if}
        </div>
    </section>
{/if}
