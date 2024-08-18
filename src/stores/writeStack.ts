import { writable } from "svelte/store";
import type { RenderRepModified } from "./writeState";
import deepclone from "rfdc/default";

let initialState: RenderRepModified[] = [];
if (localStorage.getItem("stack") !== null) {
    initialState = JSON.parse(
        localStorage.getItem("stack")
    ) as RenderRepModified[];
}

export const stack = writable(initialState);

stack.subscribe((v) => {
    const newstack = deepclone(v) as RenderRepModified[];
    while (newstack.length > 100) {
        newstack.shift();
    }
    localStorage.setItem("stack", JSON.stringify(newstack));
});
