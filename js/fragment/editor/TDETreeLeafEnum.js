import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {_, $} from '../../dom/SCore';
import TDETreeEnum from "./TDETreeEnum";


/***
 * @extends TDTreeEnum
 * @param {TableEditor} tableEditor
 * @param {TDBase} cell
 * @constructor
 */
function TDETreeLeafEnum(tableEditor, cell) {
    TDETreeEnum.apply(this, arguments);
}

OOP.mixClass(TDETreeLeafEnum, TDETreeEnum);

TDETreeLeafEnum.prototype.prepareInput = function () {
    this.$input = _({
        tag: 'selecttreeleafmenu',
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


TDEBase.typeClasses.treeleafenum = TDETreeLeafEnum;
TDEBase.typeClasses.TreeLeafEnum = TDETreeLeafEnum;

export default TDETreeLeafEnum;
