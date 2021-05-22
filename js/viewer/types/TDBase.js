/***
 *
 * @param {TSRow} row
 * @param {string} pName
 * @constructor
 */
import {_} from "../../dom/SCore";
import noop from "absol/src/Code/noop";

function TDBase(row, pName) {
    this.elt = _('td');
    this.row = row;
    this.pName = pName;
    this.attachView();
    this.reload();
}


Object.defineProperty(TDBase.prototype, 'record', {
    get: function () {
        return this.row.record;
    }
});

Object.defineProperty(TDBase.prototype, 'table', {
    get: function () {
        return this.row.table;
    }
});

Object.defineProperty(TDBase.prototype, 'descriptor', {
    get: function () {
        return (this.row.table.propertyDescriptors && this.row.table.propertyDescriptors[this.pName]) || { type: 'text' };
    }
});

Object.defineProperty(TDBase.prototype, 'value', {
    get: function () {
        return this.row.record[this.pName];
    },
    set: function (value) {
        this.row.record[this.pName] = value;
        this.reload();
    }
});

TDBase.prototype.attachView = function () {
    this.$text = _({ text: '?['+JSON.stringify(this.value) + ']' });
    this.elt.addChild(this.$text);
};

TDBase.prototype.reload = noop;


TDBase.typeClasses = {
    notSupport: TDBase
};


export default TDBase;
