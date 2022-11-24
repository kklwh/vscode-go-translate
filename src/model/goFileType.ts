export class GoFileType {
    private id: string;
    private name: string;
    private suffix: string;

    private static nextId: number = 1;

    constructor(name: string, suffix: string) {
        this.name = name;
        this.suffix = suffix;

        this.id = (GoFileType.nextId++).toString();
    }

    // getter
    public getId     = () => this.id;
    public getName   = () => this.name;
    public getSuffix = () => this.suffix;

    public toString = (): string => {
        return `id: ${this.id}, name: ${this.name}, suffix: ${this.suffix}`;
    };

    public static getDefaultFileType = () => {
        return [
            // new GoFileType(
            //     "Hash",
            //     ""
            // ),
            new GoFileType(
                "JSON",
                ".json"
            ),
            new GoFileType(
                "ARB",
                ".arb"
            ),
            new GoFileType(
                "PHP (Laravel)",
                ".php"
            ),           
        ];
    };
}