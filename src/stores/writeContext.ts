import type { IColourContext } from "@abstractplay/renderer/build/renderers/_base";
import { writable } from "svelte/store";

export const defaultContext: IColourContext = {
    background: "#fff",
    strokes: "#000",
    borders: "#000",
    labels: "#000",
    annotations: "#000",
    fill: "#000",
};

let initialState: IColourContext = {
    background: "#fff",
    strokes: "#000",
    borders: "#000",
    labels: "#000",
    annotations: "#000",
    fill: "#000",
};

if (localStorage.getItem("context") !== null) {
    initialState = JSON.parse(
        localStorage.getItem("context")
    ) as IColourContext;
}

export const colourContext = writable(initialState);

colourContext.subscribe((v) => {
    localStorage.setItem("context", JSON.stringify(v));
});
