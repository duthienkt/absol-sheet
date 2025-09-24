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


TSFunction.prototype._makeConstCode = function (localConstants, context) {
    localConstants = Object.assign({}, localConstants || {}, context || {});
    return Object.keys(localConstants).map(function (key) {
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
        return func.call(_this, record);
    } catch (err) {
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