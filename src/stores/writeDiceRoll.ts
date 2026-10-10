import { get, writable } from "svelte/store";
import type { APDesignerClientMessages } from "#/schemas/messages";
import { peers } from "#/stores/writePeers";
import { haveToken } from "#/stores/writeToken";
import { myName } from "#/stores/writeMyName";

export const DICE_HISTORY_MAX = 5;

export type DiceRollEvent = {
    notation: string;
    total: number;
    values: (number | string)[];
    roller?: string;
};

export const diceRollHistory = writable<DiceRollEvent[]>([]);

export function applyDiceRoll(event: DiceRollEvent) {
    diceRollHistory.update((history) =>
        [event, ...history].slice(0, DICE_HISTORY_MAX)
    );
}

export function latestDiceRoll(): DiceRollEvent | undefined {
    return get(diceRollHistory)[0];
}

export function diceRollMessageFromEvent(
    event: DiceRollEvent
): Extract<APDesignerClientMessages, { type: "diceRoll" }> {
    return {
        type: "diceRoll",
        notation: event.notation,
        total: event.total,
        values: event.values,
        roller: event.roller,
    };
}

export function broadcastDiceRoll(event: DiceRollEvent) {
    if (!get(haveToken)) {
        return;
    }
    const peerList = get(peers);
    if (peerList.length === 0) {
        return;
    }
    const msg = diceRollMessageFromEvent({
        ...event,
        roller: event.roller ?? get(myName),
    });
    for (const p of peerList) {
        p.connection.send(msg);
    }
}

export function recordAndBroadcastDiceRoll(
    event: Omit<DiceRollEvent, "roller"> & { roller?: string }
) {
    const full: DiceRollEvent = {
        ...event,
        roller: event.roller ?? get(myName),
    };
    applyDiceRoll(full);
    broadcastDiceRoll(full);
}
