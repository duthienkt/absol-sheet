import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {getScreenSize, traceOutBoundingClientRect} from "absol/src/HTML5/Dom";
import SelectMenu from "absol-acomp/js/SelectMenu2";
import AElement from "absol/src/HTML5/AElement";
import {_, $} from '../../dom/SCore';
import TDEText from "./TDEText";


/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TDBase} cell
 * @constructor
 */
function TDEDate(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDEDate, TDEBase);

TDEDate.prototype.prepareInput = function () {
    this.$input = _({
        tag: 'dateinput',
        class: 'asht-date-cell-editor-input',
        on: {
            change: this.ev_inputChange
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
    this.$input.addStyle(this._cellStyle);
};

TDEDate.prototype._loadCellStyle = function () {
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
TDEDate.prototype.ev_firstKey = function (event) {
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

TDEDate.prototype.ev_blur = function (event) {
    this.$editingbox.removeClass('as-status-focus');
    if (this._waitBlurTimeout >= 0) clearTimeout(this._waitBlurTimeout);
    this._waitBlurTimeout = setTimeout(function () {
        this._waitBlurTimeout = -1;
        if (!document.activeElement
            || (this.$input.$input !== document.activeElement
                && !AElement.prototype.isDescendantOf.call(document.activeElement, this.$input))) {
            //blur before finished
        }
    }.bind(this), 100);
};

TDEDate.prototype.ev_inputChange = function () {
    this.cell.value = this.$input.value;
    this.$input.$input.focus();
    this.$input.$input.select();
};

TDEDate.prototype.ev_focus = TDEText.prototype.ev_focus;
TDEBase.typeClasses.time = TDEDate;
TDEBase.typeClasses.time = TDEDate;

export default TDEDate;
