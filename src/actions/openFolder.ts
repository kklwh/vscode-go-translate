import { ExtensionContext, window } from "vscode";
import { storeHistoryPath } from "../helper/historyPath";
import { printErr } from "../helper/log";
import StateManager from "../helper/stateManager";
import { GoFileType } from "../model/goFileType";
import { GoFolder } from "../model/goFolder";
import { GoOutputMode } from "../model/goOutputMode";
import { GoSetting } from "../model/goSetting";


export default async function openFolder(context: ExtensionContext, globalState: StateManager, args: any): Promise<any> {
    try{
        if(args == undefined || args == null){
            throw new Error("Cannot use in command mode")
        };

        const folderSelect = await window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: false,
            canSelectFolders: true,
            // defaultUri: context
        });

        // if no select folder
        if(folderSelect == null || folderSelect.length != 1) {
            // globalState.write("workspace", null);
            return;
        }

        // get folder path and create workspace
        const path = folderSelect[0].fsPath;

        const delimiterIndex = path.lastIndexOf("\\") + 1;
        const folderName = path.substring(delimiterIndex, path.length);

        const workspace = new GoFolder(folderName, path);

        // get output mode
        const modeSelect = await selectOutputMode(
            GoOutputMode.getDefaultMode().map((value) => value.getMode()),
            "Output mode",
            "Please select output mode",
        );

        // get output file type 
        const fileTypeSelect = await selectOutputFileType(
            GoFileType.getDefaultFileType().map((value) => value.getName()),
            "Output file type",
            "Please select output file type",
        );

        GoSetting.setOutputMode(modeSelect);
        GoSetting.setOutputType([fileTypeSelect]);
        
        workspace.loadFiles(GoSetting.getOutputMode());
        workspace.loadFilesContant(GoSetting.getOutputMode(), GoSetting.getOutputType());
        workspace.solveMissingKey(GoSetting.getOutputMode(), GoSetting.getOutputType());
        
        if(workspace.getFiles().filter((file) => file.getFileType().getSuffix() == GoSetting.getOutputType()[0].getSuffix()).length == 0){
            workspace.createDefaultFile(GoSetting.getOutputMode(), GoSetting.getOutputType()[0]);
        }

        globalState.write("workspace", workspace);
        globalState.write("fileSelected", null);
        globalState.write("keySelected", null);
        
        storeHistoryPath(globalState, workspace.getName(), workspace.getUri(), GoSetting.getOutputMode(), GoSetting.getOutputType());

    }catch(e){
        printErr((e as Error).message);
    }
}

async function selectOutputMode(items: string[], title: string, placeholder: string = ""): Promise<GoOutputMode> {
    const modeSelectStr = await window.showQuickPick(items, {
        title: title,
        placeHolder: placeholder,
    });

    if (!modeSelectStr) throw new Error("Please select output mode.");

    return GoOutputMode.getDefaultMode().find((value) => value.getMode() == modeSelectStr)!;
}

async function selectOutputFileType(items: string[], title: string, placeholder: string = ""): Promise<GoFileType> {
    const fileTypeSelectStr = await window.showQuickPick(items, {
        title: title,
        placeHolder: placeholder,
    });

    if (!fileTypeSelectStr) throw new Error("Please select output file type.");

    return GoFileType.getDefaultFileType().find((value) => value.getName() == fileTypeSelectStr)!;
}
