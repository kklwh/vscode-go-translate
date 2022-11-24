<script lang="ts">
    export let paths: {name: string, path: string, outputMode: any, outputType: any[]}[];
</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
{#each paths as path}
    <hr />

    <div class="card text-white bg-dark p-0" on:click={() => {
        tsvscode.postMessage({
            type: "onHistoryPathSelect",
            value: path,
        })
    }}>
        <div class="card-header p-1">{path.name} (folder)</div>
        <div class="card-body p-1">{path.outputMode.modeKey} (mode)</div>
        <div class="card-body p-1">{path.outputType.map(value => value.suffix).join(", ")} (output)</div>
        <div class="card-body p-1">
          <p class="text-muted p-0">{path.path}</p>
        </div>
    </div>
{/each}