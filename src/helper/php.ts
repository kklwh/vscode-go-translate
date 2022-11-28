export class PHP {
    public static stringify = (json: any, space?: string): string => {
        let aryStr = "<?php\n\nreturn [\n";

        let currentKey: string[] = [];
        let tempJson = json;

        while(Object.keys(tempJson).length > 0){
            for(const key of Object.keys(tempJson)){
                if(space){
                    for(let i = 0; i <= currentKey.length; i++){
                        aryStr = aryStr.concat("\t");
                    }
                }

                // write key
                aryStr = aryStr.concat("'", key, "'", " => ");

                // write value
                if(typeof tempJson[key] == "string"){
                    aryStr = aryStr.concat("'", tempJson[key].replace(/'/g, "\\'"), "'", ",", "\n");
                    delete tempJson[key];
                }else{
                    currentKey.push(key);
                    aryStr = aryStr.concat("[", "\n");
                    tempJson = tempJson[key];
                    break;
                }
            }

            // while loop for write character ], and delete key and assign new json to tempJson
            while(Object.keys(tempJson).length == 0){
                if(space){
                    for(let i = 0; i < currentKey.length; i++){
                        aryStr = aryStr.concat("\t");
                    }
                }

                // if is nested write ] character
                if(currentKey.length > 0) aryStr = aryStr.concat("]", ",", "\n");

                // remove assigned key
                const keyWillRemove = currentKey.pop();
                let jsonRemove = json;
                for(const key of currentKey){
                    jsonRemove = jsonRemove[key];
                }
                if(keyWillRemove) delete jsonRemove[keyWillRemove];

                // assign json for looping
                if(Object.keys(json).length > 0){
                    tempJson = json;
    
                    for(const key of currentKey){
                        tempJson = tempJson[key];
                    }
                }else{
                    break;
                }
            }
        }
        return aryStr.concat("]", ";");
    }

    /** convert format below
     * return [
     *      "user" => [
     *          "roles" => [
     *              "title" => "xxx",
     *          ],
     *          "name" => "xxx",
     *      ],
     *      "address" => [
     *          "line1" => "xxx"
     *      ]
     * ] 
     */
    public static parse = (ary: string): any => {
        let aryStr = ary;

        if(aryStr.indexOf("<?php") == -1 || aryStr.indexOf("return") == -1) throw new Error("Invalid php format");

        // remove php code
        aryStr = aryStr.replace("<?php", "")
                    .replace("?>", "")
                    .replace("return", "")
                    .replace(/](\r|\n)*;/, "]")
                    .trim()

        if(aryStr[0] != "[" || aryStr[aryStr.length-1] != "]") throw new Error("Invalid php format, cannot found character [ or ]");

        let json: any = {};
        let symbolStack: string[] = [];
        let currentKey: string[] = [];
        let nextIsValue: boolean = false;

        while(aryStr.length != 0){
            switch(aryStr[0]){
                case "[": {
                    symbolStack.push(aryStr[0]);
                    aryStr = aryStr.substring(1).trim();
                    nextIsValue = false;
                    break;
                }
                case "]": {
                    if(!(symbolStack.length > 0 && symbolStack[symbolStack.length-1] == "[")) throw new Error("Invalid php format, cannot found character [");

                    symbolStack.pop();
                    currentKey.pop();

                    aryStr = aryStr.substring(1).trim();
                    break;
                }
                case "\"": {
                    let endIndex = aryStr.indexOf("\"", 1);

                    while(endIndex != -1 && aryStr[endIndex-1] == "\\"){
                        if(endIndex + 1 >= aryStr.length) throw new Error("Invalid php format, cannot found character '");

                        // remove character \
                        aryStr = aryStr.substring(0, endIndex-1) + aryStr.substring(endIndex);

                        endIndex = aryStr.indexOf("\"", endIndex);
                    }

                    if(endIndex == -1) throw new Error("Invalid php format, cannot found character \"");

                    const contentStr = aryStr.substring(1, endIndex);

                    if(nextIsValue){
                        // when found and is value will set be value
                        let tempJson = json;

                        for(const i in currentKey){
                            if(i == (currentKey.length-1).toString()){
                                tempJson[currentKey[i]] = contentStr;
                                break;
                            }

                            tempJson[currentKey[i]] = {
                                ...tempJson[currentKey[i]],
                            };
                            tempJson = tempJson[currentKey[i]];
                        }

                        nextIsValue = false;
                        currentKey.pop();
                    }else{
                        // when found and not is value will set be key
                        currentKey.push(contentStr);
                    }
                    
                    aryStr = aryStr.substring(endIndex+1).trim();

                    break;
                }
                case "'": {
                    let endIndex = aryStr.indexOf("'", 1);

                    while(endIndex != -1 && aryStr[endIndex-1] == "\\"){
                        if(endIndex + 1 >= aryStr.length) throw new Error("Invalid php format, cannot found character '");

                        // remove character \
                        aryStr = aryStr.substring(0, endIndex-1) + aryStr.substring(endIndex);

                        endIndex = aryStr.indexOf("'", endIndex);
                    }

                    if(endIndex == -1) throw new Error("Invalid php format, cannot found character '");
                    
                    const contentStr = aryStr.substring(1, endIndex);

                    if(nextIsValue){
                        // when found and is value will set be value
                        let tempJson = json;

                        for(const i in currentKey){
                            if(i == (currentKey.length-1).toString()){
                                tempJson[currentKey[i]] = contentStr;
                                break;
                            }

                            tempJson[currentKey[i]] = {
                                ...tempJson[currentKey[i]],
                            };
                            tempJson = tempJson[currentKey[i]];
                        }

                        nextIsValue = false;
                        currentKey.pop();
                    }else{
                        // when found and not is value will set be key
                        currentKey.push(contentStr);
                    }
                    
                    aryStr = aryStr.substring(endIndex+1).trim();

                    break;
                }
                case "=": {
                    if(aryStr[1] != ">") throw new Error("Invalid php format, cannot found character >");

                    aryStr = aryStr.substring(2).trim();
                    nextIsValue = true;

                    break;
                }
                case ",": {
                    aryStr = aryStr.substring(1).trim();

                    break;
                }
            }
        }

        if(symbolStack.length > 0 || currentKey.length > 0) throw new Error("Invalid php format");

        return json;
    }
}