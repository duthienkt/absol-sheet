import '../../css/tableeditable.css';
import SComp from "../dom/SComp";
import TableData, {TSRow} from "../viewer/TableData";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import TextCellEditor from "./editor/TextCellEditor";
import NumberCellEditor from "./editor/NumberCellEditor";
import "absol-acomp/js/BContextCapture";
import ContextCaptor from 'absol-acomp/js/ContextMenu';
import EnumCellEditor from "./editor/EnumCellEditor";
import BooleanCellEditor from "./editor/BooleanCellEditor";
import OOP from "absol/src/HTML5/OOP";
import EventEmitter from "absol/src/HTML5/EventEmitter";

var _ = SComp._;
var $ = SComp.$;

/***
 *
 * @constructor
 */
function TableEditor() {
    EventEmitter.call(this);
    this.hoverRow = null;
    this.currentCellEditor = null;
    this.selectedData = null;
    for (var key in this) {
        if (key.startsWith('ev_')) {
            this[key] = this[key].bind(this);
        }
    }
}

OOP.mixClass(TableEditor, EventEmitter);


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
                    class: 'asht-table-editor-content', child: {
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
    this.$body = $('.asht-table-editor-body', this.$view);
    this.$body.on('scroll', this.ev_scrollBody);
    this.$content = $('.asht-table-editor-content', this.$view);
    this.$foreground = $('.asht-table-editor-foreground', this.$view);
    this.$editingLayer = $('.asht-table-editor-editing-layer', this.$view)
        .on('mousedown', this.ev_editLayerMouseDown);
    this.$editingbox = $('.asht-table-editor-editing-box', this.$view)
        .addStyle('display', 'none');

    this.$selectedbox = $('.asht-table-editor-selected-box', this.$foreground).addStyle('display', 'none')

    this.$view.on('wheel', this.ev_wheel)
        .on('mousemove', this.ev_mosemove);

    this.$rootCell = $('.asht-table-editor-root-cell', this.$view)
        .on('mousedown', this.ev_rootCellMouseDown);
    this.$header = $('.asht-table-editor-header', this.$view);
    this.$headRow = $('tr', this.$header)
        .on('mousedown', this.ev_headerMouseDown);
    this.$headerScroller = $('.asht-table-editor-header-scroller', this.$view);
    this.$headerViewport = $('.asht-table-editor-header-viewport', this.$view);

    this.$indexViewport = $('.asht-table-editor-index-viewport', this.$view);
    this.$indexCol = $('.asht-table-editor-index-col', this.$view)
        .on('mousedown', this.ev_indexColMouseDown)
        .on('contextmenu', this.ev_indexColContextMenu);
    this.$indexSccroller = $('.asht-table-editor-index-scroller', this.$view);
    return this.$view;
};


TableEditor.prototype.setData = function (data) {
    if (this.$tableData) this.$tableData.remove();
    var tableData = new TableData(this);
    this.$tableData = tableData.getView();
    this.$content.addChildBefore(this.$tableData, this.$editingLayer);
    tableData.import(data);
    this.tableData = tableData;
    this.loadHeader();
    this.loadIndexCol();
    this.updateForegroundPosition();
};


TableEditor.prototype.getData = function () {
    return this.tableData && this.tableData.export();
};

TableEditor.prototype.scrollYBy = function (dy, dx) {
    dx = dx || 0;
    if (this.$body.scrollTop + dy > this.$body.scrollHeight - this.$body.clientHeight) {
        dy = this.$body.scrollHeight - this.$body.clientHeight - this.$body.scrollTop;
    }
    else if (this.$body.scrollTop + dy < 0) {
        dy = -this.$body.scrollTop;
    }
    if (dy)
        this.$body.scrollTop += dy;

    if (this.$body.scrollLeft + dx > this.$body.scrollWidth - this.$body.clientWidth) {
        dx = this.$body.scrollWidth - this.$body.clientWidth - this.$body.scrollLeft;
    }
    else if (this.$body.scrollLeft + dx < 0) {
        dx = -this.$body.scrollLeft;
    }
    if (dx)
        this.$body.scrollLeft += dx;
    return dy * dy + dx * dx;
};


/***
 *
 * @param {WheelEvent} ev
 */
TableEditor.prototype.ev_wheel = function (ev) {
    var dL = ev.shiftKey ? this.scrollYBy(0, ev.deltaY) : this.scrollYBy(ev.deltaY);
    if (dL !== 0) ev.preventDefault();
};


TableEditor.prototype.ev_scrollBody = function () {
    this.$indexSccroller.scrollTop = this.$body.scrollTop;
    this.$headerScroller.scrollLeft = this.$body.scrollLeft;
    this.updateSelectedPosition();
};


TableEditor.prototype.ev_mosemove = function (ev) {
    if (!this.tableData) return;
};


TableEditor.prototype.ev_rootCellMouseDown = function (ev) {
    this.selectAll();
    var row = this.tableData.findRowByIndex(0)
    var col = this.tableData.findColByIndex(0);
    if (row && col) {
        this.editCell(row, col);
    }
};

TableEditor.prototype.ev_headerMouseDown = function (ev) {
    var x = ev.clientX;
    var col = this.tableData.findColByClientX(x);
    var row;
    if (col) {
        this.selectCol(col);
        row = this.tableData.findRowByIndex(0);
        if (row) {
            this.editCell(row, col);
        }
    }
};

TableEditor.prototype.ev_editLayerMouseDown = function (ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    this.hoverRow = this.tableData.findRowByClientY(y);
    this.hoverCol = this.tableData.findColByClientX(x);
    if (ev.target === this.$editingLayer) {
        if (this.hoverRow) {
            if (this.hoverCol) {
                this.editCell(this.hoverRow, this.hoverCol);
                this.selectRow(null);
            }
            else {
                this.selectRow(this.hoverRow);
                this.editCell(this.hoverRow, this.tableData.headCells[0]);

            }
        }
    }
};

TableEditor.prototype.ev_indexColMouseDown = function (ev) {
    var y = ev.clientY;
    this.hoverRow = this.tableData.findRowByClientY(y);
    if (this.hoverRow) {
        this.selectRow(this.hoverRow);
        this.editCell(this.hoverRow, this.tableData.headCells[0]);
    }
};

TableEditor.prototype.ev_indexColContextMenu = function (ev) {
    var thisTE = this;
    var row = this.tableData.findRowByClientY(ev.clientY);
    ev.showContextMenu({
        items: [
            {
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
                text: 'Remove',
                icon: 'span.mdi.mdi-table-row-remove'
            },
        ]
    }, function (ev1) {
        var cmd = ev1.menuItem.cmd;
        var eventData = { cmd: cmd };
        if (cmd === 'remove') {
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
        }
        else {
            eventData.type = 'cmd_insert_row';
            eventData.rowIdx = row.idx + (cmd === 'insert_after' ? 1 : 0);
            eventData.result = {};
            eventData.resolve = function (result) {
                this.result = result;
            };

            thisTE.emit(eventData.type, eventData, thisTE);
            console.log(eventData.result)
            if (eventData.result) {
                if (eventData.result.then) {
                    eventData.result.then(function (result) {
                        if (result){
                            thisTE.insertRow(eventData.rowIdx, result);
                        }
                    });
                }
                else {
                    thisTE.insertRow(eventData.rowIdx, eventData.result);
                }
            }

        }
    });
};


TableEditor.prototype.ev_resize = function (event) {
    this.updateFixedTableEltPosition();
};


TableEditor.prototype.editCell = function (row, col) {
    if (this.currentCellEditor) {
        this.currentCellEditor.off('finish', this.ev_cellEditorFinish);
        if (this.currentCellEditor.state !== "FINISHED")
            this.currentCellEditor.finish();
        this.currentCellEditor = null;
    }
    if (row && col) {
        this.$editingbox.removeStyle('display');
        var cell = row.cells[col.index];
        this.$editingbox.clearChild();

        switch (cell.descriptor.type) {
            case 'text':
                this.currentCellEditor = new TextCellEditor(this, row.cells[col.index]);
                break;
            case 'number':
                this.currentCellEditor = new NumberCellEditor(this, row.cells[col.index]);
                break;
            case 'enum':
                this.currentCellEditor = new EnumCellEditor(this, row.cells[col.index]);
                break;
            case 'boolean':
                this.currentCellEditor = new BooleanCellEditor(this, row.cells[col.index]);
                break;
            default :
        }
        this.updateEditingBoxPosition();
        this.scrollIntoRow(row);
        this.scrollIntoCol(col);
        if (this.currentCellEditor) {
            this.currentCellEditor.on('finish', this.ev_cellEditorFinish);
        }
    }
    else {
        this.$editingbox.addStyle('display', 'none');
    }
};


TableEditor.prototype.updateEditingBoxPosition = function () {
    if (!this.currentCellEditor) return;
    var cellEditor = this.currentCellEditor;
    var elt = cellEditor.cell.elt;
    var eLBound = this.$editingLayer.getBoundingClientRect();
    var eBound = elt.getBoundingClientRect();
    var left = eBound.left - eLBound.left;
    var width = eBound.width;
    this.$editingbox.addStyle({
        left: left + 'px',
        top: eBound.top - eLBound.top + 'px',
        '--cell-width': width + 'px',
        '--cell-height': eBound.height + 'px'
    });
};


TableEditor.prototype.selectRow = function (row) {
    if (row) {
        this.selectedData = {
            type: 'row',
            row: row
        };
        this.$selectedbox.removeStyle('display');
        this.updateSelectedPosition();
    }
    else {
        // this.$selectrow
        this.selectedData = null;
        this.$selectedbox.addStyle('display', 'none');
    }
};

TableEditor.prototype.selectCol = function (col) {
    if (col) {
        this.selectedData = {
            type: 'col',
            col: col
        };
        this.$selectedbox.removeStyle('display');
        this.updateSelectedPosition();
    }
    else {
        // this.$selectrow
        this.selectedData = null;
        this.$selectedbox.addStyle('display', 'none');
    }
};

TableEditor.prototype.selectAll = function () {
    this.selectedData = {
        type: 'all'
    };
    this.$selectedbox.removeStyle('display');
    this.updateSelectedPosition();
};

TableEditor.prototype.insertRow = function (atIdx, record) {
    var tableData = this.tableData;
    atIdx = Math.min(atIdx, tableData.bodyRow.length);
    var currentRow = tableData.bodyRow[atIdx];
    var row = new TSRow(tableData, record, atIdx);
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
    this.loadIndexCol();
    this.updateFixedTableEltPosition();
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
    this.loadIndexCol();
    this.updateFixedTableEltPosition();
};

TableEditor.prototype.updateSelectedPosition = function () {
    if (!this.selectedData) return;
    var fBound = this.$foreground.getBoundingClientRect();
    if (this.selectedData.row) {
        var row = this.selectedData.row;
        var rBound = row.elt.getBoundingClientRect();
        this.$selectedbox.addStyle({
            left: rBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: rBound.top - fBound.top - 1 + 'px',
            'min-width': rBound.width + 2 + 'px',
            'min-height': rBound.height + 2 + 'px'
        });
        this.$header.addStyle('z-index', '21');
    }
    else if (this.selectedData.col) {
        var col = this.selectedData.col;
        var cBound = col.elt.getBoundingClientRect();
        var tBound = col.elt.parentElement.parentElement.parentElement.getBoundingClientRect();
        this.$selectedbox.addStyle({
            left: cBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: tBound.top - fBound.top - 1 + 'px',
            'min-width': cBound.width + 2 + 'px',
            'min-height': tBound.height + 2 + 'px'
        });
        this.$header.addStyle('z-index', '19');
    }
    else if (this.selectedData.type == 'all') {
        var tBound = this.tableData.$view.getBoundingClientRect();
        this.$selectedbox.addStyle({
            left: tBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: tBound.top - fBound.top - 1 + 'px',
            'min-width': tBound.width + 2 + 'px',
            'min-height': tBound.height + 2 + 'px'
        });
    }
};

TableEditor.prototype.loadHeader = function () {
    var $headRow = this.$headRow;
    $headRow.clearChild();
    Array.prototype.forEach.call(this.tableData.$headRow.children, function (td, index) {
        var newTd = $(td.cloneNode(true));
        newTd.$originElt = td;
        newTd.__index__ = index - 1;
        $headRow.addChild(newTd);
    });
    this.updateHeaderPosition();
};


TableEditor.prototype.updateHeaderPosition = function () {
    var headerElt = this.$header;
    var headerViewport = this.$headerViewport;
    var rootCellElt = this.$rootCell;
    Array.prototype.forEach.call(this.$headRow.children, function (td, i) {
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
    var bound = this.tableData.$view.getBoundingClientRect();
    this.$header.addStyle('width', bound.width + 'px');
};

TableEditor.prototype.loadIndexCol = function () {
    this.$indexCol.clearChild();
    this.$indexColRows = this.tableData.bodyRow.map(function (row) {
        var trElt = $(row.elt.cloneNode(false));
        trElt.$originElt = row.elt;
        var tdElt = $(row.elt.firstChild.cloneNode(true));
        tdElt.$originElt = row.elt.firstChild;
        trElt.addChild(tdElt);
        return trElt;
    });
    var indexHeaderElt = $(this.tableData.$headRow.firstChild.cloneNode());
    indexHeaderElt.$originElt = this.tableData.$headRow.firstChild;
    var indexHeaderRowElt = _({ tag: 'tr', child: indexHeaderElt });
    indexHeaderRowElt.$originElt = this.tableData.$headRow;
    this.$indexColRows.unshift(indexHeaderRowElt);
    this.$indexCol.addChild(this.$indexColRows);
    this.updateIndexColPosition();
};

TableEditor.prototype.updateIndexColPosition = function () {
    var indexViewportElt = this.$indexViewport;
    var indexColElt = this.$indexCol;
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

TableEditor.prototype.updateForegroundPosition = function () {
    this.$view.addStyle({
        '--body-scroll-width': this.$body.offsetWidth - this.$body.clientWidth + 'px',
        '--body-scroll-height': this.$body.offsetHeight - this.$body.clientHeight + 'px',
    });
};

TableEditor.prototype.updateFixedTableEltPosition = function () {
    if (!this.tableData) return;
    this.updateHeaderPosition();
    this.updateIndexColPosition();
    this.updateForegroundPosition();
    this.updateEditingBoxPosition();
    this.updateSelectedPosition();
};

TableEditor.prototype.scrollIntoRow = function (row) {
    var headerBound = this.$header.getBoundingClientRect();
    var bBound = this.$foreground.getBoundingClientRect();
    var rowBound = row.elt.getBoundingClientRect();
    var vTop = headerBound.bottom;
    var vBottom = bBound.bottom;
    if (vBottom - vTop >= rowBound.height) {
        if (rowBound.bottom > vBottom) {
            this.$body.scrollTop += rowBound.bottom - vBottom;
        }
        else if (rowBound.top < vTop) {
            this.$body.scrollTop += rowBound.top - vTop;
        }
    }
    else {
        this.$body.scrollTop += rowBound.top + rowBound.height / 2 - (vBottom + vTop) / 2;
    }
};

TableEditor.prototype.scrollIntoCol = function (col) {
    var colBound = col.elt.getBoundingClientRect();
    var iBound = this.$indexCol.getBoundingClientRect();
    var bBound = this.$foreground.getBoundingClientRect();
    var vLeft = iBound.right;
    var vRight = bBound.right;
    if (vRight - vLeft >= colBound.width) {
        if (colBound.right > vRight) {
            this.$body.scrollLeft += colBound.right - vRight;
        }
        else if (colBound.left < vLeft) {
            this.$body.scrollLeft += colBound.left - vLeft;
        }
    }
    else {
        if (vLeft < colBound.left) {
            this.$body.scrollLeft += colBound.left - vLeft;
        }
        else if (vRight > colBound.right) {
            this.$body.scrollLeft += colBound.right - vRight;
        }
    }
};

TableEditor.prototype.ev_cellEditorFinish = function (event) {
    if (this.currentCellEditor === event.target) {
        this.editCell(null);
    }
};


Object.defineProperty(TableEditor.prototype, 'records', {
    get: function () {
        return this.tableData && this.tableData.records;
    }
});


export default TableEditor;







