<script lang="ts">
    export let keySelect: string[];
    export let fileSelect: string | null;
</script>

<div class="fixed-top headermenu">
    <div class="row">
        <button class="col btn" title="Open folder" alt="Open folder" on:click={() => {
            tsvscode.postMessage({
                type: "onOpenFolder",
                value: null,
            })
        }}>
            <i class="bi bi-folder2-open" />
        </button>

        <button class="col btn" title="Save" alt="Save" on:click={() => {
            tsvscode.postMessage({
                type: "onSaveFiles",
                value: {
                    fileSelect: fileSelect,
                },
            })
        }}>
            <i class="bi bi-save" />
        </button>

        <button class="col btn" title="Add new language" alt="Add new language" on:click={() => {
            tsvscode.postMessage({
                type: "onAddLanguage",
                value: {
                    keySelect,
                    fileSelect,
                },
            })
        }}>
            <i class="bi bi-translate" />
        </button>

        <button class="col btn" title="Add new key" alt="Add new key" on:click={() => {
            tsvscode.postMessage({
                type: "onAddNewKey",
                value: {
                    keySelect,
                    fileSelect,
                }
            })
        }}>
            <i class="bi bi-key" />
        </button>
    </div>

    <hr class="m-0" />
</div>
