import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { _ } from "../../dom/SCore";
import { measureListSize } from "absol-acomp/js/SelectList";
import treeListToList from "absol-acomp/js/list/treeListToList";
import TDEnum from "./TDEnum";
import { isDifferent } from "../../util";
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import TDTreeEnum from "./TDTreeEnum";


/***
 * @extends TDTreeEnum
 * @constructor
 */
function TDTreeLeafEnum() {
    TDTreeEnum.apply(this, arguments);
    this.elt.addClass('asht-type-tree-leaf-enum');
}

OOP.mixClass(TDTreeLeafEnum, TDTreeEnum);


TDBase.typeClasses.treeleafenum = TDTreeLeafEnum;
TDBase.typeClasses.TreeLeafEnum = TDTreeLeafEnum;

export default TDTreeLeafEnum;