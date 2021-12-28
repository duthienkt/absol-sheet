import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {_, $} from '../../dom/SCore';
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import {isDifferent} from "../../util";


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
        attr: {
            'data-strict-value': 'true'
        },
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

TDEEnum.prototype.reload = function () {
    var prevValue = this.cell.value;
    var descriptor = this.cell.descriptor;
    this.$input.items = descriptor.items;
    this.$input.value = this.cell.value;
    this.$input.disabled = descriptor.readOnly;
    this.$input.enableSearch = descriptor.enableSearch || descriptor.searchable;


    if (this.$input.items && this.$input.items.length > 0 && isDifferent(prevValue, this.$input.value)) {
        setTimeout(function () {
            if (isDifferent(prevValue, this.$input.value)) {
                this.ev_inputChange();
            }
        }.bind(this), 0);
    }
};

TDEEnum.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style')
    };
};

TDEEnum.prototype.ev_inputChange = function () {
    this.cell.value = this.$input.value;
    ResizeSystem.update();
};


TDEBase.typeClasses.enum = TDEEnum;

export default TDEEnum;
