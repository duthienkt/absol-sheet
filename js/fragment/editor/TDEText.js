import PreInput from "absol-acomp/js/PreInput";
import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {_, $} from '../../dom/SCore';
import ResizeSystem from "absol/src/HTML5/ResizeSystem";

/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TDEBase} cell
 * @constructor
 */
function TDEText(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDEText, TDEBase);

TDEText.prototype.prepareInput = function () {
    /***
     * @type {PreInput}
     */
    this.$input = _({
        tag: PreInput.tag,
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

TDEText.prototype._loadCellStyle = function () {
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
        'text-align': cellElt.getComputedStyleValue('text-align'),
    };
};

TDEText.prototype.onStart = function () {
    // console.log('start');
};

TDEText.prototype.reload = function () {
    var descriptor = this.cell.descriptor;
    this.$input.value = this.cell.value;
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
};

TDEText.prototype.onStart = function () {
    setTimeout(function () {
        this.$input.focus();
        var text = this.$input.value;
        this.$input.applyData(text, { start: text.length, end: text.length });
    }.bind(this), 5);
};


/***
 *
 * @param {KeyboardEvent} event
 */
TDEText.prototype.ev_keydown = function (event) {
    if (event.key === "Enter" || event.key === "Tab") {
        var text = this.$input.value;
        if (event.altKey && event.key === "Enter") {
            var pos = this.$input.getSelectPosition();
            var newText = text.substr(0, pos.start) + '\n' + text.substr(pos.end);
            this.$input.applyData(newText, pos.start + 1);
            this.$input.waitToCommit(newText, pos.start + 1);
        }
        else {
            this.cell.value = text;
            this.tableEditor.updateFixedTableEltPosition();
            this.editCellNext();
        }
        event.preventDefault();
    }
};


TDEText.prototype.ev_inputChange = function () {
    this.cell.value = this.$input.value;
    ResizeSystem.update();
};


TDEBase.typeClasses.string = TDEText;
TDEBase.typeClasses.text = TDEText;

export default TDEText;
