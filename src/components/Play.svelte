<script lang="ts">
    import { state, type RenderRepModified } from "#/stores/writeState";
    import { stack } from "#/stores/writeStack";
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
    import type { APDesignerClientMessages } from "#/schemas/messages";
    import Modal from "./Modal.svelte";
    import type {
        MarkerFlood,
        Glyph,
    } from "@abstractplay/renderer/build/schemas/schema";
    import { colourContext } from "#/stores/writeContext";

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

    const boardClick = (row: number, col: number, piece: string) => {
        console.log(`Row: ${row}, Col: ${col}, Piece: ${piece}`);
        if (selectedPiece !== undefined) {
            if (floodEnabled) {
                const colour = ($state.legend[selectedPiece] as Glyph)
                    .colour as string | number;
                // I will only place one point per marker, to simplify this code
                const markers: MarkerFlood[] =
                    ($state.board.markers as MarkerFlood[]) || [];
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
                $state.board.markers = JSON.parse(JSON.stringify(markers));
            } else {
                let matrix: string[][][] = [];
                if ($state.pieces !== null) {
                    matrix = JSON.parse(
                        JSON.stringify($state.pieces)
                    ) as string[][][];
                }
                // prefill the matrix as necessary
                while (row >= matrix.length) {
                    matrix.push([[]]);
                }
                while (col >= matrix[row].length) {
                    matrix[row].push([]);
                }

                // add/remove piece
                let stack = matrix[row][col];
                if (
                    selectedPiece === "_eraser" ||
                    (stack.length === 1 &&
                        !stackingEnabled &&
                        stack[stack.length - 1] === selectedPiece)
                ) {
                    stack.pop();
                } else {
                    if (stackingEnabled) {
                        stack.push(selectedPiece);
                    } else {
                        matrix[row][col] = [selectedPiece];
                    }
                }

                // save
                $state.pieces = JSON.parse(JSON.stringify(matrix));
            }
            $state = $state;
        }
        return false;
    };

    let previewDiv: HTMLDivElement;
    afterUpdate(() => {
        const opts: IRenderOptions = {
            colourContext: $colourContext,
            divelem: previewDiv,
            boardClick,
        };
        try {
            previewDiv.innerHTML = null;
            previewDiv.style.backgroundColor = $colourContext.background;
            APRender($state, opts);
        } catch (err) {
            previewDiv.innerHTML = `<p>Unable to render the piece with the current parameters.</p>`;
        }
    });

    let selectedPiece: string | undefined;
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

    let stackingEnabled = false;
    let floodEnabled = false;
    let floodSupported = true;

    $: if (!floodEnabled && $state.board.style === "squares-diamonds") {
        floodEnabled = true;
    }

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.repeat) return;
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
            ].includes(event.key)
        ) {
            if (event.key === "Delete" || event.key === "0") {
                handlePcSelect(event, "_eraser");
            } else if (event.key === "s" || event.key === "S") {
                stackingEnabled = !stackingEnabled;
            } else if (event.key === "f" || event.key === "F") {
                if (floodSupported) {
                    floodEnabled = !floodEnabled;
                } else {
                    floodEnabled = false;
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
        S key to toggle stacking and the F key to toggle flood filling.
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
                        <input type="checkbox" bind:checked="{floodEnabled}" />
                        Enable flood fill?
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
                    on:click="{() => {
                        stack.update((s) => s.slice(0, -3));
                        if ($stack.length > 0) {
                            $state = $stack[$stack.length - 1];
                        }
                    }}"
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
