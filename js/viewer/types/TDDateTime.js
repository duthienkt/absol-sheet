import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { LOCAL_DATE_FORMAT, parseDateTime, formatDateTime } from "absol/src/Time/datetime";
import { _ } from "../../dom/SCore";
import TDDate from "./TDDate";


/***
 * @extends TDBase
 * @constructor
 */
function TDDateTime() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-date-time');
}

OOP.mixClass(TDDateTime, TDBase);

TDDateTime.prototype.attachView = function () {
    this.elt.clearChild();
    this.$date = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$date);
};

TDDateTime.prototype.implicit = TDDate.prototype.implicit;
TDDateTime.prototype.isEmpty = TDDate.prototype.isEmpty;
TDDateTime.prototype.isNoneValue = TDDate.prototype.isNoneValue;

TDDateTime.prototype.loadValue = function () {
    var value = this.value;
    var text = '';
    var dateValue = this.implicit(value);

    if (value) {
        if (!dateValue) {
            text = "?[" + JSON.stringify(value) + ']';
        }
        else if (dateValue) {
            text = formatDateTime(dateValue, this.descriptor.format || 'dd/MM/yyyy hh:mm a');
        }
    }
    else {
        text = '';
    }

    this.$date.firstChild.data = text;
};

TDDateTime.prototype._dateFromString = function (dateString) {
    var format = this.descriptor.format || (LOCAL_DATE_FORMAT + 'hh:mm a');
    try {
        return parseDateTime(dateString, format);
    } catch (e) {
        return new Date(dateString);
    }
};


Object.defineProperty(TDDateTime.prototype, 'dateValue', {
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

TDBase.typeClasses.datetime = TDDateTime;
TDBase.typeClasses.DateTime = TDDateTime;
TDBase.typeClasses.DateTimeInput = TDDateTime;
export default TDDateTime;