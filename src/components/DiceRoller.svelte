<script lang="ts">
    import {
        roll,
        validateNotation,
        notation as parseDiceNotation,
        RandsumError,
    } from "@randsum/roller";
    import { toast } from "@zerodevx/svelte-toast";
    import {
        dicePresets,
        MAX_DICE_PRESETS,
    } from "#/stores/writeDicePresets";
    import { diceRollHistory, recordAndBroadcastDiceRoll } from "#/stores/writeDiceRoll";
    import { peers } from "#/stores/writePeers";
    import { haveToken } from "#/stores/writeToken";

    let notation = "d20";
    let rollError: string | undefined;

    $: history = $diceRollHistory;
    $: latest = history[0];
    $: lastTotal = latest?.total;
    $: lastValues = latest?.values;
    $: lastNotation = latest?.notation;

    let presetName: string;
    $: presetNameEmpty =
        presetName === undefined || /^\s*$/.test(presetName);
    $: presetNameExists =
        !presetNameEmpty && $dicePresets.has(presetName.trim());

    const formatValues = (values: (number | string)[]) =>
        `[${values.join(", ")}]`;

    const executeRoll = (raw: string) => {
        rollError = undefined;
        const trimmed = raw.trim();
        if (!trimmed) {
            rollError = "Enter a dice notation string.";
            return;
        }
        const v = validateNotation(trimmed);
        if (!v.valid) {
            const pos =
                v.error.position !== undefined
                    ? ` (at character ${v.error.position + 1})`
                    : "";
            rollError = `${v.error.message}${pos}`;
            return;
        }
        try {
            const result = roll(parseDiceNotation(trimmed));
            notation = trimmed;
            recordAndBroadcastDiceRoll({
                notation: trimmed,
                total: result.total,
                values: result.values,
            });
        } catch (e) {
            if (e instanceof RandsumError) {
                rollError = e.message;
            } else if (e instanceof Error) {
                rollError = e.message;
            } else {
                rollError = "Unable to roll.";
            }
        }
    };

    const handleRoll = () => executeRoll(notation);

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleRoll();
        }
    };

    const handleSavePreset = () => {
        const label = presetName.trim();
        const trimmed = notation.trim();
        const v = validateNotation(trimmed);
        if (!v.valid) {
            rollError = v.error.message;
            return;
        }
        if ($dicePresets.size >= MAX_DICE_PRESETS && !$dicePresets.has(label)) {
            toast.push(`At most ${MAX_DICE_PRESETS} saved dice presets.`);
            return;
        }
        dicePresets.update((val) => {
            const next = new Map(val);
            next.set(label, trimmed);
            return next;
        });
        presetName = undefined;
    };

    const handlePresetRoll = (label: string) => {
        const stored = $dicePresets.get(label);
        if (stored !== undefined) {
            executeRoll(stored);
        }
    };

    const handleDeletePreset = (label: string) => {
        dicePresets.update(
            (val) =>
                new Map([...val.entries()].filter(([k]) => k !== label))
        );
    };
</script>

<div class="box">
    <h2 class="title is-5">Dice roller</h2>
    {#if $peers.length > 0 && !$haveToken}
        <p class="help is-warning">
            Rolls are shared only from the peer with the talking stick.
        </p>
    {/if}
    <div class="field">
        <label class="label is-small" for="diceNotation">Notation</label>
        <div class="field has-addons">
            <div class="control is-expanded">
                <input
                    id="diceNotation"
                    class="input is-small"
                    type="text"
                    bind:value="{notation}"
                    on:keydown="{handleKeydown}"
                    autocomplete="off"
                    spellcheck="false"
                />
            </div>
            <div class="control">
                <button
                    class="button apButton is-small"
                    on:click="{handleRoll}">Roll</button
                >
            </div>
        </div>
        {#if rollError}
            <p class="help is-danger">{rollError}</p>
        {/if}
    </div>

    {#if lastTotal !== undefined && lastValues !== undefined}
        <div class="result content is-small">
            <p class="total">
                <strong>{lastTotal}</strong>
                {#if lastNotation}
                    <span class="notation">({lastNotation})</span>
                {/if}
            </p>
            <p class="values">
                {formatValues(lastValues)} → {lastTotal}
            </p>
        </div>
    {/if}

    {#if history.length > 0}
        <div class="history content is-small">
            <p class="has-text-weight-semibold">Recent</p>
            <ul>
                {#each history as entry, i (i)}
                    <li>
                        {#if entry.roller && $peers.length > 0}
                            <span class="roller">{entry.roller}:</span>
                        {/if}
                        <strong>{entry.total}</strong>
                        {entry.notation}
                        <span class="has-text-grey"
                            >{formatValues(entry.values)}</span
                        >
                    </li>
                {/each}
            </ul>
        </div>
    {/if}

    <div class="field">
        <label class="label is-small" for="dicePresetName"
            >Save as preset</label
        >
        <div class="control">
            <input
                id="dicePresetName"
                class="input is-small"
                type="text"
                name="dicePresetName"
                bind:value="{presetName}"
                placeholder="Label"
            />
            <button
                class="button apButton is-small"
                disabled="{presetNameEmpty}"
                on:click="{handleSavePreset}">Save</button
            >
        </div>
        <p
            class="help {presetNameExists ? 'is-danger' : 'is-success'}"
        >
            {presetNameExists
                ? "That name already exists. Saving will overwrite."
                : !presetNameEmpty
                  ? "That name is available."
                  : ""}
        </p>
    </div>

    {#if $dicePresets.size > 0}
        <div class="presets">
            <p class="label is-small">Presets</p>
            <div class="buttons are-small">
                {#each [...$dicePresets.entries()] as [label, storedNotation]}
                    <span class="preset-wrap">
                        <button
                            class="button apButton is-small"
                            title="{storedNotation}"
                            on:click="{() => handlePresetRoll(label)}"
                            >{label}</button
                        >
                        <button
                            class="button is-small is-light preset-delete"
                            title="Remove preset"
                            aria-label="Remove preset {label}"
                            on:click="{(e) => {
                                e.stopPropagation();
                                handleDeletePreset(label);
                            }}"
                        >
                            <span class="icon is-small">
                                <i
                                    class="fa fa-times"
                                    aria-hidden="true"
                                ></i>
                            </span>
                        </button>
                    </span>
                {/each}
            </div>
        </div>
    {/if}

    <details class="docs">
        <summary>Quick reference</summary>
        <div class="content is-small">
            <ul>
                <li><code>d20</code>, <code>4d6</code>, <code>4d6+2</code></li>
                <li
                    ><code>4d6L</code> / <code>4d6H</code> — drop lowest /
                    highest</li
                >
                <li
                    ><code>2d20L</code> / <code>2d20H</code> — advantage /
                    disadvantage style</li
                >
                <li><code>4d6!</code> explode; <code>d%</code>; <code>4dF</code></li>
            </ul>
            <p>
                Uses <a
                    href="https://notation.randsum.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    >RANDSUM dice notation (RDN)</a
                > — see the full modifier list there.
            </p>
        </div>
    </details>
</div>

<style>
    .total {
        margin-bottom: 0.25rem;
        font-size: 1.25rem;
    }
    .notation {
        font-weight: normal;
        color: #666;
        margin-left: 0.35rem;
    }
    .values {
        margin-top: 0;
        color: #666;
    }
    .history ul {
        margin-top: 0.25rem;
        margin-left: 1rem;
    }
    .presets {
        margin-top: 0.75rem;
    }
    .preset-wrap {
        display: inline-flex;
        align-items: stretch;
        margin-bottom: 0.35rem;
    }
    .preset-delete {
        margin-left: -1px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
    .preset-wrap .apButton {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }
    .docs {
        margin-top: 1rem;
    }
    .roller {
        color: #666;
        margin-right: 0.25rem;
    }
</style>
