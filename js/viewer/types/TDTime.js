import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {beginOfDay, formatDateTime, MILLIS_PER_DAY} from "absol/src/Time/datetime";
import {_} from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDTime() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-time');
}


OOP.mixClass(TDTime, TDBase);

TDTime.prototype.attachView = function () {
    this.$text = _({tag: 'span', child: {text: ''}});
    this.elt.addChild(this.$text);
};

TDTime.prototype.loadValue = function () {
    var value = this.implicit(this.value);
    if (typeof value === "number") {
        this.$text.firstChild.data = formatDateTime(new Date(beginOfDay(new Date()).getTime()+ value), 'hh:mm a');
    } else {
        this.$text.firstChild.data = '';
    }
};


TDTime.prototype.implicit = function (value) {
    if (typeof value === "string"){
        value = new Date(value);
    }
    if (value instanceof Date) {
        value = value.getTime() - beginOfDay(value).getTime();
    }

    if (typeof value === "number") {
        value = Math.floor(value) % MILLIS_PER_DAY;
        if (value < 0) value += MILLIS_PER_DAY;

    }
    if (isNaN(value)) value = null;
    return value;
}


TDBase.typeClasses.time = TDTime;

export default TDTime;