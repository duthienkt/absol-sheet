import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";
import {measureListSize} from "absol-acomp/js/SelectList";
import treeListToList from "absol-acomp/js/list/treeListToList";
import TDEnum from "./TDEnum";


/***
 * @extends TDBase
 * @constructor
 */
function TDTreeEnum() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-tree-enum');
}

OOP.mixClass(TDTreeEnum, TDBase);

TDTreeEnum.prototype.attachView = function () {
    this.elt.clearChild();
    this.$text = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$text);
};

TDTreeEnum.prototype.loadDescriptor = function () {
    var descriptor = this.descriptor;
    descriptor.items = descriptor.items || [];
    if (!descriptor.items.__val2Item__) {
        Object.defineProperty(descriptor.items, '__val2Item__', {
            configurable: true,
            enumerable: false,
            value: descriptor.items
                .reduce(function visitor(ac, item) {
                    ac[item.value] = item;
                    if (item.items && item.items.length > 0)
                        item.items.reduce(visitor, ac);
                    return ac;
                }, {})
        });
        var listSize = measureListSize(treeListToList(descriptor.items || []));
        Object.defineProperty(descriptor.items, '__width14__', {
            configurable: true,
            enumerable: false,
            value: listSize.width
        });
    }
    this.elt.addStyle('min-width', (descriptor.items.__width14__ + 50) / 14 + 'em');
    var value = this.record[this.pName];
    if (value !== null && value !== undefined) {
        this.record[this.pName] = descriptor.items.length > 0 ? descriptor.items[0].value : null;
    }
};

TDTreeEnum.prototype.implicit = TDEnum.prototype.implicit;

TDTreeEnum.prototype.loadValue = function () {
    var descriptor = this.descriptor;
    var value = this.value;
    if (value !== null && value !== undefined && descriptor.items.__val2Item__[value]) {
        this.$text.firstChild.data = descriptor.items.__val2Item__[value].text;
    }
    else {
        this.$text.firstChild.data = '';
    }
};


TDBase.typeClasses.treeenum = TDTreeEnum;
TDBase.typeClasses.TreeEnum = TDTreeEnum;

export default TDTreeEnum;