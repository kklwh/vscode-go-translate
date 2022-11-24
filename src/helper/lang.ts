import { GoFile } from "../model/goFile";
import { GoFileType } from "../model/goFileType";
import { GoLanguage } from "../model/goLanguage";
import { GoOutputMode } from "../model/goOutputMode";

export const isKeyValid = (key: string): boolean => {
    if(/^[a-zA-Z@]{1}[a-zA-Z0-9-_]*$/.test(key)){
        return true;
    }
    return false;
}

export const filterFilesByOutputTypeAndMode = (files: GoFile[], types: GoFileType[], mode: GoOutputMode, fileSelect?: string): GoFile[] => {
    let filtedFiles = files.filter((file) => !file.isFileRemoved() && types.find((type) => type.getSuffix() == file.getFileType().getSuffix()) != undefined);

    switch(mode.getModeKey()){
        case "light": {
            return filtedFiles;
        }
        case "byFolder": {
            if(fileSelect == null) return filtedFiles;
            else                   return files.filter((file) => file.getName() == fileSelect);
            
        }
        default: return filtedFiles;
    }
}

export const getKeyValuesFromFiles = (filesLangs: { file: string; langs: GoLanguage[] }[]): {
    haveChange: boolean,
    keys: {
        id: string, 
        key: string, 
        value: string | {}[], 
        valueType: string, 
        haveChange: boolean, 
        changeBy: string[],
        isCreate: boolean,
        isRemove: boolean,
    }[]
} => {
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
    let childChange = false;

    if(filesLangs.length > 0){
        // loop and assign key
        for(const lang of filesLangs[0].langs){
            if(lang.isMap()){
                // if is map will generate new nested key value to recursive
                const nextFilesLangs = filesLangs.map((value) => {
                    return {
                        file: value.file,
                        langs: value.langs.find((value) => value.getKey() == lang.getKey())!.getValue() as GoLanguage[]
                    }
                });

                const result = getKeyValuesFromFiles(nextFilesLangs);
                
                if(result.haveChange) childChange = true;

                keys.push({
                    id: lang.getId(), 
                    key: lang.getKey(), 
                    value: result.keys, 
                    valueType: "map", 
                    haveChange: result.haveChange, 
                    changeBy: [],
                    isCreate: lang.isCreated(),
                    isRemove: lang.isRemoved(),
                });

            }else{
                let haveChange: boolean = false;
                let changeBy: string[] = [];

                // loop all file to check this key have change or not
                for(const fileLangs of filesLangs){
                    const langFound = fileLangs.langs.find((value) => value.getKey() == lang.getKey());

                    if(langFound != undefined && langFound.isChanged()){
                        haveChange = true;
                        changeBy.push(fileLangs.file);

                        childChange = true;
                        break;
                    }

                    if(langFound != undefined && (langFound.isRemoved() || langFound.isCreated())){
                        childChange = true;
                    }
                }

                keys.push({
                    id: lang.getId(), 
                    key: lang.getKey(), 
                    value: lang.getValue(), 
                    valueType: "string", 
                    haveChange: haveChange,
                    changeBy: changeBy,
                    isCreate: lang.isCreated(),
                    isRemove: lang.isRemoved(),
                });
            }
        }
    }

    return { haveChange: childChange, keys };
}