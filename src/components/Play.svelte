<script lang="ts">
    import { state } from "../stores/writeState";
    import { render as APRender } from "@abstractplay/renderer";
    import type { IRenderOptions } from "@abstractplay/renderer";
    import type { APRenderRepAbbreviated } from "../schemas/renderModified";
    import { afterUpdate } from "svelte";
    import PiecePreview from "./PiecePreview.svelte";

    const boardClick = (row: number, col: number, piece: string) => {
        console.log(`Row: ${row}, Col: ${col}, Piece: ${piece}`);
        if (selectedPiece !== undefined) {
            let matrix: string[][][] = [];
            if ($state.pieces !== null) {
                matrix = JSON.parse(
                    JSON.stringify($state.pieces),
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
            $state = $state;
        }
    };

    let previewDiv: HTMLDivElement;
    afterUpdate(() => {
        const opts: IRenderOptions = {
            divelem: previewDiv,
            boardClick,
        };
        try {
            previewDiv.innerHTML = null;
            APRender($state, opts);
        } catch (err) {
            previewDiv.innerHTML = `<p>Unable to render the piece with the current parameters.</p>`;
        }
    });

    let selectedPiece: string | undefined;
    const handlePcSelect = (key: string) => {
        if (selectedPiece === key) {
            selectedPiece = undefined;
        } else {
            selectedPiece = key;
        }
    };
    const toRep = (key: string): APRenderRepAbbreviated => {
        return {
            board: null,
            legend: {
                [key]: $state.legend[key],
            },
            pieces: `${key}`,
        };
    };

    let stackingEnabled = false;
</script>

<div class="content">
    <p>
        Click to select a piece. Click the selected piece to deselect it. Click
        the board with a piece selected to add/remove it. If you click a cell
        containing the selected piece, it will be removed, otherwise it will be
        replaced (unless stacking is turned on). The trashcan icon will delete
        any piece you click on.
    </p>
</div>

<div class="level">
    <div class="level-left">
        <div class="level">
            <div class="control">
                <label class="checkbox">
                    <input type="checkbox" bind:checked="{stackingEnabled}" />
                    Enable stacking?
                </label>
            </div>
        </div>
    </div>
    <div class="level-right">
        <div class="level">
            <div class="control">
                <button
                    class="button apButton is-small"
                    on:click="{() => {
                        $state.pieces = null;
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
            <div class="columns is-multiline">
                {#each Object.keys($state.legend) as pc}
                    <div
                        class="column piece{selectedPiece === pc
                            ? ' selected'
                            : ''}"
                        on:click="{() => handlePcSelect(pc)}"
                        on:keydown="{() => handlePcSelect(pc)}"
                        role="button"
                        tabindex="0"
                    >
                        <PiecePreview renderrep="{toRep(pc)}" />
                    </div>
                {/each}
                <div
                    class="column piece{selectedPiece === '_eraser'
                        ? ' selected'
                        : ''}"
                    on:click="{() => handlePcSelect('_eraser')}"
                    on:keydown="{() => handlePcSelect('_eraser')}"
                    role="button"
                    tabindex="0"
                >
                    <span class="icon" style="width: 100%; height: 100%;">
                        <i class="fa fa-trash" aria-hidden="true"></i>
                    </span>
                </div>
            </div>
        </div>
    </div>
    <div class="column">
        <div bind:this="{previewDiv}" id="previewDiv" class="box"></div>
    </div>
</div>

<style>
    .selected {
        border: 2px dotted black;
    }
    .piece {
        min-width: 25%;
        max-width: 25%;
    }
</style>
