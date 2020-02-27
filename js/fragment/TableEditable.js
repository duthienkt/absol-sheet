import '../../css/tableeditable.css';
import SComp from "../dom/SComp";
import TableData from "../viewer/TableData";

var _ = SComp._;
var $ = SComp.$;


function TableEditable() {
    this.ev_wheel = this.ev_wheel.bind(this);
    this.ev_mosemove = this.ev_mosemove.bind(this);
    this.ev_forcegroundMouseDown = this.ev_forcegroundMouseDown.bind(this);
    this.ev_dblclickEditBox = this.ev_dblclickEditBox.bind(this);
    this.ev_scrollBody = this.ev_scrollBody.bind(this);
    this.hoverRow = null;
    this.editingData = null;
    this.selectedData = null;
}


TableEditable.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _({
        class: 'asht-table-editable',
        child: [
            'bscroller.asht-table-editable-body',
            {
                class: 'asht-table-editable-forceground',
                child: [
                    {
                        tag: 'table',
                        class: ['asht-table-editable-header', 'asht-table-data'],
                        child: {
                            tag: 'thead',
                            child: 'tr'
                        }
                    },
                    '.asht-table-editable-editing-box',
                    '.asht-table-editable-selected-box'
                ]
            }
        ]
    });

    this.$body = $('.asht-table-editable-body', this.$view);
    this.$body.on('scroll', this.ev_scrollBody);
    this.$forceground = $('.asht-table-editable-forceground', this.$view);
    this.$forceground.on('mousedown', this.ev_forcegroundMouseDown);
    this.$editingbox = $('.asht-table-editable-editing-box', this.$forceground)
        .addStyle('display', 'none')
        .on('dblclick', this.ev_dblclickEditBox);

    this.$selectedbox = $('.asht-table-editable-selected-box', this.$forceground).addStyle('display', 'none')

    this.$view.on('wheel', this.ev_wheel)
        .on('mousemove', this.ev_mosemove);

    this.$header = $('.asht-table-editable-header', this.$view);
    this.$headRow = $('tr', this.$header);
    return this.$view;
};





TableEditable.prototype.setData = function (data) {
    this.$body.clearChild();
    var tableData = new TableData(this);
    tableData.getView().addTo(this.$body);
    tableData.import(data);
    this.tableData = tableData;
    this.loadHeader();
};


TableEditable.prototype.getData = function () {

};

TableEditable.prototype.scrollYBy = function (dy) {
    if (this.$body.scrollTop + dy > this.$body.scrollHeight - this.$body.offsetHeight) {
        dy = this.$body.scrollHeight - this.$body.offsetHeight - this.$body.scrollTop;
    }
    else if (this.$body.scrollTop + dy < 0) {
        dy = - this.$body.scrollTop;
    }
    this.$body.scrollTop += dy;
    return dy;
};

TableEditable.prototype.ev_dblclickEditBox = function (event) {
    if (event.target == this.$editingbox) {
        var editingData = this.editingData;
        if (editingData.onDblClickEditBox) {
            editingData.onDblClickEditBox();
        }
    }
};

TableEditable.prototype.ev_wheel = function (ev) {
    var dy = this.scrollYBy(ev.deltaY);
    if (dy != 0) ev.preventDefault();
};


TableEditable.prototype.ev_scrollBody = function () {
    this.updateEditingBoxPosition();
    this.updateSelectedPosition();
};



TableEditable.prototype.ev_mosemove = function (ev) {
    if (!this.tableData) return;
    var x = ev.clientX;
    var y = ev.clientY;
    var now = new Date().getTime();
    this.hoverRow = this.tableData.findRowByClientY(y);
    this.hoverCol = this.tableData.findColByClientX(x);
};

TableEditable.prototype.ev_forcegroundMouseDown = function (ev) {
    if (ev.target == this.$forceground) {
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
        else {
            if (this.hoverCol) {
                this.selectCol(this.hoverCol);
                var firsRow = this.tableData.findRowByIndex(0);
                if (firsRow)
                    this.editCell(firsRow, this.hoverCol);
            }
        }
    }
};

TableEditable.prototype.editCell = function (row, col) {
    if (row && col) {
        this.$editingbox.removeStyle('display');
        this.editingData = {
            row: row,
            col: col
        };
        this.$editingbox.clearChild();
        this.updateEditingBoxPosition();
        this.loadTextCellEditor();
    }
    else {
        this.$editingbox.addStyle('display', 'none');
        this.editingData = null;
    }
};

TableEditable.prototype.loadTextCellEditor = function () {
    var thisTableEditable = this;
    var editingData = this.editingData;
    var cellElt = editingData.row.cells[editingData.col.index].elt;
    var record = editingData.row.record;
    var name = editingData.col.name;
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
            display: 'inline-block'
        },
        outline: 'none'
    }).addTo(this.$editingbox);


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
        else if (event.key.length == 1){
            editor.off('keydown', waitFirstKey, true);
            editor.on('keydown', waitFinishKey, true);
        }
    };

    editor.on('keydown', waitFirstKey, true);

    function waitFinishKey(event) {
        if (event.key == "Enter") {
            var text = editor.value;
            if (event.altKey) {
                var pos = editor.getSelectPostion();
                var newText = text.substr(0, pos.start) + '\n' + text.substr(pos.end);
                editor.applyData(newText, post.start + 1);
                editor.waitToCommit(newText, post.start + 1);
            }
            else {
                cellElt.clearChild().addChild(_({ tag: 'span', child: { text: text } }));
                record[name] = text;
                thisTableEditable.editCell(null);
            }
            event.preventDefault();
        }
        else if (event.key == "Escape"){
            thisTableEditable.editCell(null);
        }
    }

    setTimeout(function () {
        editor.focus();
    }, 10);
    this.editingData.onDblClickEditBox = function () {
        editor.off('keydown', waitFirstKey, true);
        editor.on('keydown', waitFinishKey, true);
        editor.focus();
        editor.value = record[name];
    };
};


TableEditable.prototype.updateEditingBoxPosition = function () {
    if (!this.editingData) return;
    var row = this.editingData.row;
    var col = this.editingData.col;
    var elt = row.cells[col.index].elt;
    var fBound = this.$forceground.getBoundingClientRect();
    var eBoud = elt.getBoundingClientRect();
    this.$editingbox.addStyle({
        left: eBoud.left - fBound.left - 2 + 'px',// boder-width = 2px
        top: eBoud.top - fBound.top - 2 + 'px',
        'min-width': eBoud.width + 4 + 'px',
        'min-height': eBoud.height + 4 + 'px'
    });
};



TableEditable.prototype.selectRow = function (row) {
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

TableEditable.prototype.selectCol = function (col) {
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

TableEditable.prototype.selectAll = function () {
    this.selectedData = {
        type: 'all'
    };
    this.$selectedbox.removeStyle('display');
    this.updateSelectedPosition();
};



TableEditable.prototype.updateSelectedPosition = function () {
    if (!this.selectedData) return;
    var fBound = this.$forceground.getBoundingClientRect();
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
        var tBount = col.elt.parentElement.parentElement.parentElement.getBoundingClientRect();
        this.$selectedbox.addStyle({
            left: cBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: tBount.top - fBound.top - 1 + 'px',
            'min-width': cBound.width + 2 + 'px',
            'min-height': tBount.height + 2 + 'px'
        });
        this.$header.addStyle('z-index', '19');
    }
    else if (this.selectedData.type == 'all') {
        var tBount = this.tableData.$view.getBoundingClientRect();
        this.$selectedbox.addStyle({
            left: tBount.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: tBount.top - fBound.top - 1 + 'px',
            'min-width': tBount.width + 2 + 'px',
            'min-height': tBount.height + 2 + 'px'
        });
    }
};

TableEditable.prototype.loadHeader = function () {
    var thisEditor = this;
    var $headRow = this.$headRow;
    Array.prototype.forEach.call(this.tableData.$headRow.children, function (td, index) {
        var newTd = $(td.cloneNode(true));
        newTd.$originElt = td;
        newTd.__index__ = index - 1;
        newTd.on('mousedown', function (event) {
            if (index > 0) {
                var col = thisEditor.tableData.findColByIndex(index - 1);
                var row = thisEditor.tableData.findRowByClientY(this.getBoundingClientRect().bottom - 2);

                if (col) {
                    var nextRow = row ? thisEditor.tableData.findRowByIndex(row.index + 1) : thisEditor.tableData.findRowByIndex(0);
                    thisEditor.selectCol(col);
                    if (nextRow)
                        thisEditor.editCell(nextRow, col);
                }
            }
            else {
                thisEditor.selectAll();
                var col = thisEditor.tableData.findColByIndex(0);
                var row = thisEditor.tableData.findRowByClientY(this.getBoundingClientRect().bottom - 2);
                var nextRow = row ? thisEditor.tableData.findRowByIndex(row.index + 1) : thisEditor.tableData.findRowByIndex(0);
                if (nextRow)
                    thisEditor.editCell(nextRow, col);

            }
        });
        $headRow.addChild(newTd);
    });
    this.updateHeaderPosition();
};


TableEditable.prototype.updateHeaderPosition = function () {
    Array.prototype.forEach.call(this.$headRow.children, function (td) {
        var originTd = td.$originElt;
        var bound = originTd.getBoundingClientRect();
        td.addStyle({
            width: bound.width + 'px'
        })
    });
};

export default TableEditable;