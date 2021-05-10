import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";


/***
 * @extends TDBase
 * @constructor
 */
function TDEnum() {
    TDBase.apply(this, arguments);
}

OOP.mixClass(TDEnum, TDBase);

TDEnum.prototype.attachView = function () {
    this.elt.clearChild();
    this.$text = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$text);
};

TDEnum.prototype.reload = function () {
    var descriptor = this.descriptor;
    if (!descriptor.__val2Item__) {
        Object.defineProperty(descriptor, '__val2Item__', {
            configurable: true,
            enumerable: false,
            value: (descriptor.items || [])
                .reduce(function (ac, item) {
                    ac[item.value] = item;
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

TDBase.typeClasses.enum = TDEnum;
export default TDEnum;