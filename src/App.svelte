<script lang="ts">
    import logo from "./assets/AbstractPlayLogo.svg";
    import Intro from "./components/Intro.svelte";
    import Board from "./components/Board.svelte";
    import Pieces from "./components/Pieces.svelte";
    import Json from "./components/Json.svelte";
    import Play from "./components/Play.svelte";

    let activeTab: "intro" | "board" | "pieces" | "play" | "json" = "intro";
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
    </div>
    <div class="tabs is-boxed">
        <ul>
            <li class="{activeTab === 'intro' ? 'is-active' : ''}">
                <a on:click="{() => (activeTab = 'intro')}" href="{'#'}"
                    >Introduction</a
                >
            </li>
            <li class="{activeTab === 'board' ? 'is-active' : ''}">
                <a on:click="{() => (activeTab = 'board')}" href="{'#'}"
                    >Board</a
                >
            </li>
            <li class="{activeTab === 'pieces' ? 'is-active' : ''}">
                <a on:click="{() => (activeTab = 'pieces')}" href="{'#'}"
                    >Pieces</a
                >
            </li>
            <li class="{activeTab === 'play' ? 'is-active' : ''}">
                <a on:click="{() => (activeTab = 'play')}" href="{'#'}">Play</a>
            </li>
            <li class="{activeTab === 'json' ? 'is-active' : ''}">
                <a on:click="{() => (activeTab = 'json')}" href="{'#'}">JSON</a>
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
