import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import {_, $} from '../../dom/SCore';


/***
 * @extends TDEBase
 * @constructor
 */
function TDEEnumSet() {
    TDEBase.apply(this, arguments);
}

OOP.mixClass(TDEEnumSet, TDEBase);


TDEEnumSet.prototype.prepareInput = function () {
    var descriptor = this.cell.descriptor;
    this.$input = _({
        tag: 'multiselectmenu',
        class: 'asht-enum-set-cell-editor-input',
        props: {
            items: descriptor.items,
            values: this.cell.value
        },
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
};


TDEEnumSet.prototype.ev_inputChange = function () {
    this.cell.value = this.$input.values;
    ResizeSystem.update();
};

TDEBase.typeClasses['{enum}'] = TDEEnumSet;
TDEBase.typeClasses.NumSet = TDEEnumSet;

export default TDEEnumSet;