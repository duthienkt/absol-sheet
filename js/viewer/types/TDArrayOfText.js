import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";


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
    this.$number = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$number);
};

TDArrayOfText.prototype.reload = function () {
    var value = this.value;
    value = (value === null || value === undefined) ? '' : (value + '');
    this.$number.firstChild.data = value;
}

TDBase.typeClasses.ArrayOfText = TDArrayOfText;
TDBase.typeClasses['text[]'] = TDArrayOfText;
export default TDArrayOfText;