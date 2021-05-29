import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import {_} from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDText() {
    TDBase.apply(this, arguments);
}

OOP.mixClass(TDText, TDBase);

TDText.prototype.loadValue = function (){
    this.elt.clearChild();
    var value = (this.value || '') + '';
    this.$lines = value.split(/\r?\n/).reduce(function (ac, line) {
        line = line.replace(/\s\s/g, ' \u00A0');
        ac.push(_({
            tag: 'span', child: { text: line }
        }));
        ac.push(_('br'));
        return ac;
    }, []);
    this.elt.addChild(this.$lines);
};

TDBase.typeClasses.text = TDText;
export default TDText;