import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";


/***
 * @extends TDBase
 * @constructor
 */
function TDBoolean() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-boolean');
}

OOP.mixClass(TDBoolean, TDBase);

TDBoolean.prototype.attachView = function () {
    this.elt.clearChild();
    this.$check = _('span.mdi.mdi-check');
    this.elt.addChild(this.$check);
};

TDBoolean.prototype.reload = function () {
    var value = this.value;
    if (value)
        this.$check.removeStyle('display');
    else
        this.$check.addStyle('display', 'none');
};

TDBase.typeClasses.bool = TDBoolean;
TDBase.typeClasses.boolean = TDBoolean;
export default TDBoolean;