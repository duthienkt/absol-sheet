import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";


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
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$text);
};

TDEnumSet.prototype.reload = function () {
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
    var value = this.value || [];
    var text = value.map(function (iVal) {
        var item = descriptor.__val2Item__[iVal];
        if (item) return item.text;
        return '?[' + JSON.stringify(iVal) + ']';
    }).join(', ');
    this.$text.firstChild.data = text;

}

TDBase.typeClasses.EnumSet = TDEnumSet;
TDBase.typeClasses['{enum}'] = TDEnumSet;
export default TDEnumSet;