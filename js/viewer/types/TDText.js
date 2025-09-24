import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { _ } from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDText() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-text');
    //Apr04-2025; Yen required to default value must be empty string
    if (this.row.record[this.pName] === undefined || this.row.record[this.pName] === null) {
        this.row.record[this.pName] = '';
    }
}

OOP.mixClass(TDText, TDBase);

TDText.prototype.implicit = function (value) {
    if (value === undefined || value === null) return null;
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "number") return value.toString();
    if (typeof value !== "string") return '';
    return value + '';
};

TDText.prototype.loadValue = function () {
    this.elt.clearChild();
    var value = this.implicit(this.value) || '';
    this.$lines = value.split(/\r?\n/).reduce(function (ac, line) {
        line = line.replace(/\s\s/g, ' \u00A0');
        ac.push(_({
            tag: 'span', child: { text: line }
        }));
        ac.push(_('br'));
        return ac;
    }, []);
    this.elt.addChild(this.$lines);
    if (this.$lines.length > 1) {
        this.elt.removeClass('as-multi-line');
    }
    else {
        this.elt.addClass('as-multi-line');
    }
};


TDBase.typeClasses.text = TDText;
TDBase.typeClasses.TextInput = TDText;
export default TDText;