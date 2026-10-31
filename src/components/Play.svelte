<script lang="ts">
    import { state, type RenderRepModified } from "#/stores/writeState";
    import deepclone from "nanoclone";
    import {
        canRedo,
        canUndo,
        redoHistory,
        undoHistory,
    } from "#/stores/writeStack";
    import { peers } from "#/stores/writePeers";
    import { haveToken } from "#/stores/writeToken";
    import { capQ } from "#/stores/writeCaptureQueue";
    import { render as APRender } from "@abstractplay/renderer";
    import type { IRenderOptions } from "@abstractplay/renderer";
    import { toast } from "@zerodevx/svelte-toast";
    import { afterUpdate, onMount } from "svelte";
    import { customAlphabet } from "nanoid";
    import html2canvas from "html2canvas";
    const nanoid = customAlphabet(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        5
    );
    import PiecePreview from "./PiecePreview.svelte";
    import DiceRoller from "./DiceRoller.svelte";
    import type { APDesignerClientMessages } from "#/schemas/messages";
    import Modal from "./Modal.svelte";
    import type {
        MarkerFence,
        MarkerFlood,
        Glyph,
    } from "@abstractplay/renderer/build/schemas/schema";
    import { colourContext } from "#/stores/writeContext";

    /** Trim each end; fraction of segment length (matches renderer `line` / `fence` markers). */
    const FENCE_SHORTEN = 0.1;

    const FENCE_SIDES = new Set<string>([
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW",
    ]);

    const styleSupportsFence = (style: string | undefined): boolean => {
        if (style === undefined) {
            return false;
        }
        if (style === "squares-diamonds") {
            return false;
        }
        if (style.startsWith("squares")) {
            return true;
        }
        if (style.startsWith("hex-odd") || style.startsWith("hex-even")) {
            return true;
        }
        return false;
    };

    const markerColourFromLegend = (
        legend: RenderRepModified["legend"],
        key: string
    ): string | number | undefined => {
        const glyph = legend[key] as Glyph;
        return glyph.colour as string | number | undefined;
    };

    let stackingEnabled = false;
    let floodEnabled = false;
    let floodSupported = true;
    let fenceEnabled = false;
    let fenceSupported = false;
    let selectedPiece: string | undefined;
    let previewDiv: HTMLDivElement;

    const setFloodEnabled = (enabled: boolean) => {
        floodEnabled = enabled;
        if (enabled) {
            fenceEnabled = false;
        }
    };

    const setFenceEnabled = (enabled: boolean) => {
        fenceEnabled = enabled;
        if (enabled) {
            floodEnabled = false;
        }
    };

    onMount(() => {
        if (
            $state.board.style.startsWith("vertex") ||
            $state.board.style === "snubsquare"
        ) {
            floodSupported = false;
            floodEnabled = false;
        } else if ($state.board !== undefined) {
            floodSupported = true;
        }
    });

    $: fenceSupported = styleSupportsFence($state.board?.style);
    $: if (!fenceSupported) {
        fenceEnabled = false;
    }

    const boardClick = (row: number, col: number, piece: string) => {
        console.log(`Row: ${row}, Col: ${col}, Piece: ${piece}`);
        if (selectedPiece === undefined) {
            return false;
        }
        if (fenceEnabled && !FENCE_SIDES.has(piece)) {
            return false;
        }
        state.update((st) => {
            const next = deepclone(st) as RenderRepModified;
            if (floodEnabled) {
                const colour = markerColourFromLegend(
                    next.legend,
                    selectedPiece
                ) as string | number;
                // I will only place one point per marker, to simplify this code
                const markers: MarkerFlood[] =
                    (next.board.markers as MarkerFlood[]) || [];
                const idx = markers.findIndex(
                    (m) => m.points[0].col === col && m.points[0].row === row
                );
                let prev: string | number | undefined;
                if (idx !== -1) {
                    prev = markers[idx].colour as number | string;
                    markers.splice(idx, 1);
                }
                if (prev === undefined || prev !== colour) {
                    markers.push({
                        type: "flood",
                        points: [{ row, col }],
                        colour,
                        opacity: 1,
                    });
                }
                next.board.markers = JSON.parse(JSON.stringify(markers));
            } else if (fenceEnabled) {
                const side = piece as MarkerFence["side"];
                const colour = markerColourFromLegend(
                    next.legend,
                    selectedPiece
                );
                const allMarkers = [...(next.board.markers || [])];
                const fences = allMarkers.filter(
                    (m): m is MarkerFence => m.type === "fence"
                );
                const other = allMarkers.filter((m) => m.type !== "fence");
                const idx = fences.findIndex(
                    (m) =>
                        m.cell.row === row &&
                        m.cell.col === col &&
                        m.side === side
                );
                let prev: string | number | undefined;
                if (idx !== -1) {
                    prev = fences[idx].colour as number | string | undefined;
                    fences.splice(idx, 1);
                }
                if (prev === undefined || prev !== colour) {
                    const marker: MarkerFence = {
                        type: "fence",
                        cell: { row, col },
                        side,
                        shorten: FENCE_SHORTEN,
                    };
                    if (colour !== undefined) {
                        marker.colour = colour;
                    }
                    fences.push(marker);
                }
                next.board.markers = JSON.parse(
                    JSON.stringify([...other, ...fences])
                );
            } else {
                let matrix: string[][][] = [];
                if (next.pieces !== null) {
                    matrix = JSON.parse(
                        JSON.stringify(next.pieces)
                    ) as string[][][];
                }
                while (row >= matrix.length) {
                    matrix.push([[]]);
                }
                while (col >= matrix[row].length) {
                    matrix[row].push([]);
                }

                let cellStack = matrix[row][col];
                if (
                    selectedPiece === "_eraser" ||
                    (cellStack.length === 1 &&
                        !stackingEnabled &&
                        cellStack[cellStack.length - 1] === selectedPiece)
                ) {
                    cellStack.pop();
                } else if (stackingEnabled) {
                    cellStack.push(selectedPiece);
                } else {
                    matrix[row][col] = [selectedPiece];
                }

                next.pieces = JSON.parse(JSON.stringify(matrix));
            }
            return next;
        });
        return false;
    };

    afterUpdate(() => {
        const opts: IRenderOptions = {
            colourContext: $colourContext,
            divelem: previewDiv,
            boardClick,
        };
        let renderState = $state;
        if (fenceEnabled && fenceSupported) {
            const options = [...($state.options ?? [])];
            if (!options.includes("clickable-edges")) {
                options.push("clickable-edges");
            }
            renderState = { ...$state, options };
        }
        try {
            previewDiv.innerHTML = null;
            previewDiv.style.backgroundColor = $colourContext.background;
            APRender(renderState, opts);
        } catch (err) {
            previewDiv.innerHTML = `<p>Unable to render the piece with the current parameters.</p>`;
        }
    });

    const handlePcSelect = (
        e: MouseEvent | TouchEvent | KeyboardEvent,
        key: string
    ) => {
        e.preventDefault();
        // if (selectedPiece === key) {
        //     selectedPiece = undefined;
        // } else {
        selectedPiece = key;
        // }
        return false;
    };
    const toRep = (key: string): RenderRepModified => {
        const newkey = nanoid(5);
        return {
            board: null,
            legend: {
                [newkey]: $state.legend[key],
            },
            pieces: `${newkey}`,
        };
    };

    // $: if (!floodEnabled && $state.board.style === "squares-diamonds") {
    //     floodEnabled = true;
    // }

    const isTextEntryTarget = (target: EventTarget | null) => {
        if (!(target instanceof HTMLElement)) {
            return false;
        }
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
            return true;
        }
        return target.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.repeat) return;
        if (isTextEntryTarget(event.target)) return;
        if (event.ctrlKey || event.metaKey) {
            const key = event.key.toLowerCase();
            if (key === "z" && !event.shiftKey) {
                event.preventDefault();
                undoHistory();
                return;
            }
            if (key === "y" || (key === "z" && event.shiftKey)) {
                event.preventDefault();
                redoHistory();
                return;
            }
        }
        if (
            [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "0",
                "Delete",
                "s",
                "S",
                "f",
                "F",
                "n",
                "N",
            ].includes(event.key)
        ) {
            if (event.key === "Delete" || event.key === "0") {
                handlePcSelect(event, "_eraser");
            } else if (event.key === "s" || event.key === "S") {
                stackingEnabled = !stackingEnabled;
            } else if (event.key === "f" || event.key === "F") {
                if (floodSupported) {
                    setFloodEnabled(!floodEnabled);
                } else {
                    setFloodEnabled(false);
                }
            } else if (event.key === "n" || event.key === "N") {
                if (fenceSupported) {
                    setFenceEnabled(!fenceEnabled);
                } else {
                    setFenceEnabled(false);
                }
            } else {
                const keys = Object.keys($state.legend);
                if (keys.length > 0) {
                    let idx = parseInt(event.key, 10);
                    if (idx > keys.length) {
                        return;
                    }
                    handlePcSelect(event, keys[idx - 1]);
                }
            }
        }
    };

    let selectedPeer: string;
    const handleGiveToken = () => {
        if (selectedPeer !== undefined) {
            const peer = $peers.find((p) => p.id === selectedPeer);
            if (peer !== undefined) {
                const msgReplace = {
                    type: "gameReplace",
                    game: JSON.stringify($state),
                };
                const msgGive: APDesignerClientMessages = {
                    type: "giveToken",
                };
                peer.connection.send(msgReplace);
                peer.connection.send(msgGive);
                $haveToken = false;
            }
        }
    };

    let showTakeModal = false;
</script>

<svelte:window on:keydown="{onKeyDown}" />

<div class="content">
    <p>
        Click to select a piece. Click the selected piece to deselect it. Click
        the board with a piece selected to add/remove it. If you click a cell
        containing the selected piece, it will be removed, otherwise it will be
        replaced (unless stacking is turned on). The trashcan icon will delete
        any piece you click on.
    </p>
    <p>
        On desktop, press the keys 1–9 to select one of the first nine pieces in
        the legend. Pressing 0 or the Delete key will select the eraser. Use the
        S key to toggle stacking, the F key to toggle flood filling, and the N
        key to toggle fence drawing on supported boards. Use Ctrl+Z to undo and
        Ctrl+Y (or Ctrl+Shift+Z) to redo.
    </p>
</div>

<div class="level">
    <div class="level-left">
        <div class="level-item">
            <div class="control">
                <label class="checkbox">
                    <input type="checkbox" bind:checked="{stackingEnabled}" />
                    Enable stacking?
                </label>
            </div>
        </div>
        {#if floodSupported}
            <div class="level-item">
                <div class="control">
                    <label class="checkbox">
                        <input
                            type="checkbox"
                            checked="{floodEnabled}"
                            on:change="{(e) =>
                                setFloodEnabled(e.currentTarget.checked)}"
                        />
                        Enable flood fill?
                    </label>
                </div>
            </div>
        {/if}
        {#if fenceSupported}
            <div class="level-item">
                <div class="control">
                    <label class="checkbox">
                        <input
                            type="checkbox"
                            checked="{fenceEnabled}"
                            on:change="{(e) =>
                                setFenceEnabled(e.currentTarget.checked)}"
                        />
                        Enable fence?
                    </label>
                </div>
            </div>
        {/if}
    </div>
    <div class="level-right">
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButton is-small"
                    disabled="{!$canUndo}"
                    on:click="{undoHistory}"
                    ><span class="icon"
                        ><i class="fa fa-undo" aria-hidden="true" title="Undo"
                        ></i></span
                    ></button
                >
            </div>
        </div>
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButton is-small"
                    disabled="{!$canRedo}"
                    on:click="{redoHistory}"
                    ><span class="icon"
                        ><i
                            class="fa fa-repeat"
                            aria-hidden="true"
                            title="Redo"
                        ></i></span
                    ></button
                >
            </div>
        </div>
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButton is-small"
                    on:click="{() => {
                        const prev = previewDiv.style.boxShadow;
                        previewDiv.style.boxShadow = 'none';
                        html2canvas(previewDiv, {
                            background: $colourContext.background,
                            width: previewDiv.clientWidth,
                            height: previewDiv.clientHeight,
                        }).then(function (canvas) {
                            capQ.update((val) => [...val, canvas.toDataURL()]);
                            toast.push(
                                `Frame captured (${$capQ.length} total)`
                            );
                            previewDiv.style.boxShadow = prev;
                        });
                    }}"
                    ><span class="icon"
                        ><i
                            class="fa fa-camera"
                            aria-hidden="true"
                            title="Add board to capture queue"
                        ></i></span
                    ></button
                >
            </div>
        </div>
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButton is-small"
                    on:click="{() => {
                        $state.pieces = null;
                        delete $state.board.markers;
                        $state = $state;
                    }}">Clear board</button
                >
            </div>
        </div>
    </div>
</div>

<div class="columns">
    <div class="column is-one-third">
        <div class="box">
            <div class="columns is-multiline is-mobile">
                {#each Object.keys($state.legend) as pc}
                    <div
                        class="column is-narrow piece{selectedPiece === pc
                            ? ' selected'
                            : ''}"
                        on:click="{(e) => handlePcSelect(e, pc)}"
                        on:keydown="{(e) => handlePcSelect(e, pc)}"
                        role="button"
                        tabindex="0"
                    >
                        <PiecePreview renderrep="{toRep(pc)}" />
                    </div>
                {/each}
                <div
                    class="column is-narrow piece{selectedPiece === '_eraser'
                        ? ' selected'
                        : ''}"
                    on:click="{(e) => handlePcSelect(e, '_eraser')}"
                    on:keydown="{(e) => handlePcSelect(e, '_eraser')}"
                    role="button"
                    tabindex="0"
                >
                    <span class="icon" style="width: 100%; height: 100%;">
                        <i class="fa fa-trash" aria-hidden="true"></i>
                    </span>
                </div>
            </div>
        </div>
        <DiceRoller />
        {#if $peers.length > 0}
            <div class="box">
                {#if $haveToken}
                    <div class="content">
                        <p class="is-success">You have the talking stick.</p>
                    </div>
                    <div class="field">
                        <div class="control">
                            <div class="select">
                                <select bind:value="{selectedPeer}">
                                    {#each $peers as peer}
                                        <option value="{peer.id}"
                                            >{peer.alias}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                        </div>
                        <div class="control">
                            <button
                                class="button apButton"
                                on:click="{handleGiveToken}"
                                >Give talking stick</button
                            >
                        </div>
                    </div>
                {:else}
                    <div class="content">
                        <p class="is-danger">
                            You do not have the talking stick.
                        </p>
                    </div>
                    <div class="control">
                        <button
                            class="button apButton"
                            on:click="{() => (showTakeModal = true)}"
                            >Take talking stick</button
                        >
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    <div class="column">
        <div bind:this="{previewDiv}" class="box" id="captureSource"></div>
    </div>
</div>

<Modal
    title="Take the Talking Stick"
    show="{showTakeModal}"
    buttons="{[
        {
            label: 'Take it',
            style: 'is-success',
            callback: () => {
                for (const p of $peers) {
                    p.connection.send({ type: 'takeToken' });
                }
                $haveToken = true;
                showTakeModal = false;
            },
        },
        {
            label: 'Cancel',
            callback: () => (showTakeModal = false),
        },
    ]}"
>
    <div class="content">
        <p>
            This is intended to be used only when something has gone wrong. If
            you take the stick, you may miss out on changes the current stick
            holder made. Are you sure you wish to forcibly take the talking
            stick?
        </p>
    </div>
</Modal>

<style>
    .selected {
        border: 2px dotted black;
    }
    .piece {
        /* min-width: 25%; */
        max-width: 25%;
    }
    .is-success {
        background-color: #48c78e;
        color: #fff;
    }
    .is-danger {
        background-color: #f14668;
        color: #fff;
    }
</style>
