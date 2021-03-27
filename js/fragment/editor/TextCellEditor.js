import PreInput from "absol-acomp/js/PreInput";
import OOP from "absol/src/HTML5/OOP";
import CellEditor from "./CellEditor";
import {_, $} from '../../dom/SCore';

/***
 * @extends CellEditor
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function TextCellEditor(tableEditor, cell) {
    CellEditor.call(this, tableEditor, cell);
}

OOP.mixClass(TextCellEditor, CellEditor);

TextCellEditor.prototype.prepareInput = function () {
    /***
     * @type {PreInput}
     */
    this.$input = _({
        tag: PreInput.tag,
        class: 'asht-cell-editor-input',
        on: {
            blur: this.ev_blur,
            focus: this.ev_focus
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
    this._loadCellStyle();
};

TextCellEditor.prototype._loadCellStyle = function () {
    var cellElt = this.cell.elt;
    this._cellStyle = {
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style'),
        'line-height': cellElt.getComputedStyleValue('line-height'),
        'padding-left': cellElt.getComputedStyleValue('padding-left'),
        'padding-right': cellElt.getComputedStyleValue('padding-right'),
        'padding-top': cellElt.getComputedStyleValue('padding-top'),
        'padding-bottom': cellElt.getComputedStyleValue('padding-bottom'),
        'text-align': cellElt.getComputedStyleValue('text-align'),
    };
};

TextCellEditor.prototype.waitAction = function () {
    CellEditor.prototype.waitAction.call(this);
    setTimeout(function () {
        var text = this.cell.value || '';
        this.$input.focus();
        this.$input.applyData(text, { start: 0, end: text.length });
    }.bind(this), 100);
    this.$input.removeClass('asht-state-editing')
        .addClass('asht-state-wait-action');
    this.$input.on('keydown', this.ev_firstKey)
        .off('keydown', this.ev_finishKey)
        .on('dblclick', this.ev_dblClick);
};

TextCellEditor.prototype.startEditing = function () {
    CellEditor.prototype.startEditing.call(this);
    this.$input.addClass('asht-state-editing')
        .removeClass('asht-state-wait-action');
    this.$input.off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick);
    this.$input.addStyle(this._cellStyle);
    this.$input.on('keydown', this.ev_finishKey);
};

TextCellEditor.prototype.finish = function () {
    this.$input.off('keydown', this.ev_finishKey)
        .off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick)
        .off('blur', this.ev_focus)
        .off('blur', this.ev_blur);
    CellEditor.prototype.finish.call(this);
};

/***
 *
 * @param {KeyboardEvent} event
 */
TextCellEditor.prototype.ev_firstKey = function (event) {
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

TextCellEditor.prototype.ev_finishKey = function (event) {
    if (event.key === "Enter" || event.key === "Tab") {
        var text = this.$input.value;
        if (event.altKey && event.key === "Enter") {
            var pos = this.$input.getSelectPosition();
            var newText = text.substr(0, pos.start) + '\n' + text.substr(pos.end);
            this.$input.applyData(newText, pos.start + 1);
            this.$input.waitToCommit(newText, pos.start + 1);
        }
        else {
            this.cell.value = text;
            this.tableEditor.updateFixedTableEltPosition();
            this.editCellNext();
        }
        event.preventDefault();
    }
    else if (event.key === "Escape") {
        event.preventDefault();
        this.waitAction();
    }
};

TextCellEditor.prototype.ev_dblClick = function (event) {
    event.preventDefault();
    this.$input.value = this.cell.value;
    setTimeout(this.$input.focus.bind(this.$input), 100);
    this.startEditing();
};

TextCellEditor.prototype.ev_blur = function (event) {
    this.$editingbox.removeClass('as-status-focus');
    setTimeout(function () {
        if (this.$input !== document.activeElement) {
            //blur before finished
            this.cell.value = this.$input.value;
        }
    }.bind(this), 100);
};

TextCellEditor.prototype.ev_focus = function () {
    this.$editingbox.addClass('as-status-focus');
};


export default TextCellEditor;
