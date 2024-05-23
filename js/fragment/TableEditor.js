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
import TableScroller from "absol-acomp/js/tablescroller/TableScroller";
import { swapChildrenInElt, vScrollIntoView } from "absol-acomp/js/utils";
import { ASHTConfirmEvent, ASHTEditor, ASHTWaitValueEvent } from "./Abstractions";


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

OOP.mixClass(TableEditor, ASHTEditor);


TableEditor.prototype.opt = {};

TableEditor.prototype.createView = function () {
    if (this.$view) return this.$view;
    ContextCaptor.auto();
    this.$view = _({
        elt: this.opt.elt,
        extendEvent: 'contextmenu',
        class: ['asht-table-editor', 'absol-table-scroller'],
        child: [
            'attachhook',
            {
                class: ['asht-table-editor-body', 'absol-table-scroller-content'],
                child: [
                    {
                        class: ['asht-table-editor-vertical-scroller', 'as-table-scroller-vertical-scroller'],
                        child: {
                            class: ['asht-table-editor-vertical-scroller-viewport', 'as-table-scroller-horizontal-scroller-viewport'],
                            child: [
                                {
                                    class: ['asht-table-editor-horizontal-scroller', 'as-table-scroller-horizontal-scroller'],
                                    child: [
                                        {
                                            class: 'as-table-scroller-fixed-x-col-ctn',
                                            child: {
                                                tag: 'table',
                                                class: 'as-table-scroller-fixed-x-col',
                                            }
                                        },
                                        {
                                            class: ['asht-table-editor-content', 'as-table-scroller-origin-table-ctn'],
                                            child: [
                                                {
                                                    class: 'asht-table-editor-foreground',
                                                    child: [
                                                        '.asht-table-editor-selected-box'
                                                    ]
                                                },
                                                '.asht-table-editor-editing-box'
                                            ]
                                        }
                                    ]
                                },

                            ]
                        }
                    },
                    {
                        class: 'as-table-scroller-fixed-y-header-ctn',
                        child: {
                            class: 'as-table-scroller-fixed-y-header-scroller',
                            child: {
                                tag: 'table',
                                class: 'as-table-scroller-fixed-y-header',

                            }
                        }
                    },
                    {
                        class: 'as-table-scroller-fixed-xy-header-ctn',
                        child: {
                            tag: 'table',
                            class: 'as-table-scroller-fixed-xy-header'
                        }
                    }
                ]
            },


            {
                class: 'absol-table-scroller-vscrollbar-container',
                child: {
                    tag: 'vscrollbar'
                }
            },
            {
                class: 'absol-table-scroller-hscrollbar-container',
                child: {
                    tag: 'hscrollbar'
                }
            },
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
    this.$editingbox = $('.asht-table-editor-editing-box', this.$view)
        .addStyle('display', 'none');

    this.$selectedbox = $('.asht-table-editor-selected-box', this.$foreground).addStyle('display', 'none')


    this.$header = $('.asht-table-editor-header', this.$view);
    this.$headRow = $('tr', this.$header);
    this.$headerScroller = $('.asht-table-editor-header-scroller', this.$view);

    this.$headerViewport = $('.asht-table-editor-header-viewport', this.$view);

    this.$indexViewport = $('.asht-table-editor-index-viewport', this.$view);
    this.$indexCol = $('.asht-table-editor-index-col', this.$view);


    this.$fixedYHeaderScroller = $('.as-table-scroller-fixed-y-header-scroller', this.$view);
    this.$fixedYHeader = $('.as-table-scroller-fixed-y-header', this.$view);
    this.$vscrollbar = $('.absol-table-scroller-vscrollbar-container vscrollbar', this.$view);
    this.$hscrollbar = $('.absol-table-scroller-hscrollbar-container hscrollbar', this.$view);

    this.$fixedXYHeader = $('.as-table-scroller-fixed-xy-header', this.$view);
    this.$fixXCol = $('.as-table-scroller-fixed-x-col', this.$view);

    this.$vscroller = $('.as-table-scroller-vertical-scroller', this.$view);
    this.$hscroller = $('.as-table-scroller-horizontal-scroller', this.$view);


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
    this.$content.addChildBefore(this.$tableData, this.$content.firstChild);
    tableData.import(data);
    this.tableData = tableData;
    this.layoutCtrl.onData();


    //? this.domSignal.emit('request_load_foreground_content');
    tableData.on('new_row_property_change', this.ev_newRowPropertyChange);
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
};

var t = 10;
TableEditor.prototype.ev_newRowPropertyChange = function (event) {
    this.tableData.flushNewRow({});
    this.layoutCtrl.updateFixedXCol();
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
    this.layoutCtrl.updateFixedXCol();
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
    this.layoutCtrl.updateFixedXCol();
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
    var eLBound = this.editor.$content.getBoundingClientRect();
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
    this.editor.$hscrollbar.on('scroll', this.ev_scroll.bind(this, 'hscrollbar'));
    this.editor.$vscrollbar.on('scroll', this.ev_scroll.bind(this, 'vscrollbar'));
    this.editor.$hscroller.on('scroll', this.ev_scroll.bind(this, 'hscroller'));
    this.editor.$vscroller.on('scroll', this.ev_scroll.bind(this, 'vscroller'));
    this.editor.$fixedYHeaderScroller.on('scroll', this.ev_scroll.bind(this, 'fixedYScroller'));
    //
    // this.editor.domSignal.on('request_load_foreground_content', this.loadForegroundContent.bind(this));
    // this.editor.$view.on('wheel', this.ev_wheel)
    //     .on('mousemove', this.ev_mosemove);
    // this.editor.$headerScroller.on('scroll', this.ev_scrollHeader);
    // this.editor.$body.on('scroll', this.ev_scrollBody);

};

LayoutController.prototype.updateScrollerStatus = function () {
    var tableBound = this.editor.$tableData.getBoundingClientRect();
    var bound = this.editor.$view.getBoundingClientRect();
    if (tableBound.width > bound.width) {
        this.editor.$view.addClass('as-scroll-horizontal');
        this.editor.$hscrollbar.outerWidth = bound.width - 17;
        this.editor.$hscrollbar.innerWidth = tableBound.width;
    }
    else {
        this.editor.$view.removeClass('as-scroll-horizontal');
    }

    if (tableBound.height > bound.height) {
        this.editor.$view.addClass('as-scroll-vertical');

        this.editor.$vscrollbar.outerHeight = bound.height - 17;
        this.editor.$vscrollbar.innerHeight = tableBound.height;
    }
    else {
        this.editor.$view.removeClass('as-scroll-vertical');
    }
};


LayoutController.prototype.updateFixedYHeader = function () {
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
    this.editor.$fixedYHeader.clearChild().addChild(head);
    this.editor.$fixedYHeader.attr('class', this.editor.tableData.$view.attr('class')).addClass('as-table-scroller-fixed-y-header')
};

LayoutController.prototype.updateFixedYHeaderSize = function () {
    var cells = this.editor.$fixedYHeader.firstChild
        && Array.prototype.slice.call(this.editor.$fixedYHeader.firstChild.firstChild.childNodes);
    var bound = this.editor.tableData.$thead.getBoundingClientRect();
    this.editor.$fixedYHeader.addStyle({
        width: bound.width + 'px',
        height: bound.height + 'px'
    });
    cells.forEach(elt => {
        elt.addStyle('width', elt.$origin.getBoundingClientRect().width + 'px')
    });
};

LayoutController.prototype.fullUpdateFixedXCol = function () {
    var head, body;
    this.editor.$fixXCol.clearChild();
    this.editor.$fixXCol.$origin = this.editor.tableData.$view;
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
    this.editor.$fixXCol.addChild(head)
        .addChild(body);
    this.editor.$fixXCol.attr('class', this.editor.tableData.$view.attr('class')).addClass('as-table-scroller-fixed-x-col');
}

LayoutController.prototype.partUpdateFixedXCol = function () {
    var body = this.editor.$fixXCol.lastChild;
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

LayoutController.prototype.updateFixedXCol = function () {
    if (this.editor.$fixXCol.$origin !== this.editor.tableData.$view) {
        this.fullUpdateFixedXCol();
    }
    else {
        this.partUpdateFixedXCol();
    }
};

LayoutController.prototype.updateFixedXColSize = function () {
    var bound = this.editor.tableData.$view.getBoundingClientRect();

    this.editor.$fixXCol.addStyle('height', bound.height + 'px');

    Array.prototype.forEach.call(this.editor.$fixXCol.firstChild.childNodes, elt => {
        elt.addStyle('height', elt.$origin.getBoundingClientRect().height + 'px');
    });

    Array.prototype.forEach.call(this.editor.$fixXCol.firstChild.firstChild.childNodes, elt => {
        elt.addStyle('width', elt.$origin.getBoundingClientRect().width + 'px');
    });
};


LayoutController.prototype.updateFixedXYHeader = function () {

    var head = $(this.editor.tableData.$thead.cloneNode(false));
    var headRows = Array.prototype.filter.call(this.editor.tableData.$thead.childNodes, elt => elt.tagName === 'TR')
        .map(tr => {
            var copyTr = _('tr');
            copyTr.$origin = tr;
            var cells = Array.prototype.filter.call(tr.childNodes, elt => elt.tagName === 'TH' || elt.tagName === 'TD');
            cells = cells.slice(0, 1)
                .map(td => $(Object.assign(td.cloneNode(true), { $origin: td })));
            copyTr.addChild(cells);
            // cells.forEach(cell => {
            //     swapChildrenInElt(cell, cell.$origin);
            //     this._swappedPairs.push([cell, cell.$origin]);
            // })
            return copyTr;

        });
    head.addChild(headRows);
    this.editor.$fixedXYHeader.clearChild().addChild(head);
    this.editor.$fixedXYHeader.attr('class', this.editor.tableData.$view.attr('class')).addClass('as-table-scroller-fixed-xy-header');
};

LayoutController.prototype.updateFixedXYHeaderSize = function () {
    Array.prototype.forEach.call(this.editor.$fixedXYHeader.firstChild.childNodes, elt => {
        elt.addStyle('height', elt.$origin.getBoundingClientRect().height + 'px');
    });
    Array.prototype.forEach.call(this.editor.$fixedXYHeader.firstChild.firstChild.childNodes, elt => {
        elt.addStyle('width', elt.$origin.getBoundingClientRect().width + 'px');
    });
    // this.$leftLine.addStyle('left', this.editor.$fixedXYHeader.getBoundingClientRect().width - 1 + 'px');
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
    this.updateFixedYHeaderSize();
    this.updateFixedXColSize();
    this.updateFixedXYHeaderSize();
    this.editor.selectTool.updateSelectedPosition();
};

LayoutController.prototype.onData = function () {
    this.updateStyleConfig();
    this.updateFixedYHeader();
    this.updateFixedXCol();
    this.updateFixedXYHeader();
};


LayoutController.prototype.scrollIntoRow = function (row) {
    var rowBound = row.elt.getBoundingClientRect();
    var bound = this.editor.$body.getBoundingClientRect();
    var headBound = this.editor.$fixedYHeader.getBoundingClientRect();
    if (rowBound.top < headBound.bottom) {
        this.editor.$vscroller.scrollTop -= headBound.bottom - rowBound.top;
    }
    else if (rowBound.bottom > bound.bottom) {
        this.editor.$vscroller.scrollTop += rowBound.bottom - bound.bottom;
    }
};

LayoutController.prototype.scrollIntoCol = function (col) {
    var colBound = col.elt.getBoundingClientRect();
    var bound = this.editor.$body.getBoundingClientRect();
    var iBound = this.editor.$fixXCol.getBoundingClientRect();
    if (colBound.left < iBound.right) {
        this.editor.$hscroller.scrollLeft -= iBound.right - colBound.left;
    }
    else if (colBound.right > bound.right) {
        this.editor.$hscroller.scrollLeft += colBound.right - bound.right;
    }
};


LayoutController.prototype.ev_scroll = function (tag, event) {
    var now = new Date().getTime();
    if (this._scrollTarget && this._scrollTarget.tag !== tag && now - this._scrollTarget.time < 100) return;
    this._scrollTarget = {
        tag: tag,
        time: now
    };
    var scrollLeft;
    if (tag === 'hscrollbar') {
        scrollLeft = this.editor.$hscrollbar.innerOffset;
        this.editor.$hscroller.scrollLeft = scrollLeft;
        this.editor.$fixedYHeaderScroller.scrollLeft = scrollLeft;
    }
    else if (tag === 'hscroller') {
        scrollLeft = this.editor.$hscroller.scrollLeft;
        this.editor.$hscrollbar.innerOffset = scrollLeft;
        this.editor.$fixedYHeaderScroller.scrollLeft = scrollLeft;
    }
    else if (tag === 'fixedYScroller') {
        scrollLeft = this.editor.$fixedYHeaderScroller.scrollLeft;
        this.editor.$hscrollbar.innerOffset = scrollLeft;
        this.editor.$hscroller.scrollLeft = scrollLeft;
    }

    var scrollTop;
    if (tag === 'vscrollbar') {
        scrollTop = this.editor.$vscrollbar.innerOffset;
        this.editor.$vscroller.scrollTop = scrollTop;
    }
    else if (tag === 'vscroller') {
        scrollTop = this.editor.$vscroller.scrollTop;
        this.editor.$vscrollbar.innerOffset = scrollTop;
    }

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
    else if (hitElement(this.editor.$fixXCol.lastChild, event)) {
        this.ev_clickIndexCol(event);
    }

};


CommandController.prototype.ev_contextMenu = function (event) {
    if (this.editor.opt.readOnly) return;
    if (hitElement(this.editor.tableData.$view, event)) {

    }
    else if (hitElement(this.editor.$fixXCol.lastChild, event)) {
        this.ev_indexColContextMenu(event);
    }
    else if (hitElement(this.editor.$fixedXYHeader, event)) {
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
        eventOpt.rowIdx = cmd === 'insert_first' ? 0 : thisTE.tableData.records.length;
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
                thisTE.$body.scrollTop = thisTE.$body.scrollHeight - thisTE.$body.clientHeight;
            }
        }

    });
};

