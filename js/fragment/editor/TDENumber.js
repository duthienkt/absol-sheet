import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import TDEText from "./TDEText";
import {_, $} from '../../dom/SCore';


/***
 * @extends TDEText
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
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
        'padding-top': cellElt.getComputedStyleValue('padding-top'),
        'padding-bottom': cellElt.getComputedStyleValue('padding-bottom'),
        'text-align': cellElt.getComputedStyleValue('text-align'),
    };
};

TDENumber.prototype.load = function () {
    var descriptor = this.cell.descriptor;
    if (descriptor.step) this.$input.step = descriptor.step;
    this.$input.value = this.cell.value;
};

TDENumber.prototype.onStart = function (){
    setTimeout(function () {
        this.$input.focus();
        this.$input.value = this.cell.value;
        this.$input.select();
    }.bind(this), 5);
};





TDENumber.prototype.ev_keydown = function (event) {
    if (event.key === "Enter" || event.key === "Tab") {
        var text = this.$input.value;
        this.cell.value = parseFloat(text) || this.cell.value;
        this.tableEditor.updateFixedTableEltPosition();
        event.preventDefault();
        this.editCellNext();
    }
};

TDEBase.typeClasses.number = TDENumber;
TDEBase.typeClasses.Number = TDENumber;


export default TDENumber;
