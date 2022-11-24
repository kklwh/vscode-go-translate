
export class GoOutputMode {
    private id: string;
    private modeKey: string;
    private modeValue: string;

    private static nextId: number = 1;

    constructor(modeKey: string, modeValue: string) {
        this.modeKey = modeKey;
        this.modeValue = modeValue;

        this.id = (GoOutputMode.nextId++).toString();
    }

    public getModeKey = (): string => this.modeKey;
    public getMode    = (): string => this.modeValue;
    
    public isLightMode = (): boolean => this.modeKey === "light";
    public isByFolderMode = (): boolean => this.modeKey === "byFolder";

    public static getDefaultMode(): GoOutputMode[]{
        return [
            new GoOutputMode(
                "light",
                "Light",
            ),
            new GoOutputMode(
                "byFolder",
                "By folder",
            ),
        ]
    }
}