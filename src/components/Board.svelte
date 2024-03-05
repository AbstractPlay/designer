<script lang="ts">
    import { state } from "@/stores/writeState";
    import { render as APRender } from "@abstractplay/renderer";
    import type { IRenderOptions } from "@abstractplay/renderer";
    import type { APRenderRepAbbreviated } from "@/schemas/renderModified";
    import { onMount } from "svelte";

    type boardType =
        | "squares"
        | "squares-checkered"
        | "squares-beveled"
        | "snubsquare"
        | "vertex"
        | "vertex-cross"
        | "vertex-fanorona"
        | "go"
        | "hex-odd-p"
        | "hex-even-p"
        | "hex-odd-f"
        | "hex-even-f"
        | "hex-slanted"
        | "hex-of-hex"
        | "hex-of-tri"
        | "hex-of-cir"
        | "circular-cobweb"
        | "conhex-cells"
        | "cairo-collinear"
        | "cairo-catalan";
    const boardTypes = new Map<boardType, string>([
        [
            "squares",
            "A simple grid of squares, no shading, with pieces placed inside the cells",
        ],
        [
            "squares-checkered",
            'Same as "squares" but traditional shading of alternate cells',
        ],
        ["squares-beveled", 'Same as "squares" but with a lighter stroke'],
        [
            "snubsquare",
            "A unique combination of squares and triangles where most cells have five connections; pieces are placed on the vertices",
        ],
        ["go", "A traditional Go board"],
        [
            "vertex",
            "A grid of squares, no shading, with pieces placed on the vertices of the lines",
        ],
        [
            "vertex-cross",
            'Same as "vertex" but with diagonal lines between the vertices',
        ],
        [
            "vertex-fanorona",
            "A vertex grid with specific connections, originally for the game Fanorona",
        ],
        [
            "hex-odd-f",
            "A rectangular grid of hexes with flat tops and the odd-numbered columns outdented",
        ],
        [
            "hex-odd-p",
            "A rectangular grid of hexes with pointy tops and the odd-numbered rows indented",
        ],
        [
            "hex-even-f",
            "A rectangular grid of hexes with flat tops and the even-numbered columns outdented",
        ],
        [
            "hex-even-p",
            "A rectangular grid of hexes with pointy tops and the even-numbered rows indented",
        ],
        [
            "hex-slanted",
            "A simple rectangle of hexes, slanted to the left"
        ],
        [
            "hex-of-hex",
            "A hexagonally shaped board consisting of hex-shaped cells, pieces placed in the cells",
        ],
        [
            "hex-of-tri",
            "A hexagonally shaped board consisting of triangle-shaped cells, pieces placed on the vertices",
        ],
        [
            "hex-of-cir",
            "A hexagonally shaped board consisting of circular cells, pieces placed in the cells",
        ],
        ["circular-cobweb", "A circular cobweb board"],
        ["conhex-cells", "The standard ConHex board but where you can place pieces on the cells. The board must be square, and the width/height must be odd. The width/height refers not to the number of cells but the number of rows of dots that *would* be present on a traditional ConHex board."],
        ["cairo-collinear", "A clean, pentagonal board. Height and width express *pairs* of nodes that alternate being orientated vertically and horizontally"],
        ["cairo-catalan", "An alternate pentagonal tiling that duals the snubsquare board"]
    ]);

    let whichWidth: "abs" | "minmax" | undefined;
    let canBlock = false;
    let canAlternate = false;
    let symmetryLocked = true;
    let invertOrientation = false;
    let canInvertOrientation = false;
    const initVars = () => {
        canBlock = false;
        canAlternate = false;
        if ($state.board.style === undefined) {
            whichWidth = undefined;
        } else if (
            $state.board.style.startsWith("squares") ||
            $state.board.style.startsWith("vertex") ||
            $state.board.style.startsWith("hex-odd") ||
            $state.board.style.startsWith("hex-even") ||
            $state.board.style.startsWith("hex-slanted") ||
            $state.board.style === "snubsquare" ||
            $state.board.style === "conhex-cells" ||
            $state.board.style.startsWith("cairo")
        ) {
            if (
                $state.board.style.startsWith("squares") ||
                $state.board.style.startsWith("hex-odd") ||
                $state.board.style.startsWith("hex-even") ||
                $state.board.style.startsWith("hex-slanted") ||
                $state.board.style === "cairo-catalan"
            ) {
                canBlock = true;
            } else {
                canBlock = false;
            }
            if ($state.board.style === "cairo-collinear") {
                canInvertOrientation = true;
            }
            whichWidth = "abs";
        } else if ($state.board.style === "circular-cobweb") {
            whichWidth = "abs";
        } else if ($state.board.style.startsWith("hex-of")) {
            whichWidth = "minmax";
            canBlock = true;
            canAlternate = true;
        } else {
            // go board here
            whichWidth = undefined;
        }
        $state.pieces = null;
        $state = $state;
    };

    const handleInvertClick = () => {
        if ($state.board.style === "cairo-collinear") {
            if (invertOrientation) {
                $state.board.cairoStart = "V";
            } else {
                $state.board.cairoStart = "H";
            }
        }
    }

    const handleStyleChange = () => {
        if ($state.board.style === undefined) {
            $state.board = { style: undefined };
        } else if (
            $state.board.style.startsWith("squares") ||
            $state.board.style.startsWith("vertex") ||
            $state.board.style.startsWith("hex-odd") ||
            $state.board.style.startsWith("hex-even") ||
            $state.board.style.startsWith("hex-slanted") ||
            $state.board.style === "snubsquare" ||
            $state.board.style.startsWith("cairo")
        ) {
            $state.board = {
                style: $state.board.style,
                width: 8,
                height: 8,
                blocked: canBlock ? $state.board.blocked : undefined,
            };
        } else if ($state.board.style === "circular-cobweb") {
            $state.board = {
                style: $state.board.style,
                width: 8,
                height: 4,
            };
        } else if ($state.board.style.startsWith("hex-of")) {
            $state.board = {
                style: $state.board.style,
                minWidth: 4,
                maxWidth: 7,
                blocked: canBlock ? $state.board.blocked: undefined,
                alternatingSymmetry: $state.board.alternatingSymmetry || false,
            };
        } else if ($state.board.style === "conhex-cells") {
            $state.board = {
                style: $state.board.style,
                width: 11,
                height: 11
            };
        } else {
            // go board here
            $state.board = { style: $state.board.style };
        }
        $state.pieces = null;
        $state = $state;
        initVars();
    };

    const updatePreview = () => {
        if (whichWidth === "minmax") {
            // if ($state.board.minWidth < 2) {
            //     $state.board.minWidth = 2;
            // }
            // if ($state.board.minWidth >= $state.board.maxWidth) {
            //     $state.board.minWidth = $state.board.maxWidth - 1;
            // }
            if (symmetryLocked) {
                $state.board.maxWidth = ($state.board.minWidth * 2) - 1;
            }
        } else if (whichWidth === "abs") {
            if (symmetryLocked) {
                $state.board.height = $state.board.width;
            }
        }
        $state = $state;
    };

    const handleSymLockChange = () => {
        // we've switched from unlocked to locked
        if (symmetryLocked) {
            if (whichWidth === "minmax") {
                $state.board.maxWidth = ($state.board.minWidth * 2) - 1;
            } else if (whichWidth === "abs") {
                $state.board.height = $state.board.width;
            }
            $state = $state;
        }
    }

    const handleBoardClick = (row: number, col: number) => {
        console.log(`Row: ${row}, Col: ${col}`);
        // @ts-ignore
        let lst: [
            { row: number; col: number },
            ...{ row: number; col: number }[],
        ] = [];
        if ("blocked" in $state.board && $state.board.blocked !== undefined) {
            lst = JSON.parse(JSON.stringify($state.board.blocked));
        }
        const idx = lst.findIndex((p) => p.col === col && p.row === row);
        if (idx >= 0) {
            lst.splice(idx, 1);
        } else {
            lst.push({ row, col });
        }
        if (lst.length > 0) {
            $state.board.blocked = lst;
        } else {
            delete $state.board.blocked;
        }
        $state = $state;
        return false;
    };

    let previewDiv: HTMLDivElement;
    onMount(() => {
        state.subscribe((state) => {
            if (previewDiv !== undefined && previewDiv !== null) {
                const toRender = JSON.parse(
                    JSON.stringify(state),
                ) as APRenderRepAbbreviated;
                toRender.pieces = null;
                const opts: IRenderOptions = {
                    divelem: previewDiv,
                    width: "100%",
                    boardClick: canBlock ? handleBoardClick : undefined,
                };
                try {
                    previewDiv.innerHTML = null;
                    APRender(toRender, opts);
                } catch (err) {
                    previewDiv.innerHTML = `<p>Unable to render the board with the current parameters.</p>`;
                }
            }
        });
        if ("isInit" in $state) {
            delete $state.isInit;
            handleStyleChange();
        } else {
            initVars();
        }
    });
</script>

<div class="columns">
    <div class="column is-one-third">
        <div class="field">
            <label class="label" for="selectBoard">Select a board type:</label>
            <div class="control">
                <div class="select">
                    <select
                        id="selectBoard"
                        bind:value="{$state.board.style}"
                        on:change="{handleStyleChange}"
                    >
                        <option value="{undefined}"></option>
                        {#each [...boardTypes.keys()] as key}
                            <option
                                value="{key}"
                                selected="{'board' in $state &&
                                    $state.board !== null &&
                                    'style' in $state.board &&
                                    $state.board.style !== null &&
                                    $state.board.style === key}">{key}</option
                            >
                        {/each}
                    </select>
                </div>
            </div>
            <p class="help">{boardTypes.get($state.board.style) || ""}</p>
        </div>
        {#if whichWidth === "abs"}
            <div class="columns">
                <div class="column">
                    <div class="field">
                        <label class="label" for="setWidth">Width</label>
                        <div class="control">
                            <input
                                class="input"
                                id="setWidth"
                                type="number"
                                min="1"
                                bind:value="{$state.board.width}"
                                on:change="{updatePreview}"
                            />
                        </div>
                    </div>
                </div>
                <div class="column">
                    <div class="field">
                        <label class="label" for="setHeight">Height</label>
                        <div class="control">
                            <input
                                class="input"
                                id="setHeight"
                                type="number"
                                min="1"
                                bind:value="{$state.board.height}"
                                on:change="{updatePreview}"
                            />
                        </div>
                    </div>
                    <div class="control">
                        <label class="checkbox">
                            <input
                                type="checkbox"
                                bind:checked="{symmetryLocked}"
                                on:change="{handleSymLockChange}"
                            />
                            Force square
                          </label>
                    </div>
                </div>
            </div>
        {:else if whichWidth === "minmax"}
            <div class="columns">
                <div class="column">
                    <div class="field">
                        <label class="label" for="setMinWidth">Min. Width</label
                        >
                        <div class="control">
                            <input
                                class="input"
                                id="setMinWidth"
                                type="number"
                                min="1"
                                bind:value="{$state.board.minWidth}"
                                on:input="{updatePreview}"
                            />
                        </div>
                    </div>
                </div>
                <div class="column">
                    <div class="field">
                        <label class="label" for="setMaxWidth">Max. Width</label
                        >
                        <div class="control">
                            <input
                                class="input"
                                id="setMaxWidth"
                                type="number"
                                min="1"
                                bind:value="{$state.board.maxWidth}"
                                on:input="{updatePreview}"
                                readonly={symmetryLocked}
                            />
                        </div>
                    </div>
                    <div class="control">
                        <label class="checkbox">
                            <input
                                type="checkbox"
                                bind:checked="{symmetryLocked}"
                                on:change="{handleSymLockChange}"
                            />
                            Force hexhex
                          </label>
                    </div>
                </div>
            </div>
        {/if}
        {#if canAlternate}
            <div class="control">
                <label class="checkbox">
                    <input
                        type="checkbox"
                        bind:checked="{$state.board.alternatingSymmetry}"
                    >
                    Alternating Symmetry
                </label>
            </div>
        {/if}
        {#if canInvertOrientation}
            <div class="control">
                <label class="checkbox">
                    <input
                        type="checkbox"
                        bind:checked="{invertOrientation}"
                        on:change="{handleInvertClick}"
                    >
                    Start with vertical orientation
                </label>
            </div>
        {/if}
        {#if canBlock}
            <div class="content">
                <p>
                    This board type supports cell blocking. Click the board to
                    block a cell.
                </p>
            </div>
            <button
                class="button apButton"
                on:click="{() => {
                    $state.board.blocked = undefined;
                    $state = $state;
                }}">Clear blocks</button
            >
        {/if}
    </div>
    <div class="column">
        <div bind:this="{previewDiv}" id="previewDiv"></div>
    </div>
</div>
