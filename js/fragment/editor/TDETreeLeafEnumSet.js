import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import {_, $} from '../../dom/SCore';
import MultiCheckTreeLeafMenu from "absol-acomp/js/MultiCheckTreeLeafMenu";


/***
 * @extends TDEBase
 * @constructor
 */
function TDETreeLeafEnumSet() {
    TDEBase.apply(this, arguments);
}

OOP.mixClass(TDETreeLeafEnumSet, TDEBase);


TDETreeLeafEnumSet.prototype.prepareInput = function () {
    var descriptor = this.cell.descriptor;
    this.$input = _({
        tag: MultiCheckTreeLeafMenu,
        class: 'asht-enum-set-cell-editor-input',
        style:{
            'min-width:': 'var(--cell-width)'  //todo: quick fix
        },
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


TDETreeLeafEnumSet.prototype.reload = function (){
    var descriptor = this.cell.descriptor;
    this.$input.items = descriptor.items;
    this.$input.values = this.cell.value;
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
    this.$input.enableSearch = descriptor.enableSearch || descriptor.searchable;
};

TDETreeLeafEnumSet.prototype.ev_inputChange = function () {
    this.flushValue(this.$input.values.slice());
    ResizeSystem.update();
};

TDEBase.typeClasses['{treeleafenum}'] = TDETreeLeafEnumSet;
TDEBase.typeClasses['TreeLeafEnumSet'] = TDETreeLeafEnumSet;

export default TDETreeLeafEnumSet;