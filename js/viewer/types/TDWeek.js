import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { beginOfWeek, formatDateTime, implicitDate, LOCAL_DATE_FORMAT, parseDateString } from "absol/src/Time/datetime";
import TDDate from "./TDDate";
import { getDefaultWeekFormat } from "../../util";



/***
 * @extends TDDate
 * @constructor
 */
function TDWeek() {
    TDDate.apply(this, arguments);
    this.elt.addClass('asht-type-week');
}

OOP.mixClass(TDWeek, TDDate);


TDWeek.prototype.implicit = function (value) {
    var dateValue = implicitDate(value);
    if (dateValue && isNaN(dateValue.getTime())) dateValue = null;
    if (dateValue) dateValue = beginOfWeek(dateValue);
    return dateValue;
};


TDWeek.prototype.loadValue = function () {
    var value = this.value;
    var text = '';
    var dateValue = this.implicit(value);
    if (value) {
        if (!dateValue) {
            text = "?[" + JSON.stringify(value) + ']';
        }
        else if (dateValue) {
            text = formatDateTime(dateValue, (this.descriptor.format || getDefaultWeekFormat()).replace(/m/g, 'M'));
        }
    }
    else {
        text = '';
    }

    this.$date.firstChild.data = text;
};


TDWeek.prototype.isEmpty = function () {
    var value = this.implicit(this.value);
    return !(value instanceof Date);
};


TDBase.typeClasses.week = TDWeek;
TDBase.typeClasses.Week = TDWeek;
export default TDWeek;