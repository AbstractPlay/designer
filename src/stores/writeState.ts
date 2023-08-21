import { writable } from "svelte/store";
import type { APRenderRepAbbreviated } from "@/schemas/renderModified";

let initialState: APRenderRepAbbreviated = {
    renderer: "stacking-offset",
    board: {
        style: "squares-checkered",
        width: 8,
        height: 8,
    },
    legend: {
        A: {
            name: "piece",
            player: 1,
            rotate: 0,
        },
        B: {
            name: "piece",
            player: 2,
            rotate: 0,
        },
    },
    pieces: null,
    isInit: true,
};
if (localStorage.getItem("state") !== null) {
    initialState = JSON.parse(
        localStorage.getItem("state"),
    ) as APRenderRepAbbreviated;
}

export const state = writable(initialState);

state.subscribe((v) => {
    localStorage.setItem("state", JSON.stringify(v));
});
