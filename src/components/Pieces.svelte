<script lang="ts">
    import { state } from "../stores/writeState";
    import { sheets } from "@abstractplay/renderer/src/sheets";
    import type {
        APRenderRepAbbreviated,
        Glyph,
    } from "../schemas/renderModified";
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

    let pcRender: APRenderRepAbbreviated;
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
    const toRep = (key: string): APRenderRepAbbreviated => {
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
            if (
                colourStr.startsWith("#") &&
                (colourStr.length === 4 || colourStr.length === 7)
            ) {
                glyphObj.player = undefined;
                glyphObj.colour = colourStr;
            } else if (!isNaN(parseInt(colourStr, 10))) {
                glyphObj.colour = undefined;
                glyphObj.player = parseInt(colourStr, 10);
            } else {
                glyphObj.player = undefined;
                glyphObj.colour = undefined;
            }
        } else {
            glyphObj.player = undefined;
            glyphObj.colour = undefined;
        }
        glyphObj = glyphObj;
    };

    let textOverlay: string;
    const handleOverlayChange = () => {
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
                class="column is-one-fifth"
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
