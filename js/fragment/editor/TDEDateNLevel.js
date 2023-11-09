import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import { _, $ } from '../../dom/SCore';
import TDEText from "./TDEText";
import DateNLevelInput from "absol-acomp/js/DateNLevelInput";


/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TDBase} cell
 * @constructor
 */
function TDEDateNLevel(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDEDateNLevel, TDEBase);

TDEDateNLevel.prototype.prepareInput = function () {
    this.$input = _({
        tag: DateNLevelInput,
        class: 'asht-date-n-level-cell-editor-input',
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};


TDEDateNLevel.prototype.reload = function () {
    var descriptor = this.cell.descriptor;
    var value = this.cell.implicit(this.cell.value);
    if (value) {
        this.$input.level = value.level;
        this.$input.value = value.value;
    }
    else {
        this.$input.value = null;
        this.$input.level = 'date';
    }
    this.$input.min = descriptor.min || new Date(1890, 0, 1);
    this.$input.max = descriptor.max || new Date(2090, 0, 1);
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
};

TDEDateNLevel.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style')
    };
};

TDEDateNLevel.prototype.ev_inputChange = function () {
    var dateValue = this.$input.value;
    var value;
    if (!dateValue) value = undefined;
    else value = { value: dateValue, level: this.$input.level };
    this.flushValue(value);
    // if (document.activeElement && AElement.prototype.isDescendantOf.call(document.activeElement, this.tableEditor.$view)) {
    //     this.$input.$input.focus();
    //     this.$input.$input.select();
    // }
};

TDEDateNLevel.prototype.ev_focus = TDEText.prototype.ev_focus;
TDEBase.typeClasses.DateNLevel = TDEDateNLevel;
TDEBase.typeClasses.datenlevel = TDEDateNLevel;

export default TDEDateNLevel;
