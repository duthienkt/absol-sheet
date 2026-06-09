import { mixClass } from "absol/src/HTML5/OOP";
import TDEnumSet from "./TDEnumSet";
import TDBase from "./TDBase";
import { arrayUnique } from "absol/src/DataStructure/Array";
import TextMeasure from "absol-acomp/js/TextMeasure";
import { keyStringOf } from "absol-acomp/js/utils";

/**
 * @extends TDEnumSet
 * @constructor
 */
function TDTreeLeafEnumSet() {
    TDEnumSet.apply(this, arguments);

}

mixClass(TDTreeLeafEnumSet, TDEnumSet);

TDTreeLeafEnumSet.prototype.loadDescriptor = function () {
    var descriptor = this.descriptor;
    descriptor.items = descriptor.items || [];
    if (!descriptor.items.__val2Item__) {
        Object.defineProperty(descriptor.items, '__val2Item__', {
            configurable: true,
            enumerable: false,
            value: this._makeDict(descriptor.items)
        });

        Object.defineProperty(descriptor.items, '__fallback__', {
            configurable: true,
            enumerable: false,
            value: this._makeFallbackDict(descriptor.items)
        });

        Object.defineProperty(descriptor.items, '__width14__', {
            configurable: true,
            enumerable: false,
            value: this._calcMinWidth14(descriptor.items)
        });
    }
    this.elt.addStyle('min-width', (descriptor.items.__width14__ + 50) / 14 + 0.7 + 'em');
};

TDTreeLeafEnumSet.prototype._calcMinWidth14 = function (items) {
    var res = 0;

    var visitArr = (items, par) => {
        if (items && items.length) {
            items.forEach(item => visitItem(item, par));
        }
    }

    var visitItem = (item, par) => {
        var c = TextMeasure.measureWidth(item.text+'', TextMeasure.FONT_ROBOTO, 14);
        res = Math.max(res, c);
        visitArr(item.items, item);
    }
    visitArr(items);
    return res;
}

TDTreeLeafEnumSet.prototype._makeDict = function (items) {
    var res = {};

    var visitArr = (items, par) => {
        if (items && items.length) {
            items.forEach(item => visitItem(item, par));
        }
    }
    var visitItem = (item, par) => {
        res[keyStringOf(item.value)] = item;
        visitArr(item.items, item);
    }
    visitArr(items);
    return res;
};

TDTreeLeafEnumSet.prototype._makeFallbackDict = function (items) {
    items = items ||[];
    var fallback2actualValueDict = {};

    var visit = item => {
        var value = item.value;
        if (item.fallbackValues && item.fallbackValues.forEach) {
            item.fallbackValues.forEach((fv, i) => {
                var hld = fallback2actualValueDict[fv];
                if (!hld || hld.i >= i) {
                    fallback2actualValueDict[fv] = {
                        i: i,
                        value: value
                    };
                }
            });
        }
        if (item.items && item.items.forEach) {
            item.items.forEach(visit);
        }
    };

    for (var i = items.length - 1; i >= 0; --i) {
        visit(items[i]);
    }

    return fallback2actualValueDict;
};

TDTreeLeafEnumSet.prototype._getActualValues = function (fallback2actualValueDict, values) {
    values = values || [];
    return values.map(val => {
        var hld = fallback2actualValueDict[val];
        return hld ? hld.value : val;
    });
};

TDTreeLeafEnumSet.prototype.loadValue = function () {
    var descriptor = this.descriptor;
    var value = arrayUnique(this.value ||[]);
    value = this._getActualValues(descriptor.items.__fallback__, value);
    var itemsDict = descriptor.items.__val2Item__;
    var viewTextes = [];
    for (var i = 0; i < value.length; ++i) {
        var item = itemsDict[keyStringOf(value[i])];
        if (item && item.isLeaf) {
            viewTextes.push(item.text);
        }
    }
    this.$text.firstChild.data = viewTextes.join(', ');
}


export default TDTreeLeafEnumSet;

TDBase.typeClasses['{treeleafenum}'] = TDTreeLeafEnumSet;
TDBase.typeClasses['TreeLeafEnumSet'] = TDTreeLeafEnumSet;