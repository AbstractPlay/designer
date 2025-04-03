import { writable } from "svelte/store";

let initialState = new Map<string, string>();
if (localStorage.getItem("savedBoards") !== null) {
    initialState = new Map<string, string>(
        JSON.parse(localStorage.getItem("savedBoards")) as [string, string][]
    );
}

export const savedBoards = writable(initialState);

savedBoards.subscribe((v) => {
    localStorage.setItem("savedBoards", JSON.stringify([...v.entries()]));
});
