import * as fs from "fs";

const unicode = 'utf8';

export const constructFilePath = (workspaceUri: string, ...filePath: string[]) => {
    for(const path of filePath) workspaceUri = workspaceUri.concat(getPathDelimiter(), path);
    return workspaceUri;
};

export const isFileNameValid = (name: string): boolean => {
    if(/^[a-zA-Z]{1}[a-zA-Z0-9-_]*$/.test(name)){
        return true;
    }
    return false;
}

export const isFileExists = (path: string): boolean => {
    return fs.existsSync(path);
};

export const readFolder = (path: string) => {
    return fs.readdirSync(path, { withFileTypes: true });
};

export const readFileContent = (path: string) => {
    return fs.readFileSync(path, unicode);
};

export const renameFile = (oldPath: string, newPath: string): boolean => {
    fs.renameSync(
        oldPath,
        newPath,
    );
    return true;
};

export const createFileContent = (path: string, name: string, content: string = ""): boolean => {
    checkAndOpenFolder(path);

    fs.writeFileSync(
        path.concat(getPathDelimiter(), name),
        content,
    );
    return true;
};

export const updateFileContent = (path: string, content: string = ""): boolean => {
    checkAndOpenFolder(path);

    fs.writeFileSync(
        path,
        content,
    );
    return true;
};

export const removeFile = (path: string): boolean => {
    if(!isFileExists(path)) return false;

    fs.unlinkSync(path);
    return true;
};

export const removeFolder = (path: string): boolean => {
    if(!isFileExists(path)) return false;

    fs.rmSync(path, { recursive: true, force: true });
    return true;
};


const checkAndOpenFolder = (path: string) => {
    const pathAry = path.split(getPathDelimiter());
    let pathCheckingStr: string = "";

    for(const i in pathAry){
        pathCheckingStr = pathCheckingStr.concat(pathAry[i], getPathDelimiter());

        if(!isFileExists(pathCheckingStr) && i != (pathAry.length-1).toString()){
            fs.mkdirSync(pathCheckingStr);
        }
    }
}

const getPathDelimiter = () => {
    switch (process.platform) {
        case 'win32':
            return '\\';
        case 'darwin':
            return '/';
        default:
            return '\\';
    }
};