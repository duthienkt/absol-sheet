import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import { _ } from "../../dom/SCore";


/***
 * @extends TDBase
 * @constructor
 */
function TDNumber() {
    TDBase.apply(this, arguments);
    this.elt.addClass('asht-type-number');
}

OOP.mixClass(TDNumber, TDBase);

TDNumber.prototype.attachView = function () {
    this.elt.clearChild();
    this.$number = _({
        tag: 'span', child: { text: '' }
    });
    this.elt.addChild(this.$number);
};

TDNumber.prototype.loadValue = function () {
    var value = this.implicit(this.value);
    var text = (value === null || value === undefined) ? '' : (value + '');
    var copyFormat, locales;
    var format =  this.descriptor.format ||{};
    if (!this.descriptor.formater) {
        copyFormat = Object.assign({locales: 'vi-VN', maximumFractionDigits: 20,
            minimumFractionDigits: 0}, format);
        locales = copyFormat.locales;
        delete copyFormat.locales;
        if (!locales) {
            if (copyFormat.currency === 'VND') locales = 'vi-VN';
        }
        this.descriptor.formater = new Intl.NumberFormat(locales, copyFormat);
    }
    if (typeof value === "number" && this.descriptor.formater) text = this.descriptor.formater.format(value);
    this.$number.firstChild.data = text;
};


TDNumber.prototype.implicit = function (value) {
    if (typeof value === 'string') value = parseFloat(value);
    if (typeof value !== 'number') value = undefined;
    if (isNaN(value)) value = undefined;
    return value;
};

TDNumber.prototype.isEmpty = function () {
    var value = this.value;
    return typeof value !== "number" || value === this.descriptor.emptyValue;
}

TDBase.typeClasses.number = TDNumber;
export default TDNumber;