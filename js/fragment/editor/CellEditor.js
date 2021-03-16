import EventEmitter from "absol/src/HTML5/EventEmitter";
import OOP from "absol/src/HTML5/OOP";

/***
 * @extends EventEmitter
 * @param {TableEditor} tableEditor
 * @param {TSCell} cell
 * @constructor
 */
function CellEditor(tableEditor, cell) {
    EventEmitter.call(this);
    this.state = "INIT";
    this.tableEditor = tableEditor;
    this.cell = cell;
    this.row = cell.row;
    this.col = cell.table.findColByName(cell.pName);
    this.$editingbox = tableEditor.$editingbox;
    this._bindEvent();
    this.$input = null;
    this.prepareInput();
    this.waitAction();
}

OOP.mixClass(CellEditor, EventEmitter);

/***
 *
 * @protected
 */
CellEditor.prototype.prepareInput = function () {

};

/***
 *
 * @protected
 */
CellEditor.prototype.waitAction = function () {
    this.state = "WAIT_ACTION";
};


CellEditor.prototype.startEditing = function () {
    this.state = "EDITING";
};


/**
 *
 * @protected
 */
CellEditor.prototype._bindEvent = function () {
    for (var fName in this) {
        if (typeof this[fName] === "function" && fName.startsWith('ev_')) {
            this[fName] = this[fName].bind(this);
        }
    }
};

CellEditor.prototype.editCellAbove = function () {
    var rowIdx = this.cell.row.idx;
    var prevRow = this.cell.table.findRowByIndex(rowIdx - 1);
    if (prevRow) {
        this.tableEditor.editCell(prevRow, this.col);
    }
};

CellEditor.prototype.editCellBellow = function () {
    var rowIdx = this.cell.row.idx;
    var nextRow = this.cell.table.findRowByIndex(rowIdx + 1);
    if (nextRow) {
        this.finish();
        this.tableEditor.editCell(nextRow, this.col);
    }
};

CellEditor.prototype.editCellLeft = function () {
    var colIdx = this.cell.table.findIndexOfCol(this.col);
    var prevCol = this.cell.table.findColByIndex(colIdx - 1);
    if (prevCol) {
        this.finish();
        this.tableEditor.editCell(this.row, prevCol);
    }
};

CellEditor.prototype.editCellRight = function () {
    var colIdx = this.cell.table.findIndexOfCol(this.col);
    var nextCol = this.cell.table.findColByIndex(colIdx + 1);
    if (nextCol) {
        this.finish();
        this.tableEditor.editCell(this.row, nextCol);
    }
};

CellEditor.prototype.editCellNext = function () {

};

CellEditor.prototype.finish = function () {
    if (this.state !== "FINISHED") {
        this.emit('finish', { type: 'finish', target: this });
    }
};

export default CellEditor;