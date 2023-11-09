import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { beginOfDay, formatDateTime } from "absol/src/Time/datetime";
import { _ } from "../../dom/SCore";
import { isNaturalNumber } from "absol-acomp/js/utils";


/***
 * @extends TDBase
 * @constructor
 */
function TDTimeRange24() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-time-range-24');
}

OOP.mixClass(TDTimeRange24, TDBase);

TDTimeRange24.prototype.attachView = function () {
    this.elt.clearChild();
    this.$date = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$date);
};

TDTimeRange24.prototype.implicit = function (value) {
    var rangeValue = null;
    if (isNaturalNumber(value)) rangeValue = { dayOffset: value, duration: 0 };
    else if (!value) {
    }
    else if (typeof rangeValue === "object") {
        if (isNaturalNumber(value.dayOffset)) {
            rangeValue = { dayOffset: value.dayOffset, duration: 0 };
        }
        else {
            rangeValue = { dayOffset: 0, duration: 0 };
        }
        if (isNaturalNumber(value.duration)) {
            rangeValue.duration = value.duration;
        }
    }
    return rangeValue;
};


TDTimeRange24.prototype.loadValue = function () {
    var value = this.implicit(this.value);
    var text;
    var date = beginOfDay(new Date())
    if (!value) text = '';
    else {
        text = formatDateTime(new Date(date.getTime() + value.dayOffset), 'HH:mm')
            + ' - ' + formatDateTime(new Date(date.getTime() + value.dayOffset + value.duration), 'HH:mm')
    }

    this.$date.firstChild.data = text;
};


TDTimeRange24.prototype.isEmpty = function () {
    return this.isNoneValue(this.implicit(this.value));
};


TDBase.typeClasses.timerange24 = TDTimeRange24;
TDBase.typeClasses.TimeRange24 = TDTimeRange24;
TDBase.typeClasses.time_period = TDTimeRange24;
export default TDTimeRange24;