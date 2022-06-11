import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {getScreenSize, traceOutBoundingClientRect} from "absol/src/HTML5/Dom";
import SelectMenu from "absol-acomp/js/SelectMenu2";
import AElement from "absol/src/HTML5/AElement";
import {_, $} from '../../dom/SCore';
import TDEText from "./TDEText";
import {parseDateString} from "absol/src/Time/datetime";
import TDEDate from "./TDEDate";


/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TDBase} cell
 * @constructor
 */
function TDETime(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDETime, TDEBase);

TDETime.prototype.prepareInput = function () {
    this.$input = _({
        tag: 'timeinput',
        class: 'asht-date-cell-editor-input',
        props:{
          format: 'hh:mm a'
        },
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};



TDETime.prototype.reload = function () {
    var value = this.cell.value;
    var descriptor = this.cell.descriptor;
    var timeValue = this.cell.implicit(value);
    if (typeof timeValue !== "number") timeValue = 0;

    this.$input.dayOffset = timeValue;
    this.$input.disabled = descriptor.readOnly || ('calc' in descriptor);
};

TDETime.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style')
    };
};

/***
 *
 * @param {KeyboardEvent} event
 */
TDETime.prototype.ev_firstKey = function (event) {
    if (event.key === "Delete") {
        this.cell.value = "";
    }
    else if (event.key === 'Enter' || event.key === 'F2') {
        this.$input.value = this.cell.value;
        this.startEditing();
        event.preventDefault();
    }
    else if (event.key === 'Tab') {
        this.editCellNext();
        event.preventDefault();
    }
    else if (event.key.length === 1 || event.key === "Backspace") {
        this.startEditing();
    }
    else if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        switch (event.key) {
            case "ArrowLeft":
                this.editCellLeft();
                break;
            case "ArrowRight":
                this.editCellRight();
                break;
            case "ArrowUp":
                this.editCellAbove();
                break;
            case "ArrowDown":
                this.editCellBellow();
                break;
        }
    }
};



// TODO: handle enter key, blur

TDETime.prototype.ev_blur = function (event) {
    this.$editingbox.removeClass('as-status-focus');
    if (this._waitBlurTimeout >= 0) clearTimeout(this._waitBlurTimeout);
    this._waitBlurTimeout = setTimeout(function () {
        this._waitBlurTimeout = -1;
        if (!document.activeElement
            || (this.$input.$text !== document.activeElement
                && !AElement.prototype.isDescendantOf.call(document.activeElement, this.$input))) {
            //blur before finished
        }
    }.bind(this), 100);
};

TDETime.prototype.ev_inputChange = function () {
    this.flushValue(this.$input.dayOffset)
    this.$input.$text.focus();
    this.$input.$text.select();
};

TDETime.prototype.ev_focus = TDEText.prototype.ev_focus;
TDEBase.typeClasses.time = TDETime;
TDEBase.typeClasses.time = TDETime;

export default TDETime;
