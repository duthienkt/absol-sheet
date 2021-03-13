import SComp from '../dom/SComp';

var _ = SComp._;
var $ = SComp.$;


/**
 *
 * @param {TableEditor} editor
 */
function TableData(editor) {
    this.propertyNames = [];
    this.propertyDescriptors = {};
    this.records = [];
    this.editor = editor;
    this.bodyRow = [];
    this.headCells = [];
}


TableData.prototype.export = function () {
    return {
        propertyNames: this.propertyNames,
        propertyDescriptors: this.propertyDescriptors,
        records: this.records
    }
};

TableData.prototype.import = function (data) {
    this.propertyDescriptors = data.propertyDescriptors;
    this.propertyNames = data.propertyNames;
    this.records = data.records;
    this.reload();
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
        return new TSRow(thisTable, record, idx);
    });
    var rowEltList = this.bodyRow.map(function (row) {
        return row.elt;
    });
    this.$tbody.addChild(rowEltList);
};


TableData.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _({
        tag: 'table',
        class: 'asht-table-data',
        child: [
            { tag: 'thead', child: 'tr' },
            'tbody'
        ]
    });
    this.$thead = $('thead', this.$view);
    this.$headRow = $('tr', this.$thead);
    this.$tbody = $('tbody', this.$view);
    this.$rootCell = _('td.asht-table-data-root-cell');
    return this.$view;
};


/**
 * @param {Number} y
 */
TableData.prototype.findRowByClientY = function (y) {
    var length = this.bodyRow.length;
    var start = 0;
    var mid;
    var row;
    var rowY;
    var position;
    while (length > 0) {
        mid = start + (length >> 1);
        row = this.bodyRow[mid];
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


TableData.prototype.findRowByIndex = function (index) {
    return this.bodyRow[index] || null;
};

TableData.prototype.findIndexOfRow = function (row) {
    return this.bodyRow.indexOf(row);
};

TableData.prototype.findIndexOfCol = function (col) {
    return this.headCells.indexOf(col);
};


TableData.prototype.type2functionName = {
    text: 'loadTextCell',
    number: 'loadNumberCell'
};


TableData.prototype.loadTextCell = function (cellElt, value, record, name, descriptor) {
    cellElt.clearChild();
    var lineSpans = value.split(/\r?\n/).reduce(function (ac, line) {
        ac.push(_({
            tag: 'span', child: { text: line }
        }));
        ac.push(_('br'));
        return ac;
    }, []);
    cellElt.addChild(lineSpans);
};

TableData.prototype.loadNumberCell = function (cellElt, value, record, name) {
    cellElt.addChild(_({
        tag: 'span',
        child: {
            text: value
        }
    }));
};

TableData.prototype.loadCell = function (descriptor, cellElt, value, record, name) {

};


export default TableData;

/***
 *
 * @param {TableData} table
 * @param {Object} record
 * @param {number} idx
 * @constructor
 */
export function TSRow(table, record, idx) {
    this.table = table;
    this.elt = _('tr');
    this.$idx = _('td');
    this.elt.addChild(this.$idx);
    /***
     *
     * @type {TSCell[]}
     */
    this.cells = [];
    this.idx = idx;
    this.record = record;
}


Object.defineProperty(TSRow.prototype, 'record', {
    set: function (value) {
        this._record = value;
        this.loadCells();
    },
    get: function () {
        return this._record;
    }
});


Object.defineProperty(TSRow.prototype, 'propertyNames', {
    get: function () {
        return this.table.propertyNames;
    }
})

Object.defineProperty(TSRow.prototype, 'idx', {
    set: function (value) {
        this._idx = value;
        this.$idx.clearChild().addChild(_({ text: value + '' }));
    },
    get: function () {
        return this._idx;
    }
})


TSRow.prototype.loadCells = function () {
    var row = this;
    var propertyNames = this.propertyNames;
    this.cells.forEach(function (cell) {
        cell.elt.remove();
    })
    this.cells = propertyNames.map(function (pName) {
        return new TSCell(row, pName);
    });
    var cellEltList = this.cells.map(function (cell) {
        return cell.elt;
    });
    this.elt.addChild(cellEltList);
};


/***
 *
 * @param {TSRow} row
 * @param {string} pName
 * @constructor
 */
export function TSCell(row, pName) {
    this.elt = _('td');
    this.row = row;
    this.pName = pName;
}

Object.defineProperty(TSCell.prototype, 'pName', {
    set: function (value) {
        this._pName = value;
        this.load();
    },
    get: function () {
        return this._pName;
    }
});

Object.defineProperty(TSCell.prototype, 'record', {
    get: function () {
        return this.row.record;
    }
});

Object.defineProperty(TSCell.prototype, 'table', {
    get: function () {
        return this.row.table;
    }
});

Object.defineProperty(TSCell.prototype, 'descriptor', {
    get: function () {
        return (this.row.table.propertyDescriptors && this.row.table.propertyDescriptors[this.pName]) || { type: 'text' };
    }
});

Object.defineProperty(TSCell.prototype, 'value', {
    get: function () {
        return this.row.record[this.pName];
    }
});


TSCell.prototype.type2functionName = {
    text: 'loadTextCell',
    number: 'loadNumberCell'
};

TSCell.prototype.load = function () {
    var descriptor = this.descriptor;
    var fName = this.type2functionName[descriptor.type];
    this[fName](this.elt, this.value, this.record, this.pName, this.descriptor);
};


TSCell.prototype.loadTextCell = function (elt, value, record, name, descriptor) {
    elt.clearChild();
    var lineSpans = value.split(/\r?\n/).reduce(function (ac, line) {
        ac.push(_({
            tag: 'span', child: { text: line }
        }));
        ac.push(_('br'));
        return ac;
    }, []);
    elt.addChild(lineSpans);
};


TSCell.prototype.loadNumberCell = function (elt, value, record, name, descriptor) {
    elt.addChild(_({
        tag: 'span',
        child: {
            text: value
        }
    }));
};

