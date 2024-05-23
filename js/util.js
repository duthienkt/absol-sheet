import { generateJSVariable, replaceDateStringJSVariable } from "absol/src/JSMaker/generator";
import TSSwitch from "./fx/TSSwitch";
import TSFunction from "./fx/TSFunction";

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


export function computeSheetDescriptor(propertyNames, propertyDescriptors) {

    var computeFxDescriptor = (descriptor) => {
        Object.defineProperty(descriptor, '__fx__', {
            configurable: true,
            enumerable: false,
            value: {}
        });
        Object.keys(descriptor).reduce((ac, key) => {
            var val = descriptor[key];
            if (typeof val === 'string') {
                if (val.startsWith('=')) {
                    descriptor.__fx__[key] = new TSFunction(propertyNames, val);
                }
                else if (val.startsWith('{{') && val.endsWith('}}')) {
                    descriptor.__fx__[key] = new TSFunction(propertyNames, val.substring(2, val.length - 2))
                }
                else if (key === 'onchange') {
                    descriptor.__fx__[key] = new TSFunction(propertyNames, val);
                }
            }
            else if (key === 'switch') {
                descriptor.__fx__['switch'] = new TSSwitch(descriptor['switch']);
            }
            return ac;
        }, descriptor.__fx__);
    }

    var computeDependenciesDescriptor = descriptor => {
        var dependencies = {};
        var fx = descriptor.__fx__;
        Object.keys(fx).reduce(function (ac, key) {
            if (fx[key].dependents) {
                fx[key].dependents.reduce(function (ac1, pName) {
                    ac1[pName] = true;
                    return ac1;
                }, ac);
            }
            // ac[];
            return ac;
        }, dependencies);
        delete dependencies[name];
        Object.defineProperty(descriptor, '__dependencies__',
            {
                configurable: true,
                enumerable: false,
                value: dependencies
            });
    };

    var descriptor;
    propertyNames.forEach(name => {
        descriptor = propertyDescriptors[name];
        if (!descriptor) return;
        computeFxDescriptor(descriptor);
        computeDependenciesDescriptor(descriptor);
    });
}