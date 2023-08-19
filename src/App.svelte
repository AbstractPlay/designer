<script lang="ts">
    import logo from "./assets/AbstractPlayLogo.svg";
    import Intro from "./components/Intro.svelte";
    import Board from "./components/Board.svelte";
    import Pieces from "./components/Pieces.svelte";
    import Json from "./components/Json.svelte";
    import Play from "./components/Play.svelte";
    import Status from "./components/Status.svelte";
    import PeerList from "./components/PeerList.svelte";

    let activeTab: "intro" | "board" | "pieces" | "play" | "json" = "intro";
    const handleClick = (e: MouseEvent|TouchEvent, key: "intro" | "board" | "pieces" | "play" | "json") => {
        e.preventDefault();
        activeTab = key;
        return false;
    }
</script>

<main class="container p-6">
    <div class="level">
        <div class="level-left">
            <div class="level-item">
                <img
                    src="{logo}"
                    class="logo svelte"
                    alt="Abstract Play Logo"
                />
            </div>
        </div>
        <div class="level-right">
            <div class="level-item">
                <div>
                    <p class="title">Game Designer</p>
                    <div>
                        <p class="subtitle">Version: {__APP_VERSION__}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <Status />
    <PeerList />

    <div class="tabs is-boxed">
        <ul>
            <li class="{activeTab === 'intro' ? 'is-active' : ''}">
                <a on:click="{(e) => handleClick(e, "intro")}"> Introduction </a>
            </li>
            <li class="{activeTab === 'board' ? 'is-active' : ''}">
                <a on:click="{(e) => handleClick(e, "board")}"> Board </a>
            </li>
            <li class="{activeTab === 'pieces' ? 'is-active' : ''}">
                <a on:click="{(e) => handleClick(e, "pieces")}"> Pieces </a>
            </li>
            <li class="{activeTab === 'play' ? 'is-active' : ''}">
                <a on:click="{(e) => handleClick(e, "play")}"> Play </a>
            </li>
            <li class="{activeTab === 'json' ? 'is-active' : ''}">
                <a on:click="{(e) => handleClick(e, "json")}"> JSON </a>
            </li>
        </ul>
    </div>
    {#if activeTab === "intro"}
        <Intro />
    {:else if activeTab === "board"}
        <Board />
    {:else if activeTab === "pieces"}
        <Pieces />
    {:else if activeTab === "play"}
        <Play />
    {:else if activeTab === "json"}
        <Json />
    {/if}
</main>

<style>
    .logo {
        height: 8em;
        padding: 1.5em;
    }
</style>
