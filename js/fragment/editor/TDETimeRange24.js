import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import { _ , $} from "../../dom/SCore";
import TDEDate from "./TDEDate";
import { parseDateTime } from "absol/src/Time/datetime";
import AElement from "absol/src/HTML5/AElement";
import TimeRange24Input from "absol-acomp/js/TimeRange24Input";
import TDTimeRange24 from "../../viewer/types/TDTimeRange24";


/***
 * @extends TDEDate
 * @constructor
 */
function TDETimeRange24() {
    TDEDate.apply(this, arguments);
}

OOP.mixClass(TDETimeRange24, TDEDate);

TDETimeRange24.prototype.prepareInput = function () {
    this.$input = _({
        tag: TimeRange24Input.tag,
        class: ["asht-cell-editor-input", 'asht-time-range-24-cell-editor-input'],
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};

TDETimeRange24.prototype.reload = function () {
    var value = this.cell.value;
    var descriptor = this.cell.descriptor;
    var timeRangeValue = TDTimeRange24.prototype.implicit.call(this, value);

    if (timeRangeValue) {
        this.$input.dayOffset = timeRangeValue.dayOffset;
        this.$input.duration = timeRangeValue.duration;
    }
    else {
        this.$input.dayOffset = 0;
        this.$input.duration = 0;
    }

    this.$input.disabled = descriptor.readOnly || descriptor.disabled || ('calc' in descriptor);
    this.$input.notNull = descriptor.required;
};


TDETimeRange24.prototype.ev_inputChange = function () {
    this.flushValue(this.$input.value);
    var input;
    if (document.activeElement && AElement.prototype.isDescendantOf.call(document.activeElement, this.tableEditor.$view)) {
        input = $('input', this.$input);
        if (input) {
            input.focus();
            input.select();
        }
    }
};

TDEBase.typeClasses.TimeRange24 = TDETimeRange24;
TDEBase.typeClasses.timerange24 = TDETimeRange24;
TDEBase.typeClasses.time_period = TDETimeRange24;

export default TDETimeRange24;


