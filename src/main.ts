import "./app.css";
import "./stores/writeState";
import "./stores/writeStack";
import App from "./App.svelte";

const app = new App({
    target: document.getElementById("app"),
});

export default app;
