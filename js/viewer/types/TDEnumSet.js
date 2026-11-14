import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";
import { keyStringOf } from "absol-acomp/js/utils";
import { measureListSize } from "absol-acomp/js/SelectList";


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
    this.elt.addStyle('white-space', 'pre-wrap');
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
                    ac[keyStringOf(item.value)] = item;
                    return ac;
                }, {})
        });
        var listSize = measureListSize(descriptor.items);
        Object.defineProperty(descriptor.items, '__width14__', {
            configurable: true,
            enumerable: false,
            value: listSize.width
        });
    }
    var cellEstWidth = (descriptor.items.__width14__ + 50) / 14 + 'em'
    this.elt.addStyle('min-width', cellEstWidth);
    this.elt.addStyle('max-width', `min(${cellEstWidth}, 600px, 50vw)`);

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
            || items.__val2Item__[keyStringOf(value)];
    });
    return value;
};

TDEnumSet.prototype.isNoneValue = function (value) {
    return TDBase.prototype.isNoneValue.call(this, value) || value.length === 0;
};

TDEnumSet.prototype.loadValue = function () {
    var descriptor = this.descriptor;
    var value = this.implicit(this.value || []);
    var text = value.map(function (iVal) {
        var item = descriptor.items.__val2Item__[keyStringOf(iVal)];
        if (item) return item.text;
        return '?[' + JSON.stringify(iVal) + ']';
    }).join(', ');
    this.$text.firstChild.data = text;
};


TDEnumSet.prototype.type = '{enum}';

TDBase.typeClasses.EnumSet = TDEnumSet;
TDBase.typeClasses['{enum}'] = TDEnumSet;
TDBase.typeClasses.MultiSelectComboBox = TDEnumSet;
export default TDEnumSet;