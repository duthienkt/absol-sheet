import * as ExcelFx from './ExcelFx';

var types = babel.types;

function TSFunction(propertyNames, body) {
    this.propertyNames = propertyNames;
    this.body = body;
    this.dependents = [];
    this.ast = null;
    this.func = null;
    this._compile();
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


TSFunction.prototype._makeConstCode = function (localConstants) {
    return Object.keys(localConstants).map(function (key) {
        return 'const ' + key + ' = localConstants[' + JSON.stringify(key) + '];'
    }).join('\n') + '\n';
};

TSFunction.prototype._compile = function () {
    var scriptCode;
    if (this.body.startsWith('=')) {
        scriptCode = 'RET' + this.body;
    }
    else scriptCode = this.body;
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
        var mdl = {};
        (new Function('module', 'regeneratorRuntime', 'localConstants', this._makeConstCode(this.localConstants) + this.transformedCode))(mdl, babel.regeneratorRuntime, this.localConstants);
        this.func = mdl.exports;
    } catch (err) {
        setTimeout(function () {
           throw  err;
        }, 0);
    }
};

TSFunction.prototype.invoke = function (_this, record) {
    try {
        return this.func.call(_this, record);
    } catch (err) {
        setTimeout(function () {
            if (window['ABSOL_DEBUG'])    throw err;
        }, 0);
        return undefined;
    }
};

export default TSFunction;