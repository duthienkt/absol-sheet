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
import "./types/TDDateInYear";
import { _ } from '../dom/SCore';
import OOP from "absol/src/HTML5/OOP";
import { ASHTRow } from "../fragment/Abstractions";

/***
 * @extends ASHTRow
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
    this.elt = _('tr.asht-record');
    this.$idx = _('td');
    this.$menu = _({
        tag: 'td',
        class: 'asht-menu',
        child: 'span.mdi.mdi-dots-vertical',
    });

    this.elt.addChild(this.$idx);
    this.elt.addChild(this.$menu);
    this.elt.tdRecord = this;
};


TDRecord.prototype.loadFields = function () {
    this.loadCells();
};


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
    this.$menu.remove();
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
    this.elt.addChild(this.$menu);
};




export default TDRecord;