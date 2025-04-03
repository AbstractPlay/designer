<script lang="ts">
    import { afterUpdate } from "svelte";
    import { state } from "#/stores/writeState";
    import { savedBoards } from "#/stores/writeSavedBoards";
    import Modal from "./Modal.svelte";
    import SaveLoad from "./SaveLoad.svelte";

    let copied = false;
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify($state));
            copied = true;
        } catch (err) {
            alert(`Failed to copy: ${err}`);
        }
    };

    let showModal = false;
    let savedJson: string;

    const handleLoad = (val: string) => {
        state.update(() => JSON.parse(val));
    };
</script>

<div class="level">
    <div class="level-left">
        <div class="level-item">
            <div class="control">
                <button class="button apButton" on:click="{copyToClipboard}">
                    {copied ? "Copied" : "Copy to clipboard"}
                </button>
            </div>
        </div>
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButton"
                    on:click="{() => (showModal = true)}"
                >
                    Load saved JSON
                </button>
            </div>
        </div>
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButtonAlert"
                    on:click="{() => {
                        localStorage.removeItem('stack');
                        localStorage.removeItem('state');
                        location.reload();
                    }}"
                >
                    Full reset
                </button>
            </div>
        </div>
    </div>
    <div class="level-right">
        <SaveLoad
            store="{savedBoards}"
            value="{JSON.stringify($state)}"
            handleLoad="{handleLoad}"
        />
    </div>
</div>

<pre>
{JSON.stringify($state, null, 2)}
</pre>

<Modal
    title="Load JSON"
    show="{showModal}"
    buttons="{[
        {
            label: 'Load',
            style: 'is-success',
            callback: () => {
                $state = JSON.parse(savedJson);
                $state = $state;
                showModal = false;
            },
        },
        {
            label: 'Close',
            callback: () => (showModal = false),
        },
    ]}"
>
    <div class="field">
        <label class="label" for="savedJSON">Paste saved JSON</label>
        <div class="control">
            <textarea class="textarea" id="savedJSON" bind:value="{savedJson}"
            ></textarea>
        </div>
    </div>
</Modal>
