<script lang="ts">
    import { state, type RenderRepModified } from "@/stores/writeState";
    import { sheets } from "@abstractplay/renderer/src/sheets";
    import type {
        Glyph,
    } from "@abstractplay/renderer";
    import { onMount } from "svelte";
    import { customAlphabet } from "nanoid";
    const nanoid = customAlphabet(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        5,
    );
    import PiecePreview from "./PiecePreview.svelte";

    let sheetNames: string[] = [];
    let selectedSheet: string;
    onMount(() => {
        sheetNames = [...sheets.keys()].sort((a, b) => a.localeCompare(b));
        selectedSheet = "core";
        handleSheetChange();
        selectedGlyph = "piece";
        handleGlyphChange();
    });

    let glyphNames: string[] = [];
    const handleSheetChange = () => {
        glyphNames = [];
        if (selectedSheet !== undefined) {
            const sheet = sheets.get(selectedSheet);
            if (sheet !== undefined) {
                glyphNames = [...sheet.glyphs.keys()].sort((a, b) =>
                    a.localeCompare(b),
                );
            }
        }
    };

    let selectedGlyph: string;
    let glyphObj: Glyph;
    const handleGlyphChange = () => {
        if (selectedGlyph !== undefined) {
            glyphObj = {
                name: selectedGlyph,
                scale: 1,
                opacity: 1,
                rotate: 0,
            };
            handleColourChange();
        }
    };

    let pcRender: RenderRepModified;
    $: if (glyphObj !== undefined) {
        const id = nanoid();
        if (
            textOverlay !== undefined &&
            textOverlay !== null &&
            textOverlay.length > 0
        ) {
            pcRender = {
                board: null,
                legend: {
                    [id]: [
                        glyphObj,
                        {
                            text: textOverlay,
                            scale: 0.75,
                        },
                    ],
                },
                pieces: `${id}`,
            };
        } else {
            pcRender = {
                board: null,
                legend: {
                    [id]: glyphObj,
                },
                pieces: `${id}`,
            };
        }
    }
    const toRep = (key: string): RenderRepModified => {
        return {
            board: null,
            legend: {
                [key]: $state.legend[key],
            },
            pieces: `${key}`,
        };
    };

    let colourStr: string = "1";
    const handleColourChange = () => {
        if (colourStr !== undefined) {
            const n = parseInt(colourStr, 10);
            if (isNaN(n)) {
                glyphObj.colour = colourStr;
            } else {
                glyphObj.colour = n;
            }
        } else {
            glyphObj.colour = undefined;
        }
        glyphObj = glyphObj;
    };

    let textOverlay: string;
    const handleOverlayChange = () => {
        glyphObj = glyphObj;
    };

    let rotation = 0;
    const handleRotationChange = () => {
        glyphObj.rotate = rotation;
        glyphObj = glyphObj;
    };

    let opacity = 1;
    const handleOpacityChange = () => {
        glyphObj.opacity = opacity;
        glyphObj = glyphObj;
    };

    let scale = 1;
    const handleScaleChange = () => {
        glyphObj.scale = scale;
        glyphObj = glyphObj;
    };

    const addToLegend = () => {
        const id = nanoid();
        if (
            textOverlay !== undefined &&
            textOverlay !== null &&
            textOverlay.length > 0
        ) {
            $state.legend[id] = [
                glyphObj,
                {
                    text: textOverlay,
                    scale: 0.75,
                },
            ];
        } else {
            $state.legend[id] = glyphObj;
        }
        glyphObj = { ...glyphObj };
        $state = $state;
    };
    const removeFromLegend = (key: string) => {
        if (key in $state.legend) {
            console.log(`Deleting key ${key}`);
            delete $state.legend[key];
        }
        $state = $state;
    };
</script>

<div class="columns">
    <div class="column">
        <div class="field">
            <label class="label" for="pickSheet">Glyph sheet</label>
            <div class="control">
                <div class="select">
                    <select
                        id="pickSheet"
                        bind:value="{selectedSheet}"
                        on:change="{handleSheetChange}"
                    >
                        <option></option>
                        {#each sheetNames as sheet}
                            <option value="{sheet}">{sheet}</option>
                        {/each}
                    </select>
                </div>
            </div>
        </div>
        {#if pcRender !== undefined}
            <div class="field">
                <label class="label" for="pickColour">Colour</label>
                <div class="control">
                    <input
                        class="input"
                        type="text"
                        id="pickColour"
                        placeholder="1-9, #zzz, or #zzzzzz"
                        bind:value="{colourStr}"
                        on:input="{handleColourChange}"
                    />
                </div>
                <p class="help">
                    Enter a digit between 1 and 9 or a three- or six-character
                    hexadecimal colour string starting with a <code>#</code> character.
                </p>
            </div>
            <div class="field">
                <label class="label" for="opacity">Opacity</label>
                <div class="control">
                    <input
                        class="input"
                        type="number"
                        id="opacity"
                        min="0"
                        max="1"
                        step="0.1"
                        bind:value="{opacity}"
                        on:input="{handleOpacityChange}"
                    />
                </div>
            </div>
            <div class="field">
                <label class="label" for="addOverlay">Overlay text</label>
                <div class="control">
                    <input
                        class="input"
                        type="text"
                        id="addOverlay"
                        bind:value="{textOverlay}"
                        on:input="{handleOverlayChange}"
                    />
                </div>
                <p class="help">
                    Optional. Useful for denoting stacks. Meant for <i>short</i>
                    strings.
                </p>
            </div>
        {/if}
    </div>
    <div class="column">
        {#if glyphNames.length > 0}
            <div class="field">
                <label class="label" for="pickGlyph">Glyph</label>
                <div class="control">
                    <div class="select">
                        <select
                            id="pickGlyph"
                            bind:value="{selectedGlyph}"
                            on:change="{handleGlyphChange}"
                        >
                            <option></option>
                            {#each glyphNames as glyph}
                                <option value="{glyph}">{glyph}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            </div>
        {/if}
        {#if pcRender !== undefined}
            <div class="field">
                <label class="label" for="rotate">Rotate</label>
                <div class="control">
                    <input
                        class="input"
                        type="number"
                        id="rotate"
                        min="0"
                        max="359"
                        bind:value="{rotation}"
                        on:input="{handleRotationChange}"
                    />
                </div>
                <p class="help">
                    0&deg; is the glyph's default facing. Rotation increases
                    clockwise. Rotation at angles not in 90&deg; increments can
                    cause clipping.
                </p>
            </div>
            <div class="field">
                <label class="label" for="scale">Scale</label>
                <div class="control">
                    <input
                        class="input"
                        type="number"
                        id="scale"
                        min="0"
                        max="1"
                        step="0.1"
                        bind:value="{scale}"
                        on:input="{handleScaleChange}"
                    />
                </div>
                <p class="help">
                    Represented as a percent. You can only shrink pieces by
                    selecting a number between 0 and 1. This will cause issues
                    with overlay text.
                </p>
            </div>
        {/if}
    </div>
    <div class="column piece">
        {#key pcRender}
            <PiecePreview renderrep="{pcRender}" />
        {/key}
    </div>
</div>

<div class="control">
    <button class="button apButton" on:click="{addToLegend}"
        >Add to legend</button
    >
</div>

<hr />

<div class="content">
    <h4>Glyphs in Legend</h4>
    <p>Click to remove.</p>
</div>
{#key $state.legend}
    <div class="columns is-multiline">
        {#each Object.keys($state.legend) as key}
            <div
                class="column is-one-fifth piece"
                on:click="{() => removeFromLegend(key)}"
                on:keydown="{() => removeFromLegend(key)}"
                role="button"
                tabindex="0"
            >
                <PiecePreview renderrep="{toRep(key)}" />
            </div>
        {/each}
    </div>
{/key}

<style>
    .piece {
        max-width: 25%;
        max-height: 25%;
    }
</style>
