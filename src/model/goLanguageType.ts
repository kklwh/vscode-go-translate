export class GoLanguageType {
    private id: string;
    private name: string;
    private code: string;

    private static nextId: number = 0;

    constructor(name: string, code: string = "") {
        this.name = name;
        this.code = code;

        this.id = (GoLanguageType.nextId++).toString();
    }

    // getter
    public getId   = () => this.id;
    public getName = () => this.name;
    public getCode = () => this.code;

    public toString = (): string => {
        return `id: ${this.id}, name: ${this.name}, code: ${this.code}`;
    }
}