<script lang="ts">
    import { render as APRender } from "@abstractplay/renderer";
    import type { IRenderOptions } from "@abstractplay/renderer";
    import type { APRenderRepAbbreviated } from "../schemas/renderModified";
    import { onMount } from "svelte";

    export let renderrep: APRenderRepAbbreviated;
    export let options: IRenderOptions = {};

    let previewDiv: HTMLDivElement;
    onMount(() => {
        const opts: IRenderOptions = { ...options, divelem: previewDiv };
        try {
            previewDiv.innerHTML = null;
            APRender(renderrep, opts);
        } catch (err) {
            previewDiv.innerHTML = `<p>Unable to render the piece with the current parameters.</p>`;
        }
    });
</script>

<div bind:this="{previewDiv}" id="previewDiv"></div>
