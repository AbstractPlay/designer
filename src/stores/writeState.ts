import { writable } from "svelte/store";
import type { APRenderRep } from "@abstractplay/renderer";
import { stack } from "./writeStack";
import deepclone from "rfdc/default";
import type { BoardBasic, BoardStyles } from "@abstractplay/renderer/build/schemas/schema";

export type SupportedBoards = Exclude<BoardStyles,
                                        "squares-stacked"|
                                        "pegboard"|
                                        "sowing"|
                                        "conhex-dots"
                                      >
export type BasicBoardModifed = BoardBasic & {
    style: SupportedBoards;
}
export type RenderRepModified = APRenderRep & {
    board: BasicBoardModifed;
    isInit?: boolean;
}

let initialState: RenderRepModified = {
    renderer: "stacking-offset",
    board: {
        style: "squares-checkered",
        width: 8,
        height: 8,
    },
    legend: {
        A: {
            name: "piece",
            colour: 1,
            rotate: 0,
        },
        B: {
            name: "piece",
            colour: 2,
            rotate: 0,
        },
    },
    pieces: null,
    isInit: true,
};
if (localStorage.getItem("state") !== null) {
    initialState = JSON.parse(
        localStorage.getItem("state"),
    ) as RenderRepModified;
}

export const state = writable(initialState);

state.subscribe((v) => {
    localStorage.setItem("state", JSON.stringify(v));
    stack.update((s) => [...deepclone(s), v]);
});
