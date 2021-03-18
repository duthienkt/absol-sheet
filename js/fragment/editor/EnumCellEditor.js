import OOP from "absol/src/HTML5/OOP";
import CellEditor from "./CellEditor";
import {getScreenSize, traceOutBoundingClientRect} from "absol/src/HTML5/Dom";
import SelectMenu from "absol-acomp/js/SelectMenu2";
import AElement from "absol/src/HTML5/AElement";


/***
 * @extends CellEditor
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function EnumCellEditor(tableEditor, cell) {
    CellEditor.call(this, tableEditor, cell);
}

OOP.mixClass(EnumCellEditor, CellEditor);

EnumCellEditor.prototype.prepareInput = function () {
    var descriptor = this.cell.descriptor;
    this.$selectlistBox = _({
        tag: 'selectlistbox',
        props: {
            anchor: [1, 6, 2, 5],
            items: descriptor.items
        },
        on: {
            preupdateposition: this.ev_preUpdateListPosition,
            blur: this.ev_blur
        }
    });

    this.$selectlistBox.on('pressitem', this.ev_selectListBoxPressItem);
    /***
     * @type {Button ||AElement}
     */
    this.$input = _({
        tag: 'button',
        class: 'asht-cell-editor-input',
        child: {
            text: (descriptor.__val2Item__[this.cell.value] && descriptor.__val2Item__[this.cell.value].text) || ""
        },
        on: {
            blur: this.ev_blur
        }
    });
    /*


        this.$selectlistBox.followTarget = this.$input;
        */
    this._loadCellStyle();
    this.$editingbox.clearChild()
        .addChild(this.$input);
};

EnumCellEditor.prototype._loadCellStyle = function () {
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

EnumCellEditor.prototype.waitAction = function () {
    CellEditor.prototype.waitAction.call(this);
    setTimeout(function () {
        this.$input.focus();
    }.bind(this), 100);
    this.$input.removeClass('asht-state-editing')
        .addClass('asht-state-wait-action');
    this.$input.on('keydown', this.ev_firstKey)
        .off('keydown', this.ev_finishKey)
        .on('dblclick', this.ev_dblClick);
    this.$selectlistBox.followTarget = null;
    this.$selectlistBox.remove();
};

EnumCellEditor.prototype.startEditing = function () {
    CellEditor.prototype.startEditing.call(this);
    this.$input.addClass('asht-state-editing')
        .removeClass('asht-state-wait-action');
    this.$input.off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick);
    this.$input.addStyle(this._cellStyle);
    this.$input.on('keydown', this.ev_finishKey);
    this.$selectlistBox.on('keydown', this.ev_finishKey);

    this.$selectlistBox.addTo(document.body);
    this.$selectlistBox.followTarget = this.$input;
};

EnumCellEditor.prototype.finish = function () {
    if (this._waitBlurTimeout > 0) clearTimeout(this._waitBlurTimeout);
    this.$input.off('keydown', this.ev_finishKey)
        .off('keydown', this.ev_firstKey)
        .off('dblclick', this.ev_dblClick)
        .off('blur', this.ev_blur);
    this.$selectlistBox.off('keydown', this.ev_finishKey)
        .off('blur', this.ev_blur);
    CellEditor.prototype.finish.call(this);
    this.$selectlistBox.followTarget = null;
    this.$selectlistBox.remove();
};

/***
 *
 * @param {KeyboardEvent} event
 */
EnumCellEditor.prototype.ev_firstKey = function (event) {
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

EnumCellEditor.prototype.ev_finishKey = function (event) {
    if (event.key === "Tab") {
        this.editCellNext();
        event.preventDefault();
    }
};

EnumCellEditor.prototype.ev_dblClick = function (event) {
    event.preventDefault();
    this.startEditing();
};

EnumCellEditor.prototype.ev_blur = function (event) {
    if (this._waitBlurTimeout >= 0) clearTimeout(this._waitBlurTimeout);
    this._waitBlurTimeout = setTimeout(function () {
        this._waitBlurTimeout = -1;
        if (!document.activeElement
            || (this.$input !== document.activeElement
                && !AElement.prototype.isDescendantOf.call(document.activeElement, this.$selectlistBox))) {
            //blur before finished
            this.finish();
        }
    }.bind(this), 100);
};

EnumCellEditor.prototype.ev_preUpdateListPosition = function () {
    var bound = this.$input.getBoundingClientRect();
    var screenSize = getScreenSize();
    var availableTop = bound.top - 5;
    var availableBot = screenSize.height - 5 - bound.bottom;
    this.$selectlistBox.addStyle('--max-height', Math.max(availableBot, availableTop) + 'px');
    var outBound = traceOutBoundingClientRect(this.$input);
    if (bound.bottom < outBound.top || bound.top > outBound.bottom || bound.right < outBound.left || bound.left > outBound.right) {
        if (this.$selectlistBox.isDescendantOf(document.body)) {
            setTimeout(this.waitAction.bind(this), 0)
        }
    }
};

EnumCellEditor.prototype.ev_selectListBoxPressItem = function (event) {
    this.$input.firstChild.data = this.cell.descriptor.__val2Item__[event.value].text;
    this.cell.value = event.value;
    this.tableEditor.updateFixedTableEltPosition();
    this.waitAction();
};

export default EnumCellEditor;