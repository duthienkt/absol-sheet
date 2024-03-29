import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {_, $} from '../../dom/SCore';
import ResizeSystem from 'absol/src/HTML5/ResizeSystem';
import {isDifferent} from "../../util";


/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TDBase} cell
 * @constructor
 */
function TDETreeEnum(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDETreeEnum, TDEBase);

TDETreeEnum.prototype.prepareInput = function () {
    this.$input = _({
        tag: 'selecttreemenu',
        class: 'asht-cell-editor-input',
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};

TDETreeEnum.prototype.reload = function () {
    var preValue = this.cell.value;
    var descriptor = this.cell.descriptor;
    this.$input.items = descriptor.items;
    this.$input.value = this.cell.value;
    this.$input.enableSearch = descriptor.enableSearch || descriptor.searchable;
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
    if (isDifferent(preValue, this.$input.value)) {
        setTimeout(function () {
            if (isDifferent(preValue, this.$input.value)) {
                this.ev_inputChange();
            }
        }.bind(this), 0);
    }
};

TDETreeEnum.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style')
    };
};

TDETreeEnum.prototype.ev_inputChange = function () {
    this.flushValue(this.$input.value);
    ResizeSystem.update();
};


TDEBase.typeClasses.treeenum = TDETreeEnum;
TDEBase.typeClasses.TreeEnum = TDETreeEnum;

export default TDETreeEnum;
