import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { formatDateTime, implicitDate, LOCAL_DATE_FORMAT, parseDateString } from "absol/src/Time/datetime";
import {_} from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDDate() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-date');
}

OOP.mixClass(TDDate, TDBase);

TDDate.prototype.attachView = function () {
    this.elt.clearChild();
    this.$date = _({
        tag: 'span', child: {text: ''}
    });
    this.elt.addChild(this.$date);
};

TDDate.prototype.implicit = function (value) {
    var vType = typeof value;
    var dateValue = implicitDate(value);
    if (dateValue && isNaN(dateValue.getTime())) dateValue = null;
    return dateValue;
};


TDDate.prototype.loadValue = function () {
    var value = this.value;
    var text = '';
    var dateValue = this.implicit(value);
    if (value) {
        if (!dateValue) {
            text = "?[" + JSON.stringify(value) + ']';
        } else if (dateValue) {
            text = formatDateTime(dateValue, (this.descriptor.format || "dd/MM/yyyy").replace(/m/g, 'M'));
        }
    } else {
        text = '';
    }

    this.$date.firstChild.data = text;
};


TDDate.prototype.isEmpty = function () {
    var value = this.implicit(this.value);
    return !(value instanceof Date);
};


Object.defineProperty(TDDate.prototype, 'dateValue', {
    get: function () {
        var value = this.value;
        var vType = typeof value;
        var dateValue = implicitDate(value);
        if (dateValue && dateValue.getTime() > 0) return dateValue;
        return undefined;
    }
});

TDBase.typeClasses.date = TDDate;
TDBase.typeClasses.Date = TDDate;
export default TDDate;