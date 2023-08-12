import { parsedNodeToAST, parsedNodeToASTChain } from "absol/src/Pharse/DPParseInstance";
import DPParser from "absol/src/Pharse/DPParser";
import OOP from "absol/src/HTML5/OOP";
import SCCodeGenerator from "absol/src/SCLang/SCCodeGenerator";

var rules = [];

var elementRegexes = [
    ['string', /("(?:[^"\\]|\\.)*?")|('(?:[^'\\]|\\.)*?')/],
    ['number', /(\d+([.]\d*)?([eE][+-]?\d+)?|[.]\d+([eE][+-]?\d+)?)/],
    ['word', /[_a-zA-Z][_a-zA-Z0-9]*/],
    ['skip', /([\s\r\n]+)|(\/\/[^\n]*)|(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/],
    ['dsymbol', /\+\+|--|==|!=|<=|>=/],
    ['tsymbol', /\.\.\./],
    ['symbol', /[^\s_a-zA-Z0-9]/],
];


var operatorOrder = {
    '%': 3,
    '^': 4,
    '*': 5,
    '/': 5,
    '+': 6,
    '-': 6,
    '<': 9,
    '>': 9,
    '<=': 9,
    '>=': 9,
    '=': 9,
    '<>': 9,
    // 'AND': 14,
    // '&&': 14,
    // 'OR': 15,
    // '||': 15,
    // 'XOR': 15,
}


rules.push({
    target: 'ident',
    elements: ['.word'],
    toAST: function (parsedNode) {
        return {
            type: 'Identifier',
            name: parsedNode.children[0].content
        }
    }
});


rules.push({
    target: 'args_list',
    elements: ['exp'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    },
    toASTChain: function (parsedNode) {
        return [parsedNodeToAST(parsedNode)];
    }
});

rules.push({
    target: 'args_list',
    elements: ['args_list', '_,', 'exp'],
    longestOnly: true,
    ident: 'args_list_rec',
    toASTChain: function (parsedNode) {
        return parsedNodeToASTChain(parsedNode.children[0]).concat(parsedNodeToAST(parsedNode.children[2]));
    }
});

rules.push({
    target: 'function_callee',
    elements: ['ident'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    }
});

rules.push({
    target: 'function_call',
    elements: ['function_callee', '_(', 'args_list', '_)'],
    toAST: function (parsedNode) {
        return {
            type: 'CallExpression',
            arguments: parsedNode.children[2].rule.toASTChain(parsedNode.children[2]),
            callee: parsedNodeToAST(parsedNode.children[0])
        }
    }
});

rules.push({
    target: 'function_call',
    elements: ['function_callee', '_(', '_)'],
    toAST: function (parsedNode) {
        return {
            type: 'CallExpression',
            arguments: [],
            callee: parsedNodeToAST(parsedNode.children[0])
        };
    }
});


rules.push({
    target: 'exp',
    elements: ['ident'],
    toAST: function (parsedNode) {
        //todo: ident is booolean const
        return parsedNodeToAST(parsedNode.children[0]);
    }
});

rules.push({
    target: 'number',
    elements: ['.number'],
    toAST: function (parsedNode) {
        return {
            type: 'NumericLiteral',
            value: parseFloat(parsedNode.children[0].content)
        }
    }
});

rules.push({
    target: 'string',
    elements: ['.string'],
    toAST: function (parsedNode) {
        var content = parsedNode.children[0].content;
        if (content[0] === "'") content = '"' + content.substring(1, content.length - 1).replace(/["]/g, '\\"') + '"';
        return {
            type: 'StringLiteral',
            value: JSON.parse(content)
        }
    }
});


rules.push({
    target: 'exp',
    elements: ['number'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    }
});

rules.push({
    target: 'exp',
    elements: ['string'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    }
});


['^', '+', '-', '*', '/', '=', '<>', '<', '>', '>=', '<='].forEach(function (op) {
    rules.push({
        target: 'bin_op',
        elements: ['_' + op],
        toAST: function (parsedNode) {
            return {
                type: "BinaryOperator",
                content: op
            }
        }
    });
});


rules.push({
    target: 'exp',
    elements: ['exp', 'bin_op', 'exp'],
    longestOnly: true,
    ident: 'bin_op_rec',
    toASTChain: function (parseNode) {
        var res = [];
        if (parseNode.children[0].rule === this) {
            res = res.concat(this.toASTChain(parseNode.children[0]));
        } else {
            res.push(parsedNodeToAST(parseNode.children[0]));
        }

        res.push(parseNode.children[1].children[0]);

        if (parseNode.children[2].rule === this) {
            res = res.concat(this.toASTChain(parseNode.children[2]));
        } else {
            res.push(parsedNodeToAST(parseNode.children[2]));
        }
        return res;
    },
    toAST: function (parsedNode) {
        var chain = this.toASTChain(parsedNode);
        var stack = [];
        var item;
        var newNode;
        while (chain.length > 0) {
            item = chain.shift();
            if (item.content in operatorOrder) {
                while (stack.length >= 3 && operatorOrder[stack[stack.length - 2].content] <= operatorOrder[item.content]) {
                    newNode = { type: 'BinaryExpression' };
                    newNode.right = stack.pop();
                    newNode.operator = stack.pop();
                    newNode.left = stack.pop();
                    stack.push(newNode);
                }
            }
            stack.push(item);
        }

        while (stack.length >= 3) {
            newNode = { type: 'BinaryExpression' };
            newNode.right = stack.pop();
            newNode.operator = stack.pop();
            newNode.left = stack.pop();
            stack.push(newNode);
        }

        return stack.pop();
    }
});

rules.push({
    target: 'exp',
    elements: ['function_call'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    }
});


rules.push({
    target: 'bracket_group',
    elements: ['_(', 'exp', '_)'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[1]);
    }
});

rules.push({
    target: 'exp',
    elements: ['bracket_group'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    }
});

['+', '-'].forEach(function (op) {
    ['number', 'bracket_group', 'ident', 'function_call', 'mem_exp', 'unary_exp', 'percent_exp'].forEach(function (arg) {
        rules.push({
            target: 'unary_exp',
            elements: ['_' + op, arg],
            toAST: function (parsedNode) {
                return {
                    type: 'UnaryExpression',
                    argument: parsedNodeToAST(parsedNode.children[1]),
                    operator: {
                        type: 'UnaryOperator',
                        content: op
                    }
                }
            }
        });
    });
});

rules.push({
    target: 'exp',
    elements: ['unary_exp'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    }
});

['number', 'bracket_group', 'ident', 'function_call', 'unary_exp'].forEach(function (arg) {
    rules.push({
        target: 'percent_exp',
        elements: [arg, '_%'],
        toAST: function (parsedNode) {
            return {
                type: 'BinaryExpression',
                left: parsedNodeToAST(parsedNode.children[0]),
                operator: {
                    type: "BinaryOperator",
                    content: '/'
                },
                right: {
                    type: 'NumericLiteral',
                    value: 100
                }
            };
        }
    });
});

rules.push({
    target: 'exp',
    elements: ['percent_exp'],
    toAST: function (parsedNode) {
        return parsedNodeToAST(parsedNode.children[0]);
    }
});


rules.push({
    target: 'formula',
    elements: ['_=', 'exp'],
    longestOnly: true,
    toAST: function (parsedNode) {
        return {
            type: 'Formula',
            expression: parsedNodeToAST(parsedNode.children[1])
        }
    }
});
//
rules.push({
    target: 'formula',
    elements: ['exp'],
    longestOnly: true,
    toAST: function (parsedNode) {
        return {
            type: 'Formula',
            expression: parsedNodeToAST(parsedNode.children[1])
        }
    }
});


/**
 * @extends SCCodeGenerator
 * @constructor
 */
function KVFormulaGenerator() {

}


OOP.mixClass(KVFormulaGenerator, SCCodeGenerator);


KVFormulaGenerator.prototype.visitors = Object.assign({}, KVFormulaGenerator.prototype.visitors);

/**
 * @this KVFormulaGenerator
 * @param node
 * @constructor
 */
KVFormulaGenerator.prototype.visitors.Formula = function (node) {
    return this.accept(node.expression);
};

KVFormulaGenerator.prototype.visitors.BinaryExpressionNormal = KVFormulaGenerator.prototype.visitors.BinaryExpression;

/**
 * @this KVFormulaGenerator
 * @param node
 * @returns {*|string}
 * @constructor
 */
KVFormulaGenerator.prototype.visitors.BinaryExpression = function (node) {
    if (node.operator.content === '^') {
        return `pow(${this.accept(node.left)}, ${this.accept(node.right)})`;
    } else if (node.operator.content === '=') {
        return `${this.accept(node.left)} == ${this.accept(node.right)}`;
    } else return KVFormulaGenerator.prototype.visitors.BinaryExpressionNormal.apply(this, arguments);
}

KVFormulaGenerator.prototype.visitors.IdentifierNormal = KVFormulaGenerator.prototype.visitors.Identifier;

KVFormulaGenerator.prototype.visitors.Identifier = function (node) {
    var text = KVFormulaGenerator.prototype.visitors.IdentifierNormal.apply(this, arguments);
    var tl = text.toLowerCase();
    if (tl === 'true' || tl === 'false') {
        text = tl;
    }
    return text;
};

/**
 * @this KVFormulaGenerator
 * @param node
 * @returns {*|string}
 * @constructor
 */
KVFormulaGenerator.prototype.visitors.CallExpression = function (node) {
    var res = '';
    if (node.callee && node.callee.type === 'Identifier') {
        res += this.accept(node.callee).toLowerCase();
    } else {
        res += '(' + this.accept(node.callee) + ')';
    }

    res += '(';
    res += node.arguments.map(arg => this.accept(arg)).join(', ');
    res += ')';
    return res;
};

var parser = new DPParser({
    rules: rules,
    elementRegexes: elementRegexes
});
var generator = new KVFormulaGenerator();


export function excelFormula2KVFormula(code) {
    var rows, errorHTML, error, token, charIdx, rowIdx;
    var result = parser.parse(code, 'formula');
    if (result.ast) return generator.generate(result.ast);
    else if (result.error) {
        rows = code.split('\n');
        errorHTML = '';
        error = result.error;
        switch (error.type) {
            case 'unexpected':
                errorHTML = `<span style="color:red">${error.message}</span>`;
                token = result.tokens[error.tokenIdx];
                charIdx = token.start;
                rowIdx = 0;
                while (rowIdx < rows.length) {
                    if (charIdx <= rows[rowIdx].length) {
                        errorHTML = `<strong>Line ${rowIdx + 1}:</strong> ` + errorHTML
                        errorHTML += '<br>';
                        errorHTML += `<div style="color:blue">${rows[rowIdx]}</div>`;
                        errorHTML += `<div style=" --text-color:red" class="as-blink-text">${' '.repeat(charIdx)}^</div>`;
                        break;
                    }
                    charIdx -= rows[rowIdx].length + 1;//by \n
                    rowIdx++;
                }
                break;
            case 'expected':
                if (error.expectedToken && error.expectedToken) {
                    error.message = "Incomplete formula!";
                }
                errorHTML = `<span style="color:red">${error.message}</span>`;
                break;
            default:
                errorHTML = `<span style="color:red">${error.message}</span>`;
                break;
        }
        error.html = errorHTML;
        throw error;
    }
}

//
// console.log(excelFormula2KVFormula('= 2 *  30% + x% * *100 ^ x + 100 * 9%'));
// //
// // var result = ExcelFormulaParser.parse('= 2 *  30%%', 'formula');
// // console.log(result);