import { ExtensionContext } from "vscode";

export default class StateManager {
    constructor(private readonly context: ExtensionContext) {}

    read(key: string) {
        return this.context.workspaceState.get(key);
    }

    async write(key: string, newState: any) {
        await this.context.workspaceState.update(key, newState);
    }

    readPersist(key: string) {
        return this.context.globalState.get(key);
    }

    async writePersist(key: string, newState: any) {
        await this.context.globalState.update(key, newState);
    }
}