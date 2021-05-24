import SComp from '../dom/SComp';
import TDRecord from "./TDRecord";

var _ = SComp._;
var $ = SComp.$;


/**
 *
 * @constructor
 */
function TableData() {
    this.propertyNames = [];
    this.propertyDescriptors = {};
    this.records = [];
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
    this._computeData();
    this.reload();
};


TableData.prototype._computeData = function () {
    var descriptors = this.propertyDescriptors;
    var descriptor;
    var pName;
    this.propertyNames.forEach(function (name) {
        descriptor = descriptors[name];
        if (!descriptor) return;
        if (descriptor.dependencies) {
            Object.defineProperty(descriptor, '__dependencies_dict__',
                {
                    configurable: true,
                    enumerable: false,
                    value: descriptor.dependencies.reduce(function (ac, cr) {
                        ac[cr] = true;
                        return ac;
                    }, {})
                });
        }
    });

    for (var i = 0; i < this.propertyNames.length; ++i) {
        pName = this.propertyNames[i];
        descriptor = descriptors[pName];
        if (!descriptor) continue;
        Object.defineProperty(descriptor, '__dependents__',
            {
                configurable: true,
                enumerable: false,
                value: this._findAllDependency(pName)
            });
    }
};

TableData.prototype._findAllDependency = function (pName) {
    var descriptors = this.propertyDescriptors;
    var propertyNames = this.propertyNames;
    var queue = [pName];
    var visited = { pName: true };
    var res = [];
    var i;
    var u, v;
    while (queue.length > 0) {
        u = queue.shift();
        for (i = 0; i < propertyNames.length; ++i) {
            v = propertyNames[i];
            if (!visited[v] && descriptors[v]
                && descriptors[v].__dependencies_dict__
                && descriptors[v].__dependencies_dict__[u]) {
                visited[v] = true;
                queue.push(v);
                res.push(v);
            }
        }
    }
    return res;
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
    this.$newRow = _({
        tag: 'tr',
        class: 'asht-row-new',
        child: [{
            tag: 'td',
            child: {
                text: "*"
            }
        }]
    })
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

TableData.prototype.findColByName = function (name) {
    return this.headCells[this.propertyNames.indexOf(name)] || null;
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


export default TableData;

