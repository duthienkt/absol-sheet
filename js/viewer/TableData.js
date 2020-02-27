import SComp from '../dom/SComp';

var _ = SComp._;
var $ = SComp.$;


/**
 * 
 * @param {import('../fragment/TableEditor').default} editor 
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
                child: { text: name }
            }
        });
        thisTable.$headRow.addChild(cell);
        return {
            elt: cell,
            index: i,
            name: name
        };
    });
};

TableData.prototype.loadBody = function () {
    var thisTable = this;
    this.$tbody.clearChild();
    this.bodyRow = this.records.map(function (record, index) {
        var rowElt = _('tr');
        thisTable.$tbody.addChild(rowElt);
        var indexCell = _({
            tag: 'td',
            child: {
                tag: 'span',
                child: { text: index + 1 + '' }
            }
        });
        rowElt.addChild(indexCell);
        var cells = thisTable.propertyNames.map(function (name) {
            var cellData = record[name];
            var cellElt = _('td');
            var holder = { elt: cellElt };
            if (cellData !== null && cellData !== undefined) {
                var fName = 'loadTextCell';
                Object.assign(holder, thisTable[fName](cellElt, cellData, record, name));
            }
            rowElt.addChild(cellElt);
            return holder;
        });
        return { elt: rowElt, cells: cells, index: index, record: record };
    });
    this.loadPosition();
};

TableData.prototype.loadPosition = function () {
    var bound = this.$view.getBoundingClientRect();
    this.bodyRow.forEach(function (row) {
        var rowBound = row.elt.getBoundingClientRect();
        row.position = {
            y: rowBound.top - bound.top,
            height: rowBound.height,
        };
    });
    this.headCells.forEach(function (cell) {
        var cellBound = cell.elt.getBoundingClientRect();
        cell.position = {
            x: cellBound.left - bound.left,
            width: cellBound.width,
        };
    });
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
    var bound = this.$view.getBoundingClientRect();
    var length = this.bodyRow.length;
    var start = 0;
    var mid;
    var row;
    var rowY;
    while (length > 0) {
        mid = start + (length >> 1);
        row = this.bodyRow[mid];
        rowY = bound.top + row.position.y;
        if (y < rowY) {
            length = mid - start;
        }
        else if (y > rowY + row.position.height) {
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
    var bound = this.$view.getBoundingClientRect();
    var length = this.headCells.length;
    var start = 0;
    var mid;
    var cell;
    var rowX;
    while (length > 0) {
        mid = start + (length >> 1);
        cell = this.headCells[mid];
        rowX = bound.left + cell.position.x;
        if (x < rowX) {
            length = mid - start;
        }
        else if (x > rowX + cell.position.width) {
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


TableData.prototype.loadTextCell = function (cellElt, value, record, name) {
    cellElt.addChild(_({
        tag: 'span',
        child: {
            text: value
        }
    }));
};

TableData.prototype.loadNumberCell = function (cellElt, value, record, name) {
    cellElt.addChild(_({
        tag: 'span',
        child: {
            text: value
        }
    }));
};


export default TableData;
