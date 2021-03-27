import OOP from "absol/src/HTML5/OOP";
import CellEditor from "./CellEditor";
import AElement from "absol/src/HTML5/AElement";
import {_, $} from '../../dom/SCore';


/***
 * @extends CellEditor
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function BooleanCellEditor(tableEditor, cell) {
    CellEditor.call(this, tableEditor, cell);
}

OOP.mixClass(BooleanCellEditor, CellEditor);

BooleanCellEditor.prototype.prepareInput = function () {
    var descriptor = this.cell.descriptor;

    this.$checkbox = _({
        tag: 'checkboxbutton',
        props: {
            checked: !!this.cell.value
        },
        on: {
            blur: this.ev_blur,
            change: this.ev_change
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
        child: this.$checkbox,
        on: {
            blur: this.ev_blur
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
};

BooleanCellEditor.prototype.waitAction = function () {
    CellEditor.prototype.waitAction.call(this);
    setTimeout(function () {
        this.$input.focus();
    }.bind(this), 100);
    this.$input.removeClass('asht-state-editing')
        .addClass('asht-state-wait-action');
    this.$input.on('keydown', this.ev_firstKey)
        .off('keydown', this.ev_finishKey)
        .on('dblclick', this.ev_dblClick);

};

BooleanCellEditor.prototype.startEditing = function () {
    CellEditor.prototype.startEditing.call(this);
    this.$input.addClass('asht-state-editing')
        .removeClass('asht-state-wait-action');
    this.$input.off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick);
    this.$input.on('keydown', this.ev_finishKey);
};

BooleanCellEditor.prototype.finish = function () {
    if (this._waitBlurTimeout > 0) clearTimeout(this._waitBlurTimeout);
    this.$input.off('keydown', this.ev_finishKey)
        .off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick)
        .off('blur', this.ev_blur);
    this.$checkbox.off('blur', this.ev_blur);
    CellEditor.prototype.finish.call(this);
};

/***
 *
 * @param {KeyboardEvent} event
 */
BooleanCellEditor.prototype.ev_firstKey = function (event) {
    if (event.key === "Delete") {
        this.cell.value = "";
    }
    else if (event.key === 'Enter' || event.key === 'F2') {
        this.$input.value = this.cell.value;
        this.startEditing();
        event.preventDefault();
    }
    else if (event.key.length === 1 || event.key === "Backspace") {
        this.startEditing();
    }
    else if (event.key === 'Tab') {
        this.editCellNext();
        event.preventDefault();
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

BooleanCellEditor.prototype.ev_finishKey = function (event) {
    if (event.key === "Tab" || event.key === "Enter") {
        this.editCellNext();
        event.preventDefault();
    }
};

BooleanCellEditor.prototype.ev_dblClick = function (event) {
    event.preventDefault();
    this.startEditing();
};

BooleanCellEditor.prototype.ev_blur = function (event) {
    if (this._waitBlurTimeout >= 0) clearTimeout(this._waitBlurTimeout);
    this._waitBlurTimeout = setTimeout(function () {
        this._waitBlurTimeout = -1;
        if (!document.activeElement
            || (this.$input !== document.activeElement
                && !AElement.prototype.isDescendantOf.call(document.activeElement, this.$input))) {
            //blur before finished
            this.finish();
        }
    }.bind(this), 100);
};

BooleanCellEditor.prototype.ev_change = function (event) {
    this.cell.value = this.$checkbox.checked;
    this.tableEditor.updateFixedTableEltPosition();
};

export default BooleanCellEditor;
