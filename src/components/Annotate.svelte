<script lang="ts">
    import { state, type RenderRepModified } from "#/stores/writeState";
    import { capQ } from "#/stores/writeCaptureQueue";
    import { toast } from "@zerodevx/svelte-toast";
    import { render as APRender } from "@abstractplay/renderer";
    import type { IRenderOptions } from "@abstractplay/renderer";
    import { afterUpdate, onMount } from "svelte";
    import type {
        AnnotationBasic,
        RowCol,
    } from "@abstractplay/renderer/build/schemas/schema";
    import { colourContext } from "#/stores/writeContext";
    import html2canvas from "html2canvas";

    type Shape = "square" | "circle" | "hexf" | "hexp";

    const boardClick = (row: number, col: number, piece: string) => {
        console.log(`Row: ${row}, Col: ${col}, Piece: ${piece}`);
        const idx = currentTargets.findIndex(
            (t) => t[0] === col && t[1] === row
        );
        if (idx === -1) {
            currentTargets = [...currentTargets, [col, row]];
        } else {
            currentTargets = [
                ...currentTargets.slice(0, idx),
                ...currentTargets.slice(idx + 1),
            ];
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
        let renderstate = { ...$state, annotations: [...$state.annotations] };
        if (currentNote !== undefined) {
            renderstate.annotations.push(currentNote);
        }
        try {
            previewDiv.innerHTML = null;
            previewDiv.style.backgroundColor = $colourContext.background;
            APRender(renderstate, opts);
        } catch (err) {
            previewDiv.innerHTML = `<p>Unable to render the board with the current parameters.</p>`;
        }
    });

    let newNote = false;
    let currentType: "move" | "enter" | "eject" | "dots" | undefined;
    let currentShape: Shape = "square";
    let currentTargets: [number, number][] = [];
    let currentNote: AnnotationBasic | undefined;
    let isDashed = false;
    let currentColour = "#000";

    // the following builds `currentNote` only when it is sufficiently valid to render
    $: if (
        newNote &&
        currentType !== undefined &&
        currentTargets.length > 0 &&
        currentColour.length > 0
    ) {
        if (
            (currentType === "move" && currentTargets.length >= 2) ||
            (currentType === "eject" && currentTargets.length === 2) ||
            ((currentType === "enter" || currentType === "dots") &&
                currentTargets.length > 0)
        ) {
            currentNote = {
                type: currentType,
                targets: currentTargets.map(([x, y]) => {
                    return { col: x, row: y };
                }) as [RowCol, ...RowCol[]],
            };
            if (currentType === "move" && isDashed) {
                currentNote.style = "dashed";
            } else {
                delete currentNote.style;
            }
            if (currentType === "enter" && currentShape !== "square") {
                currentNote.shape = currentShape;
            } else {
                delete currentNote.shape;
            }
        } else {
            currentNote = undefined;
        }

        // validate and add colour
        if (currentNote !== undefined) {
            // look for digit first
            if (/^\d$/.test(currentColour)) {
                const n = parseInt(currentColour, 10);
                currentNote.colour = n;
            } else if (
                /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(currentColour)
            ) {
                currentNote.colour = currentColour;
            } else {
                delete currentNote.colour;
            }
        }
    } else {
        currentNote = undefined;
    }

    const saveNote = () => {
        if (currentNote !== undefined) {
            $state.annotations.push(currentNote);
            $state = $state;
            closeNote();
        }
    };

    const closeNote = () => {
        currentType = undefined;
        currentTargets = [];
        currentNote = undefined;
        currentColour = "#000";
        isDashed = false;
        newNote = false;
    };

    const deleteNotes = () => {
        $state.annotations = [];
        $state = $state;
    };
</script>

<div class="content">
    <p>
        Here you can add annotations to a finished board for the purposes of
        illustration.
    </p>
    <ul>
        <li>The `move` annotation draws arrows.</li>
        <li>
            The `enter/exit` annotation draws a dotted line around a cell,
            indicating the addition or removal of a piece.
        </li>
        <li>
            The `eject` annotation shows a succession of movement from a
            particular cell. Each ejection can only have two targets, but
            usually all ejections share the same source.
        </li>
        <li>The `dots` annotation places small dots on the cells/pieces.</li>
    </ul>
</div>

<div class="columns">
    <div class="column is-one-third">
        <div class="box">
            <div class="content">
                <ul>
                    {#each $state.annotations as note}
                        <li>{note.type}</li>
                    {/each}
                </ul>
            </div>
            <div class="field">
                <div class="control">
                    <button
                        class="button apButton"
                        disabled="{newNote}"
                        on:click="{() => {
                            currentTargets = [];
                            newNote = true;
                        }}">Add new</button
                    >
                    <button
                        class="button is-small apButtonAlert"
                        on:click="{deleteNotes}">Delete all</button
                    >
                </div>
            </div>
            {#if newNote}
                <hr />
                <div class="field">
                    <label class="label" for="noteType">Type</label>
                    <div class="control">
                        <label class="radio">
                            <input
                                type="radio"
                                name="noteType"
                                value="move"
                                bind:group="{currentType}"
                            />
                            Move
                        </label>
                        <label class="radio">
                            <input
                                type="radio"
                                name="noteType"
                                value="enter"
                                bind:group="{currentType}"
                            />
                            Enter/Exit
                        </label>
                        <label class="radio">
                            <input
                                type="radio"
                                name="noteType"
                                value="eject"
                                bind:group="{currentType}"
                            />
                            Eject
                        </label>
                        <label class="radio">
                            <input
                                type="radio"
                                name="noteType"
                                value="dots"
                                bind:group="{currentType}"
                            />
                            Dots
                        </label>
                    </div>
                </div>
                {#if currentType === "move"}
                    <div class="field">
                        <div class="control">
                            <label class="checkbox">
                                <input
                                    type="checkbox"
                                    bind:checked="{isDashed}"
                                />
                                Dashed line
                            </label>
                        </div>
                    </div>
                {/if}
                {#if currentType === "enter"}
                    <div class="field">
                        <div class="select">
                            <select bind:value="{currentShape}">
                                <option value="square">Square</option>
                                <option value="circle">Circle</option>
                                <option value="hexf">Hex, flat</option>
                                <option value="hexp">Hex, pointy</option>
                            </select>
                        </div>
                    </div>
                {/if}
                <div class="field">
                    <div class="content">
                        <p>
                            Targets <span style="font-size: smaller"
                                >(click to add/remove)</span
                            >:
                        </p>
                        <ul>
                            {#each currentTargets as target}
                                <li>{target[0]}, {target[1]}</li>
                            {/each}
                        </ul>
                    </div>
                    <div class="control">
                        <button
                            class="button is-small apButton"
                            on:click="{() => (currentTargets = [])}"
                            >Clear targets</button
                        >
                    </div>
                </div>
                <div class="field">
                    <label class="label" for="selectColour">Colour</label>
                    <div class="control">
                        <input
                            class="input"
                            type="text"
                            name="selectColour"
                            bind:value="{currentColour}"
                        />
                    </div>
                    <p class="help">
                        Must be a three- or six-digit hexadecimal string or a
                        number from 1 to 9.
                    </p>
                </div>
                <div class="field">
                    <div class="control">
                        <button
                            class="button apButton"
                            disabled="{currentNote === undefined}"
                            on:click="{saveNote}">Save annotation</button
                        >
                        <button
                            class="button is-small apButtonAlert"
                            on:click="{closeNote}">Cancel</button
                        >
                    </div>
                </div>
            {/if}
        </div>
    </div>
    <div class="column">
        <div class="level">
            <div class="level-left"></div>
            <div class="level-right">
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
                                    capQ.update((val) => [
                                        ...val,
                                        canvas.toDataURL(),
                                    ]);
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
            </div>
        </div>
        <div bind:this="{previewDiv}" class="box"></div>
    </div>
</div>

<style>
</style>
