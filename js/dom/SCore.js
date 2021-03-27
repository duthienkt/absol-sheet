import AComp from "absol-acomp";
import Dom from "absol/src/HTML5/Dom";

var SCore = new Dom();
SCore.install(AComp.core);
export default SCore;
export var _ = SCore._;
export var $ = SCore.$;