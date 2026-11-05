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
    var body = table.querySelector('tbody');
    if (!body) return null;
    var rows = Array.prototype.filter.call(body.childNodes, node => node.tagName === "TR")
        .map(row=>{
        return Array.prototype.filter.call(row.childNodes, node => node.tagName === "TD");
    });
    var i, j;
    for (i = 0; i < rows.length; ++i) {
        for (j = 0; j < rows[i].length; ++j) {
            sheet.data.push({
                row: i,
                col: j,
                value: rows[i][j].innerText
            });
        }
    }
    res.sheets.push(sheet);
    return res;
}



export function fileXlsxToExcelData(file) {
    return loadExcelLibrary().then(()=> file.arrayBuffer()).then((buffer)=>{
        var wb = new window.ExcelJS.Workbook();
        return wb.xlsx.load(buffer).then(workbook => {
            var res = {};
            res.sheets = [];
            var opt = {
                date1904: workbook.properties.date1904
            };
            workbook.eachSheet((sheet, id) => {
                var sheetData = {data: [], name: sheet.name};
                sheet.eachRow((row, rIdx)=>{
                    row.eachCell((cell, cIdx)=>{
                        sheetData.data.push({
                            row: rIdx - 1,
                            col: cIdx - 1,
                            value: cell.value
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
