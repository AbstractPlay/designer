<script lang="ts">
    import { customAlphabet } from "nanoid";
    import { toast } from "@zerodevx/svelte-toast";
    import { get } from "svelte/store";
    import {
        MAX_SCORE_ROWS,
        mutatePlayScores,
        playScores,
        type ScoreRow,
    } from "#/stores/writeScores";
    import { peers } from "#/stores/writePeers";
    import { haveToken } from "#/stores/writeToken";
    import Modal from "./Modal.svelte";

    const newScoreId = customAlphabet(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        8
    );

    $: rows = $playScores;
    $: peerLocked = $peers.length > 0 && !$haveToken;

    let showAddModal = false;
    let newLabel = "";
    let newValue = 0;

    const openAddModal = () => {
        newLabel = "";
        newValue = 0;
        showAddModal = true;
    };

    const parseStartingValue = (raw: number): number | undefined => {
        if (!Number.isFinite(raw)) {
            return undefined;
        }
        return Math.trunc(raw);
    };

    const handleAdd = () => {
        const label = newLabel.trim();
        if (!label) {
            toast.push("Enter a label for the score.");
            return;
        }
        const value = parseStartingValue(newValue);
        if (value === undefined) {
            toast.push("Enter a valid starting value.");
            return;
        }
        if (get(playScores).length >= MAX_SCORE_ROWS) {
            toast.push(`At most ${MAX_SCORE_ROWS} score rows.`);
            return;
        }
        const row: ScoreRow = {
            id: newScoreId(),
            label,
            value,
        };
        mutatePlayScores((existing) => [...existing, row]);
        showAddModal = false;
    };

    const adjustValue = (id: string, delta: number) => {
        mutatePlayScores((existing) =>
            existing.map((row) =>
                row.id === id ? { ...row, value: row.value + delta } : row
            )
        );
    };

    const removeRow = (id: string) => {
        mutatePlayScores((existing) => existing.filter((row) => row.id !== id));
    };
</script>

<div class="box">
    <div class="scores-head">
        <h2 class="title is-5">Scores</h2>
        <button
            class="button apButton is-small"
            disabled="{peerLocked}"
            aria-label="Add score"
            title="Add score"
            on:click="{openAddModal}"
        >
            <span class="icon is-small">
                <i class="fa fa-plus" aria-hidden="true"></i>
            </span>
        </button>
    </div>
    {#if peerLocked}
        <p class="help is-warning">
            Score changes are shared only from the peer with the talking stick.
        </p>
    {/if}

    {#if rows.length === 0}
        <p class="help">No scores yet. Add one with the plus button.</p>
    {:else}
        <ul class="score-list">
            {#each rows as row (row.id)}
                <li class="score-row">
                    <span class="score-label">{row.label}</span>
                    <div class="score-controls">
                        <button
                            class="button is-small apButton"
                            disabled="{peerLocked}"
                            aria-label="Decrease {row.label}"
                            on:click="{() => adjustValue(row.id, -1)}">−</button
                        >
                        <span class="score-value">{row.value}</span>
                        <button
                            class="button is-small apButton"
                            disabled="{peerLocked}"
                            aria-label="Increase {row.label}"
                            on:click="{() => adjustValue(row.id, 1)}">+</button
                        >
                        <button
                            class="button is-small is-light score-remove"
                            disabled="{peerLocked}"
                            title="Remove score"
                            aria-label="Remove {row.label}"
                            on:click="{() => removeRow(row.id)}"
                        >
                            <span class="icon is-small">
                                <i class="fa fa-times" aria-hidden="true"></i>
                            </span>
                        </button>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<Modal
    title="Add score"
    show="{showAddModal}"
    buttons="{[
        {
            label: 'Add',
            style: 'is-success',
            callback: handleAdd,
        },
        {
            label: 'Cancel',
            callback: () => (showAddModal = false),
        },
    ]}"
>
    <div class="field">
        <label class="label" for="scoreLabel">Label</label>
        <div class="control">
            <input
                id="scoreLabel"
                class="input"
                type="text"
                bind:value="{newLabel}"
                autocomplete="off"
            />
        </div>
    </div>
    <div class="field">
        <label class="label" for="scoreStart">Starting value</label>
        <div class="control">
            <input
                id="scoreStart"
                class="input"
                type="number"
                step="1"
                bind:value="{newValue}"
            />
        </div>
    </div>
</Modal>

<style>
    .scores-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    .scores-head .title {
        margin-bottom: 0;
    }
    .score-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .score-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.35rem 0;
        border-bottom: 1px solid #eee;
    }
    .score-row:last-child {
        border-bottom: none;
    }
    .score-label {
        font-weight: 600;
        min-width: 0;
        flex: 1 1 auto;
    }
    .score-controls {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        flex-shrink: 0;
    }
    .score-value {
        min-width: 2.5rem;
        text-align: center;
        font-variant-numeric: tabular-nums;
    }
    .score-remove {
        margin-left: 0.25rem;
    }
</style>
