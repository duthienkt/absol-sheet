import '../../css/tableeditable.css';
import { _, $ } from "../dom/SCore";
import TableData from "../viewer/TableData";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import "./editor/TDEText";
import "./editor/TDENumber";
import "./editor/TDEDate";
import "./editor/TDEDateTime";
import "./editor/TDEEnum";
import "./editor/TDEEnumSet";
import "./editor/TDEBoolean";
import "./editor/TDETreeEnum";
import "./editor/TDETreeLeafEnum";
import "./editor/TDETime";
import "./editor/TDETimeRange24";
import "./editor/TDEWeek";
import "./editor/TDEDateNLevel";
import "absol-acomp/js/BContextCapture";
import ContextCaptor from 'absol-acomp/js/ContextMenu';
import OOP from "absol/src/HTML5/OOP";
import EventEmitter, { hitElement } from "absol/src/HTML5/EventEmitter";
import TDEBase from "./editor/TDEBase";
import Toast from "absol-acomp/js/Toast";
import TDRecord from "../viewer/TDRecord";
import DomSignal from "absol/src/HTML5/DomSignal";
import { selectRowHeight } from "./dialogs";
import noop from "absol/src/Code/noop";
import { copyText, pasteText } from "absol/src/HTML5/Clipboard";
import Attributes from 'absol/src/AppPattern/Attributes';
import { duplicateData } from "../util";
import Fragment from 'absol/src/AppPattern/Fragment';
import safeThrow from "absol/src/Code/safeThrow";
import { isRealNumber, swapChildrenInElt, vScrollIntoView } from "absol-acomp/js/utils";
import { ASHTConfirmEvent, ASHTEditor, ASHTWaitValueEvent } from "./Abstractions";
import AElement from "absol/src/HTML5/AElement";
import { kebabCaseToCamelCase } from "absol/src/String/stringFormat";
import { computeMeasureExpression, parseMeasureValue } from "absol/src/JSX/attribute";
import Dom, { getScreenSize } from "absol/src/HTML5/Dom";
import { HScrollbar } from "absol-acomp/js/Scroller";


function getScrollSize() {
    var parent = _({
        style: {
            'z-index': '-100',
            opacity: '0',
            width: '100px',
            height: '100px',
            overflow: 'scroll',
            top: '0',
            left: '0',
            'box-sizing': 'content-box',
            position: 'fixed'
        }
    }).addTo(document.body);
    var child = _({ style: { width: '100%', height: '100%' } }).addTo(parent);
    var parentBound = parent.getBoundingClientRect();
    var childBound = child.getBoundingClientRect();
    return {
        width: parentBound.width - childBound.width,
        height: parentBound.height - childBound.height
    };
}

var EV_CONTENT_CHANGE = 'contentchange';


/***
 * @typedef TableEditorOpt
 *
 */

/***
 * @extends EventEmitter
 * @constructor
 */
function TableEditor(opt) {
    ASHTEditor.call(this, opt);
    this.lcEmitter = new EventEmitter();
    this.autoStateMng = new StateAutoManager(this);
    this.layoutCtrl = new LayoutController(this);
    this.selectTool = new SelectTool(this);
    this.editTool = new EditTool(this);
    this.commandCtrl = new CommandController(this);
    this.fixedYCtrl = new TEFixedYController(this);
    this.fixedXCtrl = new TEFixedXController(this);
    this.fixedXYCtrl = new TEFixedXYController(this);
    for (var key in this) {
        if (key.startsWith('ev_')) {
            this[key] = this[key].bind(this);
        }
    }

    this.lcEmitter.on(EV_CONTENT_CHANGE, () => {
        this.fixedXYCtrl.updateContent();
        this.fixedYCtrl.updateContent();
        this.fixedXCtrl.updateContent();
        ResizeSystem.updateUp(this.$view, true);
    });
}

OOP.mixClass(TableEditor, ASHTEditor);


TableEditor.prototype.opt = {};


TableEditor.prototype.createView = function () {
    ContextCaptor.auto();
    this.$view = _({
        elt: this.opt.elt,
        extendEvent: 'contextmenu',
        class: ['asht-table-editor'],
        child: [
            'attachhook',
            {
                class: 'asht-table-editor-main-viewport',
                child: [
                    {
                        class: 'asht-table-editor-main-scroller',
                        child: 'table.asht-table-data'
                    },
                    {
                        class: 'asht-table-editor-foreground',
                        child: [
                            '.asht-table-editor-selected-box',

                        ]
                    },
                    '.asht-table-editor-editing-box',

                ]
            },
            {
                class: 'asht-table-editor-fixed-y-viewport',
                child: {
                    class: 'asht-table-editor-fixed-y-scroller',
                    child: {
                        class: 'asht-table-editor-fixed-y-size-wrapper',
                        child: {
                            tag: 'table',
                            class: 'asht-table-editor-fixed-y'
                        }
                    }
                }
            },
            {
                class: 'asht-table-editor-fixed-x-viewport',
                child: {
                    class: 'asht-table-editor-fixed-x-scroller',
                    child: {
                        tag: 'table',
                        class: 'asht-table-editor-fixed-x'
                    }
                }
            },
            {
                class: 'asht-table-editor-fixed-xy-viewport',
                child: {
                    tag: 'table',
                    class: 'asht-table-editor-fixed-xy',
                    child: {
                        tag: 'thead',
                        child: { tag: 'tr', child: 'td' }
                    }
                }
            },
            {
                tag: 'vscrollbar',
                class: 'asht-table-editor-v-scrollbar',
                child: {}
            },
            {
                tag: HScrollbar,
                class: 'asht-table-editor-h-scrollbar'
            }
        ]
    });

    this.$attachook = $('attachhook', this.$view);
    this.$attachook.requestUpdateSize = this.ev_resize;
    this.$attachook.on('attached', function () {
        ResizeSystem.add(this);
        this.requestUpdateSize();
    });
    this.$view.requestUpdateSize = this.ev_resize;

    this.$domSignal = _('attachhook').addTo(this.$view);
    this.domSignal = new DomSignal(this.$domSignal);


    this.$body = $('.asht-table-editor-body', this.$view);
    this.$mainViewport = $('.asht-table-editor-main-viewport', this.$view);
    this.$mainScroller = $('.asht-table-editor-main-scroller', this.$view);
    this.$tableData = $('table.asht-table-data', this.$view);


    this.$hscrollbar = $('.asht-table-editor-h-scrollbar', this.$view);
    this.$vscrollbar = $('.asht-table-editor-v-scrollbar', this.$view);


    this.$fixedYScroller = $('.asht-table-editor-fixed-y-scroller', this.$view);
    this.$fixedXScroller = $('.asht-table-editor-fixed-x-scroller', this.$view);


    this.$foreground = $('.asht-table-editor-foreground', this.$view);
    this.$editingbox = $('.asht-table-editor-editing-box', this.$view)
        .addStyle('display', 'none');
    this.$selectedbox = $('.asht-table-editor-selected-box', this.$foreground).addStyle('display', 'none')


    this.$header = $('.asht-table-editor-header', this.$view);
    this.$headRow = $('tr', this.$header);


    this.$fixedYHeaderScroller = $('.ash-fixed-y-header-scroller', this.$view);
    // this.$fixedYHeaderSizeWrapper = $('.ash-fixed-y-header-size-wrapper', this.$view);

    this.$fixedXYHeader = $('.as-table-scroller-fixed-xy-header', this.$view);
    this.$fixXCol = $('.as-table-scroller-fixed-x-col', this.$view);

    this.$vscroller = $('.as-table-scroller-vertical-scroller', this.$view);
    this.$hscroller = $('.as-table-scroller-horizontal-scroller', this.$view);


    this.$indexSccroller = $('.asht-table-editor-index-scroller', this.$view);
    this.opt.loadAttributeHandlers(this.optHandlers);
    this.$view.tableEditor = this;
    var scrollSize = getScrollSize();
    this.$view.addStyle('--sys-scrollbar-width', scrollSize.width + 'px');
    this.$view.addStyle('--sys-scrollbar-height', scrollSize.height + 'px');

    this.autoStateMng.onViewCreated();
    this.layoutCtrl.onViewCreated();
    this.fixedYCtrl.onViewCreated();
    this.fixedXCtrl.onViewCreated();
    this.fixedXYCtrl.onViewCreated();
    this.selectTool.onViewCreated();
    this.editTool.onViewCreated();
    this.commandCtrl.onViewCreated();
    return this.$view;
};


TableEditor.prototype.setData = function (data) {
    data = duplicateData(data);
    if (this.$tableData) this.$tableData.remove();
    var tableData = new TableData(this, { elt: this.$tableData });
    this.$mainScroller.addChild(this.$tableData);
    tableData.import(data);
    this.tableData = tableData;
    this.layoutCtrl.onData();
    //? this.domSignal.emit('request_load_foreground_content');
    tableData.on('new_row_property_change', this.ev_newRowPropertyChange);
};

TableEditor.prototype.getHash = function () {
  if (this.tableData) return this.tableData.getHash();
  return 0;
};


TableEditor.prototype.getData = function () {
    return this.tableData && this.tableData.export();
};

TableEditor.prototype.getRecords = function () {
    return this.tableData && this.tableData.records;
};

TableEditor.prototype.onStart = function () {
    // console.log('start')
};


TableEditor.prototype.onStop = function () {
    // console.log('stop')
};


TableEditor.prototype.ev_resize = function (event) {
    this.layoutCtrl.onResize();
    this.editTool.updateEditingBoxPosition();
    this.selectTool.updateSelectedPosition();
};

var t = 10;
TableEditor.prototype.ev_newRowPropertyChange = function (event) {
    this.tableData.flushNewRow({});
    this.fixedXCtrl.updateContent();
    vScrollIntoView(this.tableData.newRow.elt);
};

TableEditor.prototype.editCellDelay = function (row, col) {
    this.editTool.editCellDelay(row, col);
};


TableEditor.prototype.editCell = function (row, col) {
    this.editTool.editCell(row, col);
};


TableEditor.prototype.selectRow = function (row) {
    this.selectTool.selectRow(row);
};

TableEditor.prototype.selectCol = function (col) {
    this.selectTool.selectCol(col);
};


TableEditor.prototype.selectAll = function () {
    this.selectTool.selectAll();
};

TableEditor.prototype.focusIncompleteCell = function () {
    this.editTool.focusIncompleteCell();
};


TableEditor.prototype.insertRow = function (atIdx, record) {
    var tableData = this.tableData;
    tableData.addRowAt(atIdx, record);
    this.lcEmitter.emit(EV_CONTENT_CHANGE);
};


TableEditor.prototype.removeRow = function (atIdx) {
    var tableData = this.tableData;
    tableData.removeRowAt(atIdx);
    this.lcEmitter.emit(EV_CONTENT_CHANGE);
};


TableEditor.prototype.showError = function (title, message) {
    var toast = Toast.make({
        props: {
            htitle: title,
            message: message,
            variant: 'error'
        }
    });

    setTimeout(toast.disappear.bind(toast), 2000);
};

TableEditor.prototype.optHandlers = {};

TableEditor.prototype.optHandlers.readOnly = {
    set: function (value) {
        if (value) {
            this.$view.addClass('asht-read-only');
        }
        else {
            this.$view.removeClass('asht-read-only');
        }
        // ResizeSystem.update();
    },
    get: function () {
        return this.$view.containsClass('asht-read-only');
    },
    descriptor: {
        type: 'bool'
    }
};

Object.defineProperty(TableEditor.prototype, 'records', {
    get: function () {
        return this.tableData && this.tableData.records;
    }
});


export default TableEditor;

/***
 *
 * @param {TableEditor} editor
 * @constructor
 */
function StateAutoManager(editor) {
    this.editor = editor;
}

StateAutoManager.prototype.onViewCreated = function () {
    this.editor.domSignal.once('autostart', () => {
        if (this.editor.opt.autoStart && this.editor.state === 'STANDBY' || this.editor.state === 'CREATE') {
            this.editor.start();
        }
    });
    this.editor.domSignal.emit('autostart');
}


/***
 *
 * @param {TableEditor} editor
 * @constructor
 */
function SelectTool(editor) {
    this.editor = editor;
    Object.keys(this.constructor.prototype).forEach(key => {
        if (key.startsWith('ev_')) this[key] = this[key].bind(this);
    });

    this.hoverRow = null;
    this.selectedData = null;
}

SelectTool.prototype.onViewCreated = function () {
    // this.editor.$editingLayer.on('mousedown', this.ev_editLayerMouseDown);
    // this.editor.$rootCell.on('mousedown', this.ev_rootCellMouseDown);
    // this.editor.$headRow.on('mousedown', this.ev_headerMouseDown);
    // this.editor.$indexCol.on('mousedown', this.ev_indexColMouseDown);
};


SelectTool.prototype.selectRow = function (row) {
    if (row) {
        this.selectedData = {
            type: 'row',
            row: row
        };
        this.editor.$selectedbox.removeStyle('display');
        this.updateSelectedPosition();
    }
    else {
        // this.$selectrow
        this.selectedData = null;
        this.editor.$selectedbox.addStyle('display', 'none');
    }
};


SelectTool.prototype.selectCol = function (col) {
    if (col) {
        this.selectedData = {
            type: 'col',
            col: col
        };
        this.editor.$selectedbox.removeStyle('display');
        this.updateSelectedPosition();
    }
    else {
        this.selectedData = null;
        this.editor.$selectedbox.addStyle('display', 'none');
    }
};


SelectTool.prototype.updateSelectedPosition = function () {
    if (!this.selectedData) return;
    var tBound;
    var fBound = this.editor.$foreground.getBoundingClientRect();
    if (this.selectedData.row) {
        var row = this.selectedData.row;
        var rBound = row.elt.getBoundingClientRect();
        this.editor.$selectedbox.addStyle({
            left: rBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: rBound.top - fBound.top - 1 + 'px',
            'min-width': rBound.width + 2 + 'px',
            'min-height': rBound.height + 2 + 'px'
        });
    }
    else if (this.selectedData.col) {
        var col = this.selectedData.col;
        var cBound = col.elt.getBoundingClientRect();
        tBound = col.elt.parentElement.parentElement.parentElement.getBoundingClientRect();
        this.editor.$selectedbox.addStyle({
            left: cBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: tBound.top - fBound.top - 1 + 'px',
            'min-width': cBound.width + 2 + 'px',
            'min-height': tBound.height + 2 + 'px'
        });
    }
    else if (this.selectedData.type === 'all') {
        tBound = this.editor.tableData.$view.getBoundingClientRect();
        this.editor.$selectedbox.addStyle({
            left: tBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: tBound.top - fBound.top - 1 + 'px',
            'min-width': tBound.width + 2 + 'px',
            'min-height': tBound.height + 2 + 'px'
        });
    }
};

SelectTool.prototype.selectAll = function () {
    this.selectedData = {
        type: 'all'
    };
    this.editor.$selectedbox.removeStyle('display');
    this.updateSelectedPosition();
};


SelectTool.prototype.ev_rootCellMouseDown = function (ev) {
    if (this.editor.opt.readOnly) return;
    this.selectAll();
    var row = this.editor.tableData.findRowByIndex(0)
    var col = this.editor.tableData.findColByIndex(0);
    if (row && col) {
        this.editor.editCellDelay(row, col);
    }
};

SelectTool.prototype.ev_indexColMouseDown = function (ev) {
    var y = ev.clientY;
    this.hoverRow = this.editor.tableData.findRowByClientY(y);
    if (this.hoverRow) {
        this.selectRow(this.hoverRow);
        this.editor.editCellDelay(this.hoverRow, this.editor.tableData.headCells[0]);
    }
};

SelectTool.prototype.ev_headerMouseDown = function (ev) {
    // if (this.opt.readOnly) return;
    var x = ev.clientX;
    var col = this.editor.tableData.findColByClientX(x);
    var row;
    if (col) {
        this.editor.selectCol(col);
        row = this.editor.tableData.findRowByIndex(0);
        if (row) {
            this.editor.editCellDelay(row, col);
        }
    }
};

/***
 *
 * @param {TableEditor} editor
 * @constructor
 */
function EditTool(editor) {
    this.editor = editor;
    Object.keys(this.constructor.prototype).forEach(key => {
        if (key.startsWith('ev_')) this[key] = this[key].bind(this);
    });
}

EditTool.prototype.onViewCreated = function () {

};


EditTool.prototype.editCell = function (row, col) {
    if (this.currentCellEditor) {
        this.currentCellEditor.off('finish', this.ev_cellEditorFinish);
        this.currentCellEditor.destroy();
        this.currentCellEditor = null;
        // if (document.activeElement && AElement.prototype.isDescendantOf.call(document.activeElement, this.$editingbox)){
        //     // document.activeElement.blur();
        // }
        this.editor.$editingbox.clearChild();

    }
    if (row && col) {
        var cell = row.cells[col.index];


        var EditorClass = TDEBase.typeClasses[cell.descriptor.type];
        if (EditorClass) {
            this.currentCellEditor = new EditorClass(this.editor, row.cells[col.index]);
            this.editor.$editingbox.removeStyle('display');
            this.currentCellEditor.start();
        }
        else {
            this.currentCellEditor = null;
            this.editor.showError('Data Error', 'Not support ' + cell.descriptor.type);
            this.editor.$editingbox.addStyle('display', 'none');
        }


        this.updateEditingBoxPosition();
        this.editor.layoutCtrl.scrollIntoRow(row);
        this.editor.layoutCtrl.scrollIntoCol(col);
        if (this.currentCellEditor) {
            this.currentCellEditor.on('finish', this.ev_cellEditorFinish);
        }
    }
    else {
        this.editor.$editingbox.addStyle('display', 'none');
    }
};

EditTool.prototype.editCellDelay = function (row, col) {
    setTimeout(() => {
        this.editCell(row, col);
    }, 100);
};


EditTool.prototype.updateEditingBoxPosition = function () {
    if (!this.currentCellEditor) return;
    var cellEditor = this.currentCellEditor;
    var elt = cellEditor.cell.elt;
    var eLBound = this.editor.$view.getBoundingClientRect();
    var eBound = elt.getBoundingClientRect();
    var left = eBound.left - eLBound.left;
    var width = eBound.width;
    this.editor.$editingbox.addStyle({
        left: left + 'px',
        top: eBound.top - eLBound.top + 'px',
        '--cell-width': width + 'px',
        '--cell-height': eBound.height + 'px'
    });
};

EditTool.prototype.focusIncompleteCell = function () {
    if (!this.editor.tableData) return false;
    var incompleteCell = this.editor.tableData.findFirsIncompleteCell();
    if (!incompleteCell) return false;
    var col = this.editor.tableData.findColByName(incompleteCell.pName);
    this.editCellDelay(incompleteCell.row, col);
    return true;
};


EditTool.prototype.ev_cellEditorFinish = function (event) {
    if (this.currentCellEditor === event.target) {
        this.editCellDelay(null);
    }
};

/***
 *
 * @param {TableEditor} editor
 * @constructor
 */
function LayoutController(editor) {
    this.editor = editor;
    Object.keys(this.constructor.prototype).forEach(key => {
        if (key.startsWith('ev_')) this[key] = this[key].bind(this);
    });
    this.extendStyle = Object.assign(new Attributes(this), this.extendStyle);


}

LayoutController.prototype.extendStyle = {
    width: 'auto',
    height: 'auto'
};

LayoutController.prototype.styleHandlers = {};

LayoutController.prototype.styleHandlers.width = {
    /**
     * @this LayoutController
     * @param value
     */
    set: function (value) {
        if (typeof value === 'number') value += 'px';
        else if (typeof value !== "string") value = 'auto';
        var psValue;
        if (value === 'auto') {
            this.editor.$view.style.width = null;
            this.editor.$view.addClass('asht-width-auto');
        }
        else if (value.indexOf('calc(') >= 0) {
            this.editor.$view.style.width = value;
            this.editor.$view.removeClass('asht-width-auto');
        }
        else {
            psValue = parseMeasureValue(value);
            if (psValue) {
                if (['px', 'vw', 'vh', 'em', 'rem', 'pt'].indexOf(psValue.unit) >= 0) {
                    this.editor.$view.style.width = value;
                    this.editor.$view.removeClass('asht-width-auto');
                }
                else {

                    this.editor.$view.style.width = null;
                    this.editor.$view.addClass('asht-width-auto');

                }
            }
            else {
                this.editor.$view.style.width = null;
                this.editor.$view.addClass('asht-width-auto');
            }
        }
        return value;
    }
};

LayoutController.prototype.styleHandlers.height = {
    /**
     * @this LayoutController
     * @param value
     */
    set: function (value) {
        if (typeof value === 'number') value += 'px';
        else if (typeof value !== "string") value = 'auto';
        var psValue;
        if (value === 'auto') {
            this.editor.$view.style.height = null;
            this.editor.$view.addClass('asht-height-auto');
        }
        else if (value.indexOf('calc(')) {
            this.editor.$view.style.height = value;
            this.editor.$view.removeClass('asht-height-auto');
        }
        else {
            psValue = parseMeasureValue(value);
            if (psValue) {
                if (['px', 'vw', 'vh', 'em', 'rem', 'pt'].indexOf(psValue.unit) < 0) {
                    this.editor.$view.style.height = null;
                    this.editor.$view.addClass('asht-height-auto');
                }
                else {
                    this.editor.$view.style.height = value;
                    this.editor.$view.removeClass('asht-height-auto');
                }
            }
            else {
                this.editor.$view.style.height = null;
                this.editor.$view.addClass('asht-height-auto');
            }
        }
        return value;
    }
};


LayoutController.prototype.addStyle = function () {
    var arg0 = arguments[0];
    var arg1 = arguments[1];
    var key;
    if (arguments.length === 1) {
        if (typeof arg0 === "object") {
            for (key in arg0) {
                this.addStyle(key, arg0[key]);
            }
        }
    }
    else if (arguments.length === 2) {

        if (typeof arg0 === 'string') {
            if (arg0.startsWith('--')) {
                this.editor.$view.style.setProperty(arg0, arg1);
            }
            else {
                if (arg0.indexOf('-') >= 0) {
                    arg0 = kebabCaseToCamelCase(arg0);
                }
                if (this.styleHandlers[arg0]) {
                    this.extendStyle[arg0] = arguments[1];

                }
                else {
                    this.editor.$view.style[arg0] = arg1;
                }
            }
        }
    }
    return this.editor.$view;
};

LayoutController.prototype.removeStyle = function () {
    var arg0 = arguments[0];
    if (arguments.length === 1) {
        if (arg0.startsWith('--')) {
            this.editor.$view.style.removeProperty(arg0);
        }
        else {
            if (arg0.indexOf('-') >= 0) {
                arg0 = kebabCaseToCamelCase(arg0);
            }
            if (this.styleHandlers[arg0])
                this.extendStyle[arg0] = null;
            else
                this.editor.$view.style[arg0] = null;
        }
    }
    else {
        for (var i = 0; i < arguments.length; ++i) {
            this.removeStyle(arguments[i]);
        }
    }
    return this.editor.$view;

};

LayoutController.prototype.onViewCreated = function () {
    this.editor.$view.extendStyle = this.extendStyle;
    this.extendStyle.loadAttributeHandlers(this.styleHandlers);
    this.editor.$view.addStyle = this.addStyle.bind(this);
    this.editor.$view.removeStyle = this.removeStyle.bind(this);


    this.editor.$hscrollbar.on('scroll', this.ev_scroll.bind(this, 'hscrollbar'));
    this.editor.$vscrollbar.on('scroll', this.ev_scroll.bind(this, 'vscrollbar'));
    this.editor.$mainScroller.on('scroll', this.ev_scroll.bind(this, 'main'));
    this.editor.$fixedXScroller.on('scroll', this.ev_scroll.bind(this, 'fixedXScroller'));
    this.editor.$fixedYScroller.on('scroll', this.ev_scroll.bind(this, 'fixedYScroller'));

    // this.editor.$fixedYHeaderScroller.on('scroll', this.ev_scroll.bind(this, 'fixedYScroller'));
    //

};


LayoutController.prototype.updateOverflowStatus = function () {
    var tableBound = this.editor.$tableData.getBoundingClientRect();
    this.editor.$view.style.setProperty('--content-width', tableBound.width + 'px');
    this.editor.$view.style.setProperty('--content-height', tableBound.height + 'px');


};

LayoutController.prototype.updateScrollerStatus = function () {
    var viewElt = this.editor.$view;
    var tableElt = this.editor.$tableData;
    var tableBound = tableElt.getBoundingClientRect();
    viewElt.style.setProperty('--content-width', tableBound.width + 'px');
    viewElt.style.setProperty('--content-height', tableBound.height + 'px');
    var cpStyle = getComputedStyle(this.editor.$view);

    var parentBound = viewElt.parentElement.getBoundingClientRect();
    var screenViewSize = getScreenSize();
    var getAvailableWidth = () => {
        var res = Infinity;
        var width = this.extendStyle.width || 'auto';
        var psWidth = parseMeasureValue(width);
        if (width !== "auto" && (width.indexOf('calc') >= 0 || psWidth)) {
            res = computeMeasureExpression(width, {
                parentSize: parentBound.width,
                screenViewSize: getScreenSize(),
                style: cpStyle
            });
            if (res.unit === 'px') {
                res = res.value;
            }
            else if (res.unit === 'vw') {
                res = res.value * screenViewSize.width / 100;
            }
            else {
                //todo
                res = screenViewSize.width;//todo
            }
        }


        var maxWidth = cpStyle.maxWidth;
        var psMaxWidth = parseMeasureValue(maxWidth);
        if (psMaxWidth && psMaxWidth.unit === 'px') {
            res = Math.min(res, psMaxWidth.value);
        }

        return res;
    };

    var getAvailableHeight = () => {
        var res = Infinity;
        var height = this.extendStyle.height || 'auto';
        var psHeight = parseMeasureValue(height);

        if (height !== 'auto' && (height.indexOf('calc') >= 0 || psHeight)) {
            res = computeMeasureExpression(height, {
                parentSize: parentBound.height,
                screenViewSize: getScreenSize(),
                style: cpStyle
            });
            if (res.unit === 'px') {
                res = res.value;
            }
            else {
                //todo
                res = Infinity;
            }
        }
        var maxHeight = cpStyle.maxHeight;
        var psMaxHeight = parseMeasureValue(maxHeight);
        if (psMaxHeight && psMaxHeight.unit === 'px') {
            res = Math.min(res, psMaxHeight.value);
        }

        return res;
    }

    var availableWidth = getAvailableWidth();
    var availableHeight = getAvailableHeight();
    if (isRealNumber(availableWidth)) {
        viewElt.addStyle('--available-width', availableWidth + 'px');
    }
    else {
        viewElt.removeStyle('--available-width');
    }

    if (isRealNumber(availableHeight)) {
        viewElt.addStyle('--available-height', availableHeight + 'px');
    }
    else {
        viewElt.removeStyle('--available-height');
    }

    if ((tableBound.width) > availableWidth - 17) {
        this.editor.$view.addClass('asht-overflow-x');
    }
    else {
        this.editor.$view.removeClass('asht-overflow-x');
    }

    if (tableBound.height > availableHeight - 17) {
        this.editor.$view.addClass('asht-overflow-y');
    }
    else {
        this.editor.$view.removeClass('asht-overflow-y');
    }

    this.editor.$hscrollbar.innerWidth = tableBound.width;
    this.editor.$vscrollbar.innerHeight = tableBound.height;
    setTimeout(() => {
        var viewportBound = this.editor.$mainViewport.getBoundingClientRect();
        this.editor.$hscrollbar.outerWidth = viewportBound.width;
        this.editor.$vscrollbar.outerHeight = viewportBound.height;
        if (this.editor.$hscrollbar.innerWidth > this.editor.$hscrollbar.outerWidth) {
            this.editor.$hscrollbar.removeStyle('display');
        }
        else {
            this.editor.$hscrollbar.addStyle('display', 'none');
        }

        if (this.editor.$vscrollbar.innerHeight > this.editor.$vscrollbar.outerHeight) {
            this.editor.$vscrollbar.removeStyle('display');
        }
        else {
            this.editor.$vscrollbar.addStyle('display', 'none');
        }
    }, 1);
};


LayoutController.prototype.updateFixedYHeader = function () {
    this.editor.fixedYCtrl.updateContent();
};

LayoutController.prototype.updateFixedYHeaderSize = function () {
    this.editor.fixedYCtrl.updateSize();
};

LayoutController.prototype.fullUpdateFixedXCol = function () {
    console.log("fullUpdateFixedXCol");
};

LayoutController.prototype.updateStyleConfig = function () {
    if (this.editor.tableData.config && this.editor.tableData.config.rowHeight) {
        this.editor.$view.addStyle('--row-height', this.editor.tableData.config.rowHeight + 'px');
    }
    else {
        this.editor.$view.removeStyle('--row-height');
    }
};

LayoutController.prototype.onResize = function () {
    if (!this.editor.tableData) return;

    this.updateScrollerStatus();

    this.editor.fixedYCtrl.updateSize();
    this.editor.fixedXCtrl.updateSize();
    this.editor.fixedXYCtrl.updateSize();

    this.editor.selectTool.updateSelectedPosition();
};

LayoutController.prototype.onData = function () {
    this.updateStyleConfig();
    this.editor.fixedYCtrl.updateContent();
    this.editor.fixedXCtrl.updateContent();
    this.editor.fixedXYCtrl.updateContent();
};


LayoutController.prototype.scrollIntoRow = function (row) {
    var rowBound = row.elt.getBoundingClientRect();
    var bound = this.editor.$view.getBoundingClientRect();
    var headBound = this.editor.fixedYCtrl.$fixedYTable.getBoundingClientRect();
    if (rowBound.top < headBound.bottom) {
        this.editor.$mainScroller.scrollTop -= headBound.bottom - rowBound.top;
    }
    else if (rowBound.bottom > bound.bottom) {
        this.editor.$mainScroller.scrollTop += rowBound.bottom - bound.bottom;
    }
};

LayoutController.prototype.scrollIntoCol = function (col) {
    var colBound = col.elt.getBoundingClientRect();
    var bound = this.editor.$view.getBoundingClientRect();
    var iBound = this.editor.fixedXCtrl.$fixXTable.getBoundingClientRect();
    if (colBound.left < iBound.right) {
        this.editor.$mainScroller.scrollLeft -= iBound.right - colBound.left;
    }
    else if (colBound.right > bound.right) {
        this.editor.$mainScroller.scrollLeft += colBound.right - bound.right;
    }
};


LayoutController.prototype.ev_scroll = function (tag, event) {
    var now = new Date().getTime();
    if (this._scrollTarget && this._scrollTarget.tag !== tag && now - this._scrollTarget.time < 100) return;
    this._scrollTarget = {
        tag: tag,
        time: now
    };
    var scrollLeft, scrollTop;
    if (tag === 'main') {
        scrollLeft = this.editor.$mainScroller.scrollLeft;
        if (scrollLeft < 0) {
            this.editor.$mainScroller.scrollLeft = 0;
            scrollLeft = 0;
        }
        else if (scrollLeft > this.editor.$hscrollbar.innerWidth - this.editor.$hscrollbar.outerWidth) {
            scrollLeft = this.editor.$hscrollbar.innerWidth - this.editor.$hscrollbar.outerWidth;
            this.editor.$mainScroller.scrollLeft = scrollLeft;
        }
        this.editor.$hscrollbar.innerOffset = scrollLeft;
        this.editor.$fixedYScroller.scrollLeft = scrollLeft;

        scrollTop = this.editor.$mainScroller.scrollTop;
        if (scrollTop < 0) {
            this.editor.$mainScroller.scrollTop = 0;
            scrollTop = 0;
        }
        else if (scrollTop > this.editor.$vscrollbar.innerHeight - this.editor.$vscrollbar.outerHeight) {
            scrollTop = this.editor.$vscrollbar.innerHeight - this.editor.$vscrollbar.outerHeight;
            this.editor.$mainScroller.scrollTop = scrollTop;
        }
        this.editor.$vscrollbar.innerOffset = scrollTop;
        this.editor.$fixedXScroller.scrollTop = scrollTop;
        //todo

    }
    else if (tag === 'hscrollbar') {
        scrollLeft = this.editor.$hscrollbar.innerOffset;
        this.editor.$mainScroller.scrollLeft = scrollLeft;
        this.editor.$fixedYScroller.scrollLeft = scrollLeft;
        // this.editor.$fixedYHeaderScroller.scrollLeft = scrollLeft;
    }
    else if (tag === 'vscrollbar') {
        scrollTop = this.editor.$vscrollbar.innerOffset;
        this.editor.$mainScroller.scrollTop = scrollTop;
        //todo
    }

    else if (tag === 'fixedYScroller') {
        scrollLeft = this.editor.$fixedYScroller.scrollLeft;
        if (scrollLeft < 0) {
            scrollLeft = 0;
            this.editor.$fixedYScroller.scrollLeft = 0;
        }
        else if (scrollLeft > this.editor.$hscrollbar.innerWidth - this.editor.$hscrollbar.outerWidth) {
            scrollLeft = this.editor.$hscrollbar.innerWidth - this.editor.$hscrollbar.outerWidth;
            this.editor.$fixedYScroller.scrollLeft = scrollLeft;
        }
        this.editor.$hscrollbar.innerOffset = scrollLeft;
        this.editor.$mainScroller.scrollLeft = scrollLeft;

    }
    else if (tag === 'fixedXScroller') {
        scrollTop = this.editor.$fixedXScroller.scrollTop;
        if (scrollTop < 0) {
            this.editor.$fixedXScroller.scrollTop = 0;
            scrollTop = 0;
        }
        else if (scrollTop > this.editor.$vscrollbar.innerHeight - this.editor.$vscrollbar.outerHeight) {
            scrollTop = this.editor.$vscrollbar.innerHeight - this.editor.$vscrollbar.outerHeight;
            this.editor.$fixedXScroller.scrollTop = scrollTop;
        }
        this.editor.$vscrollbar.innerOffset = scrollTop;
        this.editor.$mainScroller.scrollTop = scrollTop;
    }

    this.editor.editTool.updateEditingBoxPosition();
    this.editor.selectTool.updateSelectedPosition();
};

/**
 * @param {TableEditor} editor
 * @param editor
 * @constructor
 */
function TEFixedYController(editor) {
    this.editor = editor;
}

TEFixedYController.prototype.onViewCreated = function () {
    this.$fixedYTable = $('.asht-table-editor-fixed-y', this.editor.$view);

};


TEFixedYController.prototype.updateContent = function () {
    var head = $(this.editor.tableData.$thead.cloneNode(false));
    head.$origin = this.editor.tableData.$thead;
    var headRows = Array.prototype.filter.call(this.editor.tableData.$thead.childNodes, elt => elt.tagName === 'TR')
        .map(tr => {
            var copyTr = $(tr.cloneNode(false));
            copyTr.$origin = tr;
            var cells = Array.prototype.filter.call(tr.childNodes, elt => elt.tagName === 'TH' || elt.tagName === 'TD')
                .map(td => $(Object.assign(td.cloneNode(true), { $origin: td })))
            copyTr.addChild(cells);

            return copyTr;

        });
    head.addChild(headRows);
    this.$fixedYTable.clearChild().addChild(head);
    this.$fixedYTable.attr('class', this.editor.tableData.$view.attr('class')).addClass('asht-table-editor-fixed-y')

};

TEFixedYController.prototype.updateSize = function () {
    var cells = this.$fixedYTable.firstChild
        && Array.prototype.slice.call(this.$fixedYTable.firstChild.firstChild.childNodes);
    var headBound = this.editor.tableData.$thead.getBoundingClientRect();
    cells.forEach(elt => {
        elt.addStyle('width', elt.$origin.getBoundingClientRect().width + 'px')
    });
    this.editor.$view.addStyle('--head-height', headBound.height + 'px');
};

/**
 * @param {TableEditor} editor
 * @param editor
 * @constructor
 */
function TEFixedXController(editor) {
    this.editor = editor;
}

TEFixedXController.prototype.onViewCreated = function () {
    this.$fixXTable = $('.asht-table-editor-fixed-x', this.editor.$view);

};

TEFixedXController.prototype.updateFullContent = function () {
    console.log("updateFullContent");
    var head, body;
    this.$fixXTable.clearChild();
    this.$fixXTable.$origin = this.editor.tableData.$view;
    head = $(this.editor.tableData.$thead.cloneNode(false));
    head.$origin = this.editor.tableData.$thead;
    var headRows = Array.prototype.filter.call(this.editor.tableData.$thead.childNodes, elt => elt.tagName === 'TR')
        .map(tr => {
            var copyTr = $(tr.cloneNode(false));
            copyTr.$origin = tr;
            var cells = Array.prototype.filter.call(tr.childNodes, elt => elt.tagName === 'TH' || elt.tagName === 'TD');
            cells = cells.slice(0, 1).map(td => $(Object.assign(td.cloneNode(true), { $origin: td })));
            copyTr.addChild(cells);
            return copyTr;
        });
    head.addChild(headRows);

    body = $(this.editor.tableData.$tbody.cloneNode());
    body.$origin = this.editor.tableData.$tbody;
    var rows = Array.prototype.filter.call(this.editor.tableData.$tbody.childNodes, elt => elt.tagName === 'TR')
        .map(tr => {
            var copyTr = $(tr.cloneNode(false));
            copyTr.$origin = tr;
            var cells = Array.prototype.filter.call(tr.childNodes, elt => elt.tagName === 'TH' || elt.tagName === 'TD');
            cells = cells.slice(0, 1)
                .map(td => $(Object.assign(td.cloneNode(true), { $origin: td })));
            // cells.forEach(elt => {
            //     swapChildrenInElt(elt, elt.$origin);
            //     this._swappedPairs.push([elt, elt.$origin]);
            // });
            copyTr.addChild(cells);
            return copyTr;
        });
    body.addChild(rows);
    this.$fixXTable.addChild(head)
        .addChild(body);
    this.$fixXTable.attr('class', this.editor.tableData.$view.attr('class')).addClass('as-table-scroller-fixed-x');
};

TEFixedXController.prototype.updateChangedContent = function () {
    var body = this.$fixXTable.lastChild;
    var rows = Array.prototype.slice.call(this.editor.tableData.$tbody.childNodes);
    var i = 0;
    while (i < body.childNodes.length) {
        if (body.childNodes[i].$origin !== rows[i]) break;
        i++;
    }
    i = Math.max(0, Math.min(body.childNodes.length - 1, i));
    while (body.childNodes.length > i) {
        body.lastChild.remove();
    }
    rows = rows.slice(i).map(tr => {
        var copyTr = $(tr.cloneNode(false));
        copyTr.$origin = tr;
        var cells = Array.prototype.filter.call(tr.childNodes, elt => elt.tagName === 'TH' || elt.tagName === 'TD');
        cells = cells.slice(0, 1)
            .map(td => $(Object.assign(td.cloneNode(true), { $origin: td })));
        // cells.forEach(elt => {
        //     swapChildrenInElt(elt, elt.$origin);
        //     this._swappedPairs.push([elt, elt.$origin]);
        // });
        copyTr.addChild(cells);
        return copyTr;
    });
    body.addChild(rows);
};

TEFixedXController.prototype.updateContent = function () {
    if (this.$fixXTable.$origin !== this.editor.tableData.$view) {
        this.updateFullContent();
    }
    else {
        this.updateChangedContent();
    }
};

TEFixedXController.prototype.updateSize = function () {
    // var bound = this.editor.tableData.$view.getBoundingClientRect();

    // this.$fixXCol.addStyle('height', bound.height + 'px');
    if (!this.editor.tableData) return;
    var firstCell = this.editor.tableData.$view.firstChild.firstChild.firstChild;
    var colSize = firstCell.getBoundingClientRect();
    var colWidth = colSize.width;
    this.editor.$view.addStyle('--index-col-width', colWidth + 'px');
    Array.prototype.forEach.call(this.$fixXTable.firstChild.childNodes, elt => {
        elt.addStyle('height', elt.$origin.getBoundingClientRect().height + 'px');
        elt.addStyle('width', colWidth + 'px');
    });
    Array.prototype.forEach.call(this.$fixXTable.lastChild.childNodes, elt => {
        elt.addStyle('height', elt.$origin.getBoundingClientRect().height + 'px');
        elt.addStyle('width', colWidth + 'px');
    });
};


/**
 * @param {TableEditor} editor
 * @param editor
 * @constructor
 */
function TEFixedXYController(editor) {
    this.editor = editor;
}

TEFixedXYController.prototype.onViewCreated = function () {
    this.$fixedXYTable = $('.asht-table-editor-fixed-xy', this.editor.$view);
    this.$fixedXYTable.addClass('asht-table-data');
};

TEFixedXYController.prototype.updateContent = function () {

};

TEFixedXYController.prototype.updateSize = function () {
};

/***
 *
 * @param {TableEditor} editor
 * @constructor
 */
function CommandController(editor) {
    this.editor = editor;
    Object.keys(this.constructor.prototype).forEach(key => {
        if (key.startsWith('ev_')) this[key] = this[key].bind(this);
    });
}

CommandController.prototype.onViewCreated = function () {
    ContextCaptor.auto();
    this.editor.$view.on('click', this.ev_click);
    this.editor.$view.on('contextmenu', this.ev_contextMenu);
    // this.editor.$indexCol.on('contextmenu', this.ev_indexColContextMenu);
};

CommandController.prototype.ev_click = function (event) {
    if (this.editor.tableData && hitElement(this.editor.tableData.$view, event)) {
        this.ev_clickTable(event);
    }
    else if (hitElement(this.editor.fixedXCtrl.$fixXTable.lastChild, event)) {
        this.ev_clickIndexCol(event);
    }

};


CommandController.prototype.ev_contextMenu = function (event) {
    if (this.editor.opt.readOnly) return;
    if (hitElement(this.editor.tableData.$view, event)) {

    }
    else if (hitElement(this.editor.fixedXCtrl.$fixXTable.lastChild, event)) {
        this.ev_indexColContextMenu(event);
    }
    else if (hitElement(this.editor.fixedXYCtrl.$fixedXYTable, event)) {
        this.ev_rootCellContextMenu(event);
    }
};

CommandController.prototype.ev_clickTable = function (event) {

    var c = event.target;
    var cellElt;
    while (c) {
        if (c.hasClass && c.hasClass('asht-table-cell')) {
            cellElt = c;
            this.ev_clickCell(cellElt, event);
            return;
        }
        c = c.parentElement;
    }
};

CommandController.prototype.ev_clickCell = function (cellElt, event) {
    if (this.editor.opt.readOnly) return;
    var colIdx = Array.prototype.indexOf.call(cellElt.parentElement.childNodes, cellElt) - 1;
    var col = this.editor.tableData.findColByIndex(colIdx);
    var rowIdx = Array.prototype.indexOf.call(cellElt.parentElement.parentElement.childNodes, cellElt.parentElement);
    var row = this.editor.tableData.findRowByIndex(rowIdx);
    if (!row && rowIdx >= 0) row = this.editor.tableData.newRow;
    this.editor.editTool.editCellDelay(row, col);
};

CommandController.prototype.ev_clickIndexCol = function (ev) {
    if (this.editor.opt.readOnly) return;
    var c = ev.target;
    while (c) {
        if (c.tagName === 'TR') break;
        c = c.parentElement;
    }
    if (!c) return;
    var rowIdx = Array.prototype.indexOf.call(c.parentElement.childNodes, c);
    var row = this.editor.tableData.findRowByIndex(rowIdx) || this.editor.tableData.newRow;
    this.editor.selectRow(row);
    var firstCol = this.editor.tableData.findColByIndex(0);
    this.editor.editTool.editCellDelay(row, firstCol);
};


CommandController.prototype.ev_indexColContextMenu = function (ev) {
    var thisTE = this.editor;
    var c = ev.target;
    while (c) {
        if (c.tagName === 'TR') break;
        c = c.parentElement;
    }
    if (!c) return;
    var rowIdx = Array.prototype.indexOf.call(c.parentElement.childNodes, c);
    var row = this.editor.tableData.findRowByIndex(rowIdx) || this.editor.tableData.newRow;
    this.editor.selectRow(row);
    var items = [];
    if (row.idx === "*") {

    }
    else {
        items.push({
                cmd: 'insert_before',
                text: 'Insert Before',
                icon: 'span.mdi.mdi-table-row-plus-before'
            },
            {
                cmd: 'insert_after',
                text: 'Insert After',
                icon: 'span.mdi.mdi-table-row-plus-after'
            },
            {
                cmd: 'remove',
                text: 'Delete',
                icon: 'span.mdi.mdi-table-row-remove'
            })
    }
    if (items.length > 0 && items[items.length - 1] !== '===') {
        items.push("===");
    }
    if (row.idx !== "*") {
        items.push({
            cmd: 'copy',
            text: "Copy",
            icon: "span.mdi.mdi-content-copy"
        });
    }
    items.push({
        cmd: 'paste',
        text: "Paste",
        icon: 'span.mdi.mdi-content-paste'
    });
    items.push('===', {
        cmd: 'row_height',
        text: 'Row Height',
        icon: 'span.mdi.mdi-table-row-height'
    });

    ev.showContextMenu({
        extendStyle: { fontSize: '14px' },
        items: items
    }, function (ev1) {
        var cmd = ev1.menuItem.cmd;
        var eventOpt = { cmd: cmd };
        var ev2;
        console.log(cmd)
        switch (cmd) {
            case 'row_height':
                selectRowHeight({ value: thisTE.tableData.config.rowHeight, standard: 21 })
                    .then(function (result) {
                        thisTE.tableData.config.rowHeight = result;
                        thisTE.layoutCtrl.updateStyleConfig();
                        ResizeSystem.updateDown(thisTE.$attachook);
                    }, err => {
                        if (err) console.error(err);
                    });
                break;
            case 'remove':
                eventOpt.type = 'cmd_remove_row';
                eventOpt.rowIdx = row.idx;
                eventOpt.accepted = true;
                ev2 = new ASHTConfirmEvent(eventOpt);

                thisTE.emit(eventOpt.type, ev2, thisTE);
                ev2.afterThen(isAccept => {
                    if (isAccept)
                        thisTE.removeRow(eventOpt.rowIdx);
                });
                break;
            case 'insert_before':
            case 'insert_after':
                eventOpt.type = 'cmd_insert_row';
                eventOpt.rowIdx = row.idx + (cmd === 'insert_after' ? 1 : 0);
                ev2 = new ASHTWaitValueEvent(eventOpt);

                thisTE.emit(eventOpt.type, ev2, thisTE);
                ev2.afterThen(result => {
                    if (result) {
                        thisTE.insertRow(eventOpt.rowIdx, result);
                    }
                    else if (result === null) {
                        thisTE.insertRow(eventOpt.rowIdx, {});
                    }
                });

                break;

            case "copy":
                copyText(JSON.stringify(row.record));
                break;
            case "paste":
                pasteText().then(function (result) {
                    try {
                        var obj = duplicateData(JSON.parse(result));
                        thisTE.tableData.propertyNames.forEach(function (cr) {
                                row.propertyByName[cr].value = obj[cr];
                            },
                            {});
                        if (thisTE.editTool.currentCellEditor) {
                            thisTE.editTool.currentCellEditor.reload();
                        }
                        ResizeSystem.update();

                    } catch (e) {
                        safeThrow(e);
                    }
                })
                break;
        }
    });
};

CommandController.prototype.ev_rootCellContextMenu = function (ev) {
    var thisTE = this.editor;
    ev.showContextMenu({
        items: [
            {
                cmd: 'insert_first',
                text: 'Insert First',
                icon: 'span.mdi.mdi-table-row-plus-before'
            },
            {
                cmd: 'append_last',
                text: 'Append Last',
                icon: 'span.mdi.mdi-table-row-plus-after'
            }
        ]
    }, function (ev1) {
        var cmd = ev1.menuItem.cmd;
        var eventOpt = { cmd: cmd };
        eventOpt.type = 'cmd_insert_row';
        eventOpt.rowIdx = cmd === 'insert_first' ? 0 : thisTE.tableData.getLength();
        eventOpt.result = {};
        eventOpt.resolve = function (result) {
            this.result = result;
        };

        thisTE.emit(eventOpt.type, eventOpt, thisTE);
        if (eventOpt.result) {
            if (eventOpt.result.then) {
                eventOpt.result.then(function (result) {
                    if (result) {
                        thisTE.insertRow(eventOpt.rowIdx, result);
                        if (cmd === 'append_last') {
                            thisTE.$body.scrollTop = thisTE.$body.scrollHeight - thisTE.$body.clientHeight;
                        }
                    }
                });
            }
            else {
                thisTE.insertRow(eventOpt.rowIdx, eventOpt.result);
                thisTE.$mainScroller.scrollTop = thisTE.$mainScroller.scrollHeight - thisTE.$mainScroller.clientHeight;
            }
        }

    });
};


