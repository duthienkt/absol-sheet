import Fragment from 'absol/src/AppPattern/Fragment';
import OOP from "absol/src/HTML5/OOP";
import { _, $ } from '../dom/SCore';
import '../../css/formarrayeditor.css';
import ResizeSystem from "absol/src/HTML5/ResizeSystem";
import { computeSheetDescriptor, duplicateData } from "../util";
import { ASHField, ASHTEditor, ASHTRow, ASHTTable } from "./Abstractions";
import DomSignal from "absol/src/HTML5/DomSignal";
import tableData from "../viewer/TableData";
import TDDate from "../viewer/types/TDDate";
import TDText from "../viewer/types/TDText";
import TDNumber from "../viewer/types/TDNumber";
import TDBoolean from "../viewer/types/TDBoolean";
import TDEEnum from "./editor/TDEEnum";
import TDEEnumSet from "./editor/TDEEnumSet";
import TDDateNLevel from "../viewer/types/TDDateNLevel";
import TDEnum from "../viewer/types/TDEnum";
import TDEnumSet from "../viewer/types/TDEnumSet";

/**
 * @extends Fragment
 * @param opt
 * @constructor
 */
function FormArrayEditor(opt) {
    ASHTEditor.call(this, opt);
    this.$domSignal = _('attachhook');
    this.domSignal = new DomSignal(this.$domSignal);
}

OOP.mixClass(FormArrayEditor, ASHTEditor);

FormArrayEditor.prototype.setData = function (data) {
    data = duplicateData(data);
    this.$body.clearChild();
    this.tableData = new FATable(this, this.opt);
    this.tableData.import(data);

    this.tableData.records.forEach(rc => {
        this.$body.addChild(rc.domRows);
        this.$body.addChild(_({
            class: 'asht-form-array-break',
            tag: 'tr',
            child: { tag: "td", attr: { colspan: 2 }, }
        }));
    });
    //

    ResizeSystem.updateUp(this.$view, true);
};

FormArrayEditor.prototype.getData = function () {

};


FormArrayEditor.prototype.createView = function () {
    this.$view = _({
        elt: this.opt.elt,
        class: 'asht-form-array-editor',
        child: [
            this.$domSignal,
            {
                tag: 'table',
                class: 'asht-form-array',
                child: [
                    {
                        tag: 'tbody',
                        child: []
                    }
                ]
            },
        ]
    });
    this.$body = $('tbody', this.$view);
    this.$view.fae = this;
};


export default FormArrayEditor;

function FATable(editor, opt) {
    ASHTTable.call(this, editor, opt);
    OOP.drillProperty(this, this.editor, 'domSignal');
}

OOP.mixClass(FATable, ASHTTable);


FATable.prototype.import = function (data) {
    ASHTTable.prototype.import.apply(this, arguments);
    this.records = data.records.map(rc => new FARow(this, rc));
};

/**
 * @extends ASHTRow
 * @param table
 * @param record
 * @constructor
 */
function FARow(table, record) {
    ASHTRow.call(this, table, record);
}

OOP.mixClass(FARow, ASHTRow);

FARow.prototype.render = function () {

};

FARow.prototype.loadFields = function () {
    var propertyNames = this.propertyNames;
    var propertyDescriptors = this.propertyDescriptors;
    this.fields = this.table.propertyNames.map(pName => {
        var descriptor = propertyDescriptors[pName] || { type: 'notSupport' };
        var clazz = FAField.typeClasses[descriptor.type] || FAField;
        console.log(descriptor.type, clazz)
        return new clazz(this, pName);

    });
    this.domRows = this.fields.map(field => field.rowElt);
    console.log(this.domRows)

}

/**
 * @extends ASHField
 * @param row
 * @param pName
 * @constructor
 */
function FAField(row, pName) {
    ASHField.apply(this, arguments);
    var descriptor = this.row.table.propertyDescriptors[pName];
    this.rowElt = _({
        tag: 'tr',
        child: [
            {
                tag: 'td',
                child: {
                    text: descriptor.text || pName
                }
            },
            this.elt
        ]
    });
}

OOP.mixClass(FAField, ASHField);

FAField.typeClasses = {
    notSupport: FAField
};


/**
 * @extends FAField
 * @param row
 * @param pName
 * @constructor
 */
function FADate(row, pName) {
    FAField.call(this, row, pName);
}

OOP.mixClass(FADate, FAField, TDDate);

FAField.typeClasses.date = FADate;
FAField.typeClasses.Date = FADate;

/**
 * @extends FAField
 * @param row
 * @param pName
 * @constructor
 */
function FADateNLevel(row, pName) {
    FAField.call(this, row, pName);
}

OOP.mixClass(FADateNLevel, FAField, TDDateNLevel);

FAField.typeClasses.datenlevel = FADateNLevel;
FAField.typeClasses.DateNLevel = FADateNLevel;


/**
 * @extends FAField
 * @param row
 * @param pName
 * @constructor
 */
function FAText(row, pName) {
    FAField.call(this, row, pName);
    console.log(this)
}

OOP.mixClass(FAText, FAField, TDText);

FAField.typeClasses.text = FAText;
FAField.typeClasses.string = FAText;


/**
 * @extends FAField
 * @param row
 * @param pName
 * @constructor
 */
function FANumber(row, pName) {
    FAField.call(this, row, pName);
}

OOP.mixClass(FANumber, FAField, TDNumber);

FAField.typeClasses.number = FANumber;


/**
 * @extends FAField
 * @param row
 * @param pName
 * @constructor
 */
function FABoolean(row, pName) {
    FAField.call(this, row, pName);
}

OOP.mixClass(FABoolean, FAField, TDBoolean);

FAField.typeClasses.bool = FABoolean;
FAField.typeClasses.boolean = FABoolean;



/**
 * @extends FAField
 * @param row
 * @param pName
 * @constructor
 */
function FAEnum(row, pName) {
    FAField.call(this, row, pName);
}

OOP.mixClass(FAEnum, FAField, TDEnum);

FAField.typeClasses.enum = FAEnum;
FAField.typeClasses.Emum = FAEnum;



/**
 * @extends FAField
 * @param row
 * @param pName
 * @constructor
 */
function FAEnumSet(row, pName) {
    FAField.call(this, row, pName);
}

OOP.mixClass(FAEnumSet, FAField, TDEnumSet);

FAField.typeClasses.EnumSet = FAEnumSet;
FAField.typeClasses['{enum}'] = FAEnumSet;
