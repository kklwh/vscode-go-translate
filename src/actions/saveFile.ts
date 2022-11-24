import { ExtensionContext } from "vscode";
import { constructFilePath, removeFolder } from "../helper/file";
import { filterFilesByOutputTypeAndMode } from "../helper/lang";
import { printErr, printInfo } from "../helper/log";
import StateManager from "../helper/stateManager";
import { GoFolder } from "../model/goFolder";
import { GoSetting } from "../model/goSetting";


export default async function saveFile(context: ExtensionContext, globalState: StateManager, args: any): Promise<any> {
	try{
		const workspaceRead = globalState.read("workspace");

        if (workspaceRead == undefined || workspaceRead == null) return;

		const workspace = workspaceRead as GoFolder;
		const files = workspace.getFiles();

		const fileIndexRemove: number[] = [];

		for(const i in files){
			if(GoSetting.getOutputType().find((type) => type.getSuffix() == files[i].getFileType().getSuffix()) == undefined) continue;
			if(files[i].isFileRemoved()) fileIndexRemove.unshift(Number.parseInt(i));

			files[i].updateFile(workspace.getUri(), GoSetting.getOutputMode(), GoSetting.getOutputType());
			files[i].removeDeleteLang();

			// remove folder when folder no any file
			// when id is same will check files[i] is not remove
			if(files.filter((file) => 
				file.getId() == files[i].getId() 
				? !file.isFileRemoved()
				:file.getLanguageType().getName() == files[i].getLanguageType().getName() && !file.isFileRemoved()).length == 0
			){
				removeFolder(constructFilePath(workspace.getUri(), files[i].getLanguageType().getName()));
			}
		}

		for(const i of fileIndexRemove){
			workspace.getFiles().splice(i, 1);
		}

		printInfo("Save file successfully");

	}catch(e){
		printErr((e as Error).message);
	}
}
