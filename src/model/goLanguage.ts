enum ValueType {
    string,
    map,
}

export class GoLanguage {
    private id: string;
    private key: string;
    private value: string | GoLanguage[];
    private valueType: ValueType;
    private havaChanged: boolean;
    private haveCreated: boolean;
    private haveRemoved: boolean;

    private static nextId: number = 1;

    constructor(key: string, value: string | GoLanguage[], options: { havaChanged?: boolean, haveCreated?: boolean, haveRemoved?: boolean } = { havaChanged: false, haveCreated: false, haveRemoved: false}) {
        this.key = key;
        this.value = value;
        this.havaChanged = options.havaChanged ?? false;
        this.haveCreated = options.haveCreated ?? false;
        this.haveRemoved = options.haveRemoved ?? false;

        if(typeof value == "object" && value instanceof Array){
            this.valueType = ValueType.map;

        }else if(typeof value == "string"){
            this.valueType = ValueType.string;

        }else{
            throw new Error("value are not string or map");
        }

        this.id = (GoLanguage.nextId++).toString();
    }

    // getter
    public getId        = () => this.id;
    public getKey       = () => this.key;
    public getValue     = () => this.value;
    public getValueType = () => this.valueType;
    public isChanged    = () => this.havaChanged;
    public isCreated    = () => this.haveCreated;
    public isRemoved    = () => this.haveRemoved;
    public isStr        = () => this.valueType == ValueType.string;
    public isMap        = () => this.valueType == ValueType.map;

    // setter
    public setKey = (value: string) => {
        this.key = value;
    };

    public setValue = (value: string | GoLanguage[]) => {
        this.value = value;
    };

    public setValueType = (valueType: ValueType) => {
        this.valueType = valueType;
    };

    public setOptions = (options: { havaChanged?: boolean, haveCreated?: boolean, haveRemoved?: boolean }) => {
        this.havaChanged = options.havaChanged ?? this.havaChanged;
        this.haveCreated = options.haveCreated ?? this.haveCreated;
        this.haveRemoved = options.haveRemoved ?? this.haveRemoved;
    }

    public setIsStr = () => {
        this.valueType = ValueType.string;
    };

    public setIsMap = () => {
        this.valueType = ValueType.map;
    };

    public static fromJsons(json: any): GoLanguage[] {
        const goLanguages: GoLanguage[] = [];
        
        Object.keys(json).forEach((key) => {
            if(typeof json[key] == "object"){
                goLanguages.push(new GoLanguage(
                    key,
                    GoLanguage.fromJsons(json[key]),
                ));

            }else if(typeof json[key] == "string"){
                goLanguages.push(new GoLanguage(
                    key,
                    json[key],
                ));
            }else{
                throw new Error("value are not string or map");
            }
        });

        return goLanguages;
    }

    public static toJsons(goLanguages: GoLanguage[]): any {
        const newObj: any = {};
        
        goLanguages.forEach((language) => {
            if(language.isRemoved()) return;

            if(language.isMap()){
                newObj[language.getKey()] = GoLanguage.toJsons(language.getValue() as GoLanguage[]);

            }else if(language.isStr()){
                newObj[language.getKey()] = language.getValue();

            }else{
                throw new Error("value are not string or map");
            }
        });

        return newObj;
    }

    public static clone(reference: GoLanguage, copyValue: boolean = false): GoLanguage {
        let newGoLanguage = null;
        
        if(reference.isMap()){
            newGoLanguage = new GoLanguage(
                reference.getKey(),
                (reference.getValue() as GoLanguage[]).map((value) => {
                    return GoLanguage.clone(value, copyValue);
                }),
            );
        }else{
            newGoLanguage = new GoLanguage(
                reference.getKey(),
                copyValue ? reference.getValue() : (reference.isMap() ? [] : ""),
            );
        }
        newGoLanguage.setValueType(reference.getValueType());

        return newGoLanguage;
    }

    public toString = (): string => {
        return `id: ${this.id}, key: ${this.key}, value: ${this.value}`;
    };
}
