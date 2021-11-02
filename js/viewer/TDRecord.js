/***
 *
 * @param {TableData} table
 * @param {Object} record
 * @param {number} idx
 * @constructor
 */
import TDBase from "./types/TDBase";
import "./types/TDText";
import "./types/TDNumber";
import "./types/TDBoolean";
import "./types/TDEnum";
import "./types/TDTreeEnum";
import "./types/TDArrayOfText";
import "./types/TDEnumSet";
import "./types/TDDate";
import "./types/TDDateTime";
import {_} from '../dom/SCore';
import EventEmitter from "absol/src/HTML5/EventEmitter";
import OOP from "absol/src/HTML5/OOP";
import {randomIdent} from "absol/src/String/stringGenerate";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";

/***
 * @extends EventEmitter
 * @param {TableData} table
 * @param {Object} record
 * @param {number|"*"} idx
 * @constructor
 */
export function TDRecord(table, record, idx) {
    EventEmitter.call(this);
    this.busy = false;
    this.id = randomIdent(24);
    this.changedPNames = [];
    this.table = table;
    this.elt = _('tr');
    this.$idx = _('td');
    this.elt.addChild(this.$idx);
    this.table.domSignal.on(this.id + '_property_change', this.ev_propertyChange.bind(this));
    /***
     *
     * @type {TDBase[]}
     */
    this.properties = [];
    this.propertyByName = {};
    this.idx = idx;
    this.record = record;
}

OOP.mixClass(TDRecord, EventEmitter);


Object.defineProperty(TDRecord.prototype, 'record', {
    set: function (value) {
        this.busy = true;
        this._record = value;
        this.loadCells();
        this.busy = false;
    },
    get: function () {
        return this._record;
    }
});


Object.defineProperty(TDRecord.prototype, 'fragment', {
    get: function () {
        return this.table.fragment;
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
        if (value === "*") {
            this.$idx.clearChild().addChild(_({text: '*'}));
        } else {
            this.$idx.clearChild().addChild(_({text: value + 1 + ''}));
        }
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
    });
    this.propertyByName = {};
    this.properties = propertyNames.map(function (pName) {
        var descriptor = propertyDescriptors[pName] || {type: 'notSupport'};
        var td = new (TDBase.typeClasses[descriptor.type] || TDBase.typeClasses.notSupport)(tdRow, pName);
        tdRow.propertyByName[pName] = td;
        return td;
    });
    var cellEltList = this.properties.map(function (cell) {
        return cell.elt;
    });
    this.elt.addChild(cellEltList);
};

TDRecord.prototype.notifyPropertyChange = function (pName) {
    if (this.changedPNames.indexOf(pName) < 0) {
        this.changedPNames.push(pName);
        this.table.domSignal.emit(this.id + '_property_change');
        this.emit('property_change', {target: this, record: this.record, pName: pName}, this);
    }
};

TDRecord.prototype.ev_propertyChange = function () {
    var changedPNames = this.changedPNames.splice(0, this.changedPNames.length);
    var self = this;
    var needUpdatePNames = this.propertyNames.filter(function (name) {
        if (changedPNames.indexOf(name) >= 0) return false;
        var dp = self.table.propertyDescriptors[name].__dependencies__;
        return changedPNames.some(function (cN) {
            return !!dp[cN];
        });
    });

    var sync = needUpdatePNames.map(function (name) {
        return self.propertyByName[name].reload();
    }).filter(function (p) {
        return !!p
    });
    if (sync.length > 0) {
        Promise.all(sync).then(ResizeSystem.update.bind(ResizeSystem));
    } else {
        ResizeSystem.update();
    }
};

export default TDRecord;