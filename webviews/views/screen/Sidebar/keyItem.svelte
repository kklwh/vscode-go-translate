<script lang="ts">
    export let lang: {
        id: string, 
        key: string, 
        value: string | {key: string}[], 
        valueType: string, 
        haveChange: boolean, 
        changeBy: string[],
        isCreate: boolean,
        isRemove: boolean,
    };
    export let keyPath: string[];
    export let keySelect: string[];
    export let fileSelect: string | null;
</script>


<li class="nav-item mt-2 pl-2 {lang.isRemove ? "nav-item-remove" : lang.isCreate ? "nav-item-create" : lang.haveChange ? "nav-item-change" : ""}">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <a
        href="/"
        class="nav-link nav-link-white position-relative {keyPath.join("-") == (keySelect.slice(0, keyPath.length)).join("-") ? 'active' : ''}"
        data-bs-toggle="{lang.valueType == "map" ? "collapse" : ""}" 
        data-bs-target="{lang.valueType == "map" ? "#" + keyPath.join("-").replace("@", "_") : ''}" 
        aria-expanded="{lang.valueType == "map" ? false : null }" 
        aria-controls="{lang.valueType == "map" ? keyPath.join("-").replace("@", "_") : ''}" 
        on:click={() => {
            keySelect = keyPath;

            tsvscode.postMessage({
                type: "onLanguageKeySelect",
                value: {
                    keys: keySelect,
                    fileSelect: fileSelect,
                }
            })
        }}
    >
        <div class="item-status {lang.isRemove ? "item-remove" : lang.isCreate ? "item-create" : lang.haveChange ? "item-change" : ""}" />
        {lang.key}
    </a>

    {#if lang.valueType == "map" && Array.isArray(lang.value)}
        <div class="collapse" id="{keyPath.join("-").replace("@", "_")}">
            <ul class="nav nav-pills flex-column mb-auto">
                {#each lang.value as nestLang}
                    <svelte:self
                        lang={nestLang}
                        keyPath={[...keyPath, nestLang.key]}
                        keySelect={keySelect}
                        fileSelect={fileSelect}
                    />
                {/each}
            </ul>
        </div>
    {/if}
</li>
