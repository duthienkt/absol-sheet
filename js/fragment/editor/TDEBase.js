import EventEmitter from "absol/src/HTML5/EventEmitter";
import OOP from "absol/src/HTML5/OOP";
import {_, $} from '../../dom/SCore';
import noop from "absol/src/Code/noop";


var STATE_STANDBY = 0;
var STATE_RUNNING = 1;
var STATE_STOP = 2;
var STATE_DESTROYED = 3;

/***
 * @extends EventEmitter
 * @param {TableEditor} tableEditor
 * @param {TDBase} cell
 * @constructor
 */
function TDEBase(tableEditor, cell) {
    EventEmitter.call(this);
    this.state = STATE_STANDBY;
    this.tableEditor = tableEditor;
    this.cell = cell;
    this.col = cell.table.findColByName(cell.pName);
    this.$editingbox = tableEditor.$editingbox;
    this._bindEvent();
    this.$input = null;
    this.prepareInput();
    this.reload();
}

OOP.mixClass(TDEBase, EventEmitter);

TDEBase.prototype.onStart = noop;
TDEBase.prototype.onStop = noop;
TDEBase.prototype.onDestroy = noop;

TDEBase.prototype.start = function () {
    if (this.state === STATE_STANDBY) {
        this.state = STATE_RUNNING;
        this.onStart();
    }
    else if (this.state === STATE_DESTROYED) {
        console.error(this, "Editor destroyed!");
    }
};


TDEBase.prototype.stop = function (){
  if (this.state === STATE_RUNNING){
      this.state = STATE_STOP;
      this.onStop();
  }
};

TDEBase.prototype.destroy = function (){
    if (this.state === STATE_RUNNING){
        this.stop();
    }
    if (this.state !== STATE_DESTROYED){
        this.onDestroy();
        this.state = STATE_DESTROYED;
    }
}


/***
 *
 * @protected
 */
TDEBase.prototype.prepareInput = function () {

};

TDEBase.prototype.reload = function () {

};

TDEBase.prototype.startEditing = function () {
    this.state = "EDITING";
};


/**
 *
 * @protected
 */
TDEBase.prototype._bindEvent = function () {
    for (var fName in this) {
        if (typeof this[fName] === "function" && fName.startsWith('ev_')) {
            this[fName] = this[fName].bind(this);
        }
    }
};

TDEBase.prototype.editCellAbove = function () {
    var rowIdx = this.cell.row.idx;
    var prevRow = this.cell.table.findRowByIndex(rowIdx - 1);
    if (prevRow) {
        this.tableEditor.editCell(prevRow, this.col);
    }
};

TDEBase.prototype.editCellBellow = function () {
    var rowIdx = this.cell.row.idx;
    var nextRow = this.cell.table.findRowByIndex(rowIdx + 1);
    if (nextRow) {
        this.finish();
        this.tableEditor.editCell(nextRow, this.col);
    }
};

TDEBase.prototype.editCellLeft = function () {
    var colIdx = this.cell.table.findIndexOfCol(this.col);
    var prevCol = this.cell.table.findColByIndex(colIdx - 1);
    if (prevCol) {
        this.finish();
        this.tableEditor.editCell(this.row, prevCol);
    }
};

TDEBase.prototype.editCellRight = function () {
    var colIdx = this.cell.table.findIndexOfCol(this.col);
    var nextCol = this.cell.table.findColByIndex(colIdx + 1);
    if (nextCol) {
        this.finish();
        this.tableEditor.editCell(this.row, nextCol);
    }
};

TDEBase.prototype.editCellNext = function () {
    var colIdx = this.cell.table.findIndexOfCol(this.col);
    var nextCol = this.cell.table.findColByIndex(colIdx + 1);
    if (nextCol) {
        this.finish();
        this.tableEditor.editCell(this.row, nextCol);
    }
    else {
        var rowIdx = this.cell.row.idx;
        var nextRow = this.cell.table.findRowByIndex(rowIdx + 1);
        var firstCol = this.cell.table.findColByIndex(0);
        if (nextRow && firstCol) {
            this.finish();
            this.tableEditor.editCell(nextRow, firstCol);
        }
    }
};

TDEBase.prototype.finish = function () {
    if (this.state !== "FINISHED") {
        this.state = "FINISHED";
        this.emit('finish', { type: 'finish', target: this });
    }
};

Object.defineProperty(TDEBase.prototype, 'row', {
    get: function () {
        return this.cell.row;
    }
});


TDEBase.typeClasses = {};

export default TDEBase;