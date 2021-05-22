import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";


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

TDTreeEnum.prototype.reload = function () {
    var descriptor = this.descriptor;
    if (!descriptor.__val2Item__) {
        Object.defineProperty(descriptor, '__val2Item__', {
            configurable: true,
            enumerable: false,
            value: (descriptor.items || [])
                .reduce(function visitor(ac, item) {
                    ac[item.value] = item;
                    if (item.items && item.items.length > 0)
                        item.items.reduce(visitor, ac);
                    return ac;
                }, {})
        });
    }
    var value = this.value;
    if (value !== null && value !== undefined && descriptor.__val2Item__[value]) {
        this.$text.firstChild.data = descriptor.__val2Item__[value].text;
    }
    else {
        this.$text.firstChild.data = '';
    }
};

TDBase.typeClasses.treeenum = TDTreeEnum;
TDBase.typeClasses.TreeEnum = TDTreeEnum;

export default TDTreeEnum;