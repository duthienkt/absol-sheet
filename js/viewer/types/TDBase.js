import { ASHField } from "../../fragment/Abstractions";
import OOP from "absol/src/HTML5/OOP";

/***
 * @extends ASHField
 * @param {TDRecord} row
 * @param {string} pName
 * @constructor
 */
function TDBase(row, pName) {
    ASHField.apply(this,  arguments);
    this.elt.addClass('asht-table-cell');
}

OOP.mixClass(TDBase, ASHField);

TDBase.typeClasses = {
    notSupport: TDBase
};


export default TDBase;
