import { writable } from "svelte/store";

export type ValidOption =
    | "hide-labels"
    | "hide-labels-half"
    | "hide-star-points"
    | "no-border"
    | "reverse-letters"
    | "reverse-numbers"
    | "swap-labels";

const STORAGE_KEY = "rendererOptions";

const isValidOption = (value: unknown): value is ValidOption =>
    typeof value === "string" &&
    [
        "hide-labels",
        "hide-labels-half",
        "hide-star-points",
        "no-border",
        "reverse-letters",
        "reverse-numbers",
        "swap-labels",
    ].includes(value);

let initialState: ValidOption[] = [];
if (localStorage.getItem(STORAGE_KEY) !== null) {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(parsed)) {
        initialState = parsed.filter(isValidOption);
    }
} else if (localStorage.getItem("state") !== null) {
    const state = JSON.parse(localStorage.getItem("state")) as {
        options?: unknown;
    };
    if (Array.isArray(state.options)) {
        initialState = state.options.filter(isValidOption);
    }
}

export const rendererOptions = writable(initialState);

rendererOptions.subscribe((v) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
});
