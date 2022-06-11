import {beginOfDay, compareDate, compareMonth, daysInMonth} from "absol/src/Time/datetime";

export function DATE(year, month, day) {
    var tYear = typeof year;
    var tMonth = typeof month;
    var tDay = typeof day;
    if (tYear !== "number" && tMonth !== 'number' && tDay !== "number") return undefined;
    if (tYear !== 'number') tYear = new Date().getFullYear();
    if (typeof month !== 'number') month = 1;
    if (typeof day !== 'number') day = 1;
    month = Math.max(1, Math.min(12, month << 0));
    var dim = daysInMonth(year, month - 1);
    day = Math.max(1, Math.min(dim, day << 0));
    return new Date(year, month - 1, day);
}

export function YEAR(date) {
    if (typeof date === "number" ||typeof date === "string"  ) date = new Date(date);
    if (date && date.getFullYear)
        return date.getFullYear();
    return undefined;
}

export function MONTH(date) {
    if (typeof date === "number" ||typeof date === "string" ) date = new Date(date);
    if (date && date.getMonth)
        return date.getMonth() + 1;
    return undefined;
}

export function DAY(date) {
    if (typeof date === "number" ||typeof date === "string" ) date = new Date(date);
    if (date && date.getDate)
        return date.getDate();
    return undefined;
}

export function TODAY() {
    return beginOfDay(new Date());
}

export function NOW() {
    return new Date();
}


export function DATEDIF(d1, d2, df) {
    if (!d1 || !d2) {
        return undefined;
    }
    if (typeof d1 === "number" ||typeof d1 === "string" ) d1 = new Date(d1);
    if (typeof d2 === "number" ||typeof d2 === "string" ) d2 = new Date(d2);
    if (!d1.getFullYear || isNaN(d1.getFullYear())) return undefined;
    if (!d2.getFullYear || isNaN(d2.getFullYear())) return undefined;
    df = df ||'D';
    switch (df) {
        case 'D':
            return compareDate(d2, d1);
        case 'M':
            return compareMonth(d2, d1);
        case 'Y':
            return d2.getFullYear() - d1.getFullYear();
        default:
            return undefined;
    }
}

export var MAX = Math.max.bind(Math);
export var MIN = Math.min.bind(Math);
export var SIN = Math.sin.bind(Math);
export var COS = Math.cos.bind(Math);
export var TAN = Math.tan.bind(Math);
export var CTAN = function (x) {
    return 1 / TAN(x)
}
