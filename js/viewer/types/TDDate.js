import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {formatDateString, LOCAL_DATE_FORMAT, parseDateString} from "absol/src/Time/datetime";


/***
 * @extends TDBase
 * @constructor
 */
function TDDate() {
    TDBase.apply(this, arguments);
}

OOP.mixClass(TDDate, TDBase);

TDDate.prototype.attachView = function () {
    this.elt.clearChild();
    this.$date = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$date);
};

TDDate.prototype.reload = function () {
    var value = this.value;
    var vType = typeof value;
    var text = '';
    var dateValue;
    if (vType === "string") {
        dateValue = this._dateFromString(value);
    }
    else if (vType === 'number') {
        dateValue = new Date(value);
    }
    if (value) {
        if (!dateValue || isNaN(dateValue.getTime())) {
            text = "?[" + JSON.stringify(value) + ']';
        }
        else if (dateValue) {
            text = formatDateString(dateValue, this.descriptor.format || LOCAL_DATE_FORMAT);
        }
    }
    else {
        text = '';
    }

    this.$date.firstChild.data = text;
};

TDDate.prototype._dateFromString = function (dateString) {
    var format = this.descriptor.format || LOCAL_DATE_FORMAT;
    if (format) {
        return parseDateString(dateString, format);
    }
    else {
        return new Date(dateString);
    }
};

TDBase.typeClasses.date = TDDate;
TDBase.typeClasses.Date = TDDate;
export default TDDate;