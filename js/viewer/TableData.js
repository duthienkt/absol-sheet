import { _, $ } from '../dom/SCore';
import TDRecord from "./TDRecord";
import Attributes from "absol/src/AppPattern/Attributes";
import '../../css/tabledata.css';
import OOP from "absol/src/HTML5/OOP";
import DomSignal from "absol/src/HTML5/DomSignal";
import { ASHTTable } from "../fragment/Abstractions";
import { isNaturalNumber } from "absol-acomp/js/utils";
import { stringHashCode } from "absol/src/String/stringUtils";


/***
 * /**
 * @extends ASHTTable
 * @param {TableEditor} editor
 * @param {object=} opt
 * @constructor
 */
function TableData(editor, opt) {
    ASHTTable.apply(this, arguments);

    this.bodyRow = [];
    this.headCells = [];
    this.newRow = null;
    /***
     *
     * @type {Attributes}
     */
    this.config = new Attributes(this);
    this.config.loadAttributeHandlers(this.configHandlers);
    for (var key in this) {
        if (key.startsWith('ev_')) {
            this[key] = this[key].bind(this);
        }
    }
}

OOP.mixClass(TableData, ASHTTable);

TableData.prototype.defaultConfig = {
    rowHeight: 30
};

TableData.prototype.configHandlers = {};


TableData.prototype.configHandlers.rowHeight = {
    set: function (value) {
        value = 30;
        this.getView();
        if (!(value > 0 && value < 1024)) {
            value = this.defaultConfig.rowHeight;
        }
        this.$view.addStyle('--row-height', value + 'px');
        return value;
    },
    export: function (ref) {
        if (ref.get() === 21) return undefined;
        return ref.get() || undefined;
    }
};


TableData.prototype.export = function () {
    var res = {
        propertyNames: this.propertyNames,
        propertyDescriptors: this.propertyDescriptors,
        records: this.getRecords()
    };
    var config = this.config.export();
    if (Object.keys(config).length > 0) {
        res.config = config;
    }
    return res;
};

TableData.prototype.import = function (data) {
    this.formSource = data.formSource;
    this.propertyDescriptors = data.propertyDescriptors;
    this.propertyNames = data.propertyNames;
    Object.assign(this.config, this.defaultConfig, data.config || {});
    this.computeFormSource();
    this.computeHeader();
    this.bodyRow = (data.records || []).map((record, idx) => {
        return new TDRecord(this, record, idx);
    });
    this.reload();
    this.emitResizeEvent();
};


TableData.prototype.getHash = function () {
    return this.bodyRow.reduce((ac, row) => stringHashCode(row.getHash() + ',' + ac));
};

TableData.prototype.onStart = function () {
    // console.log(this, 'start');
};


TableData.prototype.onResume = function () {
    // console.log(this, 'resume');

};


TableData.prototype.onPause = function () {
    // console.log(this, 'pause');

};


TableData.prototype.onStop = function () {
    // console.log(this, 'stop');
};


TableData.prototype.reload = function () {
    this.loadHeader();
    this.loadBody();
};

TableData.prototype.loadHeader = function () {
    var thisTable = this;
    this.$headRow.clearChild();
    this.$headRow.addChild(this.$rootCell);
    this.colIndexOfProperty = this.propertyNames.reduce(function (ac, name, i) {
        ac[name] = i + 1;
        return ac;
    }, {});
    this.headCells = this.propertyNames.map(function (name, i) {
        var cell = _({
            tag: 'td',
            attr: {
                'data-col-idx': i,
                'data-prop-name': name
            },
            child: {
                tag: 'span',
                child: {
                    text: (thisTable.propertyDescriptors
                        && thisTable.propertyDescriptors[name]
                        && thisTable.propertyDescriptors[name].text
                    ) || name
                }
            }
        });
        thisTable.$headRow.addChild(cell);
        return {
            elt: cell,
            index: i,
            name: name,
            descriptor: (thisTable.propertyDescriptors && thisTable.propertyDescriptors[name]) || {type: 'text'}
        };
    });
    this.$headRow.addChild(this.$menu);

};

TableData.prototype.loadBody = function () {
    var thisTable = this;
    this.$tbody.clearChild();

    var rowEltList = this.bodyRow.map(function (row) {
        return row.elt;
    });
    this.$tbody.addChild(rowEltList);
    this.newRow = new TDRecord(this, {}, '*');

    this.newRow.once('property_change', this.ev_newRowPropertyChange);
    this.$tbody.addChild(this.newRow.elt);
};


TableData.prototype.getView = function () {
    if (this.$view) return this.$view;
    var viewConstructor = {
        class: 'asht-table-data',
        child: [
            {tag: 'thead', child: 'tr'},
            {
                tag: 'tbody',
                child: [
                    {}
                ]
            }
        ]
    };
    if (this.opt.elt) {
        viewConstructor.elt = this.opt.elt;
    }
    else {
        viewConstructor.tag = 'table';
    }

    this.$view = _(viewConstructor);

    this.$thead = $('thead', this.$view);
    this.$headRow = $('tr', this.$thead);
    this.$tbody = $('tbody', this.$view);
    this.$rootCell = _('td.asht-table-data-root-cell');
    this.$menu = _({
        tag: 'td',
        class: 'asht-menu',
        child: 'span.mdi.mdi-dots-vertical'
    });
    this.$domSignal = _('attachhook').addTo(this.$rootCell);
    this.domSignal = new DomSignal(this.$domSignal)
        .on('requestEmitResizeEvent', function () {
            window.dispatchEvent(new Event('resize'));
        });
    return this.$view;
};

TableData.prototype.emitResizeEvent = function () {
    window.dispatchEvent(new Event('resize'));
    this.domSignal.emit('requestEmitResizeEvent');
};

/***
 *
 * @param {Object=} newRecord
 */
TableData.prototype.flushNewRow = function (newRecord) {
    this.newRow.idx = this.bodyRow.length;
    this.bodyRow.push(this.newRow);
    this.newRow.makeDefaultValues();
    this.newRow = new TDRecord(this, newRecord || {}, "*");
    this.newRow.once('property_change', this.ev_newRowPropertyChange);
    this.$tbody.addChild(this.newRow.elt);
    this.emitResizeEvent();
};


/**
 * @param {Number} y
 */
TableData.prototype.findRowByClientY = function (y) {
    var length = this.bodyRow.length + 1;
    var start = 0;
    var mid;
    var row;
    var rowY;
    var position;
    while (length > 0) {
        mid = start + (length >> 1);
        row = this.bodyRow[mid] || this.newRow;
        position = row.elt.getBoundingClientRect();
        rowY = position.top;
        if (y < rowY) {
            length = mid - start;
        }
        else if (y > rowY + position.height) {
            length = start + length - mid - 1;
            start = mid + 1;
        }
        else {
            return row;
        }
    }
    return null;
};

/**
 *
 * @param elt
 * @returns {TDRecord}
 */
TableData.prototype.findRowByElt = function (elt) {
    while (elt) {
        if (elt.tdRecord) return elt.tdRecord;
        elt = elt.parentElement;
    }
    return  null;
};

TableData.prototype.findFirsIncompleteCell = function () {
    var cells;
    for (var i = 0; i < this.bodyRow.length; ++i) {
        cells = this.bodyRow[i].getIncompleteCells();
        if (cells.length > 0) {
            return cells[0];
        }
    }
};


/**
 * @param {Number} x
 */
TableData.prototype.findColByClientX = function (x) {
    var length = this.headCells.length;
    var start = 0;
    var mid;
    var cell;
    var rowX;
    var position;
    while (length > 0) {
        mid = start + (length >> 1);
        cell = this.headCells[mid];
        position = cell.elt.getBoundingClientRect();
        rowX = position.left;
        if (x < rowX) {
            length = mid - start;
        }
        else if (x > rowX + position.width) {
            length = start + length - mid - 1;
            start = mid + 1;
        }
        else {
            return cell;
        }
    }
    return null;
};

TableData.prototype.findColByIndex = function (index) {
    return this.headCells[index] || null;
};

TableData.prototype.findColByName = function (name) {
    return this.headCells[this.propertyNames.indexOf(name)] || null;
};




TableData.prototype.findRowByIndex = function (index) {
    if (index === '*') return this.newRow;
    return this.bodyRow[index] || null;
};

TableData.prototype.rowAt = function (index) {
    return this.bodyRow[index];
};


TableData.prototype.removeRowAt = function (idx) {
    var row = this.bodyRow[idx];
    if (!row) return;
    this.bodyRow.splice(idx, 1);
    this.$tbody.removeChild(row.elt);
    for (var i = idx; i < this.bodyRow.length; ++i) {
        this.bodyRow[i].idx = i;
    }
    this.emitResizeEvent();
};

TableData.prototype.addRowAt = function (idx, record) {
    if (idx < 0) idx = 0;
    if (idx > this.bodyRow.length || !isNaturalNumber(idx)) idx = this.bodyRow.length;
    var atElt = this.$tbody.childNodes[idx];
    var newRow = new TDRecord(this, record, idx);
    this.bodyRow.splice(idx, 0, newRow);
    this.$tbody.addChildBefore(newRow.elt, atElt);
    for (var i = idx + 1; i < this.bodyRow.length; ++i) {
        this.bodyRow[i].idx = i;
    }
};

TableData.prototype.getLength = function () {
    return this.bodyRow.length;
};

TableData.prototype.getRecords = function () {
    return this.bodyRow.map(function (r) {
        return r.record;
    });
};


TableData.prototype.findIndexOfCol = function (col) {
    return this.headCells.indexOf(col);
};

TableData.prototype.ev_newRowPropertyChange = function (event) {
    this.emit('new_row_property_change', Object.assign({}, event, {
        type: 'new_row_property_change',
        target: this,
        tdRecord: event.target
    }), this);
};


Object.defineProperty(TableData.prototype, 'fragment', {
    get: function () {
        return (this.editor && this.editor.fragment) || this.opt.fragment || null
    },
});

export default TableData;

