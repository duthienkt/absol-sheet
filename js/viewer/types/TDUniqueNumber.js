import TDBase from "./TDBase";
import OOP from "absol/src/HTML5/OOP";
import TDNumber from "./TDNumber";

/***
 * @extends TDNumber
 * @constructor
 */
function TDUniqueNumber() {
    TDNumber.apply(this, arguments);
    this.elt.addClass('asht-unique');
}


OOP.mixClass(TDUniqueNumber, TDNumber);

TDUniqueNumber.prototype.loadValue = function () {
    var value = this.implicit(this.value);
    value = (value === null || value === undefined) ? '' : (value + '');
    this.$number.firstChild.data = value;
    var isDuplicated = false;
    var records = this.table.records;
    var record;
    if (typeof value === "number") {
        for (var i = 0; i < records.length && !isDuplicated; ++i) {
            record = records[i];
            if (value === record[this.pName]) isDuplicated = true;
        }
    }
    if (isDuplicated) {
        this.elt.addClass('asht-duplicated');
    } else {
        this.elt.removeClass('asht-duplicated');
    }
};

TDBase.typeClasses.UniqueNumber = TDUniqueNumber;
TDBase.typeClasses.unique_number = TDUniqueNumber;
TDBase.typeClasses['unique<number>'] = TDUniqueNumber;

export default TDUniqueNumber;