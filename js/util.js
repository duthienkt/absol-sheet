import { generateJSVariable, replaceDateStringJSVariable } from "absol/src/JSMaker/generator";

export function isNone(o) {
    return o === null || o === undefined;
}

export function isDifferent(a, b) {
    return a !== b && (!isNone(a) || !isNone(b));
}

export function duplicateData(o){
   return replaceDateStringJSVariable(o);
}