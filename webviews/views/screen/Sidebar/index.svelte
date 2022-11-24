<script lang="ts">
    import { onMount } from "svelte";
    import Loading from "../../component/atom/Loading.svelte";
    import HeaderMenu from "./headerMenu.svelte";
    import HistoryPath from "./historyPath.svelte";
    import NoFolder from "./noFolder.svelte";
    import KeyItem from "./keyItem.svelte";
    import FolderModeMenu from "./folderModeMenu.svelte";

    let isBoot = false;
    let historyPath: {name: string, path: string, outputMode: any, outputType: any[]}[] = [];

    let workspace: any = {};
    let outputMode: any = {};
    let outputType: any[] = [];
    let langs: {
        id: string,
        key: string,
        value: string | {key: string}[], 
        valueType: string, 
        haveChange: boolean, 
        changeBy: string[],
        isCreate: boolean,
        isRemove: boolean,
    }[] = [];
    let keySelect: string[] = [];

    let fileOptions: any[] = [];
    let fileSelect: string | null = null;

    onMount(() => {
        if(!isBoot) {
            setTimeout(() => {
                tsvscode.postMessage({
                    type: "onBoot",
                    value: null
                });

                isBoot = true;
            }, 250);
        }

        window.addEventListener("message", (event) => {
            const data = event.data;

            switch(data.type){
                case "updateHistoryPath": {
                    historyPath = data.value;
                    break;
                }
                case "updateWorkspace": {
                    workspace = data.value.workspace;
                    outputMode = data.value.outputMode;
                    outputType = data.value.outputType;

                    langs = data.value.keys;
                    keySelect = data.value.keySelect ?? [];

                    fileOptions = data.value.fileOptions ?? [];
                    fileSelect = data.value.fileSelect ?? null;
                    break;
                }
                case "updateKeyValues": {
                    langs = data.value;
                    break;
                }
                case "updateKeySelect": {
                    if(!Array.isArray(data.value)) return;
                    keySelect = data.value;
                    break;
                }
                case "updateFilesOptions": {
                    if(!Array.isArray(data.value)) return;
                    fileOptions = data.value;
                    break;
                }
                case "updateFileSelect": {
                    fileSelect = data.value;
                    break;
                }
            }
        })
    })
</script>

{#if !isBoot}
    <Loading />
{:else}
    {#if Object.keys(workspace).length == 0}
        <NoFolder />

        <HistoryPath paths={historyPath} />
    {:else}
        <div class="pt-5">
            <HeaderMenu keySelect={keySelect} fileSelect={fileSelect} />

            <p>Folder : {workspace.name}</p>
            <p>Mode : {outputMode.modeValue}</p>
            <p>Type : {outputType.map((value) => value.name)}</p>

            <hr class="m-0" />

            {#if outputMode.modeValue == "By folder"}
                <FolderModeMenu
                    bind:fileSelect={fileSelect}
                    keySelect={keySelect}
                    fileOptions={fileOptions}
                />
            {/if}

            {#if langs.length > 0}
                <ul class="nav nav-pills flex-column">
                    {#each langs as lang}
                        <KeyItem
                            lang={lang} 
                            keyPath={[lang.key]}
                            keySelect={keySelect}
                            fileSelect={fileSelect}
                        />
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
{/if}