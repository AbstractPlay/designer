import { writable } from "svelte/store";

let initialState = new Map<string, string>();
if (localStorage.getItem("dicePresets") !== null) {
    initialState = new Map<string, string>(
        JSON.parse(localStorage.getItem("dicePresets")) as [string, string][]
    );
}

export const dicePresets = writable(initialState);

dicePresets.subscribe((v) => {
    localStorage.setItem("dicePresets", JSON.stringify([...v.entries()]));
});

export const MAX_DICE_PRESETS = 24;
