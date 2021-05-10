import PreInput from "absol-acomp/js/PreInput";
import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import TextCellEditor from "./TextCellEditor";
import {_, $} from '../../dom/SCore';


/***
 * @extends TextCellEditor
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function TDENumber(tableEditor, cell) {
    TextCellEditor.call(this, tableEditor, cell);
}

OOP.mixClass(TDENumber, TextCellEditor);

TDENumber.prototype.prepareInput = function () {
    var descriptor = this.cell.descriptor;
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
            blur: this.ev_blur
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
};


TDENumber.prototype.waitAction = function () {
    TDEBase.prototype.waitAction.call(this);
    setTimeout(function () {
        this.$input.focus();
        this.$input.value = this.cell.value;
        this.$input.select();
    }.bind(this), 100);
    this.$input.removeClass('asht-state-editing')
        .addClass('asht-state-wait-action');
    this.$input.on('keydown', this.ev_firstKey)
        .off('keydown', this.ev_finishKey)
        .on('dblclick', this.ev_dblClick);
};

TDENumber.prototype.startEditing = function () {
    TDEBase.prototype.startEditing.call(this);
    this.$input.addClass('asht-state-editing')
        .removeClass('asht-state-wait-action');
    this.$input.off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick);
    this.$input.on('keydown', this.ev_finishKey);
};


/***
 *
 * @param {KeyboardEvent} event
 */
TDENumber.prototype.ev_firstKey = function (event) {
    if (event.key === "Delete") {
        this.cell.value = 0;
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

TDENumber.prototype.ev_finishKey = function (event) {
    if (event.key === "Enter"|| event.key === "Tab") {
        var text = this.$input.value;
        this.cell.value = parseFloat(text) || this.cell.value;
        this.tableEditor.updateFixedTableEltPosition();
        event.preventDefault();
        this.editCellNext();
    }
    else if (event.key === "Escape") {
        event.preventDefault();
        this.waitAction();
    }
};

TDENumber.prototype.ev_dblClick = function (event) {
    event.preventDefault();
    this.$input.value = this.cell.value;
    setTimeout(this.$input.focus.bind(this.$input), 100);
    this.startEditing();
};


TDENumber.prototype.ev_blur = function (event) {
    this.$editingbox.removeClass('as-status-focus');
    setTimeout(function () {
        if (this.$input !== document.activeElement) {
            //blur before finished
            var value = parseFloat(this.$input.value);
            if (isFinite(value))
                this.cell.value = value;
        }
    }.bind(this), 100);
};

TDENumber.prototype.ev_focus = TextCellEditor.prototype.ev_focus;

export default TDENumber;
