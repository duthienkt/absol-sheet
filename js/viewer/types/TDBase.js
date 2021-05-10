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


//
// TDBase.prototype.type2functionName = {
//     text: 'loadTextCell',
//     number: 'loadNumberCell',
//     enum: 'loadEnumCell',
//     boolean: 'loadBooleanCell'
// };
//
// TDBase.prototype.load = function () {
//     var descriptor = this.descriptor;
//     var fName = this.type2functionName[descriptor.type];
//     this.elt.attr('class', 'asht-type-' + descriptor.type);
//     this[fName](this.elt, this.value, this.record, this.pName, this.descriptor);
// };
//
//
// TDBase.prototype.loadTextCell = function (elt, value, record, name, descriptor) {
//     value = value || '';
//     elt.clearChild();
//     var lineSpans = value.split(/\r?\n/).reduce(function (ac, line) {
//         ac.push(_({
//             tag: 'span', child: { text: line }
//         }));
//         ac.push(_('br'));
//         return ac;
//     }, []);
//     elt.addChild(lineSpans);
// };
//
//
// TDBase.prototype.loadNumberCell = function (elt, value, record, name, descriptor) {
//     value = value || 0;
//     elt.clearChild();
//     elt.addChild(_({
//         tag: 'span',
//         child: {
//             text: value + ''
//         }
//     }));
// };
//
//
// TDBase.prototype.loadEnumCell = function (elt, value, record, name, descriptor) {

// };
//
// TDBase.prototype.loadBooleanCell = function (elt, value, record, name, descriptor) {
//     elt.clearChild();
//     if (value) {
//         elt.addChild(_('span.mdi.mdi-check'));
//     }
// };
//
// TDBase.prototype.loadDateCell = function () {
//
// };

export default TDBase;
