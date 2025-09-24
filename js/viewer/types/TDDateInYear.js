import TDBase from "./TDBase";
import {mixClass} from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";
import {zeroPadding} from "absol-acomp/js/utils";

/**
 * @extends TDBase
 * @constructor
 */
function TDDateInYear() {
    TDBase.apply(this, arguments);
}

mixClass(TDDateInYear, TDBase);

TDDateInYear.prototype.attachView = function () {
    this.elt.clearChild();
    this.$text = _({
        tag: 'span', child: {text: ''}
    });
    this.elt.addChild(this.$text);
};


TDDateInYear.prototype.isNoneValue = function (value) {
    if (!value) return true;
    if (typeof value !== 'object') return true;
    if (typeof value.month !== 'number') return true;
    if (typeof value.date !== 'number') return true;
    return  false;
};

TDDateInYear.prototype.reload = function () {
    var value = this.value;
    if (this.isNoneValue(value)) value = null;
    var text = ''
    if (value) {
        text = zeroPadding(value.date , 2) + '/' + zeroPadding(value.month + 1, 2);//todo: format
    }
    this.$text.firstChild.data = text;
};

export default TDDateInYear;

TDBase.typeClasses.DateInYear = TDDateInYear;
TDBase.typeClasses.DateInYearInput = TDDateInYear;
