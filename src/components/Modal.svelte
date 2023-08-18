<script lang="ts">
    import { onMount } from "svelte";

    interface IButton {
        label: string;
        style?: string;
        callback: () => void;
    }
    export let buttons: IButton[];
    export let title: string;
    export let show = false;

    let realButtons: IButton[];
    let closeBtn: IButton;
    onMount(() => {
        closeBtn = buttons.pop();
        realButtons = [...buttons];
    });
</script>

{#if show}
    <div class="modal is-active">
        <div
            class="modal-background"
            on:click="{closeBtn.callback}"
            on:keydown="{closeBtn.callback}"
            role="button"
            tabindex="-1"
        ></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">{title}</p>
                <button class="delete" aria-label="close"></button>
            </header>
            <section class="modal-card-body">
                <slot />
            </section>
            <footer class="modal-card-foot">
                {#each realButtons as btn}
                    <button
                        class="button {btn.style !== undefined
                            ? btn.style
                            : ''}"
                        on:click="{btn.callback}"
                    >
                        {btn.label}
                    </button>
                {/each}
                <button
                    class="button {closeBtn.style !== undefined
                        ? closeBtn.style
                        : ''}"
                    on:click="{closeBtn.callback}"
                >
                    {closeBtn.label}
                </button>
            </footer>
        </div>
    </div>
{/if}
