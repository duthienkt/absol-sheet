import PreInput from "absol-acomp/js/PreInput";
import OOP from "absol/src/HTML5/OOP";
import TDEBase from "./TDEBase";
import {_, $} from '../../dom/SCore';

/***
 * @extends TDEBase
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function TDEText(tableEditor, cell) {
    TDEBase.call(this, tableEditor, cell);
}

OOP.mixClass(TDEText, TDEBase);

TDEText.prototype.prepareInput = function () {
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

TDEText.prototype._loadCellStyle = function () {
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

TDEText.prototype.waitAction = function () {
    TDEBase.prototype.waitAction.call(this);
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

TDEText.prototype.startEditing = function () {
    TDEBase.prototype.startEditing.call(this);
    this.$input.addClass('asht-state-editing')
        .removeClass('asht-state-wait-action');
    this.$input.off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick);
    this.$input.addStyle(this._cellStyle);
    this.$input.on('keydown', this.ev_finishKey);
};

TDEText.prototype.finish = function () {
    if (this.state === "FINISHED") return;
    this.$input.off('keydown', this.ev_finishKey)
        .off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick)
        .off('blur', this.ev_focus)
        .off('blur', this.ev_blur);
    TDEBase.prototype.finish.call(this);
};

/***
 *
 * @param {KeyboardEvent} event
 */
TDEText.prototype.ev_firstKey = function (event) {
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

TDEText.prototype.ev_finishKey = function (event) {
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

TDEText.prototype.ev_dblClick = function (event) {
    event.preventDefault();
    this.$input.value = this.cell.value;
    setTimeout(this.$input.focus.bind(this.$input), 100);
    this.startEditing();
};

TDEText.prototype.ev_blur = function (event) {
    this.$editingbox.removeClass('as-status-focus');
    setTimeout(function () {
        if (this.$input !== document.activeElement) {
            //blur before finished
            this.cell.value = this.$input.value;
        }
    }.bind(this), 100);
};

TDEText.prototype.ev_focus = function () {
    this.$editingbox.addClass('as-status-focus');
};


export default TDEText;
