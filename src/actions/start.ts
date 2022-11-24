import { commands, ExtensionContext, window } from "vscode";
import { filterFilesByOutputTypeAndMode, isKeyValid } from "../helper/lang";
import { printErr, printInfo } from "../helper/log";
import StateManager from "../helper/stateManager";
import { GoFile } from "../model/goFile";
import { GoFileType } from "../model/goFileType";
import { GoFolder } from "../model/goFolder";
import { GoLanguage } from "../model/goLanguage";
import { GoOutputMode } from "../model/goOutputMode";
import { GoSetting } from "../model/goSetting";
import { DashboardPanel } from "../panel/DashboardPanel";
import { SidebarProvider } from "../provider/SidebarProvider";


export default async function start(context: ExtensionContext, globalState: StateManager, args: any): Promise<any> {
    try {
        const workspaceRead = globalState.read("workspace");

        if (workspaceRead == undefined || workspaceRead == null) {
            throw new Error("Please select folder first.");
        }

        const workspace = workspaceRead as GoFolder;

        DashboardPanel.createOrShow(context.extensionUri);

        if(!DashboardPanel.isInitDidReceive()){
            DashboardPanel.onDidReceiveMessage(async (data) => {
                try{
                    const workspaceRead = globalState.read("workspace");

                    if (!workspaceRead) throw new Error("Please select folder first.");

                    const workspace = workspaceRead as GoFolder;
                    
                    switch (data.type) {
                        case "onBoot": {
                            let keys: string[] = [];
                            let fileSelect: string | null = null;

                            keys = globalState.read("keySelected") as string[];
                            fileSelect = globalState.read("fileSelected") as string;

                            const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), keys, fileSelect);

                            DashboardPanel.postData({
                                "type": "onSelectChange",
                                "keys": keys,
                                "fileSelect": fileSelect,
                                "valueType": languageValue.length > 0 ? languageValue[0].valueType : 'string',
                                "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
                            });

                            break;
                        }
                        case "onUpdateLanguageValue": {
                            if (!data.value || !data.value.language || !data.value.keys || data.value.value == undefined || data.value.value == null) return;
                            if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;

                            const files = filterFilesByOutputTypeAndMode(
                                workspace.getFiles(),
                                GoSetting.getOutputType(),
                                GoSetting.getOutputMode(),
                                data.value.fileSelect ?? null,
                            );

                            changeValueByMode(files, GoSetting.getOutputMode(), data.value.language, data.value.keys, data.value.value);

                            // for update isOpen, isChange, isRemove
                            SidebarProvider.updateKeyValues(workspace, data.value.fileSelect ?? null);
                            break;
                        }
                        case "onChangeValueType": {
                            if (!data.value || !data.value.keys || !data.value.valueType) return;
                            if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;

                            const keys = data.value.keys;

                            const response = await window.showInformationMessage("Are you sure change to "+ data.value.valueType +" type ?", "Yes", "No");
                            
                            if (response == "Yes") {
                                // filter files that need to change
                                const files = filterFilesByOutputTypeAndMode(
                                    workspace.getFiles(),
                                    GoSetting.getOutputType(),
                                    GoSetting.getOutputMode(),
                                    data.value.fileSelect ?? null,
                                );

                                // change all files value type 
                                for(const file of files){
                                    let langsTemp = file.getLanguages();
                                    let languageFound = null;

                                    // loop to found key value
                                    for(const i in keys){
                                        const language = langsTemp.find((language) => language.getKey() == keys[i]);

                                        if(!language) throw new Error(keys[i] +" key not found");

                                        if(i == (keys.length - 1).toString()){
                                            languageFound = language;

                                        }else{
                                            langsTemp = language.getValue() as GoLanguage[];
                                        }
                                    }

                                    if(!languageFound) continue;

                                    switch(data.value.valueType){
                                        case "string": {
                                            languageFound.setIsStr();
                                            languageFound.setValue("");
                                            languageFound.setOptions({ havaChanged: true});
                                            break;
                                        }
                                        case "map": {
                                            languageFound.setIsMap();
                                            languageFound.setValue([]);
                                            languageFound.setOptions({ havaChanged: true});
                                            break;
                                        }
                                    }
                                }
            
                                SidebarProvider.initWorkspace();
                            }

                            const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), keys, data.value.fileSelect);

                            DashboardPanel.postData({
                                "type": "onSelectChange",
                                "keys": keys,
                                "fileSelect": data.value.fileSelect ?? null,
                                "valueType": languageValue.length > 0 ? languageValue[0].valueType : 'string',
                                "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
                            });
        
                            break;
                        }
                        case "onAddNewKey": {
                            if(!data.value || !data.value.keys) return;
                            if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;

                            const keys = data.value.keys;

                            const newKey = await window.showInputBox({
                                title: "Key create",
                                placeHolder: "Please enter new key name",
                            });
        
                            if(newKey == undefined) return;
                            if(newKey == "") throw new Error("Key name cannot be empty");
                            if(!isKeyValid(newKey)) throw new Error("Key name are invalid format");

                            let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

                            if(GoSetting.getOutputMode().isByFolderMode()){
                                files = files.filter((file) => file.getName() == data.value.fileSelect);
                            }

                            for(const file of files){
                                let langsTemp = file.getLanguages();

                                for(const i in keys){
                                    const langFound = langsTemp.find((language) => language.getKey() == keys[i]);

                                    if(!langFound) throw new Error(keys[i] +" key not found");

                                    if(i == (keys.length - 1).toString()){
                                        if(!langFound.isMap()) throw new Error("key "+ keys[i] +" is not map type"); 

                                        const found = (langFound.getValue() as GoLanguage[]).find((value) => value.getKey() == newKey);

                                        if(found != undefined) throw new Error("Key are already exists.");

                                        (langFound.getValue() as GoLanguage[]).push(new GoLanguage(
                                            newKey,
                                            "",
                                            { haveCreated: true }
                                        ));

                                        break;

                                    }else{
                                        langsTemp = langFound.getValue() as GoLanguage[];
                                    }
                                }
                            }

                            SidebarProvider.updateKeyValues(workspace, data.value.fileSelect ?? null);

                            const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), keys, data.value.fileSelect);

                            DashboardPanel.postData({
                                "type": "onSelectChange",
                                "keys": keys,
                                "fileSelect": data.value.fileSelect ?? null,
                                "valueType": languageValue.length > 0 ? languageValue[0].valueType : 'string',
                                "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
                            });

                            break;
                        }
                        case "onRenameKey": {
                            if(!data.value || !data.value.keys) return;
                            if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;

                            const keys = data.value.keys;

                            const newKeyName = await window.showInputBox({
                                title: "Key rename",
                                placeHolder: "Please enter new key name",
                            });
        
                            if(newKeyName == undefined) return;
                            if(newKeyName == "") throw new Error("Key name cannot be empty");
                            if(!isKeyValid(newKeyName)) throw new Error("Key name are invalid format");

                            let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

                            if(GoSetting.getOutputMode().isByFolderMode()){
                                files = files.filter((file) => file.getName() == data.value.fileSelect);
                            }

                            for(const file of files){
                                let langsTemp = file.getLanguages();

                                for(const i in keys){
                                    const langFound = langsTemp.find((language) => language.getKey() == keys[i]);
                                    const duplicateFound = langsTemp.find((language) => language.getKey() == newKeyName);

                                    if(!langFound) throw new Error(keys[i] +" key not found");
                                    if(duplicateFound != undefined) throw new Error("Key "+ newKeyName +" are already exists.");

                                    if(i == (keys.length - 1).toString()){
                                        langFound.setKey(newKeyName);
                                        langFound.setOptions({ havaChanged: true});

                                        break;
                                    }else{
                                        langsTemp = langFound.getValue() as GoLanguage[];
                                    }
                                }
                            }
                            
                            // update selected key
                            keys[keys.length - 1] = newKeyName;

                            SidebarProvider.updateKeyValues(workspace, data.value.fileSelect ?? null);
                            SidebarProvider.updateKeySelect(keys);

                            const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), keys, data.value.fileSelect);

                            DashboardPanel.postData({
                                "type": "onSelectChange",
                                "keys": keys,
                                "fileSelect": data.value.fileSelect ?? null,
                                "valueType": languageValue.length > 0 ? languageValue[0].valueType : 'string',
                                "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
                            });

                            break;
                        }
                        case "onDeleteKey": {
                            if(!data.value || !data.value.keys) return;
                            if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;
        
                            const response = await window.showInformationMessage("Are you sure to delete this key ?", "Yes", "No");
        
                            if(response != "Yes") return;
                            
                            const keys = data.value.keys;

                            let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

                            if(GoSetting.getOutputMode().isByFolderMode()){
                                files = files.filter((file) => file.getName() == data.value.fileSelect);
                            }

                            for(const file of files){
                                if(GoSetting.getOutputType().find((value) => value.getSuffix() == file.getFileType().getSuffix()) == undefined) continue;

                                let langsTemp = file.getLanguages();

                                for(const i in keys){
                                    const indexFound = langsTemp.findIndex((language) => language.getKey() == keys[i]);

                                    if(indexFound == -1) throw new Error(keys[i] +" key not found");

                                    if(i == (keys.length - 1).toString()){
                                        langsTemp[indexFound].setOptions({ haveRemoved: true });
                                    }else{
                                        langsTemp = langsTemp[indexFound].getValue() as GoLanguage[];
                                    }
                                }
                            }
        
                            SidebarProvider.updateKeyValues(workspace, data.value.fileSelect ?? null);
                            
                            const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), keys, data.value.fileSelect);
        
                            DashboardPanel.postData({
                                "type": "onSelectChange",
                                "keys": keys,
                                "fileSelect": data.value.fileSelect ?? null,
                                "valueType": languageValue.length > 0 ? languageValue[0].valueType : 'string',
                                "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
                            });

                            break;
                        }
                        case "onRemoveLanguageFile": {
                            if(!data.value || !data.value.keys || !data.value.langauge) return;
                            if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;
        
                            const response = await window.showInformationMessage("Are you sure to delete this language ?", "Yes", "No");
        
                            if (response == "Yes") {
                                const indexRemove: number[] = [];

                                workspace.getFiles().forEach((value, index) => {
                                    if(GoSetting.getOutputType().find((type) => type.getSuffix() == value.getFileType().getSuffix()) == undefined) return;
        
                                    if(value.getLanguageType().getName() == data.value.langauge) {
                                        // value.removeFile(workspace.getUri(), GoSetting.getOutputMode());
                                        value.setFileOptions({ isRemoved: true });
                                        indexRemove.unshift(index);
                                    }
                                });
                                
                                // remove file delete from workspace
                                // for(const i of indexRemove){
                                //     workspace.getFiles().splice(i, 1);
                                // }
                                
                                const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), data.value.keys, data.value.fileSelect);

                                DashboardPanel.postData({
                                    "type": "onSelectChange",
                                    "keys": data.value.keys,
                                    "fileSelect": data.value.fileSelect ?? null,
                                    "valueType": languageValue.length > 0 ? languageValue[0].valueType : 'string',
                                    "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
                                });
                            }
                            
                            break;
                        }
                    }

                }catch(e){
                    printErr((e as Error).message);
                }
            });
        }

        if(args != undefined && args != null){
            if(!args.keys) throw new Error("Missing keys select");
            if(GoSetting.getOutputMode().isByFolderMode() && !args.fileSelect) throw new Error("Missing file select in by folder mode");

            const keys = args.keys;

            globalState.write("keySelected", keys);

            const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), keys, args.fileSelect ?? null);

            DashboardPanel.postData({
                "type": "onSelectChange",
                "keys": keys,
                "fileSelect": args.fileSelect ?? null,
                "valueType": languageValue.length > 0 ? languageValue[0].valueType : "string",
                "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
            });
        }

    } catch (e) {
        printErr((e as Error).message);
    }
}

function changeValueByMode(files: GoFile[], mode: GoOutputMode, languageName: string, keys: string[], value: string): GoFile | undefined {
    let file: GoFile | undefined;

    switch(mode.getModeKey()){
        case "light": {
            file = files.find((file) => file.getName() == languageName);
            break;
        }
        case "byFolder": {
            file = files.find((file) => file.getLanguageType().getName() == languageName);
            break;
        }
    }

    if(!file) return;

    let langsTemp = file.getLanguages();
    let languageTemp = null;

    for(const i in keys){
        const language = langsTemp.find((language) => language.getKey() == keys[i]);

        if(!language) throw new Error(keys[i] +" key not found");

        if(i == (keys.length - 1).toString()){
            languageTemp = language;

        }else{
            langsTemp = language.getValue() as GoLanguage[];
        }
    }

    if(!languageTemp) return;

    languageTemp.setValue(value);
    languageTemp.setOptions({ havaChanged: true });

    return file;
}
