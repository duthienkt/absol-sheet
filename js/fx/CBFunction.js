import {randomIdent} from "absol/src/String/stringGenerate";
import Attributes from "absol/src/AppPattern/Attributes";
import CCBlock from "absol/src/AppPattern/circuit/CCBlock";
import {mixClass} from "absol/src/HTML5/OOP";
import SCScope from "absol/src/SCLang/SCScope";
import Context from "absol/src/AppPattern/Context";

/**
 * @augments Context
 * @extends CCBlock
 * @constructor
 */
function CBFunction() {
    CCBlock.call(this);
    Context.call(this);
    this.id = this.id || randomIdent(8);
    /**
     *
     * @type {Attributes & {args:[], body:string, lang:string}}
     */
    this.attributes = Object.assign(new Attributes(this), this.attributes);
    this.attributes.loadAttributeHandlers(this.attributeHandlers);
    this.pinHandlers = Object.assign({}, CBFunction.prototype.pinHandlers);
    this.receivedArgValues = {};
    this.result = null;
    this.mutex = null;
}

mixClass(CBFunction, CCBlock, Context);

CBFunction.prototype.tag = "Function";
CBFunction.prototype.menuIcon = 'span.mdi.mdi-function';
CBFunction.prototype.attributes = {};
/**
 *
 * @type {*[]}
 * @name args
 * @memberOf CBFunction.prototype.attributes
 */
CBFunction.prototype.attributes.args = [];
CBFunction.prototype.attributes.body = "";
CBFunction.prototype.attributes.lang = "js";
CBFunction.prototype.attributeHandlers = {};


CBFunction.prototype.buildFunction = function () {
    var self = this;
    this.pinHandlers = this.attributes.args.reduce(function (ac, cr) {
        ac[cr] = {
            receives: function (value) {
                if (value && value.then) {
                    value.then(function () {
                        self.receivedArgValues[cr] = value;
                        self.exec();
                    });
                } else {
                    self.receivedArgValues[cr] = value;
                    self.exec();
                }
            }
        };
        return ac;
    }, {});

    Object.assign(this.pinHandlers, CBFunction.prototype.pinHandlers);
};

CBFunction.prototype.exec = function () {
    var sync;
    var i;
    var args = this.attributes.args || [];
    for (i = 0; i < args.length; i++) {
        if (!(args[i] in this.receivedArgValues)) //not enough params
            return;
    }
    var factor = '';
    var code = this.attributes.body || '';
    var localScope = new SCScope(this.getContext('variableScope')).makeFlattenedScope();
    for (i = 0; i < args.length; i++) {
        localScope.declareVar(args[i], this.receivedArgValues[args[i]]);
    }

    factor += "/** auto generate params **/"
    factor += Object.keys(localScope.data).map((key) => {
        return `var ${key} = localScope.get("${key}");`
    }).join('\n') + "\n\n";
    factor += `return function ${this.attributes.name || 'noname'}(){\n${code}\n};`
    var func = (new Function('localScope', factor))(localScope);

    var result = func.call(this);
    if (result && result.then) {
        sync = result.then(res => {
            this.result = res;
            this.pinFire('result');
        })
    } else {
        this.result = result;
        this.pinFire('result');
    }
    if (this.mutex && sync) {
        this.mutex = Promise.all([this.mutex, sync]);
    }
};

CBFunction.prototype.onStart = function () {
    this.exec();
}

CBFunction.prototype.pinHandlers = {};
CBFunction.prototype.attributeHandlers.id = {
    set: function (value) {
        this.id = value;
    },
    get: function () {
        return this.id;
    },
    export: function () {
        return this.id;
    }
};

CBFunction.prototype.attributeHandlers.args = {
    set: function (value, ref) {
        ref.set(value);
        this.buildFunction();
        return value;
    }
};

CBFunction.prototype.attributeHandlers.body = {
    // set: function (value) {
    //
    // },
    // get: function (value) {
    //
    // }
};


CBFunction.prototype.pinHandlers.exec = {
    receives: function () {
        this.exec();
    }
};

CBFunction.prototype.pinHandlers.result = {
    get: function () {
        return this.result;
    }
};

export default CBFunction;
