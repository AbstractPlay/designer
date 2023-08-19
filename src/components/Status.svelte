<script lang="ts">
    import { myName } from "@/stores/writeMyName";
    import { peer } from "@/stores/writePeerObj";
    import { peers } from "@/stores/writePeers";
    import type { PeerRecord } from "@/stores/writePeers";
    import type { DataConnection } from "peerjs";
    import type { APDesignerClientMessages } from "@/schemas/messages";
    import { state } from "@/stores/writeState";
    import { haveToken } from "@/stores/writeToken";
    import type { APRenderRepAbbreviated } from "@/schemas/renderModified";
    import { onMount } from "svelte";

    let remotePeer: string;
    const joinClick = () => {
        joinPeer(remotePeer);
        remotePeer = "";
        $haveToken = false;
    };
    const joinPeer = (peerid: string) => {
        const conn = $peer.connect(peerid);
        conn.on("open", () => peers.update((lst) => updatePeers(lst, conn)));
    };

    const updatePeers = (
        lst: PeerRecord[],
        conn: DataConnection,
    ): PeerRecord[] => {
        // Update the actual list of peers
        const idx = lst.findIndex((rec) => rec.id === conn.peer);
        const newlst = [...lst];
        if (idx < 0) {
            const newrec: PeerRecord = {
                id: conn.peer,
                connection: conn,
                locked: false,
            };
            newlst.push(newrec);
        }

        // Add handlers
        conn.on("data", (data) =>
            handleMsg(data as APDesignerClientMessages, conn.peer),
        );
        conn.on("close", () => {
            peers.update((lst) => deletePeer(lst, conn.peer));
        });

        // Now broadcast your display name
        let msg: APDesignerClientMessages = {
            type: "display",
            name: $myName,
        };
        for (const p of newlst) {
            p.connection.send(msg);
        }

        // Share list of peers
        const idlst = newlst.map((rec) => rec.id);
        msg = {
            type: "peers",
            peers: [...idlst],
        };
        for (const p of newlst) {
            p.connection.send(msg);
        }

        // Share game object with connecting player if you have the token
        if ($haveToken) {
            msg = {
                type: "gameReplace",
                game: JSON.stringify($state),
            };
            conn.send(msg);
        }

        return newlst;
    };

    const deletePeer = (lst: PeerRecord[], peerid: string): PeerRecord[] => {
        const idx = lst.findIndex((rec) => rec.id === peerid);
        if (idx !== -1) {
            lst.splice(idx, 1);
        }
        if (lst.length === 0) {
            $haveToken = true;
        }
        return [...lst];
    };

    let id = "";
    $peer.on("error", (err) => {
        console.error(err);
    });
    $peer.on("open", (givenid) => {
        id = givenid;
    });
    $peer.on("close", () => {
        id = "";
    });
    $peer.on("disconnected", () => {
        id = "";
    });
    $peer.on("connection", (conn) =>
        conn.on("open", () => peers.update((lst) => updatePeers(lst, conn))),
    );

    const sendDirectMsg = (peerid: string, msg: APDesignerClientMessages) => {
        const idx = $peers.findIndex((p) => p.id === peerid);
        if (idx !== -1) {
            $peers[idx].connection.send(msg);
        }
    };

    const handleMsg = (msg: APDesignerClientMessages, peerid: string) => {
        if (!msg.hasOwnProperty("type")) {
            console.error(
                "Malformed message!\nPeer ID: " +
                    peerid +
                    "\nMsg: " +
                    JSON.stringify(msg),
            );
        } else {
            if (msg.type === "display") {
                peers.update((lst) => {
                    const idx = lst.findIndex((rec) => rec.id === peerid);
                    if (idx !== -1 && !lst[idx].locked) {
                        if (msg.name.length === 0 || /^\s+$/.test(msg.name)) {
                            msg.name =
                                "Random" +
                                Math.floor(
                                    Math.random() * 9000 + 1000,
                                ).toString();
                        }
                        lst[idx].alias = msg.name;
                    }
                    return [...lst];
                });
            } else if (msg.type === "peers") {
                for (const p of msg.peers) {
                    if (p === $peer.id) {
                        continue;
                    }
                    const idx = $peers.findIndex((rec) => rec.id === p);
                    if (idx === -1) {
                        joinPeer(p);
                    }
                }
            } else if (msg.type === "askdisplay") {
                const reply: APDesignerClientMessages = {
                    type: "display",
                    name: $myName,
                };
                sendDirectMsg(peerid, reply);
            } else if (msg.type === "gameReplace") {
                $state = JSON.parse(msg.game) as APRenderRepAbbreviated;
            } else if (msg.type === "giveToken") {
                $haveToken = true;
            } else if (msg.type === "takeToken") {
                $haveToken = false;
            } else {
                console.error(
                    "Unrecognized command!\nPeer ID: " +
                        peerid +
                        "\nMsg: " +
                        JSON.stringify(msg),
                );
            }
        }
    };

    const shutdown = () => {
        for (const p of $peers) {
            p.connection.close();
        }
        $peer.destroy();
    };

    let showCode = false;
    let modalShow = "";
    // From StackOverflow: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    const fallbackCopyTextToClipboard = (text: string) => {
        var textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand("copy");
            var msg = successful ? "successful" : "unsuccessful";
            // console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
            // console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
    };

    const copyTextToClipboard = (text: string) => {
        if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(
            function () {
                console.log("Async: Copying to clipboard was successful!");
            },
            function (err) {
                console.error("Async: Could not copy text: ", err);
            },
        );
    };

    onMount(() => {
        state.subscribe((val) => {
            if ($haveToken) {
                const msg = {
                    type: "gameReplace",
                    game: JSON.stringify($state),
                };
                for (const p of $peers) {
                    p.connection.send(msg);
                }
            }
        });
    });
</script>

<svelte:window on:beforeunload="{shutdown}" />

<div class="level">
    <div class="level-left">
        <div class="level-item">
            {#if id.length > 0}
                {#if showCode}
                    <p>
                        Your ID is <code>{id}</code>
                        <a target="_self" on:click="{() => (showCode = false)}"
                            ><span class="clickTarget">(click to hide)</span></a
                        >
                    </p>
                {:else}
                    <p>
                        Connection established <a
                            target="_self"
                            on:click="{() => copyTextToClipboard(id)}"
                            ><span class="clickTarget">(click to copy ID)</span
                            ></a
                        >
                        <a
                            target="_self"
                            on:click="{() => (modalShow = 'is-active')}"
                            ><span class="clickTarget">(click to show ID)</span
                            ></a
                        >
                    </p>
                {/if}
            {:else}
                <p>Connecting to brokering server. Refresh to retry.</p>
            {/if}
        </div>
    </div>
    <div class="level-right">
        <div class="level-item">
            <input
                class="input"
                type="text"
                id="remotePeer"
                placeholder="ID of remote peer"
                bind:value="{remotePeer}"
            />
            <button class="button is-link" on:click="{joinClick}"
                >Connect to remote peer</button
            >
        </div>
    </div>
</div>

<div class="modal {modalShow}" id="confirmShow">
    <div class="modal-background"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Show Code?</p>
        </header>
        <section class="modal-card-body">
            <p>
                Do not show your code if you are streaming. Once the code is
                revealed, anyone on the Internet can then connect to your lobby.
                Use the "copy to clipboard" link instead to share your code with
                friends.
            </p>
        </section>
        <footer class="modal-card-foot">
            <button
                class="button is-success"
                on:click="{() => {
                    showCode = true;
                    modalShow = '';
                }}">Show Code</button
            >
            <button
                class="button"
                on:click="{() => {
                    modalShow = '';
                }}">Cancel</button
            >
        </footer>
    </div>
</div>

<style>
    .clickTarget {
        font-size: smaller;
    }
</style>
