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
import "./types/TDTreeLeafEnum";
import "./types/TDArrayOfText";
import "./types/TDEnumSet";
import "./types/TDDate";
import "./types/TDDateTime";
import "./types/TDUniqueString";
import "./types/TDUniqueNumber";
import "./types/TDTime";
import "./types/TDTimeRange24";
import "./types/TDWeek";
import "./types/TDWeek";
import "./types/TDDateNLevel";
import { _ } from '../dom/SCore';
import EventEmitter from "absol/src/HTML5/EventEmitter";
import OOP from "absol/src/HTML5/OOP";
import { randomIdent } from "absol/src/String/stringGenerate";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import Context from "absol/src/AppPattern/Context";
import { ASHTRow } from "../fragment/Abstractions";

/***

 * @param {TableData} table
 * @param {Object} record
 * @param {number|"*"} idx
 * @constructor
 */
export function TDRecord(table, record, idx) {
    ASHTRow.call(this, table, record);
   this.idx = idx;
}

OOP.mixClass(TDRecord, ASHTRow);

TDRecord.prototype.render = function () {
    this.elt = _('tr');
    this.$idx = _('td');
    this.elt.addChild(this.$idx);
};


TDRecord.prototype.loadFields = function () {
    this.loadCells();
}

Object.defineProperty(TDRecord.prototype, 'computedRecord', {
    get: function () {
        var descriptors = this.propertyDescriptors;
        var pNames = this.propertyNames;
        var self = this;
        return pNames.reduce((ac, pName) => {
            var descriptor = descriptors[pName];
            Object.defineProperty(ac, pName, {
                enumerable: true,
                configurable: true,
                get: function () {
                    if (descriptor.__fx__ && descriptor.__fx__.calc) {

                    }
                },
                set: function () {

                }
            });

            return ac;
        }, {});
    }
});


Object.defineProperty(TDRecord.prototype, 'idx', {
    set: function (value) {
        this._idx = value;
        if (value === "*") {
            this.$idx.clearChild().addChild(_({ text: '*' }));
            this.elt.addClass('asht-new-row');
        }
        else {
            this.$idx.clearChild().addChild(_({ text: value + 1 + '' }));
            this.elt.removeClass('asht-new-row');
        }
    },
    get: function () {
        return this._idx;
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
        var descriptor = propertyDescriptors[pName] || { type: 'notSupport' };
        var td = new (TDBase.typeClasses[descriptor.type] || TDBase.typeClasses.notSupport)(tdRow, pName);
        tdRow.propertyByName[pName] = td;
        return td;
    });
    var cellEltList = this.properties.map(function (cell) {
        return cell.elt;
    });
    this.elt.addChild(cellEltList);
};




export default TDRecord;