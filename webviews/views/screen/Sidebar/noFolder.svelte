<p>No folder selected.</p>

<button class="btn btn-primary w-100" on:click={() => {
    tsvscode.postMessage({
        type: "onOpenFolder",
        value: null,
    })
}}>
    Open Folder
</button>