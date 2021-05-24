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
    this.renewDescriptor();
    this.attachView();
    this.loadDescriptor();
    this.loadValue();
}

TDBase.prototype.renewDescriptor = function () {
    var descriptor = (this.row.table.propertyDescriptors && this.row.table.propertyDescriptors[this.pName]) || { type: 'text' };
    var defaultCase;
    var selectedCase;
    var cCase;
    var matched;
    if (descriptor.switch) {
        descriptor = Object.assign({}, descriptor);
        for (var i = 0; i < descriptor.switch.length; ++i) {
            cCase = descriptor.switch[i];
            if (cCase.case === "DEFAULT") {
                defaultCase = cCase;
            }
            else {
                matched = Object.keys(cCase.case).every(function (record, key) {
                    return this[key] == record[key];
                }.bind(cCase.case, this.record));
                if (matched) {
                    selectedCase = cCase;
                    break;
                }
            }
        }
    }
    selectedCase = selectedCase || defaultCase;
    if (selectedCase) {
        Object.assign(descriptor, selectedCase);
    }
    this.descriptor = descriptor;
    return descriptor;
};


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


Object.defineProperty(TDBase.prototype, 'value', {
    get: function () {
        return this.row.record[this.pName];
    },
    set: function (value) {
        if (value !== this.row.record[this.pName]) {
            this.row.record[this.pName] = value;
            this.loadValue();
            this.notifyChange();
        }
    }
});

TDBase.prototype.attachView = function () {
    this.$text = _({ text: '?[' + JSON.stringify(this.value) + ']' });
    this.elt.addChild(this.$text);
};

TDBase.prototype.notifyChange = function () {
    this.row.notifyPropertyChange(this.pName);
};


TDBase.prototype.reload = function () {
    this.renewDescriptor();
    this.loadDescriptor();
    this.loadValue();
};

TDBase.prototype.loadDescriptor = noop;
TDBase.prototype.loadValue = noop;


TDBase.typeClasses = {
    notSupport: TDBase
};


export default TDBase;
