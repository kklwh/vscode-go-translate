import { constructFilePath, readFileContent, updateFileContent, removeFile, isFileExists, removeFolder, renameFile } from "../helper/file";
import { PHP } from "../helper/php";
import { GoFileType } from "./goFileType";
import { GoLanguage } from "./goLanguage";
import { GoLanguageType } from "./goLanguageType";
import { GoOutputMode } from "./goOutputMode";

export class GoFile {
    private id: string;
    private name: string;
    private fileType: GoFileType;
    private languageType: GoLanguageType;
    private languages: GoLanguage[];
    private isCreated: boolean = false;
    private isRemoved: boolean = false;
    private isRenamed: boolean = false;
    private oldName: string = "";

    private static nextId: number = 1;

    constructor(name: string, fileType: GoFileType, languageType: GoLanguageType, languages: GoLanguage[] = []) {
        this.name = name;
        this.fileType = fileType;
        this.languageType = languageType;
        this.languages = languages;

        this.id = (GoFile.nextId++).toString();
    }

    // getter
    public getId = () => this.id;
    public getName = () => this.name;
    public getFileType = () => this.fileType;
    public getLanguageType = () => this.languageType;
    public getLanguages = () => this.languages;
    public isFileCreated = () => this.isCreated;
    public isFileRemoved = () => this.isRemoved;
    public isFileRenamed = () => this.isRenamed;

    // setter
    public setName = (name: string) => {
        this.isRenamed = true;
        this.oldName = this.name;
        this.name = name;
    }

    public setFileOptions = (options: { isCreated?: boolean, isRemoved?: boolean }) => {
        this.isCreated = options.isCreated ?? this.isCreated;
        this.isRemoved = options.isRemoved ?? this.isRemoved;
    }

    public loadFile = (workspaceUri: string, mode: GoOutputMode, types: GoFileType[]) => {
        if (types.find((value) => value.getSuffix() === this.fileType.getSuffix()) === undefined) return;

        const fileContent = readFileContent(this.getFilePathByMode(workspaceUri, mode, this));

        // load content by different file type
        switch (this.fileType.getSuffix()) {
            case ".json": case ".arb": {
                const jsonContent = fileContent.length > 0 ? JSON.parse(fileContent) : {};

                this.languages = GoLanguage.fromJsons(jsonContent);
                break;
            }
            case ".php": {
                const jsonContent = fileContent.length > 0 ? PHP.parse(fileContent) : {};

                this.languages = GoLanguage.fromJsons(jsonContent);
                break;
            }
        }
    }

    public updateFile = (workspaceUri: string, mode: GoOutputMode, types: GoFileType[]) => {
        if (types.find((value) => value.getSuffix() === this.fileType.getSuffix()) === undefined) return;
        if (!this.isFileChange(workspaceUri, mode) && !this.isFileRemoved()) return;

        const path = this.getFilePathByMode(workspaceUri, mode, this);
        
        // update content by different file type
        if(this.isFileRemoved()){
            if(this.isFileCreated()) return;

            if(this.isFileRenamed()) {
                removeFile(this.getFileOldPathByMode(workspaceUri, mode, this));
            }else{
                removeFile(this.getFilePathByMode(workspaceUri, mode, this));
            }
        }else{
            // rename file before update file content
            if(this.isFileRenamed()) {
                renameFile(this.getFileOldPathByMode(workspaceUri, mode, this), this.getFilePathByMode(workspaceUri, mode, this));
            }

            switch (this.fileType.getSuffix()) {
                case ".json": case ".arb": {
                    updateFileContent(
                        path,
                        JSON.stringify(GoLanguage.toJsons(this.languages), null, "\t"),
                    );
                    break;
                }
                case ".php": {
                    updateFileContent(
                        path,
                        PHP.stringify(GoLanguage.toJsons(this.languages), "\t"),
                    );
                    break;
                }
            }

            this.setLangsOptions(this.languages, {havaChanged: false, haveCreated: false})
        }
    }

    public removeDeleteLang = (langs: GoLanguage[] = this.languages) => {
        const indexRemove: number[] = [];

        for(const i in langs){
            if(langs[i].isRemoved()) indexRemove.unshift(Number.parseInt(i));
            else if(langs[i].isMap()) this.removeDeleteLang(langs[i].getValue() as GoLanguage[]);
        }

        for(const i of indexRemove) langs.splice(i, 1);
    }

    private setLangsOptions = (langs: GoLanguage[], options: { havaChanged?: boolean, haveCreated?: boolean, haveRemoved?: boolean }) => {
        for(const i in langs){
            langs[i].setOptions(options);
            if(langs[i].isMap()) this.setLangsOptions(langs[i].getValue() as GoLanguage[], options);
        }
    }

    private isFileChange = (workspaceUri: string, mode: GoOutputMode): boolean => {
        const path = this.getFilePathByMode(workspaceUri, mode, this);

        // if file no exists is means file changed
        if(!isFileExists(path)) return true;

        const fileContent = readFileContent(path);

        switch (this.fileType.getSuffix()) {
            case ".json": case ".arb": {
                const jsonContentRead = fileContent == "" ? fileContent : JSON.stringify(JSON.parse(fileContent), null, "\t");
                const jsonContentCurrent = JSON.stringify(GoLanguage.toJsons(this.languages), null, "\t");

                return jsonContentRead !== jsonContentCurrent;
            }
            case ".php": {
                const jsonContentRead = fileContent == "" ? fileContent : PHP.stringify(PHP.parse(fileContent), "\t");
                const jsonContentCurrent = PHP.stringify(GoLanguage.toJsons(this.languages), "\t");

                return jsonContentRead !== jsonContentCurrent;
            }
            default: return false;
        }
    }

    private getFilePathByMode = (workspaceUri: string, mode: GoOutputMode, file: GoFile): string => {
        switch (mode.getModeKey()) {
            case "light":    return constructFilePath( workspaceUri, file.name.concat(file.fileType.getSuffix()) );
            case "byFolder": return constructFilePath( workspaceUri, file.languageType.getName(), file.name.concat(file.fileType.getSuffix()) );
            default: return "";
        }
    }

    private getFileOldPathByMode = (workspaceUri: string, mode: GoOutputMode, file: GoFile): string => {
        switch (mode.getModeKey()) {
            case "light":    return constructFilePath( workspaceUri, file.oldName.concat(file.fileType.getSuffix()) );
            case "byFolder": return constructFilePath( workspaceUri, file.languageType.getName(), file.oldName.concat(file.fileType.getSuffix()) );
            default: return "";
        }
    }

    public toString = (): string => {
        return `id: ${this.id}, name: ${this.name}, fileType: ${this.fileType.toString()}, languageType: ${this.languageType.toString()}, languages: ${this.languages.toString()}`;
    };
}