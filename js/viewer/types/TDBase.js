import { _ } from "../../dom/SCore";
import noop from "absol/src/Code/noop";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import { keyStringOf } from "absol-acomp/js/utils";

/***
 *
 * @param {TDRecord} row
 * @param {string} pName
 * @constructor
 */
function TDBase(row, pName) {
    this.elt = _('td');
    this.row = row;
    this.pName = pName;
    this.sync = this.renewDescriptor();
    if (this.sync) {
        this.sync = this.sync.then(function () {
            this.attachView();
            this.loadDescriptor();
            this.loadValue();
        }.bind(this));
    }
    else {
        this.attachView();
        this.loadDescriptor();
        this.loadValue();
    }

}

TDBase.prototype.renewDescriptor = function () {
    var self = this;
    var originDescriptor = this.row.table.propertyDescriptors && this.row.table.propertyDescriptors[this.pName];
    var descriptor = Object.assign({}, originDescriptor || { type: 'text' });
    var fx = originDescriptor && originDescriptor.__fx__;
    var syncs = [];
    if (fx) {
        Object.keys(fx).reduce(function (ac, key) {
            if (key === 'onchange') {
                ac.onchange = originDescriptor.__fx__.onchange;
            }
            else if (key === 'switch') {
                Object.assign(descriptor, fx[key].getCase(self.record));
            }
            else {
                ac[key] = fx[key].invoke(self, self.record);
                if (ac[key] && ac[key].then) {
                    ac[key] = ac[key].then(function (result) {
                        ac[key] = result;
                    });
                    syncs.push(ac[key]);
                }
            }
            return ac;
        }, descriptor);
    }
    this.descriptor = descriptor;
    if ('calc' in descriptor) {
        this.elt.addClass('asht-calc');
    }
    else {
        this.elt.removeClass('asht-calc');
    }
    if (syncs.length > 0) return Promise.all(syncs);
};

TDBase.prototype.implicit = function (value) {
    return value;
};

TDBase.prototype.isEmpty = function () {
    var value = this.value;
    return value !== null && value !== undefined;
};


TDBase.prototype.makeDefaultValue = function (){
    var descriptor = this.descriptor;
    if ('calc' in descriptor) return;
    if (('defaultValue' in descriptor) && (this.value === undefined || this.value === null)){
        this.value = descriptor.defaultValue;
    }
}


/**
 * @name record
 * @memberOf TDBase
 * @type Object
 */
Object.defineProperty(TDBase.prototype, 'record', {
    get: function () {
        return this.row.record;
    }
});


/**
 * @name table
 * @memberOf TDBase
 * @type TableData
 */
Object.defineProperty(TDBase.prototype, 'table', {
    get: function () {
        return this.row.table;
    }
});


/***
 * @name fragment
 * @memberOf TDBase
 * @type FmFragment|null
 */
Object.defineProperty(TDBase.prototype, 'fragment', {
    get: function () {
        return this.row.table.fragment;
    }
});

/***
 * @name value
 * @memberOf TDBase
 * @type any
 */
Object.defineProperty(TDBase.prototype, 'value', {
    get: function () {
        if ('calc' in this.descriptor) {
            return this.descriptor.calc;
        }
        return this.row.record[this.pName];
    },
    set: function (value) {
        value = this.implicit(value);
        if ((value === undefined || value === null)
            && (this.row.record[this.pName] === null || this.row.record[this.pName] === undefined))
            return;
        if (!this.isEqual(value, this.row.record[this.pName])) {
            this.row.record[this.pName] = value;
            this.loadValue();
            this.execOnChange();
            this.notifyChange();
        }
    }
});

TDBase.prototype.attachView = function () {
    this.$text = _({ text: '?[' + JSON.stringify(this.value) + ']' });
    this.elt.addChild(this.$text);
};

TDBase.prototype.execOnChange = function () {
    var record = this.record;
    var newRecord = Object.assign({}, this.record);
    var sync;
    if (this.descriptor.onchange) {
        sync = this.descriptor.onchange.invoke(this, newRecord);
    }
    function update() {
        var needUpdateSize = keyStringOf(newRecord, record);
        if (needUpdateSize) ResizeSystem.update();
    }

    if (sync && sync.then) {
        sync.then(update)
    }
    else update();
};

TDBase.prototype.notifyChange = function () {
    this.row.notifyPropertyChange(this.pName);
};


TDBase.prototype.reload = function () {
    var sync = this.renewDescriptor();
    var update = function () {
        this.loadDescriptor();
        if ('calc' in this.descriptor) {
            var value = this.implicit(this.descriptor.calc);
            if (!this.isEqual(value, this.record[this.pName])) {
                this.execOnChange();
                this.notifyChange();
            }
        }
        this.loadValue();
    }.bind(this);
    if (sync) {
        sync.then(update)
    }
    else {
        update();
    }
    return sync;
};


TDBase.prototype.isEqual = function (a, b) {
    return keyStringOf(a) === keyStringOf(b);
};


TDBase.prototype.loadDescriptor = noop;
TDBase.prototype.loadValue = noop;


TDBase.typeClasses = {
    notSupport: TDBase
};


export default TDBase;
