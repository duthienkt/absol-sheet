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
            blur: this.ev_blur,
            focus: this.ev_focus
        }
    });
    this.$editingbox.clearChild()
        .addChild(this.$input);
};

TDEBoolean.prototype.waitAction = function () {
    TDEBase.prototype.waitAction.call(this);
    setTimeout(function () {
        this.$input.focus();
    }.bind(this), 100);
    this.$input.removeClass('asht-state-editing')
        .addClass('asht-state-wait-action');
    this.$input.on('keydown', this.ev_firstKey)
        .off('keydown', this.ev_finishKey)
        .on('dblclick', this.ev_dblClick);

};

TDEBoolean.prototype.startEditing = function () {
    TDEBase.prototype.startEditing.call(this);
    this.$input.addClass('asht-state-editing')
        .removeClass('asht-state-wait-action');
    this.$input.off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick);
    this.$input.on('keydown', this.ev_finishKey);
};

TDEBoolean.prototype.finish = function () {
    if (this.state === "FINISHED") return;
    if (this._waitBlurTimeout > 0) clearTimeout(this._waitBlurTimeout);
    this.$input.off('keydown', this.ev_finishKey)
        .off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick)
        .off('blur', this.ev_blur)
        .off('focus', this.ev_focus);
    this.$checkbox.off('focus', this.ev_focus)
        .off('blur', this.ev_blur);
    TDEBase.prototype.finish.call(this);
};

/***
 *
 * @param {KeyboardEvent} event
 */
TDEBoolean.prototype.ev_firstKey = function (event) {
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

TDEBoolean.prototype.ev_finishKey = function (event) {
    if (event.key === "Tab" || event.key === "Enter") {
        this.editCellNext();
        event.preventDefault();
    }
};

TDEBoolean.prototype.ev_dblClick = function (event) {
    event.preventDefault();
    this.startEditing();
};

TDEBoolean.prototype.ev_blur = function (event) {
    if (this._waitBlurTimeout >= 0) clearTimeout(this._waitBlurTimeout);
    this._waitBlurTimeout = setTimeout(function () {
        this._waitBlurTimeout = -1;
        if (!document.activeElement
            || (this.$input !== document.activeElement
                && !AElement.prototype.isDescendantOf.call(document.activeElement, this.$input))) {
            //blur before finished
            this.$editingbox.removeClass('as-status-focus');
        }
    }.bind(this), 100);
};

TDEBoolean.prototype.ev_change = function (event) {
    this.cell.value = this.$checkbox.checked;
    this.tableEditor.updateFixedTableEltPosition();
};

TDEBoolean.prototype.ev_focus = TDEText.prototype.ev_focus;

TDEBase.typeClasses.bool = TDEBoolean;
TDEBase.typeClasses.boolean = TDEBoolean;

export default TDEBoolean;
