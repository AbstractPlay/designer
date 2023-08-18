<script lang="ts">
    import { render as APRender } from "@abstractplay/renderer";
    import type { IRenderOptions } from "@abstractplay/renderer";
    import type { APRenderRepAbbreviated } from "../schemas/renderModified";
    import { onMount } from "svelte";
    import { customAlphabet } from "nanoid";
    const nanoid = customAlphabet(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        5,
    );

    export let renderrep: APRenderRepAbbreviated;
    export let options: IRenderOptions = {};

    let previewDiv: HTMLDivElement;
    onMount(() => {
        const buffer = 10;
        const svgid = nanoid(10);
        const opts: IRenderOptions = { ...options, divelem: previewDiv, svgid };
        try {
            previewDiv.innerHTML = null;
            APRender(renderrep, opts);
            const svg = document.getElementById(svgid);
            const vb = svg.getAttribute("viewBox");
            const [x, y, width, height] = vb.split(" ").map(n => parseInt(n, 10));
            svg.setAttribute("viewBox", `${x - buffer} ${y - buffer} ${width + (buffer * 2)} ${height + (buffer * 2)}`);
        } catch (err) {
            previewDiv.innerHTML = `<p>Unable to render the piece with the current parameters.</p>`;
        }
    });
</script>

<div bind:this="{previewDiv}" id="previewDiv"></div>

<style>
</style>
