import SComp from "./js/dom/SComp";
import TableEditor from "./js/fragment/TableEditor";
import TSFunction from "./js/fx/TSFunction";
import * as ExcelFx from './js/fx/ExcelFx';
import './js/fx/ExcelParser';
import { excelFormula2KVFormula } from "./js/fx/ExcelParser";

export default {
    dom: SComp,
    TableEditor: TableEditor,
    TSFunction: TSFunction,
    ExcelFx: ExcelFx,
    excelFormula2KVFormula: excelFormula2KVFormula
};