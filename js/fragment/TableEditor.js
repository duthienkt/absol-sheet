import '../../css/tableeditable.css';
import SComp from "../dom/SComp";
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
import "./editor/TDETime";
import "./editor/TDETimeRange24";
import "absol-acomp/js/BContextCapture";
import ContextCaptor from 'absol-acomp/js/ContextMenu';
import OOP from "absol/src/HTML5/OOP";
import EventEmitter from "absol/src/HTML5/EventEmitter";
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


var _ = SComp._;
var $ = SComp.$;


/***
 * @typedef TableEditorOpt
 *
 */

/***
 * @extends EventEmitter
 * @constructor
 */
function TableEditor(opt) {
    Fragment.call(this);
    var defaultOpt = Object.assign({ autoStart: true }, this.opt, opt);
    this.opt = new Attributes(this);
    Object.assign(this.opt, defaultOpt);
    EventEmitter.call(this);

    this.autoStateMng = new StateAutoManager(this);
    this.layoutCtrl = new LayoutController(this);
    this.selectTool = new SelectTool(this);
    this.editTool = new EditTool(this);
    this.commandCtrl = new CommandController(this);
    for (var key in this) {
        if (key.startsWith('ev_')) {
            this[key] = this[key].bind(this);
        }
    }


}

OOP.mixClass(TableEditor, Fragment, EventEmitter);


TableEditor.prototype.opt = {};

TableEditor.prototype.getView = function () {
    if (this.$view) return this.$view;
    ContextCaptor.auto();
    this.$view = _({
        class: 'asht-table-editor',
        child: [
            'attachhook',
            {
                class: 'asht-table-editor-body',
                child: {
                    class: 'asht-table-editor-content',
                    child: {
                        class: 'asht-table-editor-editing-layer',
                        child: '.asht-table-editor-editing-box',
                    }
                }
            },
            {
                class: 'asht-table-editor-foreground',
                child: [
                    {
                        class: "asht-table-editor-header-viewport",
                        child: {
                            class: "asht-table-editor-header-scroller",
                            child: {
                                tag: 'table',
                                class: ['asht-table-editor-header', 'asht-table-data'],
                                child: {
                                    tag: 'thead',
                                    child: 'tr'
                                }
                            }
                        }
                    },
                    {
                        class: 'asht-table-editor-index-viewport',
                        child: {
                            class: 'asht-table-editor-index-scroller',
                            child: {
                                tag: 'table',
                                class: ['asht-table-editor-index-col', 'asht-table-data'],
                                extendEvent: 'contextmenu'
                            }
                        }
                    },
                    '.asht-table-editor-root-cell',
                    '.asht-table-editor-selected-box'
                ]
            }
        ]
    });

    this.$attachook = $('attachhook', this.$view);
    this.$attachook.requestUpdateSize = this.ev_resize;
    this.$attachook.on('attached', function () {
        ResizeSystem.add(this);
        this.requestUpdateSize();
    });

    this.$domSignal = _('attachhook').addTo(this.$view);
    this.domSignal = new DomSignal(this.$domSignal);


    this.$body = $('.asht-table-editor-body', this.$view);

    this.$content = $('.asht-table-editor-content', this.$view);
    this.$foreground = $('.asht-table-editor-foreground', this.$view);
    this.$editingLayer = $('.asht-table-editor-editing-layer', this.$view);
    this.$editingbox = $('.asht-table-editor-editing-box', this.$view)
        .addStyle('display', 'none');

    this.$selectedbox = $('.asht-table-editor-selected-box', this.$foreground).addStyle('display', 'none')


    this.$rootCell = $('.asht-table-editor-root-cell', this.$view);
    this.$rootCell.defineEvent('contextmenu');
    this.$rootCell.on('contextmenu', this.ev_rootCellContextMenu);
    this.$header = $('.asht-table-editor-header', this.$view);
    this.$headRow = $('tr', this.$header);
    this.$headerScroller = $('.asht-table-editor-header-scroller', this.$view);

    this.$headerViewport = $('.asht-table-editor-header-viewport', this.$view);

    this.$indexViewport = $('.asht-table-editor-index-viewport', this.$view);
    this.$indexCol = $('.asht-table-editor-index-col', this.$view)

    this.$indexSccroller = $('.asht-table-editor-index-scroller', this.$view);
    this.opt.loadAttributeHandlers(this.optHandlers);
    this.$view.tableEditor = this;

    this.autoStateMng.onViewCreated();
    this.layoutCtrl.onViewCreated();
    this.selectTool.onViewCreated();
    this.editTool.onViewCreated();
    this.commandCtrl.onViewCreated();
    return this.$view;
};


TableEditor.prototype.setData = function (data) {
    data = duplicateData(data);
    if (this.$tableData) this.$tableData.remove();
    var tableData = new TableData(this, {});
    this.$tableData = tableData.getView();
    this.$content.addChildBefore(this.$tableData, this.$editingLayer);
    tableData.import(data);
    this.tableData = tableData;
    this.domSignal.emit('request_load_foreground_content');
    tableData.on('new_row_property_change', this.ev_newRowPropertyChange);
};


TableEditor.prototype.getData = function () {
    return this.tableData && this.tableData.export();
};

TableEditor.prototype.getRecords = function () {
    return this.tableData && this.tableData.records;
}


TableEditor.prototype.ev_resize = function (event) {
    this.layoutCtrl.updateFixedTableEltPosition();
};

var t = 10;
TableEditor.prototype.ev_newRowPropertyChange = function (event) {
    this.tableData.flushNewRow({});
    this.layoutCtrl.loadIndexCol();
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
    atIdx = Math.min(atIdx, tableData.bodyRow.length);
    var currentRow = tableData.bodyRow[atIdx];
    var row = new TDRecord(tableData, record, atIdx);
    if (currentRow) {
        tableData.records.splice(atIdx, 0, record);
        tableData.$tbody.addChildBefore(row.elt, currentRow.elt);
        tableData.bodyRow.splice(atIdx, 0, row);
    }
    else {
        tableData.records.push(record);
        if (tableData.bodyRow.length > 0) {
            tableData.$tbody.addChildAfter(row.elt, tableData.bodyRow[tableData.bodyRow.length - 1].elt);
        }
        else {
            tableData.$tbody.addChildBefore(row.elt, tableData.$tbody.firstChild);
        }
        tableData.bodyRow.push(row);
    }
    for (var i = atIdx; i < tableData.bodyRow.length; ++i) {
        tableData.bodyRow[i].idx = i;
    }
    this.layoutCtrl.loadIndexCol();
    this.layoutCtrl.updateFixedTableEltPosition();
};


TableEditor.prototype.removeRow = function (atIdx) {
    var tableData = this.tableData;
    atIdx = Math.min(atIdx, tableData.bodyRow.length - 1);
    if (atIdx < 0) return;
    var row = tableData.bodyRow.splice(atIdx, 1)[0];
    row.elt.remove();
    this.tableData.records.splice(atIdx, 1);
    for (var i = atIdx; i < tableData.bodyRow.length; ++i) {
        tableData.bodyRow[i].idx = i;
    }
    this.layoutCtrl.loadIndexCol();
    this.selectTool.updateFixedTableEltPosition();
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
        ResizeSystem.update();
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

Object.defineProperty(TableEditor.prototype, 'fragment', {
    get: function () {
        return this.opt.fragment;
    },
    set: function (value) {
        this.opt.fragment = value;
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
    this.editor.$editingLayer.on('mousedown', this.ev_editLayerMouseDown);
    this.editor.$rootCell.on('mousedown', this.ev_rootCellMouseDown);
    this.editor.$headRow.on('mousedown', this.ev_headerMouseDown);
    this.editor.$indexCol.on('mousedown', this.ev_indexColMouseDown);
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
        this.editor.$header.addStyle('z-index', '21');
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
        this.editor.$header.addStyle('z-index', '19');
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


SelectTool.prototype.ev_editLayerMouseDown = function (ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    this.hoverRow = this.editor.tableData.findRowByClientY(y);
    this.hoverCol = this.editor.tableData.findColByClientX(x);
    if (ev.target === this.editor.$editingLayer) {
        if (this.hoverRow) {
            if (this.hoverCol) {
                this.editor.editCellDelay(this.hoverRow, this.hoverCol);
                this.editor.selectRow(null);
            }
            else {
                this.editor.selectRow(this.hoverRow);
                this.editor.editCellDelay(this.hoverRow, this.editor.tableData.headCells[0]);

            }
        }
    }
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
    var eLBound = this.editor.$editingLayer.getBoundingClientRect();
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

    this.$indexColRows = [];
}

LayoutController.prototype.onViewCreated = function () {
    this.editor.domSignal.on('request_load_foreground_content', this.loadForegroundContent.bind(this));
    this.editor.$view.on('wheel', this.ev_wheel)
        .on('mousemove', this.ev_mosemove);
    this.editor.$headerScroller.on('scroll', this.ev_scrollHeader);
    this.editor.$body.on('scroll', this.ev_scrollBody);
};


LayoutController.prototype.loadHeader = function () {
    var $headRow = this.editor.$headRow;
    $headRow.clearChild();
    Array.prototype.forEach.call(this.editor.tableData.$headRow.children, function (td, index) {
        var newTd = $(td.cloneNode(true));
        newTd.$originElt = td;
        newTd.__index__ = index - 1;
        $headRow.addChild(newTd);
    });
    this.updateHeaderPosition();
};


LayoutController.prototype.updateHeaderPosition = function () {
    var headerElt = this.editor.$header;
    var headerViewport = this.editor.$headerViewport;
    var rootCellElt = this.editor.$rootCell;
    Array.prototype.forEach.call(this.editor.$headRow.children, function (td, i) {
        var originTd = td.$originElt;
        var bound = originTd.getBoundingClientRect();
        td.addStyle({
            width: bound.width + 'px'
        });
        if (i === 0) {
            headerElt.addStyle('height', bound.height + 1 + 'px');
            headerViewport.addStyle('height', bound.height + 1 + 'px');
            rootCellElt.addStyle('height', bound.height + 1 + 'px');
            rootCellElt.addStyle('width', bound.width + 1 + 'px');
        }
    });
    var bound = this.editor.tableData.$view.getBoundingClientRect();
    this.editor.$header.addStyle('width', bound.width + 'px');
};


LayoutController.prototype.loadIndexCol = function () {
    this.editor.$indexCol.clearChild();
    this.$indexColRows = this.editor.tableData.bodyRow.concat([this.editor.tableData.newRow]).map(function (row) {
        var trElt = $(row.elt.cloneNode(false));
        trElt.$originElt = row.elt;
        var tdElt = $(row.elt.firstChild.cloneNode(true));
        tdElt.$originElt = row.elt.firstChild;
        trElt.addChild(tdElt);
        return trElt;
    });
    var indexHeaderElt = $(this.editor.tableData.$headRow.firstChild.cloneNode());
    indexHeaderElt.$originElt = this.editor.tableData.$headRow.firstChild;
    var indexHeaderRowElt = _({ tag: 'tr', child: indexHeaderElt });
    indexHeaderRowElt.$originElt = this.editor.tableData.$headRow;
    this.$indexColRows.unshift(indexHeaderRowElt);
    this.editor.$indexCol.addChild(this.$indexColRows);
    this.updateIndexColPosition();
};


LayoutController.prototype.updateIndexColPosition = function () {
    var indexViewportElt = this.editor.$indexViewport;
    var indexColElt = this.editor.$indexCol;
    this.$indexColRows.forEach(function (trElt, i) {
        var tdElt = trElt.firstChild;
        var bound = tdElt.$originElt.getBoundingClientRect();
        tdElt.addStyle('height', bound.height + 'px');
        if (i === 0) {
            indexViewportElt.addStyle('width', bound.width + 1 + 'px');//1px is border
            indexColElt.addStyle('width', bound.width + 1 + 'px');
        }
    });
};


LayoutController.prototype.updateForegroundPosition = function () {
    this.editor.$view.addStyle({
        '--body-scroll-width': this.editor.$body.offsetWidth - this.editor.$body.clientWidth + 'px',
        '--body-scroll-height': this.editor.$body.offsetHeight - this.editor.$body.clientHeight + 'px',
    });
    if (this.editor.$body.scrollWidth > this.editor.$body.clientWidth) {
        this.editor.$view.addClass('as-overflow-x');
    }
    else {
        this.editor.$view.removeClass('as-overflow-x');
    }
};


LayoutController.prototype.updateFixedTableEltPosition = function () {
    if (!this.editor.tableData) return;
    var tableBound = this.editor.tableData.getView().getBoundingClientRect()
    this.editor.$view.addStyle({
        '--table-data-width': tableBound.width + 'px',
        '--table-data-height': tableBound.height + 'px',
    });
    this.updateForegroundPosition();
    this.updateHeaderPosition();
    this.updateIndexColPosition();
    this.editor.editTool.updateEditingBoxPosition();
    this.editor.selectTool.updateSelectedPosition();
};

LayoutController.prototype.loadForegroundContent = function () {
    this.loadHeader();
    this.loadIndexCol();
    this.updateFixedTableEltPosition();
    this.updateForegroundPosition();
};


LayoutController.prototype.scrollIntoRow = function (row) {
    var headerBound = this.editor.$header.getBoundingClientRect();
    var bBound = this.editor.$foreground.getBoundingClientRect();
    var rowBound = row.elt.getBoundingClientRect();
    var vTop = headerBound.bottom;
    var vBottom = bBound.bottom;
    if (vBottom - vTop >= rowBound.height) {
        if (rowBound.bottom > vBottom) {
            this.editor.$body.scrollTop += rowBound.bottom - vBottom;
        }
        else if (rowBound.top < vTop) {
            this.editor.$body.scrollTop += rowBound.top - vTop;
        }
    }
    else {
        this.editor.$body.scrollTop += rowBound.top + rowBound.height / 2 - (vBottom + vTop) / 2;
    }
};

LayoutController.prototype.scrollIntoCol = function (col) {
    var colBound = col.elt.getBoundingClientRect();
    var iBound = this.editor.$indexCol.getBoundingClientRect();
    var bBound = this.editor.$foreground.getBoundingClientRect();
    var vLeft = iBound.right;
    var vRight = bBound.right;
    if (vRight - vLeft >= colBound.width) {
        if (colBound.right > vRight) {
            this.editor.$body.scrollLeft += colBound.right - vRight;
        }
        else if (colBound.left < vLeft) {
            this.editor.$body.scrollLeft += colBound.left - vLeft;
        }
    }
    else {
        if (vLeft < colBound.left) {
            this.editor.$body.scrollLeft += colBound.left - vLeft;
        }
        else if (vRight > colBound.right) {
            this.editor.$body.scrollLeft += colBound.right - vRight;
        }
    }
};


LayoutController.prototype.scrollYBy = function (dy, dx) {
    dx = dx || 0;
    if (this.editor.$body.scrollTop + dy > this.editor.$body.scrollHeight - this.editor.$body.clientHeight) {
        dy = this.editor.$body.scrollHeight - this.editor.$body.clientHeight - this.editor.$body.scrollTop;
    }
    else if (this.editor.$body.scrollTop + dy < 0) {
        dy = -this.editor.$body.scrollTop;
    }
    if (dy)
        this.editor.$body.scrollTop += dy;

    if (this.editor.$body.scrollLeft + dx > this.editor.$body.scrollWidth - this.editor.$body.clientWidth) {
        dx = this.editor.$body.scrollWidth - this.editor.$body.clientWidth - this.editor.$body.scrollLeft;
    }
    else if (this.editor.$body.scrollLeft + dx < 0) {
        dx = -this.editor.$body.scrollLeft;
    }
    if (dx)
        this.editor.$body.scrollLeft += dx;
    return dy * dy + dx * dx;
};


/***
 *
 * @param {WheelEvent} ev
 */
LayoutController.prototype.ev_wheel = function (ev) {
    var dL = ev.shiftKey ? this.scrollYBy(0, ev.deltaY) : this.scrollYBy(ev.deltaY);
    if (dL !== 0) ev.preventDefault();
};

LayoutController.prototype.ev_mosemove = function (ev) {
    if (!this.editor.tableData) return;
};


LayoutController.prototype.ev_scrollHeader = function () {
    var now = new Date().getTime();
    if (this._scrollHolder && this._scrollHolder.by !== 'header' && now - this._scrollHolder.time < 100) {
        return;
    }
    this._scrollHolder = { time: now, by: 'header' };
    this.editor.$indexSccroller.scrollTop = this.editor.$body.scrollTop;
    this.editor.$body.scrollLeft = this.editor.$headerScroller.scrollLeft;
    this.editor.selectTool.updateSelectedPosition();
};


LayoutController.prototype.ev_scrollBody = function () {
    var now = new Date().getTime();
    if (this._scrollHolder && this._scrollHolder.by !== 'body' && now - this._scrollHolder.time < 100) {
        return;
    }
    this._scrollHolder = { time: now, by: 'body' };
    this.editor.$indexSccroller.scrollTop = this.editor.$body.scrollTop;
    this.editor.$headerScroller.scrollLeft = this.editor.$body.scrollLeft;
    this.editor.selectTool.updateSelectedPosition();
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
    this.editor.$indexCol.on('contextmenu', this.ev_indexColContextMenu);
};


CommandController.prototype.ev_indexColContextMenu = function (ev) {
    var thisTE = this.editor;
    var row = this.editor.tableData.findRowByClientY(ev.clientY);
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
        var eventData = { cmd: cmd };
        switch (cmd) {
            case 'row_height':
                selectRowHeight({ value: thisTE.tableData.config.rowHeight, standard: 21 })
                    .then(function (result) {
                        thisTE.tableData.config.rowHeight = result;
                        ResizeSystem.update();
                    }, err=>{
                        if (err) console.error(err);
                    });
                break;
            case 'remove':
                eventData.type = 'cmd_remove_row';
                eventData.rowIdx = row.idx;
                eventData.accepted = true;
                eventData.accept = function (isAccepted) {
                    this.accepted = isAccepted;
                };
                thisTE.emit(eventData.type, eventData, thisTE);
                if (eventData.accepted && eventData.accepted.then) {
                    eventData.accepted.then(function (isAccept) {
                        if (isAccept)
                            thisTE.removeRow(eventData.rowIdx);
                    });
                }
                else if (eventData.accepted) {
                    thisTE.removeRow(eventData.rowIdx);
                }
                break;
            case 'insert_before':
            case 'insert_after':
                eventData.type = 'cmd_insert_row';
                eventData.rowIdx = row.idx + (cmd === 'insert_after' ? 1 : 0);
                eventData.result = {};
                eventData.resolve = function (result) {
                    this.result = result;
                };

                thisTE.emit(eventData.type, eventData, thisTE);
                if (eventData.result) {
                    if (eventData.result.then) {
                        eventData.result.then(function (result) {
                            if (result) {
                                thisTE.insertRow(eventData.rowIdx, result);
                            }
                        });
                    }
                    else {
                        thisTE.insertRow(eventData.rowIdx, eventData.result);
                    }
                }
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

TableEditor.prototype.ev_rootCellContextMenu = function (ev) {
    var thisTE = this;
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
        var eventData = { cmd: cmd };
        eventData.type = 'cmd_insert_row';
        eventData.rowIdx = cmd === 'insert_first' ? 0 : thisTE.tableData.records.length;
        eventData.result = {};
        eventData.resolve = function (result) {
            this.result = result;
        };

        thisTE.emit(eventData.type, eventData, thisTE);
        if (eventData.result) {
            if (eventData.result.then) {
                eventData.result.then(function (result) {
                    if (result) {
                        thisTE.insertRow(eventData.rowIdx, result);
                        if (cmd === 'append_last') {
                            thisTE.$body.scrollTop = thisTE.$body.scrollHeight - thisTE.$body.clientHeight;
                        }
                    }
                });
            }
            else {
                thisTE.insertRow(eventData.rowIdx, eventData.result);
                thisTE.$body.scrollTop = thisTE.$body.scrollHeight - thisTE.$body.clientHeight;
            }
        }

    });
};

