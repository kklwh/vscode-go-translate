<script lang="ts">
    export let keys: string[];
    export let fileSelect: string | null = null;
    export let valueType: string;
    export let isRemoved: boolean;
</script>

<div>
    <hr class="my-2" />

    <div class="btn-group my-2" role="group" aria-label="actionBtns">
        <button class="btn btn-danger mx-2" disabled={isRemoved} on:click={() => {
            tsvscode.postMessage({
                type: "onChangeValueType",
                value: {
                    keys: keys,
                    valueType: valueType == "map" ? "string": "map",
                    fileSelect: fileSelect,
                },
            })
        }}>
            {#if valueType == "map"}
                To string
            {:else}
                To map
            {/if}
        </button>

        {#if valueType == "map"}
            <button class="btn btn-danger mx-2" disabled={isRemoved} on:click={() => {
                tsvscode.postMessage({
                    type: "onAddNewKey",
                    value: {
                        keys: keys,
                        fileSelect: fileSelect,
                    },
                })
            }}>
                Add New Key
            </button>
        {/if}

        <button class="btn btn-danger mx-2" disabled={isRemoved} title="Rename key" alt="Rename key"  on:click={() => {
            tsvscode.postMessage({
                type: "onRenameKey",
                value: {
                    keys: keys,
                    fileSelect: fileSelect,
                },
            })
        }}>
            <i class="bi bi-pencil" />
        </button>

        <button class="btn btn-danger mx-2" disabled={isRemoved} title="Delete key" alt="Delete key" on:click={() => {
            tsvscode.postMessage({
                type: "onDeleteKey",
                value: {
                    keys: keys,
                    fileSelect: fileSelect,
                },
            })
        }}>
            <i class="bi bi-trash" />
        </button>
    </div>

    <hr class="my-2" />
</div>
