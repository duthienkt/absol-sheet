import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {formatDateString, LOCAL_DATE_FORMAT, parseDateString} from "absol/src/Time/datetime";
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
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$date);
};

TDDate.prototype.loadValue = function () {
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
    else if (value && value.getTime) {
        dateValue = value;
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


Object.defineProperty(TDDate.prototype, 'dateValue', {
    get: function () {
        var value = this.value;
        var vType = typeof value;
        var dateValue;
        if (vType === 'string') {
            dateValue = this._dateFromString(value);
        }
        else if (vType === 'number') {
            dateValue = new Date(value);
        }
        if (dateValue && dateValue.getTime() > 0) return dateValue;
        return undefined;
    }
});

TDBase.typeClasses.date = TDDate;
TDBase.typeClasses.Date = TDDate;
export default TDDate;