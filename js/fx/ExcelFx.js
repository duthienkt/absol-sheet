import { beginOfDay, compareDate, compareMonth, daysInMonth } from "absol/src/Time/datetime";

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
    if (typeof date === "number" || typeof date === "string") date = new Date(date);
    if (date && date.getFullYear)
        return date.getFullYear();
    return undefined;
}

export function MONTH(date) {
    if (typeof date === "number" || typeof date === "string") date = new Date(date);
    if (date && date.getMonth)
        return date.getMonth() + 1;
    return undefined;
}

export function DAY(date) {
    if (typeof date === "number" || typeof date === "string") date = new Date(date);
    if (date && date.getDate)
        return date.getDate();
    return undefined;
}

export function DAYS(end_date, start_date){
    //todo
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
    if (typeof d1 === "number" || typeof d1 === "string") d1 = new Date(d1);
    if (typeof d2 === "number" || typeof d2 === "string") d2 = new Date(d2);
    if (!d1.getFullYear || isNaN(d1.getFullYear())) return undefined;
    if (!d2.getFullYear || isNaN(d2.getFullYear())) return undefined;
    df = df || 'D';
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


export function MAX(args) {
    var res;
    if (arguments.length === 0) {
        res = undefined;
    }
    else if (arguments.length === 1) {
        if (typeof args === "number") {
            res = args;
        }
        else if (args instanceof Array) {
            res = args.reduce((ac, x) => Math.max(ac, x), -Infinity);
            res = res === -Infinity ? undefined : res;
        }
    }
    return res;
}

export function MIN(args) {
    var res;
    if (arguments.length === 0) {
        res = undefined;
    }
    else if (arguments.length === 1) {
        if (typeof args === "number") {
            res = args;
        }
        else if (args instanceof Array) {
            res = args.reduce((ac, x) => Math.min(ac, x), Infinity);
            res = res === Infinity ? undefined : res;
        }
    }
    return res;
}

export var SIN = Math.sin.bind(Math);
export var COS = Math.cos.bind(Math);
export var TAN = Math.tan.bind(Math);
export var CTAN = function (x) {
    return 1 / TAN(x)
}

export function SUM(args) {
    var res;
    if (arguments.length === 0) {
        res = 0;
    }
    else if (arguments.length === 1) {
        if (typeof args === "number") {
            res = args;
        }
        else if (args instanceof Array) {
            res = args.reduce((ac, x) => {
                return ac + x;
            }, 0);
        }
    }
    else {
        res = Array.prototype.reduce.call(arguments, (ac, x) => SUM(x), 0);
    }
    if (isNaN(res)) res = undefined;

    return res;
}

export function IF(condition, ifTrue, ifFalse) {
    return condition ? ifTrue : ifFalse;
}

export function MATCH(lookup_value, lookup_array, match_type) {
    if (!(lookup_array instanceof Array)) return undefined;
    //todo
}

export function CHOOSE(index_num, args){
    if (arguments.length < 2) return undefined;
    if (arguments.length === 2){
        if (args instanceof Array){
            return  args[index_num -1];
        }
        else return arguments[index_num];
    }
    return arguments[index_num];
}
