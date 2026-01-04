import OOP, { mixClass } from "absol/src/HTML5/OOP";
import Fragment from "absol/src/AppPattern/Fragment";
import EventEmitter from "absol/src/HTML5/EventEmitter";
import Attributes from "absol/src/AppPattern/Attributes";
import { copyJSVariable } from "absol/src/JSMaker/generator";
import { _ } from "../dom/SCore";
import { isRealNumber, keyStringOf } from "absol-acomp/js/utils";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import noop from "absol/src/Code/noop";
import Context from "absol/src/AppPattern/Context";
import { randomIdent } from "absol/src/String/stringGenerate";
import { computeSheetDescriptor } from "../util";
import { stringHashCode } from "absol/src/String/stringUtils";
import SCScope from "absol/src/SCLang/SCScope";
import CCBlock from "absol/src/AppPattern/circuit/CCBlock";
import CBFunction from "../fx/CBFunction";
import CCLine from "absol/src/AppPattern/circuit/CCLine";
import TDBase from "../viewer/types/TDBase";


/**
 * @augments Fragment
 * @augments EventEmitter
 * @constructor
 */
export function ASHTEditor(opt) {
    EventEmitter.call(this);
    Fragment.call(this);
    this.opt = new Attributes(this);
    Object.assign(this.opt, copyJSVariable(this.defaultOpt), opt);
    this.tableData = null;
    this.varialbeScope = new SCScope();
    this.setContext('variableScope', this.varialbeScope);
    if (opt.context) {
        Object.keys(opt.context).forEach(key => {
            this.varialbeScope.declareConst(key, opt.context[key]);
        });
    }
}

OOP.mixClass(ASHTEditor, Fragment, EventEmitter);


ASHTEditor.prototype.defaultOpt = {
    autoStart: true
};


ASHTEditor.prototype.setData = function () {
    throw new Error("Not Implement!");
};

ASHTEditor.prototype.getData = function () {
    throw new Error("Not Implement!");
};


ASHTEditor.prototype.getRecords = function () {
    throw new Error("Not Implement!");
};


ASHTEditor.prototype.focusIncompleteCell = function () {
    throw new Error("Not Implement!");
};


ASHTEditor.prototype.insertRow = function (atIdx, record) {
    throw new Error("Not Implement!");
};

ASHTEditor.prototype.removeRow = function (atIdx) {
    throw new Error("Not Implement!");
};

Object.defineProperty(ASHTEditor.prototype, 'fragment', {
    get: function () {
        return this.opt.fragment;
    },
    set: function (value) {
        this.opt.fragment = value;
    }
});

/**
 *
 * @param row
 * @param pName
 * @constructor
 */
export function ASHField(row, pName) {
    CCBlock.call(this);
    this.elt = _('td');
    this.row = row;
    this.pName = pName;
    this.isExtraField = false;//if true, this field is in record.extrainfo
    this.pId = null;//column id, use in block/line
    this.sync = this.renewDescriptor();
    if (this.sync) {
        this.sync = this.sync.then(() => {
            this.attachView();
            this.loadDescriptor();
            this.loadValue();
        });
    }
    else {
        this.attachView();
        this.loadDescriptor();
        this.loadValue();
    }
}

mixClass(ASHField, CCBlock);

ASHField.prototype.getVariablesContext = function () {
    return this.table.getVariablesContext();
};


ASHField.prototype.renewDescriptor = function () {
    var self = this;
    var originDescriptor = this.row.table.propertyDescriptors && this.row.table.propertyDescriptors[this.pName];
    var descriptor = {type: 'text'};
    if (originDescriptor && originDescriptor.pId) {
        this.pId = originDescriptor.pId;
    }
    if (originDescriptor.isExtraField) this.isExtraField = true;


    Object.keys(originDescriptor).forEach(key => {
        var assigned = false;
        var newValue = null;
        Object.defineProperty(descriptor, key, {
            enumerable: true,
            configurable: true,
            set: (value) => {
                newValue = value;
                assigned = true;
            },
            get: () => {
                if (assigned) return newValue;
                return this.row.table.propertyDescriptors && this.row.table.propertyDescriptors[this.pName] && this.row.table.propertyDescriptors[this.pName][key];
            }
        })
    });

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
                if (fx[key].callable(self.record)) {
                    ac[key] = fx[key].invoke(self, self.record, self.getVariablesContext());
                }
                else {
                    ac[key] = undefined;
                }
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
    if (syncs.length > 0) return Promise.all(syncs).then(() => {
        if ('calc' in descriptor) {
            this.record[this.pName] = this.value;
        }
    });
    else {
        if ('calc' in descriptor) {
            this.record[this.pName] = this.value;
        }
    }
};

ASHField.prototype.implicit = function (value) {
    return value;
};

ASHField.prototype.isEmpty = function () {
    return this.isNoneValue(this.value);
};

ASHField.prototype.isNoneValue = function (value) {
    var descriptor = this.descriptor;
    return value === null || value === undefined || ((typeof value === "number") && !isRealNumber(value)) || value === "" || value === descriptor.emptyValue;
};


ASHField.prototype.makeDefaultValue = function () {
    var descriptor = this.descriptor;
    if ('calc' in descriptor) return;
    if (('defaultValue' in descriptor) && (this.value === undefined || this.value === null)) {
        this.value = descriptor.defaultValue;
    }
};

ASHField.prototype.attachView = function () {
    this.$text = _({text: '?[' + JSON.stringify(this.value) + ']'});
    this.elt.addChild(this.$text);
};


ASHField.prototype.execOnChange = function () {
    var self = this;
    var record = Object.assign({}, this.record);
    var extrainfo = record.extrainfo;
    if (extrainfo && (extrainfo === 'object')) {
        delete record.extrainfo;
        Object.assign(record, extrainfo);
    }

    var newRecord = Object.assign({}, record);
    var sync;
    if (this.descriptor.onchange) {
        sync = this.descriptor.onchange.invoke(this, newRecord, this.getVariablesContext());
    }

    function update() {
        var needUpdateSize = keyStringOf(newRecord, record);
        if (needUpdateSize) {
            Object.keys(newRecord).forEach(key => {
                if (keyStringOf(record[key]) !== keyStringOf(newRecord[key])) {
                    if (self.row.propertyByName[key])
                        self.row.propertyByName[key].value = newRecord[key];
                }
            });
            ResizeSystem.update();
        }
    }

    if (sync && sync.then) {
        sync.then(update)
    }
    else update();
};

ASHField.prototype.notifyChange = function () {
    this.pinFire('value');
    this.row.notifyPropertyChange(this.pName);
};


ASHField.prototype.reload = function () {
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


ASHField.prototype.isEqual = function (a, b) {
    if (this.isNoneValue(a) && this.isNoneValue(b)) return true;
    return keyStringOf(a) === keyStringOf(b);
};


ASHField.prototype.loadDescriptor = noop;
ASHField.prototype.loadValue = noop;

/**
 * @name record
 * @memberOf ASHField
 * @type Object
 */
Object.defineProperty(ASHField.prototype, 'record', {
    get: function () {
        return this.row.record;
    }
});


/**
 * @name table
 * @memberOf ASHField
 * @type TableData
 */
Object.defineProperty(ASHField.prototype, 'table', {
    get: function () {
        return this.row.table;
    }
});


/***
 * @name fragment
 * @memberOf ASHField
 * @type FmFragment|null
 */
Object.defineProperty(ASHField.prototype, 'fragment', {
    get: function () {
        return this.row.table.fragment;
    }
});

/***
 * @name value
 * @memberOf ASHField
 * @type any
 */
Object.defineProperty(ASHField.prototype, 'value', {
    get: function () {
        if ('calc' in this.descriptor) {
            return this.descriptor.calc;
        }
        var record = this.row.record;
        if (this.isExtraField) {
            if (record.extrainfo && (typeof record.extrainfo === 'object')) {
                return record.extrainfo[this.pName];
            }
            else return undefined;
        }
        return record[this.pName];
    },
    set: function (value) {
        value = this.implicit(value);
        if (this.isNoneValue(value)) value = undefined;
        var record = this.row.record;
        var objCtn = record;
        var prevValue;
        if (this.isExtraField) {
            if (!record.extrainfo || (typeof record.extrainfo !== 'object')) {
                record.extrainfo = {};
            }
            objCtn = record.extrainfo;
        }
        prevValue = objCtn[this.pName];

        if (!this.isEqual(value, prevValue)) {
            if (value === undefined) delete objCtn[this.pName];
            else objCtn[this.pName] = value;
            this.loadValue();
            this.execOnChange();
            this.notifyChange();
        }
    }
});

ASHField.prototype.pinHandlers.value = {
    get: function () {
        return this.value;
    },
    receives: function (value) {
        this.value = value;
    }
};

/**
 * @augments EventEmitter
 * @augments Context
 * @param table
 * @param record
 * @constructor
 */
export function ASHTRow(table, record) {
    EventEmitter.call(this);
    Context.apply(this);
    this.attach(table);
    this.table = table;
    this.id = randomIdent(24);
    this.busy = false;
    this.table.domSignal.on(this.id + '_property_change', this.ev_propertyChange.bind(this));

    this.render();

    /***
     *
     * @type {ASHField[]}
     */
    this.properties = [];
    this.propertyByName = {};
    this.changedPNames = [];

    this.record = record;
    this.lines = [];
    this.blocks = [];
    this.makeCircuit();

}

OOP.mixClass(ASHTRow, EventEmitter, Context);

ASHTRow.prototype.render = function () {
    throw new Error("Not implement!");
};

ASHTRow.prototype.loadFields = function () {
    throw new Error("Not implement!");
};

ASHTRow.prototype.remove = function () {
    this.table.removeRow(this);
};

ASHTRow.prototype.makeCircuit = function () {
    var linesSource = this.table && this.table.formSource && this.table.formSource.lines;
    var blocksSource = this.table && this.table.formSource && this.table.formSource.blocks;
    if (blocksSource) {
        this.blocks = blocksSource.map((bs) => {
            bs = Object.assign({}, bs);
            if (bs.tag !== "Function") return null;//only support Function now
            var block = new CBFunction();
            block.attach(this);
            delete bs.tag;
            Object.assign(block.attributes, bs);
            return block;
        }).filter(x => !!x);
    }
    var blockDict = this.blocks.reduce((ac, cr) => {
        if (cr.attributes.name) ac[cr.attributes.name] = cr;
        ac[cr.id] = cr;
        return ac;
    }, {});

    blockDict = this.properties.reduce((ac, cr) => {
        ac[cr.pName] = cr;
        if (cr.pId) ac[cr.pId] = cr;
        return ac;
    }, blockDict);

    if (linesSource) {
        this.lines = linesSource.map((ls) => {
            var u = blockDict[ls.u];
            var v = blockDict[ls.v];
            if (!u || !v) return null;
            return new CCLine(u, ls.uPin, v, ls.vPin);
        }).filter(x => !!x);
    }
};

ASHTRow.prototype.notifyPropertyChange = function (pName) {
    if (this.changedPNames.indexOf(pName) < 0) {
        this.changedPNames.push(pName);
        this.table.domSignal.emit(this.id + '_property_change');
        this.emit('property_change', {target: this, record: this.record, pName: pName}, this);
    }
};

ASHTRow.prototype.getIncompleteCells = function () {
    return this.properties.filter(function (cell) {
        return !!(cell.descriptor && (cell.descriptor.required || cell.descriptor.require) && cell.isEmpty());
    });
};

ASHTRow.prototype.makeDefaultValues = function () {
    this.properties.forEach(p => p.makeDefaultValue());
};

ASHTRow.prototype.ev_propertyChange = function () {
    var changedPNames = this.changedPNames.splice(0, this.changedPNames.length);
    var self = this;
    var needUpdatePNames = this.propertyNames.filter(function (name) {
        if (changedPNames.indexOf(name) >= 0) return true;
        var dp = self.table.propertyDescriptors[name].__dependencies__;
        return changedPNames.some(function (cN) {
            return !!dp[cN];
        });
    });


    var sync = needUpdatePNames.map(function (name) {
        return self.propertyByName[name].reload();
    }).filter(function (p) {
        return !!p && p.then;
    });
    if (sync.length > 0) {
        Promise.all(sync).then(ResizeSystem.update.bind(ResizeSystem));
    }
    else {
        ResizeSystem.update();
    }
};

ASHTRow.prototype.getHash = function () {
    return stringHashCode(JSON.stringify(this.record));
};


Object.defineProperty(ASHTRow.prototype, 'record', {
    set: function (value) {
        this.busy = true;
        this.rawRecord = value;
        this.loadFields();
        this.busy = false;
    },
    get: function () {
        return this.rawRecord;
    }
});




Object.defineProperty(ASHTRow.prototype, 'fragment', {
    get: function () {
        return this.table.fragment;
    }
});

Object.defineProperty(ASHTRow.prototype, 'propertyNames', {
    get: function () {
        return this.table.propertyNames;
    }
});

Object.defineProperty(ASHTRow.prototype, 'propertyDescriptors', {
    get: function () {
        return this.table.propertyDescriptors;
    }
});

//for name mapping
Object.defineProperty(ASHTRow.prototype, 'cells', {
    get: function () {
        return this.properties;
    }
});


/**
 * @augments Context
 * @augments EventEmitter
 * @param editor
 * @param opt
 * @constructor
 */
export function ASHTTable(editor, opt) {
    Context.apply(this, arguments);
    EventEmitter.call(this);
    this.editor = editor;
    this.opt = opt || {};
    this.formSource = null;
    this.propertyNames = [];
    this.propertyDescriptors = {};
    this.attach(editor);
}


OOP.mixClass(ASHTTable, Context, EventEmitter);


ASHTTable.prototype.form2Desc = {
    TextInput: 'text',
    DateInput: 'date'
};

ASHTTable.prototype.form2Desc.ComboBox = function (nd, descriptor) {
    descriptor.type = 'ComboBox';
    descriptor.items = nd.items;
};


ASHTTable.prototype.form2Desc.TreeComboBox = function (nd, descriptor) {
    descriptor.type = 'TreeComboBox';
    descriptor.items = nd.items;
};


ASHTTable.prototype.form2Desc.TreeLeafComboBox = function (nd, descriptor) {
    descriptor.type = 'TreeLeafComboBox';
    descriptor.items = nd.items;
};


/**
 * from form to datasheet data
 */
ASHTTable.prototype.computeFormSource = function () {
    if (!this.formSource) return;
    var propertyNames = [];
    var propertyDescriptors = {};

    var labels = {};//by id
    var visit = nd => {
        var name;
        var displayName;
        var descriptor;
        if (nd.children && nd.children.length > 0) {
            nd.children.forEach(visit);
            return;
        }
        if (nd.tag === 'Container') return;
        if (nd.tag === 'Label') {
            if (nd.id) labels[nd.id] = nd;
        }
        else {
            if (!nd.name) return;// not a property
            descriptor = {};
            propertyDescriptors[nd.name] = descriptor;
            propertyNames.push(nd.name);
            descriptor.text = (labels[nd.id + '_label'] && labels[nd.id + '_label'].value) || nd.name;
            descriptor.pId = nd.id;
            if (nd.readOnly) descriptor.readOnly = true;
            if (nd.outputMode) descriptor.readOnly = true;
            if (nd.isExtraField) descriptor.isExtraField = true;
            if ("value" in nd) {
                descriptor.defaultValue = nd.value;
            }

            var cvt = this.form2Desc[nd.tag] || (TDBase.typeClasses[nd.tag] ? nd.tag : null);
            if (typeof cvt === "string") {
                descriptor.type = cvt;

            }
            else if (typeof cvt === "function") {
                cvt(nd, descriptor);
            }
            else {
                descriptor.type = 'text';
            }
        }
    }
    visit(this.formSource.layout);
    this.propertyNames = propertyNames;
    this.propertyDescriptors = propertyDescriptors;
};

ASHTTable.prototype.computeHeader = function () {
    var propertyNames = this.propertyNames;
    var propertyDescriptors = this.propertyDescriptors;
    computeSheetDescriptor(propertyNames, propertyDescriptors);
};

ASHTTable.prototype.import = function (data) {
    this.formSource = data.formSource;
    this.propertyNames = data.propertyNames;
    this.propertyDescriptors = data.propertyDescriptors;
    this.computeFormSource();
    this.computeHeader();
};


ASHTTable.prototype.export = function () {
    return {
        propertyNames: this.propertyNames,
        propertyDescriptors: this.propertyDescriptors,
        records: this.getRecords()
    };
};

ASHTTable.prototype.getLength = function () {
    throw new Error("Not Implement!");
};

ASHTTable.prototype.getRecords = function () {
    throw new Error("Not Implement!");
};

ASHTTable.prototype.addRowAt = function (idx, record) {
    throw new Error("Not Implement!");
};

ASHTTable.prototype.removeRowAt = function (idx) {};

ASHTTable.prototype.removeRow = function (row) {
    var idx = this.rowIndexOf(row);
    if (idx >= 0) {
        this.removeRowAt(idx);
    }
};

ASHTTable.prototype.rowIndexOf = function (row) {
    throw new Error("Not Implement!");
}

ASHTTable.prototype.rowAt = function (idx) {
    throw new Error("Not Implement!");
};


ASHTTable.prototype.getHash = function () {
    throw new Error("Not Implement!");
};

ASHTTable.prototype.getVariablesContext = function () {
    //variableScope
    var context = {};
    var variableScope;

    if (this.fragment) {
        /**
         * @type {SCScope}
         */
        variableScope = this.fragment.getContext('variableScope');
        if (variableScope) {
            variableScope = variableScope.makeFlattenedScope();
            Object.keys(variableScope.data).forEach(key => {
                context[key] = variableScope.data[key];
            });
        }
    }
    variableScope = this.getContext('variableScope');
    if (variableScope) {
        variableScope = variableScope.makeFlattenedScope();
        Object.keys(variableScope.data).forEach(key => {
            context[key] = variableScope.get(key);
        });
    }
    return context;
};

/**
 *
 * @param {{type:("cmd_remove_row" | "cmd_insert_row"), rowIdx: number, cmd: string}|{}}opt
 * @constructor
 */
export function ASHTConfirmEvent(opt) {
    this.accepted = true;
    Object.assign(this, opt);
}

/**
 *
 * @param {boolean | Promise<boolean>} isAccepted
 */
ASHTConfirmEvent.prototype.accept = function (isAccepted) {
    this.accepted = isAccepted;
};

/**
 *
 * @param {function} callback
 */
ASHTConfirmEvent.prototype.afterThen = function (callback) {
    if (this.accepted && this.accepted.then) {
        this.accepted.then(callback);
    }
    else {
        callback(this.accepted);
    }
};

/**
 *
 * @param opt
 * @constructor
 */
export function ASHTWaitValueEvent(opt) {
    this.result = null;
    Object.assign(this, opt);

}


ASHTWaitValueEvent.prototype.resolve = function (value) {
    this.result = value;
};

/**
 *
 * @param {function} callback
 */
ASHTWaitValueEvent.prototype.afterThen = function (callback) {
    if (this.result && this.result.then) {
        this.result.then(callback);
    }
    else {
        callback(this.result);
    }
};


