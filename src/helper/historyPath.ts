import { GoFileType } from "../model/goFileType";
import { GoOutputMode } from "../model/goOutputMode";
import StateManager from "./stateManager";

export function storeHistoryPath(globalState: StateManager, newName: string, newPath: string, outputMode: GoOutputMode, outputType: GoFileType[]): void {
    let historyPath: {name: string, path: string, outputMode: GoOutputMode, outputType: GoFileType[]}[] = [];

    const historyPathRead = globalState.readPersist("historyPath");

    if (historyPathRead != undefined && historyPathRead != null && Array.isArray(historyPathRead) && historyPathRead.length > 0) {
        for(const pathRead of historyPathRead){
            historyPath.push({
                name: pathRead.name,
                path: pathRead.path,
                outputMode: new GoOutputMode(
                    pathRead.outputMode.modeKey,
                    pathRead.outputMode.modeValue,
                ),
                outputType: pathRead.outputType.map((value: { name: string, suffix: string }) => {
                    return new GoFileType(value.name , value.suffix);
                }),
            });
        }
    }

    const newHistory = {
        name: newName,
        path: newPath,
        outputMode: outputMode,
        outputType: outputType,
    };

    // found same setting from history
    const pathFound = historyPath.findIndex((value) => 
        value.name == newHistory.name && 
        value.path == newHistory.path && 
        value.outputMode.getModeKey() == newHistory.outputMode.getModeKey() && 
        value.outputType.map(value => value.getSuffix()).join("") == newHistory.outputType.map(value => value.getSuffix()).join("")
    );
    
    // if found will remove (for move to latest open)
    if(pathFound != -1){
        historyPath.splice(pathFound, 1);
    }

    historyPath.unshift({
        name: newName,
        path: newPath,
        outputMode: outputMode,
        outputType: outputType,
    });

    if(historyPath.length > 3){
        historyPath.pop();
    }

    globalState.writePersist("historyPath", historyPath);  
}