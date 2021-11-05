import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDEnumSet() {
    TDBase.apply(this, arguments);
}

OOP.mixClass(TDEnumSet, TDBase);

TDEnumSet.prototype.attachView = function () {
    this.elt.clearChild();
    this.$text = _({
        tag: 'span', child: {text: ''}
    });
    this.elt.addChild(this.$text);
};

TDEnumSet.prototype.loadDescriptor = function () {
    var descriptor = this.descriptor;
    descriptor.items = descriptor.items || [];
    if (!descriptor.items.__val2Item__) {
        Object.defineProperty(descriptor.items, '__val2Item__', {
            configurable: true,
            enumerable: false,
            value: (descriptor.items || [])
                .reduce(function (ac, item) {
                    ac[item.value] = item;
                    return ac;
                }, {})
        });
    }
    this.record[this.pName] = this.implicit(this.record[this.pName]);
};

TDEnumSet.prototype.implicit = function (value) {
    if (typeof value === 'string') {
        value = value.split(/\s*,\s*/);
    }
    if (!(value instanceof Array)) {
        value = [];
    }
    var descriptor = this.descriptor;
    var items = descriptor.items;
    value = value.filter(function (value) {
        return items.__val2Item__ === undefined
            || items.__val2Item__[value];
    });
    return value;
};

TDEnumSet.prototype.isEmpty = function () {
    var value = this.value;
    return !value || value.length === 0;
};

TDEnumSet.prototype.loadValue = function () {
    var descriptor = this.descriptor;
    var value = this.implicit(this.value || []);
    var text = value.map(function (iVal) {
        var item = descriptor.items.__val2Item__[iVal];
        if (item) return item.text;
        return '?[' + JSON.stringify(iVal) + ']';
    }).join(', ');
    this.$text.firstChild.data = text;
};


TDBase.typeClasses.EnumSet = TDEnumSet;
TDBase.typeClasses['{enum}'] = TDEnumSet;
export default TDEnumSet;