<script lang="ts">
    export let keySelect: string[];
    export let fileOptions: any[];
    export let fileSelect: string | null;
</script>

<h5 class="mt-2 text-center">File Menu</h5>

<div class="row mt-2">
    <button class="col btn" title="Create new file" alt="Create new file" on:click={() => {
        tsvscode.postMessage({
            type: "onAddNewFolderFile",
            value: {
                keys: keySelect,
                fileSelect: fileSelect,
            },
        })
    }}>
        <i class="bi bi-file-earmark-plus" />
    </button>
    
    <button class="col btn" title="Rename file" alt="Rename file" on:click={() => {
        tsvscode.postMessage({
            type: "onRenameFolderFile",
            value: {
                keys: keySelect,
                fileSelect: fileSelect,
            },
        })
    }}>
        <i class="bi bi-pencil-square" />
    </button>
    
    <button class="col btn" title="Delete file" alt="Delete file" on:click={() => {
        tsvscode.postMessage({
            type: "onDeleteFolderFile",
            value: {
                keys: keySelect,
                fileSelect: fileSelect,
            },
        })
    }}>
        <i class="bi bi-file-earmark-excel" />
    </button>
</div>

<select class="form-select my-3" bind:value={fileSelect} on:change={() => {
    tsvscode.postMessage({
        type: "onChangeFileSelect",
        value: {
            keys: keySelect,
            fileSelect: fileSelect,
        },
    })
}}>
    {#each fileOptions as file}
        <option value={file.name}>{file.name}</option>
    {/each}
</select>

<hr class="m-0" />
