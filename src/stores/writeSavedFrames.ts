import { writable } from "svelte/store";

let initialState = new Map<string, string>();
if (localStorage.getItem("savedFrames") !== null) {
    initialState = new Map<string, string>(
        JSON.parse(localStorage.getItem("savedFrames")) as [string, string][]
    );
}

export const savedFrames = writable(initialState);

savedFrames.subscribe((v) => {
    localStorage.setItem("savedFrames", JSON.stringify([...v.entries()]));
});
