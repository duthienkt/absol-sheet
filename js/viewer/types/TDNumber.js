import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDNumber() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-number');
}

OOP.mixClass(TDNumber, TDBase);

TDNumber.prototype.attachView = function () {
    this.elt.clearChild();

    this.$number = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$number);
};

TDNumber.prototype.reload = function () {
    var value = this.value;
    value = (value === null || value === undefined)?'':(value+'');
    this.$number.firstChild.data = value;
}

TDBase.typeClasses.number = TDNumber;
export default TDNumber;