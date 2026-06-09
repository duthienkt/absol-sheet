import * as ExcelFx from './ExcelFx';
import safeThrow from "absol/src/Code/safeThrow";


function TSFunction(propertyNames, body) {
    this.propertyNames = propertyNames;
    this.body = body;
    this.dependents = [];
    this.ast = null;
    this._compile();
    this.mutex = null;
}


TSFunction.prototype.localConstants = {};

Object.assign(TSFunction.prototype.localConstants, ExcelFx);

var RESERVED_VAR_NAMES = [
    'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
    'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import',
    'in', 'instanceof', 'let', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true',
    'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'implements', 'interface', 'package', 'private', 'protected', 'public', 'static',
    'arguments', 'eval'
];

function makeGlobalKeyDict() {
    var keys = RESERVED_VAR_NAMES.slice();
    var globalScope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : null);
    if (globalScope) {
        try {
            keys = keys.concat(Object.getOwnPropertyNames(globalScope));
        } catch (err) {
            safeThrow(err);
        }
    }
    return keys.reduce(function (ac, cr) {
        ac[cr] = true;
        return ac;
    }, {});
}

TSFunction.prototype._isAsync = function (jsCode) {
    if (!window.babel) return false;
    var scriptCode = 'async function fx(){\n'
        + jsCode
        + '\n}';
    var result = false;
    var ast = babel.parseSync(scriptCode, {});
    babel.traverse(ast, {
        AwaitExpression: function () {
            result = true;
        }
    });
    return result;
};

TSFunction.prototype.globalKeys = makeGlobalKeyDict();

TSFunction.prototype._isSafeVarName = function (key) {
    if (babel && babel.types && typeof babel.types.isValidIdentifier === 'function') {
        if (!babel.types.isValidIdentifier(key)) return false;
    }
    else if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(key)) return false;
    return !this.globalKeys[key];
};

TSFunction.prototype._makeConstCode = function (localConstants, context) {
    localConstants = Object.assign({}, localConstants || {}, context || {});
    return Object.keys(localConstants).filter(function (key) {
        return this._isSafeVarName(key);
    }, this).map(function (key) {

        return 'const ' + key + ' = localConstants[' + JSON.stringify(key) + '];'
    }).join('\n') + '\n';
};

TSFunction.prototype._compile = function () {
    var types = babel && babel.types;
    var scriptCode;
    if (this.body.startsWith('=')) {
        scriptCode = 'RET' + this.body;
    } else scriptCode = this.body;
    if (!window.babel) return;
    var variableDict = this.propertyNames.reduce(function (ac, cr) {
        ac[cr] = true;
        return ac;
    }, {});
    try {
        var isAsync = this._isAsync(scriptCode);
        scriptCode = (isAsync ? 'async ' : '') + 'function fx(RC){\n'
            + 'var RET;\n'
            + scriptCode
            + '\nreturn RET;'
            + '\n}';
        this.ast = babel.parseSync(scriptCode, {});
        var variables = {};
        babel.traverse(this.ast, {
            Program: function (path) {
            },
            Identifier: function (path) {
                var node = path.node;
                var name = node.name;
                if (path.container.type === "MemberExpression" && path.container.object !== node) return;
                var newNode;
                if (variableDict[name]) {
                    variables[name] = true;
                    newNode = types.memberExpression(
                        types.identifier('RC'),
                        types.identifier(name)
                    );
                    newNode.ignore = true;
                    path.replaceWith(newNode);

                }
            },
            MemberExpression: function (path) {
                if (path.node.ignore) path.skip();
            }
        });

        this.dependents = Object.keys(variables);
        this.jsCode = 'module.exports = ' + babel.generate(this.ast).code;
        var options = {
            presets: [
                babel.presetEnv
            ]
        };
        this.transformedCode = babel.transform(this.jsCode, options).code;
    } catch (err) {
        safeThrow(err);
    }
};

TSFunction.prototype._makeFunction = function (context) {
    try {
        var mdl = {};
        var localConstants = Object.assign({}, this.localConstants || {}, context || {});
        (new Function('module', 'regeneratorRuntime', 'localConstants', this._makeConstCode(localConstants, context) + this.transformedCode))(mdl, babel.regeneratorRuntime, localConstants);
        return mdl.exports;
    } catch (e) {
        safeThrow(e);
    }
};

TSFunction.prototype.invoke = function (_this, record, context) {
    try {
        var func = this._makeFunction(context);
        this.func = func;
        return func.call(_this, record);
    } catch (err) {
        this.err = err;
        // console.error(err);
        if (window["ABSOL_DEBUG"])
            safeThrow(err);
        return undefined;
    }
};

TSFunction.prototype.callable = function (record) {
    if (!this.dependents || this.dependents.length === 0) return true;
    return this.dependents.every(function (cr) {
        return record[cr] !== undefined;
    });
};

export default TSFunction;