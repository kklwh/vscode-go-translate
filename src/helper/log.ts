import { window } from "vscode";


export const printInfo = (message: string, showLog: boolean = false) => {
    if(showLog) console.log("[Go Translate]: " + message);
    window.showInformationMessage("[Go Translate]: " +message);
}


export const printErr = (message: string, showLog: boolean = true) => {
    if(showLog) console.error("[Go Translate]: " + message);
    window.showErrorMessage("[Go Translate]: " + message);
}