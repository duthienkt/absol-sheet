import '../../css/tableeditable.css';
import SComp from "../dom/SComp";
import TableData from "../viewer/TableData";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";

var _ = SComp._;
var $ = SComp.$;


function TableEditor() {
    this.hoverRow = null;
    this.editingData = null;
    this.selectedData = null;
    for (var key in this) {
        if (key.startsWith('ev_')) {
            this[key] = this[key].bind(this);
        }
    }
}


TableEditor.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _({
        class: 'asht-table-editor',
        child: [
            'attachhook',
            {
                tag: 'bscroller',
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
    ResizeSystem.add(this.$attachook);
    this.$body = $('.asht-table-editor-body', this.$view);
    this.$body.on('scroll', this.ev_scrollBody);
    this.$content = $('.asht-table-editor-content', this.$view);
    this.$foreground = $('.asht-table-editor-foreground', this.$view);
    this.$editingLayer = $('.asht-table-editor-editing-layer', this.$view)
        .on('mousedown', this.ev_editLayerMouseDown);
    this.$editingbox = $('.asht-table-editor-editing-box', this.$view)
        .addStyle('display', 'none')
        .on('dblclick', this.ev_dblclickEditBox);

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
        .on('mousedown', this.ev_indexColMouseDown);
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

};

TableEditor.prototype.scrollYBy = function (dy, dx) {
    dx = dx || 0;
    if (this.$body.scrollTop + dy > this.$body.scrollHeight - this.$body.offsetHeight) {
        dy = this.$body.scrollHeight - this.$body.offsetHeight - this.$body.scrollTop;
    }
    else if (this.$body.scrollTop + dy < 0) {
        dy = -this.$body.scrollTop;
    }
    if (dy)
        this.$body.scrollTop += dy;

    if (this.$body.scrollLeft + dx > this.$body.scrollHeight - this.$body.offsetHeight) {
        dx = this.$body.scrollHeight - this.$body.offsetHeight - this.$body.scrollLeft;
    }
    else if (this.$body.scrollLeft + dx < 0) {
        dx = -this.$body.scrollLeft;
    }
    if (dx)
        this.$body.scrollLeft += dx;
    return dy * dy + dx * dx;
};

TableEditor.prototype.ev_dblclickEditBox = function (event) {
    var editingData = this.editingData;
    if (editingData && editingData.onDblClickEditBox) {
        editingData.onDblClickEditBox();
    }
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
    // newTd.on('mousedown', function (event) {
    //     if (index > 0) {
    //         col = thisEditor.tableData.findColByIndex(index - 1);
    //         row = thisEditor.tableData.findRowByIndex(0);
    //         if (col) {
    //             thisEditor.selectCol(col);
    //             if (row)
    //                 thisEditor.editCell(row, col);
    //         }
    //     }
    //     else {
    //         thisEditor.selectAll();
    //         var col = thisEditor.tableData.findColByIndex(0);
    //         var row = thisEditor.tableData.findRowByClientY(this.getBoundingClientRect().bottom - 2);
    //         var nextRow = row ? thisEditor.tableData.findRowByIndex(row.index + 1) : thisEditor.tableData.findRowByIndex(0);
    //         if (nextRow)
    //             thisEditor.editCell(nextRow, col);
    //
    //     }
    // });
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


TableEditor.prototype.ev_resize = function (event) {
    this.updateEditingBoxPosition();
};


TableEditor.prototype.editCell = function (row, col) {
    if (row && col) {
        this.$editingbox.removeStyle('display');
        this.editingData = {
            row: row,
            col: col
        };
        this.$editingbox.clearChild();
        this.updateEditingBoxPosition();
        this.loadTextCellEditor();
        this.scrollIntoRow(row);
        this.scrollIntoCol(col);
    }
    else {
        this.$editingbox.addStyle('display', 'none');
        this.editingData = null;
    }
};

TableEditor.prototype.loadTextCellEditor = function () {
    var thisTableEditor = this;
    var editingData = this.editingData;
    var cellElt = editingData.row.cells[editingData.col.index].elt;
    var record = editingData.row.record;
    var col = editingData.col;
    var name = col.name;
    var row = editingData.row;
    var rowIdx, colIdx;
    var style = {
        'min-width': parseFloat(this.$editingbox.style.minWidth.replace('px')) - 4,
        'min-height': parseFloat(this.$editingbox.style.minHeight.replace('px')) - 4,
        outline: 'none',
        'font-size': cellElt.getComputedStyleValue('font-size'),
        'font-family': cellElt.getComputedStyleValue('font-family'),
        'font-style': cellElt.getComputedStyleValue('font-style'),
        'line-height': cellElt.getComputedStyleValue('line-height'),
        'padding-left': cellElt.getComputedStyleValue('padding-left'),
        'padding-right': cellElt.getComputedStyleValue('padding-right'),
        'padding-top': cellElt.getComputedStyleValue('padding-top'),
        'padding-bottom': cellElt.getComputedStyleValue('padding-bottom'),
        'text-align': cellElt.getComputedStyleValue('text-align'),
        background: 'white',
        opacity: '1',
        display: 'block'
    };

    var editor = _({
        tag: 'preinput',
        style: {
            opacity: '0',
            padding: '0',
            margin: '0',
        },
        outline: 'none'
    }).addTo(this.$editingbox);
    editingData.$editor = editor;


    editor.on('change', function firstChange(event) {
        editor.off('change', firstChange);
        editor.addStyle(style);
    });

    function waitFirstKey(event) {
        if (event.key == "Delete") {
            cellElt.clearChild().addChild(_({ tag: 'span', child: { text: '' } }));
            record[name] = '';
        }
        else if (event.key == 'Enter') {
            editor.off('keydown', waitFirstKey, true);
            editor.focus();
            editor.value = record[name];
            editor.on('keydown', waitFinishKey, true);
            event.preventDefault();
        }
        else if (event.key.length == 1) {
            editor.off('keydown', waitFirstKey, true);
            editor.on('keydown', waitFinishKey, true);
        }
        else if (event.key === "F2") {
            editor.off('keydown', waitFirstKey, true);
            editor.focus();
            editor.value = record[name];
            editor.on('keydown', waitFinishKey, true);
            event.preventDefault();
        }
        else if (event.key === 'ArrowDown') {
            rowIdx = thisTableEditor.tableData.findIndexOfRow(row);
            var nextRow = thisTableEditor.tableData.findRowByIndex(rowIdx + 1);
            if (nextRow) {
                event.preventDefault();
                editor.off('keydown', waitFirstKey, true);
                thisTableEditor.editCell(nextRow, col);
            }
        }
        else if (event.key === 'ArrowUp') {
            rowIdx = thisTableEditor.tableData.findIndexOfRow(row);
            var prevRow = thisTableEditor.tableData.findRowByIndex(rowIdx - 1);
            if (prevRow) {
                event.preventDefault();
                editor.off('keydown', waitFirstKey, true);
                thisTableEditor.editCell(prevRow, col);
            }
        }
        else if (event.key === 'ArrowLeft') {
            colIdx = thisTableEditor.tableData.findIndexOfCol(col);
            var prevCol = thisTableEditor.tableData.findColByIndex(colIdx - 1);
            if (prevCol) {
                event.preventDefault();
                editor.off('keydown', waitFirstKey, true);
                thisTableEditor.editCell(row, prevCol);
            }
        }
        else if (event.key === 'ArrowRight') {
            colIdx = thisTableEditor.tableData.findIndexOfCol(col);
            var nextCol = thisTableEditor.tableData.findColByIndex(colIdx + 1);
            if (nextCol) {
                event.preventDefault();
                editor.off('keydown', waitFirstKey, true);
                thisTableEditor.editCell(row, nextCol);

            }
        }
    }

    editor.on('keydown', waitFirstKey, true);

    function waitFinishKey(event) {
        if (event.key == "Enter") {
            var text = editor.value;
            if (event.altKey) {
                var pos = editor.getSelectPosition();
                var newText = text.substr(0, pos.start) + '\n' + text.substr(pos.end);
                editor.applyData(newText, pos.start + 1);
                editor.waitToCommit(newText, pos.start + 1);
            }
            else {
                thisTableEditor.tableData.loadTextCell(cellElt, text, record, name);
                record[name] = text;
                thisTableEditor.editCell(null);
                thisTableEditor.updateFixedTableEltPosition();
            }
            event.preventDefault();
        }
        else if (event.key == "Escape") {
            thisTableEditor.editCell(null);
        }
    }

    setTimeout(function () {
        editor.focus();
    }, 10);
    editingData.onDblClickEditBox = function () {
        console.log('dbclick');
        editor.off('keydown', waitFirstKey, true);
        editor.on('keydown', waitFinishKey, true);
        editor.focus();
        editor.value = record[name];
        editingData.onDblClickEditBox = null;
    };
};


TableEditor.prototype.updateEditingBoxPosition = function () {
    if (!this.editingData) return;
    var row = this.editingData.row;
    var col = this.editingData.col;
    var elt = row.cells[col.index].elt;
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
    var thisEditor = this;
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
    this.updateHeaderPosition();
    this.updateIndexColPosition();
    this.updateForegroundPosition();
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

export default TableEditor;