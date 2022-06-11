import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import AElement from "absol/src/HTML5/AElement";
import {_, $} from '../../dom/SCore';
import TDEText from "./TDEText";


/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function TDEBoolean(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDEBoolean, TDEBase);

TDEBoolean.prototype.prepareInput = function () {
    var descriptor = this.cell.descriptor;
    this.$checkbox = _({
        tag: 'checkboxbutton',
        props: {
            checked: !!this.cell.value
        },
        on: {
            change: this.ev_checkboxChange
        }
    });
    /***
     * @type {Button ||AElement}
     */
    this.$input = _({
        attr: {
            tabindex: '1'
        },
        class: ['asht-cell-editor-input', 'asht-boolean-cell-editor-input'],
        child: this.$checkbox
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
};

TDEBoolean.prototype.reload = function () {
    this.$checkbox.disabled = !!this.cell.descriptor.readOnly|| ('calc' in this.cell.descriptor);
    this.$checkbox.checked = this.cell.value;
};




TDEBoolean.prototype.ev_checkboxChange = function (event) {
    this.flushValue(this.$checkbox.checked);
};

TDEBase.typeClasses.bool = TDEBoolean;
TDEBase.typeClasses.boolean = TDEBoolean;

export default TDEBoolean;
