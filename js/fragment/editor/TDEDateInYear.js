import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import { _, $ } from "../../dom/SCore";
import TDEDate from "./TDEDate";
import { parseDateTime } from "absol/src/Time/datetime";
import AElement from "absol/src/HTML5/AElement";
import DateInYearInput from "absol-acomp/js/DateInYearInput";


/***
 * @extends TDEDate
 * @constructor
 */
function TDEDateInYear() {
    TDEDate.apply(this, arguments);
}

OOP.mixClass(TDEDateInYear, TDEDate);

TDEDateInYear.prototype.prepareInput = function () {
    this.$input = _({
        tag: DateInYearInput,
        class: ["asht-cell-editor-input", 'asht-date-in-year-cell-editor-input'],
        props: {
            format: 'dd/MM'
        },
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};

TDEDateInYear.prototype.reload = function () {
    var value = this.cell.value;
    var descriptor = this.cell.descriptor;
    var dIYYValue;
    if (typeof value === "string") {
        dIYYValue = new Date(value);
        if (isNaN(dIYYValue.getTime())) {
            try {
                dIYYValue = parseDateTime(value+'/2000', (descriptor.format || 'dd/MM')+'/yyyy');

            } catch (e) {
                dIYYValue = null;
            }
        }
    }
    if (value instanceof Date) {
        dIYYValue = {date: value.getDate(), month: value.getMonth()};
    }

    this.$input.value = dIYYValue;
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
};


TDEDateInYear.prototype.ev_inputChange = function () {
    this.flushValue(this.$input.value)
    var inputElt;
    if (document.activeElement && AElement.prototype.isDescendantOf.call(document.activeElement, this.tableEditor.$view)) {
        inputElt = $('input', this.$input);
        if (inputElt) {
            inputElt.focus();
            inputElt.select();
        }
    }
};

TDEBase.typeClasses.DateInYearInput = TDEDateInYear;
TDEBase.typeClasses.DateInYear = TDEDateInYear;

export default TDEDateInYear;


