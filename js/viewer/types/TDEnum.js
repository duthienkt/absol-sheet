import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";
import {measureListSize} from "absol-acomp/js/SelectList";
import {isDifferent} from "../../util";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";


/***
 * @extends TDBase
 * @constructor
 */
function TDEnum() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-enum');
}

OOP.mixClass(TDEnum, TDBase);

TDEnum.prototype.attachView = function () {
    this.elt.clearChild();
    this.$text = _({
        tag: 'span', child: {text: ''}
    });
    this.elt.addChild(this.$text);
};

TDEnum.prototype.loadDescriptor = function () {
    var descriptor = this.descriptor;
    descriptor.items = descriptor.items || [];
    if (!descriptor.items.__val2Item__) {
        Object.defineProperty(descriptor.items, '__val2Item__', {
            configurable: true,
            enumerable: false,
            value: descriptor.items
                .reduce(function (ac, item) {
                    ac[item.value] = item;
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
    this.elt.addStyle('min-width', (descriptor.items.__width14__ + 50) / 14 + 'em');
    var value = this.record[this.pName];
    this.record[this.pName] = this.implicit(value);
    if (isDifferent(value, this.record[this.pName])) {
        setTimeout(function () {
            if (isDifferent(value, this.record[this.pName])) {
                this.notifyChange()
            }

        }.bind(this), 0)
    }
    ResizeSystem.updateUp(this.elt);
};

TDEnum.prototype.implicit = function (value) {
    if (this.row.busy) return value;
    var descriptor = this.descriptor;
    descriptor.items = descriptor.items || [];
    if (value !== null && value !== undefined && !descriptor.items.__val2Item__[value]) {
        return descriptor.items.length > 0 ? descriptor.items[0].value : null;
    } else if (descriptor.items.__val2Item__[value]) return value;
    return null;
};


TDEnum.prototype.loadValue = function () {
    var descriptor = this.descriptor;
    var value = this.value;
    if (value !== null && value !== undefined && descriptor.items.__val2Item__[value] && !this.isNoneValue(value)) {
        this.$text.firstChild.data = descriptor.items.__val2Item__[value].text;
    }
    else {
        this.$text.firstChild.data = '';
    }
};

TDBase.typeClasses.enum = TDEnum;
export default TDEnum;