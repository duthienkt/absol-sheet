export function isNone(o) {
    return o === null || o === undefined;
}

export function isDifferent(a, b) {
    return a !== b && (!isNone(a) || !isNone(b));
}