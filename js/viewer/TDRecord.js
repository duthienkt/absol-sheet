/***
 *
 * @param {TableData} table
 * @param {Object} record
 * @param {number} idx
 * @constructor
 */
import TDBase from "./types/TDBase";
import  "./types/TDText";
import  "./types/TDNumber";
import  "./types/TDBoolean";
import  "./types/TDEnum";
import  "./types/TDTreeEnum";
import  "./types/TDArrayOfText";
import  "./types/TDEnumSet";
import  "./types/TDDate";
import  "./types/TDDateTime";
import {_} from '../dom/SCore';


export function TDRecord(table, record, idx) {
    this.table = table;
    this.elt = _('tr');
    this.$idx = _('td');
    this.elt.addChild(this.$idx);
    /***
     *
     * @type {TDBase[]}
     */
    this.properties = [];
    this.idx = idx;
    this.record = record;
}


Object.defineProperty(TDRecord.prototype, 'record', {
    set: function (value) {
        this._record = value;
        this.loadCells();
    },
    get: function () {
        return this._record;
    }
});


Object.defineProperty(TDRecord.prototype, 'propertyNames', {
    get: function () {
        return this.table.propertyNames;
    }
});

Object.defineProperty(TDRecord.prototype, 'propertyDescriptors', {
    get: function () {
        return this.table.propertyDescriptors;
    }
});

Object.defineProperty(TDRecord.prototype, 'idx', {
    set: function (value) {
        this._idx = value;
        this.$idx.clearChild().addChild(_({ text: value + 1 + '' }));
    },
    get: function () {
        return this._idx;
    }
});

//for name mapping
Object.defineProperty(TDRecord.prototype, 'cells', {
    get: function () {
        return this.properties;
    }
});


TDRecord.prototype.loadCells = function () {
    var tdRow = this;
    var propertyNames = this.propertyNames;
    var propertyDescriptors = this.propertyDescriptors;
    this.properties.forEach(function (cell) {
        cell.elt.remove();
    })
    this.properties = propertyNames.map(function (pName) {
        var descriptor = propertyDescriptors[pName] || { type: 'notSupport' };
        return new (TDBase.typeClasses[descriptor.type] || TDBase.typeClasses.notSupport)(tdRow, pName);
    });
    var cellEltList = this.properties.map(function (cell) {
        return cell.elt;
    });
    this.elt.addChild(cellEltList);
};

export default TDRecord;