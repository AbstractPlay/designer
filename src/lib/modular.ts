import { defineHex, Orientation } from "honeycomb-grid";
import type { BoardBasic, RowCol } from "@abstractplay/renderer/build/schemas/schema";

export interface IHexCoord {
    q: number;
    r: number;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const shuffle = (lst: Array<any>): Array<any> => {
    const working = [...lst];
    let remaining = working.length;

    // While there remain elements to shuffle…
    while (remaining) {

        // Pick a remaining element…
        const randomIdx = Math.floor(Math.random() * remaining--);

        // And swap it with the current element.
        const t = working[remaining];
        working[remaining] = working[randomIdx];
        working[randomIdx] = t;
    }

    return working;
}

class MyHex extends defineHex({ offset: 1, orientation: Orientation.POINTY }) {
    public get uid(): string {
        return `${this.q},${this.r}`;
    }

    public get col(): number {
        // eslint-disable-next-line no-bitwise
        return this.q + (this.r + (this.r & 1)) / 2;
    }

    public get row(): number {
        return this.r;
    }

    static create(args: {q: number; r: number;}) {
        const hex = new MyHex({q: args.q, r: args.r});
        return hex;
    }
}

export const generateField = (numModules: number): BoardBasic => {
    const around = (q: number, r: number): [number,number][] => {
        return [
            [q+1, r-1],
            [q+1, r],
            [q, r+1],
            [q-1, r+1],
            [q-1, r],
            [q, r-1],
        ];
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const selectCtr = (ctrs: Set<string>, filled: Set<string>): [number,number] => {
        const chooseFrom = shuffle([...ctrs.values()].map(c => c.split(",").map(n => parseInt(n, 10)))) as [number,number][];
        // for each known ctr, select one at random until one works
        for (const [q, r] of chooseFrom) {
            // make list of valid pts from ctr
            const nexts: [number,number][] = shuffle([
                [q+3, r-2], [q+3, r-1],
                [q+2, r+1], [q+1, r+2],
                [q-1, r+3], [q-2, r+3],
                [q-3, r+2], [q-3, r+1],
                [q-2, r-1], [q-1, r-2],
                [q+1, r-3], [q+2, r-3],
            ]) as [number,number][];
            // pick a random next until one works
            for (const [nq, nr] of nexts) {
                if (filled.has(`${nq},${nr}`)) { continue; }
                const neighbours = around(nq, nr);
                let overlaps = false;
                for (const [nnq, nnr] of neighbours) {
                    if (filled.has(`${nnq},${nnr}`)) {
                        overlaps = true;
                        break;
                    }
                }
                if (overlaps) { continue; }
                return [nq, nr];
            }
        }
        // should always find *something*
        throw new Error("Could not find a next centre point.");
    }

    const hexes: MyHex[] = [];
    const ctrs = new Set<string>();
    const filled = new Set<string>();
    ctrs.add("0,0");
    const originHex = MyHex.create({q: 0, r: 0});
    hexes.push(originHex);
    for (const [nq, nr] of around(0, 0)) {
        filled.add(`${nq},${nr}`);
        hexes.push(MyHex.create({q: nq, r: nr}));
    }
    for (let i = 0; i < numModules - 1; i++) {
        const [newq, newr] = selectCtr(ctrs, filled);
        ctrs.add(`${newq},${newr}`);
        hexes.push(MyHex.create({q: newq, r: newr}));
        for (const [nq, nr] of around(newq, newr)) {
            filled.add(`${nq},${nr}`);
            hexes.push(MyHex.create({q: nq, r: nr}));
        }
    }

    const minx = Math.min(...hexes.map(h => h.col));
    const maxx = Math.max(...hexes.map(h => h.col));
    const miny = Math.min(...hexes.map(h => h.row));
    const maxy = Math.max(...hexes.map(h => h.row));
    const width = maxx - minx + 1;
    const height = maxy - miny + 1;
    const oRow = Math.abs(miny - originHex.row)

    const blocked: RowCol[] = [];
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const [absCol, absRow] = [minx + col, miny + row];
            const hex = hexes.find(h => h.col === absCol && h.row === absRow);
            if (hex === undefined) {
                blocked.push({row, col})
            }
        }
    }

    return {
        style: oRow % 2 === 0 ? "hex-even-p" : "hex-odd-p",
        width,
        height,
        blocked: blocked as [{row: number; col: number},...{row: number; col: number}[]],
    };
}