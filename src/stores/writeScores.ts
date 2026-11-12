import { get, writable } from "svelte/store";
import type { APDesignerClientMessages } from "#/schemas/messages";
import { peers } from "#/stores/writePeers";
import { haveToken } from "#/stores/writeToken";

export type ScoreRow = {
    id: string;
    label: string;
    value: number;
};

export const MAX_SCORE_ROWS = 24;

const STORAGE_KEY = "playScores";

function readInitialScores(): ScoreRow[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw) as ScoreRow[];
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter(
            (row) =>
                typeof row?.id === "string" &&
                typeof row?.label === "string" &&
                typeof row?.value === "number"
        );
    } catch {
        return [];
    }
}

export const playScores = writable<ScoreRow[]>(readInitialScores());

playScores.subscribe((rows) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
});

export function applyPlayScores(rows: ScoreRow[]) {
    playScores.set(rows);
}

export function scoresReplaceMessageFromRows(
    rows: ScoreRow[]
): Extract<APDesignerClientMessages, { type: "scoresReplace" }> {
    return {
        type: "scoresReplace",
        rows: rows.map((r) => ({
            id: r.id,
            label: r.label,
            value: r.value,
        })),
    };
}

export function broadcastPlayScores(rows?: ScoreRow[]) {
    if (!get(haveToken)) {
        return;
    }
    const peerList = get(peers);
    if (peerList.length === 0) {
        return;
    }
    const snapshot = rows ?? get(playScores);
    const msg = scoresReplaceMessageFromRows(snapshot);
    for (const p of peerList) {
        p.connection.send(msg);
    }
}

export function mutatePlayScores(updater: (rows: ScoreRow[]) => ScoreRow[]) {
    let next: ScoreRow[] = [];
    playScores.update((rows) => {
        next = updater(rows);
        return next;
    });
    broadcastPlayScores(next);
}
