import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import { _ } from "../../dom/SCore";
import TDEDate from "./TDEDate";
import { parseDateTime } from "absol/src/Time/datetime";
import AElement from "absol/src/HTML5/AElement";


/***
 * @extends TDEDate
 * @constructor
 */
function TDEDateTime() {
    TDEDate.apply(this, arguments);
}

OOP.mixClass(TDEDateTime, TDEDate);

TDEDateTime.prototype.prepareInput = function () {
    this.$input = _({
        tag: 'datetimeinput',
        class: ["asht-cell-editor-input", 'asht-date-time-cell-editor-input'],
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};

TDEDateTime.prototype.reload = function () {
    var value = this.cell.value;
    var descriptor = this.cell.descriptor;
    var dateValue;
    if (typeof value === "string") {
        dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
            try {
                dateValue = parseDateTime(value, descriptor.format || 'dd/mm/yyyy hh:mm a');

            }
            catch (e){
                dateValue = null;
            }
        }
    }
    else if (value instanceof Date) {
        dateValue = value;
    }
    this.$input.value = dateValue;
    this.$input.disabled = descriptor.readOnly;
    this.$input.min = descriptor.min || new Date(1890, 0, 1);
    this.$input.max = descriptor.max || new Date(2090, 0, 1);
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
};


TDEDateTime.prototype.ev_inputChange = function () {
    this.flushValue(this.$input.value)
    if (document.activeElement && AElement.prototype.isDescendantOf.call(document.activeElement, this.tableEditor.$view)){
        this.$input.$input.focus();
        this.$input.$input.select();
    }
};

TDEBase.typeClasses.datetime = TDEDateTime;
TDEBase.typeClasses.DateTime = TDEDateTime;

export default TDEDateTime;


