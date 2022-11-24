import { WebviewViewProvider, Webview, WebviewView, TextDocument, ExtensionContext, Uri, window, commands } from "vscode";
import { isFileExists, isFileNameValid } from "../helper/file";
import { storeHistoryPath } from "../helper/historyPath";
import generateHtml from "../helper/html";
import { filterFilesByOutputTypeAndMode, getKeyValuesFromFiles, isKeyValid } from "../helper/lang";
import { printErr } from "../helper/log";
import StateManager from "../helper/stateManager";
import { GoFile } from "../model/goFile";
import { GoFileType } from "../model/goFileType";
import { GoFolder } from "../model/goFolder";
import { GoLanguage } from "../model/goLanguage";
import { GoLanguageType } from "../model/goLanguageType";
import { GoOutputMode } from "../model/goOutputMode";
import { GoSetting } from "../model/goSetting";
import { DashboardPanel } from "../panel/DashboardPanel";

export class SidebarProvider implements WebviewViewProvider {
    static _extensionUri: Uri;
    static _globalState: StateManager
    static _view?: WebviewView;
    static _doc?: TextDocument;

    constructor(private readonly _context: ExtensionContext, private readonly _state: StateManager) {
        SidebarProvider._extensionUri = _context.extensionUri;
        SidebarProvider._globalState = _state;
    }

    public resolveWebviewView(webviewView: WebviewView) {
        SidebarProvider._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                Uri.joinPath(SidebarProvider._extensionUri, "media/icon"),
                Uri.joinPath(SidebarProvider._extensionUri, "webviews"),
                Uri.joinPath(SidebarProvider._extensionUri, "out/compiled"),
            ],
        };

        webviewView.webview.onDidReceiveMessage(async (data) => {
            try{
                switch (data.type) {
                    case "onBoot": {
                        SidebarProvider.initWorkspace();
                        // if(SidebarProvider._readWorkspace(SidebarProvider._globalState, true) == undefined){
                        //     SidebarProvider.initWorkspace();
                        // }else{
                        //     SidebarProvider.initWorkspace();
                        // }
                        break;
                    }
                    case "onHistoryPathSelect": {
                        if(data.value == undefined || data.value == null || Object.keys(data.value).length == 0) return;

                        const hPath = data.value as {name: string, path: string, outputMode: any, outputType: any[]};

                        if(!isFileExists(hPath.path)){
                            throw new Error("Folder not exists.");
                        }

                        const workspace = new GoFolder(hPath.name, hPath.path);

                        GoSetting.setOutputMode(new GoOutputMode(hPath.outputMode.modeKey, hPath.outputMode.modeValue));

                        GoSetting.setOutputType(hPath.outputType.map((value): GoFileType => {
                            return new GoFileType(value.name, value.suffix);
                        }));

                        workspace.loadFiles(GoSetting.getOutputMode());
                        workspace.loadFilesContant(GoSetting.getOutputMode(), GoSetting.getOutputType());
                        workspace.solveMissingKey(GoSetting.getOutputMode(), GoSetting.getOutputType());

                        if(workspace.getFiles().filter((file) => file.getFileType().getSuffix() == GoSetting.getOutputType()[0].getSuffix()).length == 0){
                            workspace.createDefaultFile(GoSetting.getOutputMode(), GoSetting.getOutputType()[0]);
                        }

                        // update history path
                        storeHistoryPath(SidebarProvider._globalState, workspace.getName(), workspace.getUri(), GoSetting.getOutputMode(), GoSetting.getOutputType());

                        SidebarProvider._globalState.write("workspace", workspace);
                        SidebarProvider._globalState.write("fileSelected", null);
                        SidebarProvider._globalState.write("keySelected", null);
                        
                        SidebarProvider.initWorkspace();

                        break;
                    }
                    case "onOpenFolder": {
                        await commands.executeCommand('go-translate.openFolder', {
                            "token": Math.floor(Math.random() * 99999),
                        });

                        SidebarProvider.initWorkspace();

                        SidebarProvider._rerenderDashboard();

                        break;
                    }
                    case "onSaveFiles": {
                        if(!data.value) return;
                        if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;

                        await commands.executeCommand('go-translate.saveFile', {
                            fileSelect: data.value?.fileSelect ?? null,
                        });
                        
                        const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;

                        SidebarProvider.updateKeyValues(workspace, data.value.fileSelect);

                        break;
                    }
                    case "onAddLanguage": {
                        if(!data.value || !data.value.keySelect) return;
                        if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;

                        const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;

                        // get new language file name
                        const newLanguageName = await window.showInputBox({
                            placeHolder: "Please enter language name"
                        });
    
                        if(newLanguageName == undefined) return;
                        if(newLanguageName == "") throw new Error("Language cannot be empty");

                        // filter specify mode files
                        let filesForSelections = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());
    
                        if(GoSetting.getOutputMode().isByFolderMode()){
                            filesForSelections = filesForSelections.filter((file) => file.getName() == data.value.fileSelect);
                        }

                        // find same language name
                        const sameLanguageFound = filesForSelections.findIndex((value) => value.getLanguageType().getName() == newLanguageName);

                        if(sameLanguageFound != -1) throw new Error("Langauge "+ newLanguageName +" are already exists");

                        // filter file type and reference for select
                        const languageSelections = filesForSelections.map((value) => value.getLanguageType().getName());

                        GoSetting.getOutputType().forEach((value) => {
                            languageSelections.unshift("new empty "+ value.getSuffix() +" file");
                        })

                        const languageSelect = await window.showQuickPick(languageSelections, {
                            title: "Add new language file",
                            placeHolder: "Select new empty language file or reference.",
                        });

                        if (!languageSelect) return;

                        // reassign files for filter
                        let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

                        // get reference from use select
                        const filesReference = files.filter((value) => {
                            return value.getLanguageType().getName() == languageSelect;
                        });

                        if(filesReference.length > 0){
                            workspace.addNewLanguage(
                                GoSetting.getOutputMode(),
                                filesReference[0].getFileType(),
                                newLanguageName,
                                filesReference,
                            );
                        }else{
                            const fileType = GoSetting.getOutputType().find((value) => {
                                return value.getSuffix() == languageSelect.replace("new empty ", "").replace(" file", "");
                            });

                            if(!fileType) throw new Error("File reference not found");

                            workspace.addNewLanguage(
                                GoSetting.getOutputMode(),
                                fileType,
                                newLanguageName,
                            );
                            workspace.solveMissingKey(GoSetting.getOutputMode(), GoSetting.getOutputType());
                        }

                        // reassign files for found key
                        files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());
    
                        if(GoSetting.getOutputMode().isByFolderMode()){
                            files = files.filter((file) => file.getName() == data.value.fileSelect);
                        }

                        const keys = getKeyValuesFromFiles(files.map((file) => { 
                            return { file: file.getName(), langs: file.getLanguages() }; 
                        })).keys;

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateKeyValues",
                            value: keys,
                        });

                        const languageValue = workspace.getKeyValueByMode(GoSetting.getOutputMode(), GoSetting.getOutputType(), data.value.keySelect, data.value.fileSelect);

                        DashboardPanel.postData({
                            "type": "onSelectChange",
                            "keys": data.value.keySelect,
                            "fileSelect": data.value.fileSelect ?? null,
                            "valueType": languageValue.length > 0 ? languageValue[0].valueType : 'string',
                            "value": languageValue.length > 0 && languageValue[0].valueType == "map" ? [] : languageValue,
                        });

                        break;
                    }
                    case "onAddNewKey": {
                        if(!data.value || !data.value.keySelect) return;
                        if(GoSetting.getOutputMode().isByFolderMode() && !data.value.fileSelect) return;

                        const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;

                        const newKey = await window.showInputBox({
                            placeHolder: "Please enter new key",
                        });
    
                        if(newKey == undefined) return;
                        if(newKey == "") throw new Error("Key cannot be empty");
                        if(!isKeyValid(newKey)) throw new Error("Key are invalid format");

                        // filter specify mode files
                        let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());
    
                        if(GoSetting.getOutputMode().isByFolderMode()){
                            files = files.filter((file) => file.getName() == data.value.fileSelect);
                        }

                        // check duplicate key
                        let found: GoFile | undefined = files.find((file) => file.getLanguages().find((value) => value.getKey() == newKey) != undefined);

                        if(found != undefined) throw new Error("Key are already exists.");

                        files.forEach((file) => {
                            if(GoSetting.getOutputType().find((value) => value.getSuffix() == file.getFileType().getSuffix()) == undefined) return;

                            file.getLanguages().push(new GoLanguage(
                                newKey,
                                "",
                                { haveCreated: true }
                            ));
                        });

                        const keys = getKeyValuesFromFiles(files.map((value) => { 
                            return { file: value.getName(), langs: value.getLanguages() }; 
                        })).keys;

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateKeyValues",
                            value: keys
                        });

                        break;
                    }
                    case "onLanguageKeySelect": {
                        if(!data.value || !data.value.keys) return;

                        switch(GoSetting.getOutputMode().getModeKey()){
                            case "light": {
                                await commands.executeCommand('go-translate.start', {
                                    "keys": data.value.keys,
                                });
                                break;
                            }
                            case "byFolder": {
                                if(!data.value.fileSelect) return;

                                await commands.executeCommand('go-translate.start', {
                                    "keys": data.value.keys,
                                    "fileSelect": data.value.fileSelect
                                });
                                break;
                            }
                        }

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateKeySelect",
                            value: data.value.keys
                        });
                        break;
                    }
                    case "onAddNewFolderFile": {
                        if(!GoSetting.getOutputMode().isByFolderMode() || !data.value || !data.value.keys || !data.value.fileSelect) return;

                        const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;

                        const newName = await window.showInputBox({
                            placeHolder: "Please enter new file name",
                        });
    
                        if(newName == undefined) return;
                        if(newName == "") throw new Error("File name cannot be empty");
                        if(!isFileNameValid(newName)) throw new Error("File name are invalid format");

                        // filter specify mode files
                        let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

                        if(files.find((file) => file.getName() == newName) != undefined) throw new Error("File are already exists.");

                        let newFiles: GoFile[] = [];

                        for(const file of files){
                            if(newFiles.find((newFile) => newFile.getLanguageType().getName() == file.getLanguageType().getName()) == undefined){
                                newFiles.push(new GoFile(
                                    newName,
                                    file.getFileType(),
                                    new GoLanguageType(file.getLanguageType().getName()),
                                ));
                            }
                        }

                        workspace.setFiles([
                            ...workspace.getFiles(),
                            ...newFiles,
                        ]);

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateFilesOptions",
                            value: SidebarProvider.getFilesOptions(workspace),
                        });

                        break;
                    }
                    case "onRenameFolderFile": {
                        if(!GoSetting.getOutputMode().isByFolderMode() || !data.value || !data.value.keys || !data.value.fileSelect) return;

                        const newFileName = await window.showInputBox({
                            title: "File rename",
                            placeHolder: "Please enter new file name",
                        });
    
                        if(newFileName == undefined) return;
                        if(newFileName == "") throw new Error("File name cannot be empty");
                        if(!isFileNameValid(newFileName)) throw new Error("File name are invalid format");

                        const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;

                        let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

                        if(files.find((file) => file.getName() == newFileName) != undefined) throw new Error("File are already exists.");

                        for(const file of files){
                            if(file.getName() == data.value.fileSelect) file.setName(newFileName);
                        }
                        
                        SidebarProvider._view?.webview.postMessage({
                            type: "updateFilesOptions",
                            value: SidebarProvider.getFilesOptions(workspace),
                        });

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateFileSelect",
                            value: newFileName,
                        });

                        SidebarProvider._globalState.write("fileSelected", newFileName);

                        break;
                    }
                    case "onDeleteFolderFile": {
                        if(!GoSetting.getOutputMode().isByFolderMode() || !data.value || !data.value.keys || !data.value.fileSelect) return;

                        const response = await window.showInformationMessage("Are you sure to delete this file ?", "Yes", "No");
        
                        if(response != "Yes") return;

                        const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;

                        let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode(), data.value.fileSelect);

                        for(const file of files){
                            file.setFileOptions({ isRemoved: true });
                        }

                        const fileOptions = SidebarProvider.getFilesOptions(workspace);

                        if(fileOptions.length == 0){
                            for(const file of files){
                                file.setFileOptions({ isRemoved: false });
                            }
                            throw new Error("Cannot delete file, because this is last file");
                        }

                        const keys = getKeyValuesFromFiles(fileOptions.map((value) => { 
                            return { file: value.getName(), langs: value.getLanguages() }; 
                        })).keys;

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateFilesOptions",
                            value: fileOptions,
                        });

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateFileSelect",
                            value: fileOptions[0].getName(),
                        });

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateKeyValues",
                            value: keys,
                        });

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateKeySelect",
                            value: [],
                        });

                        SidebarProvider._rerenderDashboard();

                        SidebarProvider._globalState.write("fileSelected", fileOptions[0].getName());
                        break;
                    }
                    case "onChangeFileSelect": {
                        if(!GoSetting.getOutputMode().isByFolderMode() || !data.value || !data.value.keys || !data.value.fileSelect) return;

                        const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;

                        const files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode(), data.value.fileSelect);
            
                        const keys = getKeyValuesFromFiles(files.map((value) => { 
                            return { file: value.getName(), langs: value.getLanguages() }; 
                        })).keys;

                        SidebarProvider._view?.webview.postMessage({
                            type: "updateKeyValues",
                            value: keys,
                        });

                        SidebarProvider._rerenderDashboard();

                        SidebarProvider._globalState.write("fileSelected", data.value.fileSelect);

                        break;
                    }
                }

            }catch(e){
                printErr((e as Error).message);
            }
        });

        SidebarProvider._view.webview.html = SidebarProvider._getHtmlForWebview(SidebarProvider._view.webview);

        SidebarProvider.initWorkspace();
    }

    public static initWorkspace(){
        const workspace = this._readWorkspace(this._globalState, true);

        if (workspace != undefined && workspace != null) {
            // read state and assign it
            let fileSelected: string | null = null;
            let keySelected: string[] = [];
            
            const fileSelectedRead = this._globalState.read("fileSelected");
            const keySelectedRead = this._globalState.read("keySelected");

            if (fileSelectedRead) fileSelected = fileSelectedRead as string;
            if (keySelectedRead) keySelected = keySelectedRead as string[];

            // declare variable that use to svelte
            const fileOptions: GoFile[] = [];
            let keys: {
                id: string, 
                key: string, 
                value: string | {}[], 
                valueType: string, 
                haveChange: boolean, 
                changeBy: string[],
                isCreate: boolean,
                isRemove: boolean,
            }[] = [];
            
            let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

            if(files.length > 0){
                if(GoSetting.getOutputMode().isByFolderMode()){
                    // assign an option to file select
                    files.forEach((file) => {
                        if(fileOptions.length == 0){
                            fileOptions.push(file);
                            return;
                        }

                        if(fileOptions.find((option) => option.getLanguageType().getName() == file.getLanguageType().getName())){
                            fileOptions.push(file);
                        }
                    });

                    if(fileSelected == null && fileOptions.length > 0){
                        fileSelected = fileOptions[0].getName();
                    }

                    // filter files by selected file name
                    files = files.filter((file) => file.getName() == fileSelected);
                }
                
                keys = getKeyValuesFromFiles(files.map((value) => { 
                    return { file: value.getName(), langs: value.getLanguages() }; 
                })).keys;
            }

            this._view?.webview.postMessage({
                type: "updateWorkspace",
                value: {
                    "workspace": workspace,
                    "outputMode": GoSetting.getOutputMode(),
                    "outputType": GoSetting.getOutputType(),
                    "keys": keys,
                    "keySelect": keySelected,
                    "fileOptions": fileOptions,
                    "fileSelect": fileSelected,
                }
            });

            this._globalState.write("fileSelected", fileSelected);

        }else{
            // if no workspace will show history open
            const historyPathRead = this._globalState.readPersist("historyPath");

            if(historyPathRead != undefined && historyPathRead != null && Array.isArray(historyPathRead)){
                const historyPath = historyPathRead as [];
                
                if(historyPath.length == 0) return;

                this._view?.webview.postMessage({
                    type: "updateHistoryPath",
                    value: historyPath
                });
            }
        }
    }

    public static updateKeyValues(workspace: GoFolder, fileSelect?: string){
        let files: GoFile[] = [];

        switch(GoSetting.getOutputMode().getModeKey()){
            case "light": {
                files = filterFilesByOutputTypeAndMode(
                    workspace.getFiles(), 
                    GoSetting.getOutputType(), 
                    GoSetting.getOutputMode()
                );
                break;
            }
            case "byFolder": {
                if(fileSelect == null) throw new Error("Missing file select in by folder mode");

                files = filterFilesByOutputTypeAndMode(
                    workspace.getFiles(), 
                    GoSetting.getOutputType(), 
                    GoSetting.getOutputMode(),
                    fileSelect,
                );
                break;
            }
        }

        if(files.length == 0) throw new Error("Workspace are no any file");

        const keys = getKeyValuesFromFiles(files.map((file) => { 
            return { file: file.getName(), langs: file.getLanguages() }; 
        })).keys;

        this._view?.webview.postMessage({
            type: "updateKeyValues",
            value: keys,
        });
    }

    public static updateKeySelect(keys: string[]){
        this._view?.webview.postMessage({
            type: "updateKeySelect",
            value: keys,
        });
    }

    public static getFilesOptions(workspace: GoFolder): GoFile[]{
        const fileOptions: GoFile[] = [];
        
        const files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

        files.forEach((file) => {
            if(file.isFileRemoved()) return;

            if(fileOptions.length == 0){
                fileOptions.push(file);
                return;
            }

            if(fileOptions.find((option) => option.getLanguageType().getName() == file.getLanguageType().getName())){
                fileOptions.push(file);
            }
        });

        return fileOptions;
    }

    private static async _rerenderDashboard(){
        switch(GoSetting.getOutputMode().getModeKey()){
            case "light": {
                await commands.executeCommand('go-translate.start', {
                    "keys": [],
                });
                break;
            }
            case "byFolder": {
                let fileSelected = "";

                const workspace = SidebarProvider._readWorkspace(SidebarProvider._globalState)!;
                let files = filterFilesByOutputTypeAndMode(workspace.getFiles(), GoSetting.getOutputType(), GoSetting.getOutputMode());

                // filter files by selected file name
                if(files.length > 0){
                    fileSelected = files[0].getName();
                }

                await commands.executeCommand('go-translate.start', {
                    "keys": [],
                    "fileSelect": fileSelected
                });
                break;
            }
        }
    }

    private static _readWorkspace(globalState: StateManager, acceptUndefined: boolean = false): GoFolder | undefined {
        const workspaceRead = globalState.read("workspace");

        if (!acceptUndefined && (workspaceRead == undefined || workspaceRead == null)) {
            throw new Error("Workspace is undefined");    
        }

        return workspaceRead as GoFolder | undefined;
    }

    private static _getHtmlForWebview(webview: Webview) {
        const screenUri = webview.asWebviewUri(
            Uri.joinPath(SidebarProvider._extensionUri, "out/compiled/sidebar.js")
        );

        const styleUri = webview.asWebviewUri(
            Uri.joinPath(SidebarProvider._extensionUri, "webviews/css/sidebar.css")
        );

        return generateHtml(SidebarProvider._extensionUri, webview, screenUri, styleUri);
    }
}
