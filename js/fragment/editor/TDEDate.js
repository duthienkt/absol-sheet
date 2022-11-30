import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {_, $} from '../../dom/SCore';
import TDEText from "./TDEText";
import {LOCAL_DATE_FORMAT, parseDateString} from "absol/src/Time/datetime";
import AElement from "absol/src/HTML5/AElement";


/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TDBase} cell
 * @constructor
 */
function TDEDate(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDEDate, TDEBase);

TDEDate.prototype.prepareInput = function () {
    this.$input = _({
        tag: 'dateinput',
        class: 'asht-date-cell-editor-input',
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};


TDEDate.prototype.reload = function () {
    var value = this.cell.value;
    var descriptor = this.cell.descriptor;
    var dateValue = this.cell.implicit(value);
    if (typeof value === "string") {
        dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
            dateValue = parseDateString(value, descriptor.format || 'dd/mm/yyyy');
        }
        if (isNaN(dateValue.getTime())) {
            dateValue = null;
        }
    }
    this.$input.format = descriptor.format || "dd/mm/yyyy";
    this.$input.value = dateValue;
    this.$input.min = descriptor.min || new Date(1890, 0, 1);
    this.$input.max = descriptor.max || new Date(2090, 0, 1);
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
};

TDEDate.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style')
    };
};

TDEDate.prototype.ev_inputChange = function () {
    this.flushValue(this.$input.value);
    if (document.activeElement && AElement.prototype.isDescendantOf.call(document.activeElement, this.tableEditor.$view)) {
        this.$input.$input.focus();
        this.$input.$input.select();
    }
};

TDEDate.prototype.ev_focus = TDEText.prototype.ev_focus;
TDEBase.typeClasses.date = TDEDate;
TDEBase.typeClasses.Date = TDEDate;

export default TDEDate;
