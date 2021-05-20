import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {_, $} from '../../dom/SCore';


/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function TDEEnum(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDEEnum, TDEBase);

TDEEnum.prototype.prepareInput = function () {
    this.$input = _({
        tag: 'selectmenu',
        class: 'asht-cell-editor-input',
        on:{
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};

TDEEnum.prototype.reload = function () {
    var descriptor = this.cell.descriptor;
    this.$input.items = descriptor.items;
    this.$input.value = this.cell.value;

}

TDEEnum.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style')
    };
};

TDEEnum.prototype.ev_inputChange = function (){
    this.cell.value = this.$input.value;
};


TDEBase.typeClasses.enum = TDEEnum;

export default TDEEnum;
