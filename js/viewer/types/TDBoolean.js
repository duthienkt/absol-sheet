import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDBoolean() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-boolean');
}

OOP.mixClass(TDBoolean, TDBase);

TDBoolean.prototype.implicit = function (value) {
    if (['false', '0', 'no'].indexOf(value) >=0) return false;
    return !!value;
};

TDBoolean.prototype.attachView = function () {
    this.elt.clearChild();
    this.$check = _('span.mdi.mdi-check');
    this.elt.addChild(this.$check);
};

TDBoolean.prototype.loadValue = function () {
    var value = this.implicit(this.value);
    if (value)
        this.$check.removeStyle('display');
    else
        this.$check.addStyle('display', 'none');
};

TDBase.typeClasses.bool = TDBoolean;
TDBase.typeClasses.boolean = TDBoolean;
export default TDBoolean;