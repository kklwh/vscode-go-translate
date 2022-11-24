import { ExtensionContext, WebviewViewProvider } from "vscode";
import { printErr } from "../helper/log";
import StateManager from "../helper/stateManager";
import { SidebarProvider } from "./SidebarProvider";


export function getWebviewProviders(context: ExtensionContext, globalState: StateManager): Map<string, WebviewViewProvider> {
	try{
        return new Map([
            ["go-translate.sidebar"  , new SidebarProvider(context, globalState)],
        ]);

	}catch(e){
		printErr((e as Error).message);
        return new Map();
	}
}
