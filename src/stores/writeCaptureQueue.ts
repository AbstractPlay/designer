import { writable } from "svelte/store";

export type CaptureQueue = string[];

export let initialState: CaptureQueue = [];

if (localStorage.getItem("captureQueue") !== null) {
    initialState = JSON.parse(
        localStorage.getItem("captureQueue")
    ) as CaptureQueue;
}

export const capQ = writable(initialState);

capQ.subscribe((v) => {
    localStorage.setItem("captureQueue", JSON.stringify(v));
});
