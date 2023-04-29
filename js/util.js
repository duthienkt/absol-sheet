import { generateJSVariable, replaceDateStringJSVariable } from "absol/src/JSMaker/generator";

export function isNone(o) {
    return o === null || o === undefined;
}

export function isDifferent(a, b) {
    return a !== b && (!isNone(a) || !isNone(b));
}

export function duplicateData(o) {
    return replaceDateStringJSVariable(o);
}

export function getDefaultWeekFormat() {
    var lang = 'VN';
    if (window['systemconfig'] && window['systemconfig']['language']) lang = window['systemconfig']['language'];
    if (lang.toUpperCase().match(/VN|VI/)) return 'Tuần ww, yyyy';
    if (lang.toUpperCase().match(/EN|US/)) return 'Week ww, yyyy';
    return 'Week ww, yyyy';
}