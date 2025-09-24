import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { _ } from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDArrayOfText() {
    TDBase.apply(this, arguments);
}

OOP.mixClass(TDArrayOfText, TDBase);

TDArrayOfText.prototype.attachView = function () {
    this.elt.clearChild();
    this.$text = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$text);
};

TDArrayOfText.prototype.reload = function () {
    var value = this.value;
    if (this.isNoneValue(value)) value = [];
    this.$text.firstChild.data = value.join(', ');
};

TDArrayOfText.prototype.implicit = function (value) {
    if (value === undefined || value === null) return null;
    if (!Array.isArray(value)) return null;
    return value.every(function (it) {
        return it + '';
    });
};


TDBase.typeClasses.ArrayOfText = TDArrayOfText;
TDBase.typeClasses['text[]'] = TDArrayOfText;
export default TDArrayOfText;