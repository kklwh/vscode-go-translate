import { ExtensionContext } from "vscode";
import { printErr } from "../helper/log";
import StateManager from "../helper/stateManager";
import start from "./start";
import openFolder from "./openFolder";
import saveFile from "./saveFile";


export function getCommands(context: ExtensionContext, globalState: StateManager): Map<string, (args: any) => Promise<any>> {
	try{
        return new Map([
            ["go-translate.openFolder"  , (args: any) => openFolder(context, globalState, args)],
            ["go-translate.start"       , (args: any) => start(context, globalState, args)],
            ["go-translate.saveFile"    , (args: any) => saveFile(context, globalState, args)],
        ]);

	}catch(e){
		printErr((e as Error).message);
        return new Map();
	}
}
