import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { formatDateTime, implicitDate, LOCAL_DATE_FORMAT, parseDateString } from "absol/src/Time/datetime";
import { _ } from "../../dom/SCore";
import DateNLevelInput from "absol-acomp/js/DateNLevelInput";


/***
 * @extends TDBase
 * @constructor
 */
function TDDateNLevel() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-date');
}

OOP.mixClass(TDDateNLevel, TDBase);

TDDateNLevel.prototype.leve2format = DateNLevelInput.prototype.leve2format;

TDDateNLevel.prototype.attachView = function () {
    this.elt.clearChild();
    this.$date = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$date);
};

TDDateNLevel.prototype.implicit = function (value) {
    if (value instanceof Date) value = { value: value };
    if (!value) return null;
    var dateValue = implicitDate(value.value);
    if (dateValue && isNaN(dateValue.getTime())) dateValue = null;
    if (dateValue === null) return null;
    value.value = dateValue;
    value.level = value.level || 'date';
    return value;
};


TDDateNLevel.prototype.loadValue = function () {
    var value = this.value;
    var text = '';
    value = this.implicit(value);
    if (value) {
        text = formatDateTime(value.value, this.leve2format[value.level]);
    }
    this.$date.firstChild.data = text;
};


TDDateNLevel.prototype.isEmpty = function () {
    var value = this.implicit(this.value);
    return this.isNoneValue(value);
};


TDDateNLevel.prototype.isNoneValue = function (value) {
    return TDBase.prototype.isNoneValue.call(this, value) || !(value.value instanceof Date);
};

Object.defineProperty(TDDateNLevel.prototype, 'dateValue', {
    get: function () {
        var value = this.value;
        var vType = typeof value;
        var dateValue = implicitDate(value);
        if (dateValue && dateValue.getTime() > 0) return dateValue;
        return undefined;
    }
});

TDBase.typeClasses.datenlevel = TDDateNLevel;
TDBase.typeClasses.DateNLevel = TDDateNLevel;
TDBase.typeClasses.DateNLevelInput = TDDateNLevel;
export default TDDateNLevel;