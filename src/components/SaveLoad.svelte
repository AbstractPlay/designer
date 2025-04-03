<script lang="ts">
    import type { Writable } from "svelte/store";

    export let store: Writable<Map<string, string>>;
    export let value: string;
    export let handleLoad: (v: string) => void;

    let saveName: string;
    let nameEmpty: boolean;
    $: nameEmpty = saveName === undefined || /^\s*$/.test(saveName);
    let nameExists: boolean;
    $: nameExists = !nameEmpty && $store.has(saveName);
    let selected: string;

    const handleSave = () => {
        store.update((val) => val.set(saveName, value));
        saveName = undefined;
    };

    const handleDelete = () => {
        store.update(
            (val) =>
                new Map<string, string>(
                    [...val.entries()].filter(([k]) => k !== selected)
                )
        );
        selected = "";
    };
</script>

<div class="level">
    <div class="level-left"></div>
    <div class="level-right">
        <div class="level-item">
            <div class="field">
                <label class="label is-small" for="saveName">Name</label>
                <div class="control">
                    <input
                        class="input is-small"
                        type="text"
                        name="saveName"
                        bind:value="{saveName}"
                    />
                    <button
                        class="button apButton is-small"
                        disabled="{nameEmpty}"
                        on:click="{handleSave}">Save</button
                    >
                </div>
                <p class="help {nameExists ? 'is-danger' : 'is-success'}">
                    {nameExists
                        ? "That name already exists. Saving will overwrite."
                        : !nameEmpty
                        ? "That name is available."
                        : ""}
                </p>
            </div>
        </div>
        <div class="level-item">
            <div class="field">
                <label class="label is-small" for="selName">Select one</label>
                <div class="control">
                    <div class="select is-small">
                        <select name="selName" bind:value="{selected}">
                            <option value="">-- Select a saved state --</option>
                            {#each $store.keys() as key}
                                <option value="{key}">{key}</option>
                            {/each}
                        </select>
                    </div>
                </div>
                <div class="control">
                    <button
                        class="button apButton is-small"
                        disabled="{selected === undefined ||
                            /^\s*$/.test(selected)}"
                        on:click="{() => handleLoad($store.get(selected))}"
                        >Load</button
                    >
                    <button
                        class="button apButton is-small"
                        disabled="{selected === undefined ||
                            /^\s*$/.test(selected)}"
                        on:click="{handleDelete}">Delete</button
                    >
                </div>
            </div>
        </div>
    </div>
</div>
