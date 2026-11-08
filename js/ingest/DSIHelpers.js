import safeThrow from "absol/src/Code/safeThrow";

var libSync = null;
var libUrl = "https://absoljs.dev/vendor/exceljs/exceljs_v1.js?ver=" + Date.now();

export function loadExcelLibrary() {
    if (libSync) {
        return libSync;
    }
    if (window['excel_module'] && window['excel_module'].ready) {
        libSync = window['excel_module'].ready().then(() => {
        }, () => {
            libSync = null;//fail and load again
        });
    }
    else {
        libSync = fetch(libUrl).then(res => res.text()).then(res => {
            res += "\n//#sourceURL=vendor/exceljs/exceljs_v1.js";
            (new Function( 'global', res))(window);
        }, (error) => {
            safeThrow(error);
            libSync = null;
        })
    }
    return libSync;
}

export function isEmptyExcelSheetData(sheet) {
    if (!sheet) return true;
    if (!sheet.data || !sheet.data.length) return true;
    return false;
}

export function isEmptyExcelData(excelData) {
    if (!excelData) return true;
    if (!excelData.sheets || excelData.sheets.length === 0) return true;
    return excelData.sheets.every(sheet => isEmptyExcelSheetData(sheet));
}

export function textToExcelData(text) {
    if (!text) return null;
    if (typeof text !== 'string') return null;
    var lines = text.split('\n')
        .map(line => line.split('\t'));
    var res = {
        sheets: []
    }
    var sheet = {
        name: 'Clipboard',
        data: []
    }

    var i, j;
    for (i = 0; i < lines.length; i++) {
        for (j = 0; j < lines[i].length; j++) {
            sheet.data.push({
                row: i,
                col: j,
                value: lines[i][j]
            });
        }
    }
    res.sheets.push(sheet);

    return res;
}

export function fileTextToExcelData(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function (event) {
            resolve(textToExcelData(event.target.result));
        };
        reader.onerror = function (event) {
            reject(event.target.error);
        };
        reader.readAsText(file);
    });
}


export function htmlToExcelData(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    var res = {
        sheets: []
    }
    var sheet = {
        name: 'Clipboard',
        data: []
    }
    var table = div.querySelector('table');
    if (!table) return null;
    Array.prototype.forEach.call(div.querySelectorAll('style'), node => node.remove());
    var rows = Array.prototype.filter.call(table.rows, row => row.closest('table') === table);
    var occupied = [];
    var styleProperties = [
        'backgroundColor', 'color', 'fontWeight', 'fontSize', 'fontFamily',
        'fontStyle', 'textDecoration', 'textAlign', 'verticalAlign', 'whiteSpace',
        'borderTop', 'borderRight', 'borderBottom', 'borderLeft'
    ];
    rows.forEach((row, rIdx) => {
        var col = 0;
        occupied[rIdx] = occupied[rIdx] || [];
        var groupRows = rows.filter(it => it.parentNode === row.parentNode);
        var remainingRows = groupRows.length - groupRows.indexOf(row);
        Array.prototype.forEach.call(row.cells, cell => {
            var colspan = cell.colSpan || 1;
            var rowspan = cell.rowSpan;
            // HTML rowspan=0 extends to the end of the current row group.
            rowspan = rowspan === 0 ? remainingRows : Math.min(rowspan || 1, remainingRows);
            while (occupied[rIdx][col]) ++col;
            var style = {};
            // Read only attributes on the cell; do not resolve CSS or inheritance.
            var attributes = {
                bgcolor: 'backgroundColor', color: 'color',
                align: 'textAlign', valign: 'verticalAlign'
            };
            Object.keys(attributes).forEach(attr => {
                var value = cell.getAttribute(attr);
                if (value) style[attributes[attr]] = value;
            });
            var border = cell.getAttribute('border');
            if (border && /^\d+$/.test(border)) {
                var borderColor = cell.getAttribute('bordercolor') || 'currentColor';
                ['Top', 'Right', 'Bottom', 'Left'].forEach(side => {
                    style['border' + side] = border + 'px solid ' + borderColor;
                });
            }
            // Inline declarations take precedence over legacy HTML attributes.
            styleProperties.forEach(key => {
                if (cell.style[key]) style[key] = cell.style[key];
            });
            sheet.data.push({
                row: rIdx,
                col: col,
                value: cell.innerText,
                colspan: colspan,
                rowspan: rowspan,
                style: style
            });
            for (var r = rIdx; r < rIdx + rowspan; ++r) {
                occupied[r] = occupied[r] || [];
                for (var c = col; c < col + colspan; ++c) occupied[r][c] = true;
            }
            col += colspan;
        });
    });
    res.sheets.push(sheet);
    return res;
}



function excelCellStyle(cell, themeColors) {
    var style = {};
    function color(value) {
        if (!value) return null;
        var argb = value.argb || themeColors[value.theme];
        if (typeof argb !== 'string') return null;
        // Excel stores ARGB; cell fills and borders use the RGB portion.
        var hex = argb.replace(/^#/, '');
        if (!/^(?:[\da-f]{6}|[\da-f]{8})$/i.test(hex)) return null;
        hex = hex.slice(-6);
        if (typeof value.tint === 'number' && value.tint !== 0) {
            hex = hex.match(/../g).map(channel => {
                var n = parseInt(channel, 16);
                n = value.tint < 0 ? n * (1 + value.tint) : n + (255 - n) * value.tint;
                return ('0' + Math.max(0, Math.min(255, Math.round(n))).toString(16)).slice(-2);
            }).join('');
        }
        return '#' + hex;
    }
    var fill = cell.fill;
    if (fill && fill.type === 'pattern' && fill.pattern !== 'none') {
        var background = color(fill.pattern === 'solid' ? fill.fgColor : fill.bgColor);
        if (background) style.backgroundColor = background;
    }
    var font = cell.font || {};
    if (font.bold !== undefined) style.fontWeight = font.bold ? 'bold' : 'normal';
    if (font.size !== undefined) style.fontSize = font.size + 'pt';
    if (font.name) style.fontFamily = font.name;
    if (font.italic !== undefined) style.fontStyle = font.italic ? 'italic' : 'normal';
    var foreground = color(font.color);
    if (foreground) style.color = foreground;
    var borderStyles = {
        hair: ['1px', 'solid'], thin: ['1px', 'solid'],
        medium: ['2px', 'solid'], thick: ['3px', 'solid'], double: ['3px', 'double'],
        dotted: ['1px', 'dotted'], dashed: ['1px', 'dashed'],
        dashDot: ['1px', 'dashed'], dashDotDot: ['1px', 'dashed'],
        slantDashDot: ['1px', 'dashed'], mediumDashed: ['2px', 'dashed'],
        mediumDashDot: ['2px', 'dashed'], mediumDashDotDot: ['2px', 'dashed']
    };
    ['top', 'right', 'bottom', 'left'].forEach(side => {
        var border = (cell.border || {})[side];
        var css = border && borderStyles[border.style];
        if (!css) return;
        var key = 'border' + side[0].toUpperCase() + side.slice(1);
        style[key] = css.join(' ') + ' ' + (color(border.color) || 'currentColor');
    });
    return style;
}

export function fileXlsxToExcelData(file) {
    return loadExcelLibrary().then(()=> file.arrayBuffer()).then((buffer)=>{
        var wb = new window.ExcelJS.Workbook();
        return wb.xlsx.load(buffer).then(workbook => {
            var themeColors = [];
            var themes = workbook.model.themes || {};
            if (themes.theme1) {
                var theme = new DOMParser().parseFromString(themes.theme1, 'application/xml');
                var scheme = theme.getElementsByTagNameNS('*', 'clrScheme')[0];
                if (scheme) {
                    // Spreadsheet theme indexes put light colors before dark colors.
                    ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3',
                        'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'].forEach((name, index) => {
                        var entry = scheme.getElementsByTagNameNS('*', name)[0];
                        var node = entry && entry.firstElementChild;
                        if (node) themeColors[index] = node.getAttribute('lastClr') || node.getAttribute('val');
                    });
                }
            }
            var res = {
                sourceType: 'xlsx'
            };
            res.sheets = [];
            var opt = {
                date1904: workbook.properties.date1904
            };
            workbook.eachSheet((sheet, id) => {
                var sheetData = {data: [], name: sheet.name};
                var spans = Object.create(null);
                (sheet.model.merges || []).forEach(range => {
                    var addresses = range.split(':');
                    var start = sheet.getCell(addresses[0]);
                    var end = sheet.getCell(addresses[1] || addresses[0]);
                    spans[start.address] = {
                        colspan: end.col - start.col + 1,
                        rowspan: end.row - start.row + 1
                    };
                });
                sheet.eachRow((row, rIdx)=>{
                    row.eachCell({includeEmpty: true}, (cell, cIdx)=>{
                        if (cell.isMerged && cell.master.address !== cell.address) return;
                        var style = excelCellStyle(cell, themeColors);
                        if (cell.value == null && !Object.keys(style).length) return;
                        var span = spans[cell.address];
                        sheetData.data.push({
                            row: rIdx - 1,
                            col: cIdx - 1,
                            value: cell.value,
                            style: style,
                            colspan: span ? span.colspan : 1,
                            rowspan: span ? span.rowspan : 1
                        });
                    });
                });
                res.sheets.push(sheetData);
            })
            return res;
        });
    }, (err) => {
        console.error(err);
        return null;
    });
}


/**
 * Parse an A1 range address into inclusive, zero-based coordinates.
 * Missing endpoints default to A1 and Infinity respectively.
 * Missing row numbers default to 0 for from and Infinity for to.
 * Invalid input returns the full range from A1 to Infinity.
 * @param {string} address
 * @returns {{from: {row: number, col: number}, to: {row: number, col: number}}}
 */
export function parseRangeAddress2ZeroIndex(address) {
    var fallback = { from: { row: 0, col: 0 }, to: { row: Infinity, col: Infinity } };
    if (typeof address !== 'string') return fallback;
    var parts = address.split(':');
    if (parts.length > 2) return fallback;
    var fromAddress = parts[0].trim();
    if (parts.length === 1 && !fromAddress) return fallback;

    // A missing row stays null until the endpoint defaults are applied.
    function parseCell(value) {
        var match = /^\$?([A-Z]+)(?:\$?([1-9][0-9]*))?$/i.exec(value);
        if (!match) return null;
        var row = match[2] ? Number(match[2]) : null;
        if (row !== null && !Number.isSafeInteger(row)) return null;
        var letters = match[1].toUpperCase();
        var col = 0;
        for (var i = 0; i < letters.length; ++i) {
            col = col * 26 + letters.charCodeAt(i) - 64;
            if (!Number.isSafeInteger(col)) return null;
        }
        return { row: row === null ? null : row - 1, col: col - 1 };
    }

    var from = fromAddress ? parseCell(fromAddress) : fallback.from;
    if (!from) return fallback;
    var to;
    if (parts.length === 1) {
        to = from;
    }
    else {
        var toAddress = parts[1].trim();
        to = toAddress ? parseCell(toAddress) : fallback.to;
        if (!to) return fallback;
    }
    return {
        from: { row: from.row === null ? 0 : from.row, col: from.col },
        to: { row: to.row === null ? Infinity : to.row, col: to.col }
    };
}
