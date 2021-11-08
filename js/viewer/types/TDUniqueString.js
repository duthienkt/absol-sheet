import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import TDNumber from "./TDNumber";
import {_} from "../../dom/SCore";
import TDText from "./TDText";

/***
 * @extends TDNumber
 * @constructor
 */
function TDUniqueString() {
    TDText.apply(this, arguments);
    this.elt.addClass('asht-unique');
}


OOP.mixClass(TDUniqueString, TDText);


TDUniqueString.prototype.implicit = function (value) {
    if (value === undefined || value === null) return null;
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value !== "string") return '';
    return (value + '').replace(/[\s\r\n]/, '');
};

TDUniqueString.prototype.loadValue = function () {
    this.elt.clearChild();
    var value = this.implicit(this.value) || '';
    this.$lines = [_({
        tag: 'span', child: {text: value}
    })];
    this.elt.addChild(this.$lines);
    var isDuplicated = false;
    var records = this.table.records;
    var record;
    if (typeof value === "string") {
        for (var i = 0; i < records.length && !isDuplicated; ++i) {
            record = records[i];
            if (this.record !== record)
                if (value === record[this.pName]) isDuplicated = true;
        }
    }
    if (isDuplicated) {
        this.elt.addClass('asht-duplicated');
    } else {
        this.elt.removeClass('asht-duplicated');
    }
};

TDBase.typeClasses.UniqueString = TDUniqueString;
TDBase.typeClasses.unique_string = TDUniqueString;
TDBase.typeClasses['unique<string>'] = TDUniqueString;


export default TDUniqueString;