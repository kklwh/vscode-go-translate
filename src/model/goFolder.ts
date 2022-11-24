import { constructFilePath, readFolder, updateFileContent } from "../helper/file";
import { GoFile } from "./goFile";
import { GoFileType } from "./goFileType";
import { GoLanguage } from "./goLanguage";
import { GoLanguageType } from "./goLanguageType";
import { GoOutputMode } from "./goOutputMode";

export class GoFolder {
    private id: string;
    private name: string;
    private uri: string;
    private files: GoFile[];

    private static nextId: number = 1;

    constructor(name: string, uri: string, files: GoFile[] = []) {
        this.name = name;
        this.uri = uri;
        this.files = files;

        this.id = (GoFolder.nextId++).toString();
    }

    // getter
    public getId    = () => this.id;
    public getName  = () => this.name;
    public getUri   = () => this.uri;
    public getFiles = () => this.files;

    // setter
    public setFiles = (files: Array<GoFile>): void => {
        this.files = files;
    }

    public loadFiles = (mode: GoOutputMode): boolean => {
        this.files = [];

        const files = readFolder(this.uri);

        switch(mode.getModeKey()){
            case "light": {
                for (const file of files) {
                    if(!file.isFile()) continue;

                    const docIndex = file.name.lastIndexOf(".");

                    const suffix = docIndex >= 0 ? file.name.substring(docIndex, file.name.length) : "";
                    const goFileType = GoFileType.getDefaultFileType().find((fileType) => fileType.getSuffix() == suffix);
                    
                    if(!goFileType) continue;

                    this.files.push(new GoFile(
                        docIndex >= 0 ? file.name.substring(0, docIndex) : file.name, 
                        goFileType, 
                        new GoLanguageType(file.name.substring(0, docIndex)),
                    ));
                }
                break;
            }
            case "byFolder": {
                for (const file of files) {
                    if(!file.isDirectory()) continue;

                    const nestedFiles = readFolder(`${this.uri}\\${file.name}`);
                    
                    for (const nestedFile of nestedFiles) {
                        if(!nestedFile.isFile()) continue;

                        const docIndex = nestedFile.name.lastIndexOf(".");

                        const suffix = docIndex >= 0 ? nestedFile.name.substring(docIndex, nestedFile.name.length) : "";
                        const goFileType = GoFileType.getDefaultFileType().find((fileType) => fileType.getSuffix() == suffix);
                        
                        if(!goFileType) continue;

                        this.files.push(new GoFile(
                            docIndex >= 0 ? nestedFile.name.substring(0, docIndex) : nestedFile.name, 
                            goFileType, 
                            new GoLanguageType(file.name),
                        ));
                    }
                }
                break;
            }
        }
        
        return true;
    }

    public loadFilesContant = (mode: GoOutputMode, types: GoFileType[]) => {
        for(const file of this.files) file.loadFile(this.uri, mode, types);
    }

    public solveMissingKey = (mode: GoOutputMode, types: GoFileType[]) => {
        for(const i in this.files){
            if(types.find((value) => value.getSuffix() == this.files[i].getFileType().getSuffix()) == undefined) continue;

            for(const j in this.files){
                if(i == j || types.find((value) => value.getSuffix() == this.files[j].getFileType().getSuffix()) == undefined) continue;
                // folder mode must solve in same file name and different language
                if(mode.isByFolderMode() && (this.files[i].getName() != this.files[j].getName() || this.files[i].getLanguageType().getName() == this.files[j].getLanguageType().getName())) continue;

                this.files[i].getLanguages().forEach((valueI) => {
                    const foundKey = this.files[j].getLanguages().find((valueJ) => valueI.getKey() == valueJ.getKey());

                    if(foundKey == undefined){
                        this.files[j].getLanguages().push(GoLanguage.clone(valueI));
                    }
                })
            }
        }
    }

    public addNewLanguage = (mode: GoOutputMode, outputType: GoFileType, languageName: string, filesReference: GoFile[] = []) => {

        switch(mode.getModeKey()){
            case "light": {
                if(filesReference.length != 1) throw new Error("Files refereance cannot more than one in light mode");

                this.files.push(new GoFile(
                    languageName,
                    outputType,
                    new GoLanguageType(languageName),
                    filesReference.length > 0 ? filesReference[0].getLanguages().map(lang => GoLanguage.clone(lang, true)) : [],
                ));
                break;
            }
            case "byFolder": {
                let filterFiles = this.files.filter((file) => !file.isFileRemoved() && outputType.getSuffix() == file.getFileType().getSuffix());

                let tempLangCompare = filterFiles.length > 0 ? filterFiles[0].getLanguageType().getName() : null;

                if(!tempLangCompare) throw new Error("Cannot found files to add langauge");

                filterFiles = filterFiles.filter((file) => file.getLanguageType().getName() == tempLangCompare);

                for(const filterFile of filterFiles){
                    const fileReference = filesReference.find((fileReference) => fileReference.getName() == filterFile.getName());

                    this.files.push(new GoFile(
                        filterFile.getName(),
                        outputType,
                        new GoLanguageType(languageName),
                        fileReference ? fileReference.getLanguages().map(lang => GoLanguage.clone(lang, true)) : [],
                    ));
                }
                
                break;
            }
        }
    }

    public getKeyValueByMode = (mode: GoOutputMode, outputTypes: GoFileType[], keys: string[], fileSelect?: string): {language: string, value: string | GoLanguage[], valueType: string, fileType: string, isChanged: boolean, isRemoved: boolean}[] => {
        const languageValue: {language: string, value: string | GoLanguage[], valueType: string, fileType: string, isChanged: boolean, isRemoved: boolean}[] = [];
        
        if(mode.isByFolderMode() && !fileSelect) throw new Error("Missing file select in by folder mode");

        for(const file of this.files){
            if(file.isFileRemoved() || outputTypes.find((value) => value.getSuffix() == file.getFileType().getSuffix()) == undefined) continue;
            if(mode.isByFolderMode() && file.getName() != fileSelect) continue;

            const found = this._getValueByKey(file.getLanguages(), [...keys]);
    
            if(found != undefined && found != null){
                languageValue.push({
                    "language": mode.isByFolderMode() ? file.getLanguageType().getName() : file.getName(),
                    "value": found.getValue(),
                    "valueType": found.isMap() ? 'map' : 'string',
                    "fileType": file.getFileType().getSuffix(),
                    "isChanged": found.isChanged(),
                    "isRemoved": found.isRemoved(),
                });
            }
        }
    
        return languageValue;
    }

    public createDefaultFile = (mode: GoOutputMode, type: GoFileType, languageName: string = "en", fileName: string = "global") => {
        let newFile: GoFile;
        switch(mode.getModeKey()){
            case "light": {
                newFile = new GoFile(
                    languageName,
                    type,
                    new GoLanguageType(languageName),
                );
                break;
            }
            case "byFolder": {
                newFile = new GoFile(
                    fileName,
                    type,
                    new GoLanguageType(languageName),
                );
                break;
            }
            default: {
                newFile = new GoFile(
                    languageName,
                    type,
                    new GoLanguageType(languageName),
                );
            }
        }
        newFile.setFileOptions({ isCreated: true });
        this.files.push(newFile);
    }

    private _getValueByKey = (langs: GoLanguage[], key: string[]): GoLanguage | null => {
        for(const lang of langs){
            if(key.length <= 0) return null;

            if(lang.getKey() != key[0]) continue;

            // if match key run below
            if(key.length >= 2 && lang.isMap()){
                const nestLangs = lang.getValue() as GoLanguage[];
                key.shift();
                
                return this._getValueByKey(nestLangs, [...key]);
            }else if(key.length == 1){
                return lang;
            }
        }

        return null;
    }

    public toString = (): string => {
        return `id: ${this.id}, name: ${this.name}, uri: ${this.uri}, files: ${this.files.toString()}`;
    }
}