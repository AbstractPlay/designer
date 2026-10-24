import { derived, get, writable } from "svelte/store";
import type { RenderRepModified } from "./writeState";
import { state } from "./writeState";
import deepclone from "nanoclone";

const STACK_MAX = 100;

let initialStack: RenderRepModified[] = [];
if (localStorage.getItem("stack") !== null) {
    initialStack = JSON.parse(
        localStorage.getItem("stack")
    ) as RenderRepModified[];
}

let initialRedo: RenderRepModified[] = [];
if (localStorage.getItem("stackRedo") !== null) {
    initialRedo = JSON.parse(
        localStorage.getItem("stackRedo")
    ) as RenderRepModified[];
}

export const stack = writable(initialStack);
export const redo = writable(initialRedo);

const snapshotKey = (v: RenderRepModified) => JSON.stringify(v);

const trimForStorage = (v: RenderRepModified[]) => {
    const copy = deepclone(v) as RenderRepModified[];
    while (copy.length > STACK_MAX) {
        copy.shift();
    }
    return copy;
};

stack.subscribe((v) => {
    localStorage.setItem("stack", JSON.stringify(trimForStorage(v)));
});

redo.subscribe((v) => {
    localStorage.setItem("stackRedo", JSON.stringify(trimForStorage(v)));
});

export const canUndo = derived(stack, ($stack) => $stack.length > 1);
export const canRedo = derived(redo, ($redo) => $redo.length > 0);

let applyingHistory = false;

export function setStateFromHistory(v: RenderRepModified) {
    applyingHistory = true;
    state.set(v);
    applyingHistory = false;
}

const pushStack = (s: RenderRepModified[], v: RenderRepModified) => {
    const next = [...deepclone(s), v];
    while (next.length > STACK_MAX) {
        next.shift();
    }
    return next;
};

/** Skip consecutive identical snapshots (e.g. reload echo or mutate + reassign). */
const appendIfChanged = (
    s: RenderRepModified[],
    v: RenderRepModified
): RenderRepModified[] => {
    if (s.length > 0 && snapshotKey(s[s.length - 1]) === snapshotKey(v)) {
        return s;
    }
    return pushStack(s, v);
};

let historyBootstrapped = false;

state.subscribe((v) => {
    if (applyingHistory) {
        return;
    }
    redo.set([]);
    stack.update((s) => {
        if (!historyBootstrapped) {
            historyBootstrapped = true;
            if (s.length === 0) {
                return pushStack(s, v);
            }
            if (snapshotKey(s[s.length - 1]) === snapshotKey(v)) {
                return s;
            }
        }
        return appendIfChanged(s, v);
    });
});

const stackSyncedForUndo = (s: RenderRepModified[]) => {
    const live = get(state);
    return appendIfChanged(s, live);
};

export function undoHistory() {
    const synced = stackSyncedForUndo(get(stack));
    if (synced.length < 2) {
        stack.set(synced);
        return;
    }
    const current = synced[synced.length - 1];
    const previous = synced[synced.length - 2];
    stack.set(synced.slice(0, -1));
    redo.update((r) => appendIfChanged(r, current));
    setStateFromHistory(deepclone(previous) as RenderRepModified);
}

export function redoHistory() {
    const r = get(redo);
    if (r.length === 0) {
        return;
    }
    const next = r[r.length - 1];
    redo.set(r.slice(0, -1));
    stack.update((s) => appendIfChanged(s, next));
    setStateFromHistory(deepclone(next) as RenderRepModified);
}

export function clearHistoryStacks() {
    stack.set([]);
    redo.set([]);
}
