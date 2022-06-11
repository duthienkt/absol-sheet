import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import TDEText from "./TDEText";
import { _, $ } from '../../dom/SCore';
import ResizeSystem from "absol/src/HTML5/ResizeSystem";


/***
 * @extends TDEText
 * @param {TableEditor} tableEditor
 * @param {TDEBase} cell
 * @constructor
 */
function TDENumber(tableEditor, cell) {
    TDEText.call(this, tableEditor, cell);
}

OOP.mixClass(TDENumber, TDEText);

TDENumber.prototype.prepareInput = function () {
    /***
     * @type {PreInput}
     */
    this.$input = _({
        tag: 'input',
        attr: {
            type: 'number'
        },
        class: 'asht-cell-editor-input',
        on: {
            change: this.ev_inputChange,
            keydown: this.ev_keydown
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};

TDENumber.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style'),
        'line-height': cellElt.getComputedStyleValue('line-height'),
        'padding-left': cellElt.getComputedStyleValue('padding-left'),
        'padding-right': cellElt.getComputedStyleValue('padding-right'),
        'padding-top': cellElt.getComputedStyleValue('padding-top'),
        'padding-bottom': cellElt.getComputedStyleValue('padding-bottom'),
        'text-align': cellElt.getComputedStyleValue('text-align')
    };
};

TDENumber.prototype.reload = function () {
    var descriptor = this.cell.descriptor;
    if (descriptor.step) this.$input.step = descriptor.step;
    var min = -Infinity;
    var max = Infinity;
    if (!isNaN(descriptor.min) && isFinite(descriptor.min)) {
        min = descriptor.min;
    }
    if (!isNaN(descriptor.max) && isFinite(descriptor.max)) {
        max = descriptor.max;
    }
    var value = this.cell.value;
    if (typeof value !== "number" || isNaN(value)) value = '';
    this.$input.value = value;
    this.$input.min = min;
    this.$input.max = max;
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
};


TDENumber.prototype.onStart = function () {
    setTimeout(function () {
        this.$input.focus();
        var value = this.cell.value;
        if (typeof value !== "number" || isNaN(value)) value = '';
        this.$input.value = value;
        this.$input.select();
    }.bind(this), 5);
};


TDENumber.prototype.ev_keydown = function (event) {
    if (event.key === "Enter" || event.key === "Tab") {
        var text = this.$input.value;
        var min = -Infinity;
        var max = Infinity;
        var descriptor = this.cell.descriptor;
        if (!isNaN(descriptor.min) && isFinite(descriptor.min)) {
            min = descriptor.min;
        }
        if (!isNaN(descriptor.max) && isFinite(descriptor.max)) {
            max = descriptor.max;
        }
        var value = parseFloat(text);
        if (!isNaN(value)) {
            value = Math.max(min, Math.min(max, value));
            this.flushValue(value);
        }

        this.tableEditor.updateFixedTableEltPosition();
        event.preventDefault();
        this.editCellNext();
    }
};


TDENumber.prototype.ev_inputChange = function () {
    var text = this.$input.value;
    var min = -Infinity;
    var max = Infinity;
    var descriptor = this.cell.descriptor;
    if (!isNaN(descriptor.min) && isFinite(descriptor.min)) {
        min = descriptor.min;
    }
    if (!isNaN(descriptor.max) && isFinite(descriptor.max)) {
        max = descriptor.max;
    }
    var value = parseFloat(text);
    if (!isNaN(value)) {
        value = Math.max(min, Math.min(max, value));
        this.flushValue(value);
    }

    ResizeSystem.update();
};

TDEBase.typeClasses.number = TDENumber;
TDEBase.typeClasses.Number = TDENumber;
TDEBase.typeClasses.UniqueNumber = TDENumber;
TDEBase.typeClasses.unique_number = TDENumber;
TDEBase.typeClasses['unique<number>'] = TDENumber;


export default TDENumber;
