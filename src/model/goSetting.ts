import { GoFileType } from "./goFileType";
import { GoOutputMode } from "./goOutputMode";

export class GoSetting {
    private static outputMode: GoOutputMode;
    private static outputType: GoFileType[];
    

    // getter
    public static getOutputMode = () => this.outputMode
    public static getOutputType = () => this.outputType
    

    // setter
    public static setOutputMode = (outputMode: GoOutputMode) => {
        this.outputMode = outputMode;
    }

    public static setOutputType = (outputType: GoFileType[]) => {
        this.outputType = outputType;
    }

    public static toString = (): string => {
        return `outputMode: ${GoSetting.outputMode}, outputType: ${GoSetting.outputType.toString()}`;
    }
}