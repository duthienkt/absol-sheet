import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { _ } from "../../dom/SCore";
import TextMeasure from "absol-acomp/js/TextMeasure";


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
    var maxLineWidth = 0;
    this.$lines = value.split(/\r?\n/).reduce(function (ac, line) {
        line = line.replace(/\s\s/g, ' \u00A0');
        var lineWidth = TextMeasure.measureWidth(line, TextMeasure.FONT_ROBOTO, 14);
        if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
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
    if (maxLineWidth < 200) this.elt.addStyle('min-width',Math.ceil( maxLineWidth + 10 )+ 'px');
    else if (maxLineWidth < 400) this.elt.addStyle('min-width',Math.ceil( maxLineWidth / 2) + 'px');
    else this.elt.addStyle('min-width', Math.min(200, Math.ceil(maxLineWidth / 4)) + 'px');
};

TDText.prototype.type = 'text';

TDBase.typeClasses.text = TDText;
TDBase.typeClasses.TextInput = TDText;
export default TDText;