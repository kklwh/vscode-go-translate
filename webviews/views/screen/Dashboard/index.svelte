<script lang="ts">
    import { onMount } from "svelte";
    import ButtonMenu from "./buttonMenu.svelte";

    let isBoot = false;
    let keys: string[] = [];
    let valueType: string = "string";
    let languageValues: {language: string, value: string | {}[], valueType: string, fileType: string, isChanged: boolean, isRemoved: boolean}[] = [];
    let fileSelect: string | null = null;

    onMount(() => {
        if(!isBoot && keys.length == 0) {
            setTimeout(() => {
                tsvscode.postMessage({
                    type: "onBoot",
                    value: null
                });

                isBoot = true;
            }, 0);
        }

        window.addEventListener("message", (event) => {
            const data = event.data;

            switch(data.type){
                case "onSelectChange": {
                    keys = data.keys;
                    fileSelect = data.fileSelect;
                    valueType = data.valueType;
                    languageValues = data.value;
                    break;
                }
            }
        })
    })
</script>

<body class="pt-4">
    {#if keys.length > 0}
        <h2>Key: {keys.join(" > ")}</h2>

        <ButtonMenu keys={keys} valueType={valueType} fileSelect={fileSelect} isRemoved={languageValues.length > 0 ? languageValues[0].isRemoved : false}/>

        {#each languageValues as languageValue}
            <div>
                <label class="form-label" for="keyValue-{languageValue.language}">{languageValue.language}: </label>
                <div class="row w-100">
                    <div class="col-10">
                        <input class="form-control" name="keyValue-{languageValue.language}" bind:value="{languageValue.value}" disabled={languageValue.isRemoved} on:input={() => {
                            tsvscode.postMessage({
                                type: "onUpdateLanguageValue",
                                value: {
                                    language: languageValue.language,
                                    keys: keys,
                                    value: languageValue.value,
                                    fileSelect: fileSelect
                                },
                            });
                        }} />
                    </div>
                    
                    <div class="col-2">
                        <button class="btn btn-danger" disabled={languageValue.isRemoved} title="Delete language" alt="Delete language" on:click={() => {
                            tsvscode.postMessage({
                                type: "onRemoveLanguageFile",
                                value: {
                                    langauge: languageValue.language,
                                    keys: keys,
                                    fileSelect: fileSelect,
                                }
                            })
                        }}>
                            <i class="bi bi-trash" />
                        </button>
                    </div>
                </div>
            </div>
        {/each}
    {/if}
</body>