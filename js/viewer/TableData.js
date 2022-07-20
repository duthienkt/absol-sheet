import SComp from '../dom/SComp';
import TDRecord from "./TDRecord";
import Attributes from "absol/src/AppPattern/Attributes";
import '../../css/tabledata.css';
import EventEmitter from "absol/src/HTML5/EventEmitter";
import OOP from "absol/src/HTML5/OOP";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import TSFunction from "../fx/TSFunction";
import DomSignal from "absol/src/HTML5/DomSignal";
import TSSwitch from "../fx/TSSwitch";

var _ = SComp._;
var $ = SComp.$;


/***
 * /**
 * @extends EventEmitter
 * @param {TableEditor} editor
 * @param {object=} opt
 * @constructor
 */
function TableData(editor, opt) {
    this.editor = editor;
    this.opt = opt || {};
    EventEmitter.call(this);
    this.propertyNames = [];
    this.propertyDescriptors = {};
    this.records = [];
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

OOP.mixClass(TableData, EventEmitter);

TableData.prototype.defaultConfig = {
    rowHeight: 21
};

TableData.prototype.configHandlers = {};

TableData.prototype.configHandlers.rowHeight = {
    set: function (value) {
        if (!(value > 0 && value < 1024)) {
            value = this.defaultConfig.rowHeight;
        }
        this.$view.addStyle('--row-height', value + 'px');
        return value;
    }
}


TableData.prototype.export = function () {
    return {
        propertyNames: this.propertyNames,
        propertyDescriptors: this.propertyDescriptors,
        records: this.records,
        config: this.config.export()
    }
};

TableData.prototype.import = function (data) {
    this.propertyDescriptors = data.propertyDescriptors;
    this.propertyNames = data.propertyNames;
    this.records = data.records;
    Object.assign(this.config, this.defaultConfig, data.config || {});
    this._computeData();
    this.reload();
};


TableData.prototype._computeData = function () {
    var descriptors = this.propertyDescriptors;
    var descriptor;
    var self = this;
    var propertyNames = this.propertyNames;
    propertyNames.forEach(name => {
        descriptor = descriptors[name];
        if (!descriptor) return;
        self._computeDescriptor(descriptor, propertyNames);
        var dependencies = {};
        var fx = descriptor.__fx__;
        Object.keys(fx).reduce(function (ac, key) {
            if (fx[key].dependents) {
                fx[key].dependents.reduce(function (ac1, pName) {
                    ac1[pName] = true;
                    return ac1;
                }, ac);
            }
            // ac[];
            return ac;
        }, dependencies);
        delete dependencies[name];
        Object.defineProperty(descriptor, '__dependencies__',
            {
                configurable: true,
                enumerable: false,
                value: dependencies
            });
    });
};

TableData.prototype._computeDescriptor = function (descriptor, propertyNames) {
    Object.defineProperty(descriptor, '__fx__', {
        configurable: true,
        enumerable: false,
        value: {}
    });
    Object.keys(descriptor).reduce(function (ac, key) {
        var val = descriptor[key];
        if (typeof val === 'string') {
            if (val.startsWith('=')) {
                descriptor.__fx__[key] = new TSFunction(propertyNames, val);
            }
            else if (val.startsWith('{{') && val.endsWith('}}')) {
                descriptor.__fx__[key] = new TSFunction(propertyNames, val.substring(2, val.length - 2))
            }
            else if (key === 'onchange') {
                descriptor.__fx__[key] = new TSFunction(propertyNames, val);
            }
        }
        else if (key === 'switch') {
            descriptor.__fx__['switch'] = new TSSwitch(descriptor['switch']);
        }
        return ac;
    }, descriptor.__fx__);
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
            descriptor: (thisTable.propertyDescriptors && thisTable.propertyDescriptors[name]) || { type: 'text' }
        };
    });
};

TableData.prototype.loadBody = function () {
    var thisTable = this;
    this.$tbody.clearChild();
    this.bodyRow = this.records.map(function (record, idx) {
        return new TDRecord(thisTable, record, idx);
    });
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
    this.$view = _({
        tag: 'table',
        class: 'asht-table-data',
        child: [
            { tag: 'thead', child: 'tr' },
            {
                tag: 'tbody',
                child: [
                    {}
                ]
            }
        ]
    });
    this.$thead = $('thead', this.$view);
    this.$headRow = $('tr', this.$thead);
    this.$tbody = $('tbody', this.$view);
    this.$rootCell = _('td.asht-table-data-root-cell');
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
    this.newRow.idx = this.records.length;
    this.records.push(this.newRow.record);
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
})

export default TableData;

