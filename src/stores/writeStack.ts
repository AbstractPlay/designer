import type { APRenderRepAbbreviated } from "@/schemas/renderModified";
import { writable } from "svelte/store";
import deepclone from "rfdc/default";

let initialState: APRenderRepAbbreviated[] = [];
if (localStorage.getItem("stack") !== null) {
    initialState = JSON.parse(
        localStorage.getItem("stack"),
    ) as APRenderRepAbbreviated[];
}

export const stack = writable(initialState);

stack.subscribe((v) => {
    const newstack = deepclone(v) as APRenderRepAbbreviated[];
    while (newstack.length > 100) {
        newstack.shift();
    }
    localStorage.setItem("stack", JSON.stringify(newstack));
});
