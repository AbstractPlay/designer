<script lang="ts">
    import { capQ } from "#/stores/writeCaptureQueue";
    import { savedFrames } from "#/stores/writeSavedFrames";
    import { toast } from "@zerodevx/svelte-toast";
    import GIF from "gif.js.optimized";
    import SaveLoad from "./SaveLoad.svelte";

    let frameDelay = 1000;
    let repeat = 0;
    let currFrame = 0;
    let iQueue: (number | null)[] = [];
    $: if (currFrame !== undefined) {
        if ($capQ.length > 0) {
            iQueue = [];
            if ($capQ.length <= 7) {
                for (let i = 0; i < $capQ.length; i++) {
                    iQueue.push(i);
                }
            } else {
                // slot 1 (always 0)
                iQueue.push(0);
                // slot 2 (ellip or 1)
                if (currFrame - 1 >= 3) {
                    iQueue.push(null);
                } else {
                    iQueue.push(1);
                }
                // slot 3 (curr - 1 or 2)
                if (currFrame >= 3 && currFrame <= $capQ.length - 4) {
                    iQueue.push(currFrame - 1);
                } else if (currFrame < 3) {
                    iQueue.push(2);
                } else {
                    iQueue.push($capQ.length - 5);
                }
                // slot 4 - middle (currFrame or 3)
                if (currFrame >= 3 && currFrame <= $capQ.length - 4) {
                    iQueue.push(currFrame);
                } else if (currFrame <= 3) {
                    iQueue.push(3);
                } else {
                    iQueue.push($capQ.length - 4);
                }
                // slot 5 (curr + 1 or 4)
                if (currFrame + 1 >= 4 && currFrame + 1 <= $capQ.length - 3) {
                    iQueue.push(currFrame + 1);
                } else if (currFrame + 1 < 4) {
                    iQueue.push(4);
                } else {
                    iQueue.push($capQ.length - 3);
                }
                // slot 6 (ellip or 5)
                if (currFrame < $capQ.length - 4) {
                    iQueue.push(null);
                } else {
                    iQueue.push($capQ.length - 2);
                }
                // slot 7 (always max)
                iQueue.push($capQ.length - 1);
            }
        } else {
            iQueue = [];
        }
    }

    let renderedDiv: HTMLDivElement;
    const renderGif = () => {
        fetch("https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js")
            .then((response) => {
                if (!response.ok)
                    throw new Error("Network response was not OK");
                return response.blob();
            })
            .then((workerBlob) => {
                let width = 500;
                let height = 500;
                if ($capQ.length > 0) {
                    const imgEle = document.createElement("img");
                    imgEle.src = $capQ[0];
                    width = imgEle.width;
                    height = imgEle.height;
                }
                let gif = new GIF({
                    workers: 4,
                    workerScript: URL.createObjectURL(workerBlob),
                    quality: 10,
                    width,
                    height,
                    repeat: repeat < 0 ? -1 : repeat,
                });
                gif.on("finished", function (blob) {
                    const url = URL.createObjectURL(blob);
                    const img = document.createElement("img");
                    img.src = url;
                    renderedDiv.innerHTML = "";
                    renderedDiv.appendChild(img);
                    toast.push(
                        "Animated GIF generated. It should be visible at the bottom of the page. If there are dropped (blacked out) frames, just click the button again."
                    );
                });
                return gif;
            })
            .then((gif) => {
                for (const url of $capQ) {
                    const imgEle = document.createElement("img");
                    imgEle.src = url;
                    gif.addFrame(imgEle, { delay: frameDelay });
                }
                gif.render();
            });
    };

    const handleLoad = (val: string) => {
        capQ.update(() => JSON.parse(val));
    };
</script>

<div class="content">
    <p>
        From the Play or Annotate tabs, create board states and add them to the
        queue using the camera button. Then come to this tab and order the queue
        as desired and then export as an animated GIF.
    </p>
</div>
<nav class="pagination is-right" aria-label="pagination">
    <button
        class="pagination-previous{currFrame === 0 ? ' is-disabled' : ''}"
        on:click="{() => currFrame--}"
        disabled="{$capQ.length === 0 || currFrame === 0}"
        >Previous frame</button
    >
    <button
        class="pagination-next{currFrame === $capQ.length - 1
            ? ' is-disabled'
            : ''}"
        on:click="{() => currFrame++}"
        disabled="{$capQ.length === 0 || currFrame === $capQ.length - 1}"
        >Next frame</button
    >
    <ul class="pagination-list">
        {#if iQueue.length > 0}
            {#each iQueue as idx}
                {#if idx !== null}
                    <li>
                        <button
                            class="pagination-link{currFrame === idx
                                ? ' is-current'
                                : ''}"
                            aria-label="Goto frame {idx + 1}"
                            on:click="{() => (currFrame = idx)}"
                            >{idx + 1}</button
                        >
                    </li>
                {:else}
                    <li><span class="pagination-ellipsis">&hellip;</span></li>
                {/if}
            {/each}
        {/if}
    </ul>
</nav>
<div class="level">
    <div class="level-left">
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButton is-small"
                    on:click="{() => {
                        if (currFrame === 0) {
                            capQ.update((val) => [...val.slice(1), val[0]]);
                            currFrame = $capQ.length - 1;
                        } else if (currFrame === 1) {
                            capQ.update((val) => [
                                val[currFrame],
                                val[currFrame - 1],
                                ...val.slice(currFrame + 1),
                            ]);
                            currFrame--;
                        } else {
                            capQ.update((val) => [
                                ...val.slice(0, currFrame - 1),
                                val[currFrame],
                                val[currFrame - 1],
                                ...val.slice(currFrame + 1),
                            ]);
                            currFrame--;
                        }
                    }}"
                    ><span class="icon"
                        ><i
                            class="fa fa-angle-double-left"
                            aria-hidden="true"
                            title="Move frame left"
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
                        capQ.update((val) => [
                            ...val.slice(0, currFrame),
                            ...val.slice(currFrame + 1),
                        ]);
                        if (currFrame > 0) {
                            currFrame--;
                        }
                    }}"
                    ><span class="icon"
                        ><i
                            class="fa fa-trash"
                            aria-hidden="true"
                            title="Delete frame"
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
                        if (currFrame === $capQ.length - 1) {
                            capQ.update((val) => [
                                val[val.length - 1],
                                ...val.slice(0, -1),
                            ]);
                            currFrame = 0;
                        } else {
                            capQ.update((val) => [
                                ...val.slice(0, currFrame),
                                val[currFrame + 1],
                                val[currFrame],
                                ...val.slice(currFrame + 2),
                            ]);
                            currFrame++;
                        }
                    }}"
                    ><span class="icon"
                        ><i
                            class="fa fa-angle-double-right"
                            aria-hidden="true"
                            title="Move frame right"
                        ></i></span
                    ></button
                >
            </div>
        </div>
    </div>
    <div class="level-right">
        <div class="level-item">
            <div class="control">
                <button
                    class="button apButton is-small"
                    on:click="{() => {
                        capQ.update((val) => []);
                    }}">Clear queue</button
                >
            </div>
        </div>
    </div>
</div>
<div class="box">
    {#key currFrame}
        <img src="{$capQ[currFrame]}" />
    {/key}
</div>
<SaveLoad
    store="{savedFrames}"
    value="{JSON.stringify($capQ)}"
    handleLoad="{handleLoad}"
/>
<div class="level">
    <div class="level-left">
        <div class="level-item">
            <div class="field">
                <label class="label" for="delay">Frame interval (ms)</label>
                <div class="control">
                    <input
                        class="input"
                        name="delay"
                        type="number"
                        bind:value="{frameDelay}"
                    />
                </div>
            </div>
        </div>
        <div class="level-item">
            <div class="field">
                <label class="label" for="repeat">Repeat setting</label>
                <div class="control">
                    <input
                        class="input"
                        name="repeat"
                        type="number"
                        bind:value="{repeat}"
                    />
                </div>
                <p class="help">
                    {repeat < 0
                        ? "Don't repeat"
                        : repeat === 0
                        ? "Repeat forever"
                        : `Repeat ${repeat} time${repeat !== 1 ? "s" : ""}`}
                </p>
            </div>
        </div>
    </div>
    <div class="level-right">
        <div class="level-item">
            <div class="control">
                <button class="button apButton" on:click="{renderGif}"
                    >Render GIF</button
                >
            </div>
        </div>
    </div>
</div>
<div class="box" bind:this="{renderedDiv}"></div>
