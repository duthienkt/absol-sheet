import TableEditor from "./js/fragment/TableEditor";
import TSFunction from "./js/fx/TSFunction";
import * as ExcelFx from './js/fx/ExcelFx';
import './js/fx/ExcelParser';
import { excelFormula2KVFormula } from "./js/fx/ExcelParser";
import FormArrayEditor from "./js/fragment/FormArrayEditor";
import SCore from "./js/dom/SCore";

export default {
    dom: SCore,
    TableEditor: TableEditor,
    FormArrayEditor: FormArrayEditor,
    TSFunction: TSFunction,
    ExcelFx: ExcelFx,
    excelFormula2KVFormula: excelFormula2KVFormula
};