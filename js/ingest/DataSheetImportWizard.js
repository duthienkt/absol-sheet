import Svg from "absol/src/HTML5/Svg";
import Fragment from 'absol/src/AppPattern/Fragment'
import { drillProperty, mixClass } from "absol/src/HTML5/OOP";
import { ModalWindow } from "absol-acomp/js/Modal";
import { $, _ } from "../dom/SCore";
import VerticalTimeline from "absol-acomp/js/VerticalTimeline";
import '../../css/ingest.css';
import FrameView from "absol-acomp/js/FrameView";
import Frame from "absol-acomp/js/Frame";
import Rectangle from "absol/src/Math/Rectangle";
import FlexiconButton from "absol-acomp/js/FlexiconButton";
import { pasteFiles, pasteHTML, pasteText } from "absol/src/HTML5/Clipboard";
import {
    fileXlsxToExcelData,
    htmlToExcelData,
    isEmptyExcelData,
    parseRangeAddress2ZeroIndex,
    textToExcelData
} from "./DSIHelpers";
import {  numberToExcelColumn } from "absol-acomp/js/utils";
import { TextInput } from "absol-acomp/js/TextEditor";

/**
 * @extends Fragment
 * @param {TableEditor} tableEditor
 * @constructor
 */
function DataSheetImportWizard(opt) {
    Fragment.call(this);
    this.opt = opt || {};
    this.tableEditor = opt.editor;
    this.lang = 'vi';
    this.data = {};
    this.stepFrags = [
        new DSISourceInputFragment(this),
        new DSISheetSelectingFragment(this),
        new DSIPrepareEditingFragment(this),
        new DSIColumnMappingFragment(this),
        new DSIDataValidationFragment(this),
        new DSIImportFragment(this),
        new DSIResultFragment(this),
    ];
    this.stepCtrl = new DSIStepController(this);

}

mixClass(DataSheetImportWizard, Fragment);

DataSheetImportWizard.prototype.titles = {
    vi: [
        "Chọn nguồn dữ liệu",
        "Chọn sheet làm việc",
        "Chuẩn bị và chỉnh sửa",
        "Ghép cột với datasheet",
        "Kiểm tra dữ liệu",
        "Đang import từng dòng",
        "Kết quả và sửa lỗi"
    ],
    en: [
        "Select data source",
        "Select working sheet",
        "Prepare and edit",
        "Match columns with datasheet",
        "Check data",
        "Importing each row",
        "Results and fix errors"
    ]
}


DataSheetImportWizard.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard',
        attr: {
            tabindex: 1,
        },
        child: [
            {
                class: 'asi-sidebar',
                child: [
                    {
                        tag: VerticalTimeline,
                        props: {
                            items: this.titles[this.lang].map((item) => ({ text: item })),
                            value: 0
                        }
                    }
                ]
            },
            {
                class: 'asi-content',
                child: [
                    {
                        class: 'asi-page-header',
                        style: { display: 'none' },
                        child: [
                            {
                                tag: 'h1',
                                id: 'pageTitle',
                                child: { text: 'Chọn nguồn dữ liệu' }
                            },
                            {
                                tag: 'p',
                                class: 'asi-muted',
                                id: 'pageDescription',
                                child: { text: 'Nhập dữ liệu để bắt đầu quy trình import.' }
                            }
                        ]
                    },
                    {
                        tag: FrameView,
                        class: 'asi-tab-view',
                        child: this.stepFrags.map(frag => ({
                            tag: Frame,
                            child: frag.getView()
                        }))
                    },
                    {
                        class: 'asi-footer',
                        child: [
                            {
                                class: 'asi-action',
                                attr: { 'data-action': 'previous-step' },
                                child: {
                                    tag: FlexiconButton,
                                    style: {
                                        size: 'regular',
                                        variant: 'secondary'
                                    },
                                    id: 'backButton',
                                    props: {
                                        icon: 'span.mdi.mdi-arrow-left',
                                        text: 'Quay lại'
                                    }
                                }
                            },
                            {
                                class: 'asi-action',
                                attr: { 'data-action': 'next-step' },
                                child: {
                                    tag: FlexiconButton,
                                    style: {
                                        size: 'regular',
                                        iconPosition: 'end',
                                        variant: 'primary',
                                    },
                                    id: 'nextButton',
                                    props: {
                                        icon: 'span.mdi.mdi-arrow-right',
                                        text: 'Tiếp tục'
                                    }
                                }
                            },
                            {
                                class: 'asi-action',
                                attr: { 'data-action': 'close' },
                                child: {
                                    tag: FlexiconButton,
                                    style: {
                                        size: 'regular',
                                        iconPosition: 'end',
                                        variant: 'danger',
                                    },
                                    id: 'closeButton',
                                    props: {
                                        icon: 'span.mdi.mdi-close',
                                        text: 'Hủy'
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    });
    this.$frameView = $('frameview', this.$view);
    this.$frames = this.$frameView.getAllChild();
    this.$frames[this.$frames.length - 1].requestActive();
    this.$timeline = $(VerticalTimeline.tag, this.$view);
    this.stepCtrl.onCreateView();
}

DataSheetImportWizard.prototype.onDestroy = function () {
    this.stepCtrl.onDestroy();
    this.stepFrags.forEach(function (frag) {
        frag.onDestroy();
    });
};

DataSheetImportWizard.prototype.updateTabSize = function () {
    var rect = this.$frames.reduce((acc, frame) => {
        var width = frame.scrollWidth;
        var height = frame.scrollHeight;
        return acc.merge(new Rectangle(0, 0, width, height));
    }, new Rectangle(0, 0, 0, 0));
    this.$view.addStyle('--tab-content-width', rect.width + 'px')
        .addStyle('--tab-content-height', rect.height + 'px');

};

DataSheetImportWizard.prototype.startInModal = function () {
    var view = this.getView();
    this.modal = new ModalWindow({
        title: 'Datasheet Import Wizard',
        content: view
    });
    this.modal.open();
    this.start();
}


DataSheetImportWizard.prototype.onStart = function () {
    this.stepCtrl.viewStep(0);
    this.updateTabSize();
    this.$view.focus();

};

DataSheetImportWizard.prototype.onStop = function () {
    if (this.modal) {
        this.modal.close();
    }
};


export default DataSheetImportWizard;

/**
 *
 * @param {DataSheetImportWizard} wizard
 * @constructor
 */
function DSIStepController(wizard) {
    this.wizard = wizard;
    for (var key in this) {
        if (key.startsWith('ev_')) {
            this[key] = this[key].bind(this);
        }
    }
    this.curStepFrag = null;
}


DSIStepController.prototype.updateActions = function () {
    if (this.curStepFrag) {
        this.$prevBtn.disabled = !this.curStepFrag.canPrevious();
        this.$nextBtn.disabled = !this.curStepFrag.canNext();
    }
    else {
        this.$prevBtn.disabled = true;
        this.$nextBtn.disabled = true;
    }
}

DSIStepController.prototype.onCreateView = function () {
    this.$prevBtn = $('[data-action="previous-step"] button', this.wizard.$view)
        .on('click', this.ev_clickPrevBtn);
    this.$nextBtn = $('[data-action="next-step"] button', this.wizard.$view)
        .on('click', this.ev_clickNextBtn);
    this.$timeline = this.wizard.$timeline;
    this.$frames = this.wizard.$frames;
    this.$closeBtn = $('[data-action="close"] button', this.wizard.$view);
    this.$closeBtn.on('click', this.ev_clickCloseBtn);
};

DSIStepController.prototype.onDestroy = function () {
    Object.keys(this).forEach(function (key) {
        if (key[0] === '$' && this[key] && this[key].offAll) {
            this[key].offAll();
        }
    }, this);
};


DSIStepController.prototype.ev_clickPrevBtn = function () {
    var idx = this.wizard.stepFrags.indexOf(this.curStepFrag);
    this.viewStep(idx - 1);
};


DSIStepController.prototype.ev_clickNextBtn = function () {
    var idx = this.wizard.stepFrags.indexOf(this.curStepFrag);
    this.viewStep(idx + 1);
};


DSIStepController.prototype.ev_clickCloseBtn = function () {
    this.wizard.destroy();
};

DSIStepController.prototype.viewStep = function (index) {
    var curStepFrag = this.curStepFrag;
    var newStepFrag = this.wizard.stepFrags[index] || null;
    if (newStepFrag === curStepFrag) return;
    if (!newStepFrag) return;
    this.$timeline.current = index;
    this.$frames[index].requestActive();
    if (curStepFrag) {
        curStepFrag.pause();
    }
    this.curStepFrag = newStepFrag;
    if (newStepFrag) {
        newStepFrag.start();
        this.updateActions();
    }
};

/**
 *
 * @param {DataSheetImportWizard} wizard
 * @constructor
 */
function DSIBaseStep(wizard) {
    Fragment.call(this);
    this.wizard = wizard;
}

mixClass(DSIBaseStep, Fragment);

DSIBaseStep.prototype.canNext = function () {
    return false;
};

DSIBaseStep.prototype.canPrevious = function () {
    return false;
};

DSIBaseStep.prototype.notifyActionsChange = function () {
    this.wizard.stepCtrl.updateActions();
};

/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSISourceInputFragment(wizard) {
    DSIBaseStep.call(this, wizard);
    for (var key in this) {
        if (key.startsWith('ev_')) {
            this[key] = this[key].bind(this);
        }
    }
}

mixClass(DSISourceInputFragment, DSIBaseStep);

DSISourceInputFragment.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard-step asi-active',
        attr: { 'data-step': '0' },
        child: {
            class: 'asi-panel',
            child: [
                { tag: 'h2', child: { text: 'Nhập dữ liệu nguồn' } },
                {
                    tag: 'p',
                    class: 'asi-muted',
                    child: { text: 'Dán dữ liệu từ clipboard hoặc nhập tệp  TXT, XLSX.' }
                },
                {
                    class: 'asi-dropzone',
                    id: 'dropzone',
                    child: [
                        { class: 'asi-dropzone-icon', child: { text: '⇩' } },
                        {
                            class: 'asi-dropzone-title',
                            child: { text: 'Kéo thả tệp TXT, XLSX hoặc dán từ clipboard' }
                        },
                        {
                            class: 'asi-muted',
                            child: { text: 'Ctrl + V / ⌘ + V để dán nhanh dữ liệu bảng' }
                        },
                        {
                            class: 'asi-dropzone-actions',
                            child: [
                                {
                                    class: 'asi-action',
                                    attr: { 'data-action': 'paste-clipboard' },
                                    child: {
                                        tag: FlexiconButton,
                                        class: 'asi-btn',
                                        style: {
                                            size: 'regular',
                                            variant: 'secondary'
                                        },
                                        id: 'pasteButton',
                                        props: {
                                            icon: 'span.mdi.mdi-content-paste',
                                            text: 'Dán từ clipboard'
                                        }
                                    }
                                },
                                {
                                    class: 'asi-action',
                                    attr: { 'data-action': 'select-file' },
                                    child: [
                                        {
                                            tag: FlexiconButton,
                                            style: {
                                                size: 'regular',
                                                variant: 'primary',
                                            },
                                            id: 'fileButton',
                                            props: {
                                                icon: 'span.mdi.mdi-file-upload',
                                                text: 'Chọn tệp dữ liệu'
                                            }
                                        },
                                        {
                                            tag: 'input',
                                            id: 'fileInput',
                                            attr: { type: 'file', accept: '.html,.txt,.xlsx', hidden: '' }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            class: 'asi-muted',
                            child: [
                                { text: 'Hỗ trợ .txt, .xlsx và bảng sao chép từ Excel.\n' },
                                'br',
                                { text: 'Đối với text (clipboard/file), mỗi cell cách nhau bằng dấu tab.' }
                            ]
                        }
                    ]
                },
                {
                    class: 'asi-note',
                    id: 'sourceStatus',
                    child: { text: 'Không có dữ liệu.' }
                }
            ]
        }
    });
    this.$pasteBtn = $('[data-action="paste-clipboard"] button', this.$view);
    this.$fileBtn = $('[data-action="select-file"] button', this.$view);
    this.$fileInput = $('[data-action="select-file"] input', this.$view);
    this.$pasteBtn.on('click', this.ev_clickPaste);
    this.$fileBtn.on('click', this.ev_clickFile);
    this.$fileInput.on('change', this.ev_fileChange);
    this.$note = $('.asi-note', this.$view);
};

DSISourceInputFragment.prototype.onResume = function () {
    this.wizard.$view.on('paste', this.ev_paste);

};


DSISourceInputFragment.prototype.onPause = function () {
    this.wizard.$view.off('paste', this.ev_paste);
};

DSISourceInputFragment.prototype.canNext = function () {
    return !!this.wizard.data.excelData;
};

DSISourceInputFragment.prototype.handleExcelData = function (excelData) {
    var text;
    if (isEmptyExcelData(excelData)) {
        text = 'Không có dữ liệu.';
        this.wizard.data.excelData = null;
    }
    else {
        if (excelData.sheets.length === 1) {
            text = `${excelData.name || '*'} - ${excelData.sheets[0].data.length} cell`;
        }
        else {
            text = `${excelData.name || '*'} - ${excelData.sheets.length} sheet`;
        }
        this.wizard.data.excelData = excelData;
    }
    this.$note.innerText = text.trim();
    this.notifyActionsChange();
};


DSISourceInputFragment.prototype.ev_paste = function (event) {
    var syncs = [];
    var files = event.clipboardData.files;
    var file, sync;
    for (var i = 0; i < files.length; i++) {
        file = files[i];
        if (file.type === 'text/plain') {
            sync = file.text().then(text => textToExcelData(text));
        }
        else if (file.type.includes('html')) {
            sync = file.text().then(text => htmlToExcelData(text));
        }
        else if (file.type.includes('openxml')) {
            sync = fileXlsxToExcelData(file);
        }
        if (sync)
            syncs.push(sync);
    }

    Promise.all(syncs).then(res => {
        res = res.filter(r => !isEmptyExcelData(r));
        this.handleExcelData(res[0]);
    });
};

DSISourceInputFragment.prototype.ev_clickPaste = function () {
    if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
        if (!document.activeElement ||
            (document.activeElement !== this.wizard.$view && !this.wizard.$view.contains(document.activeElement))

        )
            this.wizard.$view.focus();
        document.execCommand('paste');
    }
    else {
        navigator.clipboard.read().then(items => {
            var item, i, j;
            var syncs = [], sync, type;
            for (i = 0; i < items.length; i++) {
                item = items[i];
                for (j = 0; j < item.types.length; ++j) {
                    type = item.types[j];
                    sync = item.getType(type);
                    if (type === 'text/html') {
                        sync = sync.then(blob => blob.text())
                            .then(html => htmlToExcelData(html))
                            .then(res => res ? Object.assign(res, { sourceType: 'html' }) : null);
                    }
                    else if (type === 'text/plain') {
                        sync = sync.then(blob => blob.text())
                            .then(text => textToExcelData(text))
                            .then(res => res ? Object.assign(res, { sourceType: 'text' }) : null);

                    }
                    else {
                        console.log(type);
                    }
                    syncs.push(sync);

                }
            }

            Promise.all(syncs).then(res => {
                res = res.filter(r => !isEmptyExcelData(r));
                var preferred = ['xlsx', 'html', 'text']
                    .map(sourceType => res.find(r => r.sourceType === sourceType))
                    .find(r => r);
                this.handleExcelData(preferred || res[0]);
            });
        });
    }

};

DSISourceInputFragment.prototype.ev_clickFile = function () {
    this.$fileInput.click();
};


DSISourceInputFragment.prototype.ev_fileChange = function () {
    var files = this.$fileInput.files;
    if (!files.length) return;
    var file = files[0];
    var sync;
    if (file.type.includes('openxml')) {
        sync = fileXlsxToExcelData(file);
    }
    else if (file.type.includes('html')) {
        sync = file.text().then(text => htmlToExcelData(text))
    }
    else {
        sync = file.text().then(text => textToExcelData(text))
    }
    sync.then(res => {
        if (res) {
            res.name = file.name;
        }
        this.handleExcelData(res);
    })
};

function DSISheetSelectingFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSISheetSelectingFragment, DSIBaseStep);

DSISheetSelectingFragment.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard-step',
        attr: { 'data-step': '1' },
        style: {
            display: 'inline-block'
        },
        child: {
            class: 'asi-panel',
            child: [
                {
                    tag: 'h2',
                    child: { text: 'Chọn sheet làm việc' }
                },
                {
                    class: 'asi-toolbar',
                    style:{
                        justifyContent : 'flex-start',
                        gap: '10px'
                    },
                    child: [
                        {
                            class: 'asi-action',
                            attr: { 'data-action': 'select-sheet' },
                            child: {
                                tag: 'selectmenu',
                                class: 'asi-select',
                                id: 'sheetSelect',
                                props: {
                                    items: [
                                        { text: 'Nhân sự', value: 'nhan-su' }
                                    ],
                                    value: 'nhan-su'
                                }
                            }
                        },
                        {
                            tag:'label',
                            attr: { for: 'selectedAddress' },
                            child: {text: "Vùng chọn"}
                        },
                        {
                            tag:TextInput,
                            id: 'selectedAddress',
                            style:{
                                size:'regular',
                                width: '100px'
                            }
                        },
                        {
                            tag: 'span',
                            class: 'asi-muted',
                            id: 'sheetDimensions',
                            child: { text: '0 dòng × 0 cột' }
                        }
                    ]
                },
                {
                    class: 'asi-table-wrap',
                    id: 'sheetPreview'
                }
            ]
        }
    });
    this.$sheetSL = $('#sheetSelect', this.$view)
        .on('change', this.ev_onSheetSelect.bind(this));
    this.$tableCtn = $('.asi-table-wrap', this.$view);
    this.$selectedAddress = $('#selectedAddress', this.$view)
        .on('input', this.ev_onAddressChange.bind(this));
    this.$dimesionText = $('#sheetDimensions', this.$view);
}

DSISheetSelectingFragment.prototype.updateSheetList = function () {
    var excelData = this.wizard.data.excelData;//excelData will not be empty
    this.$sheetSL.items = excelData.sheets
        .map((it, i) => {
            return { text: it.name, value: i }
        });
    this.$sheetSL.value = 0;
};

DSISheetSelectingFragment.prototype.updateTable = function () {
    this.$tableCtn.clearChild();
    var sheetData = this.wizard.data.excelData.sheets[this.$sheetSL.value];
    if (!sheetData) return;
    var size = sheetData.data.reduce((ac, cr) => {
        ac.rC = Math.max(ac.rC, cr.row + (cr.rowspan || 1));
        ac.cC = Math.max(ac.cC, cr.col + (cr.colspan || 1));
        return ac;
    }, { rC: 0, cC: 0 });

    this.$selectedAddress.value = sheetData.selectedAddress ||'';


    var matrix = Array(size.rC).fill(0).map(() => Array(size.cC).fill(1).map(()=>({
        tag: 'td',
        child: {
            text: ''
        }
    })));

    sheetData.data.forEach(cr => {
        var value = cr.value;
        if (value && (typeof value === 'object')) {
            if ('result' in value) {
                value = value.result;
            }
        }
        value = value +'';
        var cell = {
            tag: 'td',
            attr: {},
            style: {},
            child: {
                text: value + ''
            },
            cellData: cr
        };
        if (value.length < 20) {
            cell.style = {
                whiteSpace: 'nowrap'
            };
        }

        if (cr.style) {
            cell.style = Object.assign({}, cell.style, cr.style);
        }

        matrix[cr.row][cr.col] = cell;
        if (cr.rowspan > 1) {
            cell.attr.rowspan = cr.rowspan;
        }
        if (cr.colspan > 1) {
            cell.attr.colspan = cr.colspan;
        }
        var i, j;
        for (i = 0; i < cr.rowspan; ++i) {
            for (j = 0; j < cr.colspan; ++j) {
                if (i === 0 && j === 0) continue;
                matrix[cr.row + i ][cr.col + j] = null;
            }
        }
    });
    var i, j, tr, td;
    var rows = [];
    for (i = 0; i < size.rC; ++i) {
        tr = _({
            tag: 'tr',
            child: [{
                tag: 'td',
                child: {text: i + 1}
            }]
        });
        for (j = 0; j < size.cC; ++j) {
            if (matrix[i][j]) {
                td = _(matrix[i][j]);
                tr.addChild(td);
                matrix[i][j].domElt = td;
            }
        }
        rows.push(tr);
    }

    var table = _({
        tag: 'table',
        class: 'asht-table-data',
        style:{
            display: 'inline-table',
            width: 'auto'
        },
        child: [
            {
                tag: 'thead',
                child: {
                    tag: 'tr',
                    child: Array(size.cC + 1).fill(0).map((u, i) => ({
                        tag: 'td',
                        child: {
                            text: i > 0 ? numberToExcelColumn(i - 1) : ''
                        }
                    }))
                }
            },
            {
                tag: 'tbody',
                child: rows
            }
        ]
    });
    this.$tableCtn.addChild(table);

    this.matrix = matrix;
    this.sheetData = sheetData;// save current data

    this.updateSelectedView();
};

DSISheetSelectingFragment.prototype.updateSelectedView = function () {
    var selectedAddress = this.$selectedAddress.value;
    var parsedAddr = parseRangeAddress2ZeroIndex(selectedAddress);
    var matrix = this.matrix;
    this.selectedMatrix = matrix
        .slice(parsedAddr.from.row, parsedAddr.to.row + 1)
        .map(row => row.slice(parsedAddr.from.col, parsedAddr.to.col + 1));
    this.wizard.data.selectedMatrix = this.selectedMatrix;

    var i, j;
    var row, cell;
    for (i = 0; i < matrix.length; i++) {
        row = matrix[i];
        for (j = 0; j < row.length; j++) {
            cell = row[j];
            if (!cell) continue;
            if (i === parsedAddr.from.row && j >= parsedAddr.from.col && j <= parsedAddr.to.col) {
                cell.domElt.addClass('asi-selected-top');
            }
            else {
                cell.domElt.removeClass('asi-selected-top');
            }

            if ((i === parsedAddr.to.row || (i < parsedAddr.to.row && i === matrix.length - 1))  && j >= parsedAddr.from.col && j <= parsedAddr.to.col) {
                cell.domElt.addClass('asi-selected-bottom');
            }
            else {
                cell.domElt.removeClass('asi-selected-bottom');
            }
            if (j === parsedAddr.from.col && i >= parsedAddr.from.row && i <= parsedAddr.to.row) {
                cell.domElt.addClass('asi-selected-left');
            }
            else {
                cell.domElt.removeClass('asi-selected-left');
            }

            if ((j === parsedAddr.to.col || (j < parsedAddr.to.col && j === row.length - 1)) && i >= parsedAddr.from.row && i <= parsedAddr.to.row) {
                cell.domElt.addClass('asi-selected-right');
            }
            else {
                cell.domElt.removeClass('asi-selected-right');
            }
        }
    }

    this.updateSheetDimensionsText();
    this.notifyActionsChange();
};

DSISheetSelectingFragment.prototype.updateSheetDimensionsText = function () {
    var matrix = this.selectedMatrix || [];
    var rowCount = matrix.length;
    var colCount = matrix.reduce((count, row) => Math.max(count, row.length), 0);
    if (!rowCount || !colCount) {
        this.$dimesionText.textContent = '0 dòng x 0 cột';
        return;
    }
    var hasMergedCell = matrix.some(row => row.some(cell => !cell));
    this.$dimesionText.textContent = rowCount + ' dòng x ' + colCount + ' cột'
        + (hasMergedCell ? ' (Có merge cell, không hợp lệ)' : '');
};



DSISheetSelectingFragment.prototype.onResume = function () {
    this.updateSheetList();
    this.updateTable();
};

DSISheetSelectingFragment.prototype.canPrevious = function () {
    return true;
};

DSISheetSelectingFragment.prototype.canNext = function () {
    return !!this.selectedMatrix && this.selectedMatrix.length > 0 && this.selectedMatrix.every(row =>
        row.length > 0 && row.every(cell => cell !== null && cell !== undefined));
};


DSISheetSelectingFragment.prototype.canPrevious = function () {
    return true;
};

DSISheetSelectingFragment.prototype.ev_onSheetSelect = function () {
    this.updateTable();
};

DSISheetSelectingFragment.prototype.ev_onAddressChange = function () {
    if (this.sheetData) {
        this.sheetData.selectedAddress = this.$selectedAddress.value;
        this.updateSelectedView();
    }
};


/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSIPrepareEditingFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSIPrepareEditingFragment, DSIBaseStep);

DSIPrepareEditingFragment.prototype.canNext = function () {
    return true;
};

DSIPrepareEditingFragment.prototype.canPrevious = function () {
    return true;
};

DSIPrepareEditingFragment.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard-step',
        attr: { 'data-step': '2' },
        child: {
            class: 'asi-panel',
            child: [
                {
                    tag: 'h2',
                    child: { text: 'Chuẩn bị và chỉnh sửa dữ liệu' }
                },
                {
                    class: 'asi-prepare-options',
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        margin: '15px 0'
                    },
                    child: [
                        {
                            tag: "checkbox",
                            id: 'includesHeader',
                            props: {
                                text: 'Dữ liệu bao gồm header',
                                checked: true
                            }
                        },
                        {
                            tag: "checkbox",
                            id: 'removeEmptyRows',
                            props: {
                                text: 'Loại bỏ các dòng trống',
                                checked: true
                            }
                        },
                        {
                            tag: "checkbox",
                            id: 'trimWhitespace',
                            props: {
                                text: 'Xóa khoảng trắng đầu/cuối',
                                checked: true
                            }
                        },
                        {
                            tag: "checkbox",
                            id: 'autoMatchListValue',
                            props: {
                                text: 'Tự động chọn chuỗi khớp nhất trong danh sách',
                                checked: false
                            }
                        }
                    ]
                },
                {
                    class: 'asi-table-wrap',
                    id: 'editableTable'
                }
            ]
        }
    });
    this.$includesHeader = $('#includesHeader', this.$view);
    this.$removeEmptyRows = $('#removeEmptyRows', this.$view);
    this.$trimWhitespace = $('#trimWhitespace', this.$view);
    this.$autoMatchListValue = $('#autoMatchListValue', this.$view);
    this.$editableTable = $('#editableTable', this.$view);
};

DSIPrepareEditingFragment.prototype.updateConfigFromView = function () {
    this.wizard.data.config = {
        includesHeader: this.$includesHeader.checked,
        removeEmptyRows: this.$removeEmptyRows.checked,
        trimWhitespace: this.$trimWhitespace.checked,
        autoMatchListValue: this.$autoMatchListValue.checked
    };
};


DSIPrepareEditingFragment.prototype.onPause = function () {
    this.updateConfigFromView();
};

/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSIColumnMappingFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSIColumnMappingFragment, DSIBaseStep);

DSIColumnMappingFragment.prototype.getPropertyNames = function () {
    console.log(this.wizard.tableEditor);
    if (!this.wizard.tableEditor.tableData)
        return [];
    var descriptors = this.wizard.tableEditor.tableData.propertyDescriptors;
    console.log(descriptors);
    return Object.keys(descriptors);
};

DSIColumnMappingFragment.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard-step',
        attr: { 'data-step': '3' },
        child: {
            class: 'asi-panel',
            child: [
                {
                    tag: 'h2',
                    child: { text: 'Ghép cột với datasheet' }
                },
                {
                    tag: 'p',
                    class: 'asi-muted',
                    child: { text: 'Chọn trường đích tương ứng với từng cột nguồn.' }
                },
                {
                    id: 'mappingList'
                }
            ]
        }
    });
};

DSIColumnMappingFragment.prototype.onResume = function () {
    console.log('getPropertyName', this.getPropertyNames())
}


/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSIDataValidationFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSIDataValidationFragment, DSIBaseStep);

DSIDataValidationFragment.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard-step',
        attr: { 'data-step': '4' },
        child: {
            class: 'asi-panel',
            child: [
                {
                    tag: 'h2',
                    child: { text: 'Kiểm tra dữ liệu' }
                },
                {
                    tag: 'p',
                    class: 'asi-muted',
                    child: { text: 'Xem lại các dòng trước khi import.' }
                },
                {
                    class: 'asi-toolbar',
                    child: [
                        {
                            id: 'validationSummary'
                        },
                        {
                            class: 'asi-action',
                            attr: { 'data-action': 'validate' },
                            child: {
                                tag: FlexiconButton,
                                style: {
                                    size: 'regular',
                                    variant: 'secondary'
                                },
                                id: 'validateButton',
                                props: {
                                    icon: 'span.mdi.mdi-refresh',
                                    text: 'Kiểm tra lại'
                                }
                            }
                        }
                    ]
                },
                {
                    class: 'asi-table-wrap',
                    id: 'validationTable'
                }
            ]
        }
    });
};


/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSIImportFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSIImportFragment, DSIBaseStep);

DSIImportFragment.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard-step',
        attr: { 'data-step': '5' },
        child: {
            class: 'asi-panel',
            child: [
                {
                    tag: 'h2',
                    child: { text: 'Đang import từng dòng' }
                },
                {
                    tag: 'p',
                    class: 'asi-muted',
                    child: { text: 'Theo dõi tiến độ và kết quả của từng dòng.' }
                },
                {
                    tag: 'progressbar',
                    id: 'progressBar',
                    props: {
                        variant: 'primary',
                        value: 0,
                        animated: true
                    }
                },
                {
                    id: 'progressText',
                    child: { text: '0%' }
                },
                {
                    class: 'asi-action',
                    attr: { 'data-action': 'start-import' },
                    style: { marginTop: '20px' },
                    child: {
                        tag: FlexiconButton,
                        style: {
                            size: 'regular',
                            variant: 'primary'
                        },
                        id: 'startImportButton',
                        props: {
                            icon: 'span.mdi.mdi-play',
                            text: 'Bắt đầu import mô phỏng'
                        }
                    }
                }
            ]
        }
    });
};


/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSIResultFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSIResultFragment, DSIBaseStep);

DSIResultFragment.prototype.createView = function () {
    this.$view = _({
        class: 'asi-wizard-step',
        attr: { 'data-step': '6' },
        child: {
            class: 'asi-panel',
            child: [
                {
                    tag: 'h2',
                    child: { text: 'Kết quả import' }
                },
                {
                    id: 'resultSummary'
                },
                {
                    class: 'asi-table-wrap',
                    id: 'resultTable'
                },
                {
                    class: 'asi-action',
                    attr: { 'data-action': 'retry-failed' },
                    style: { marginTop: '20px' },
                    child: {
                        tag: FlexiconButton,
                        style: {
                            size: 'regular',
                            variant: 'primary'
                        },
                        id: 'retryButton',
                        props: {
                            icon: 'span.mdi.mdi-refresh',
                            text: 'Thử lại các dòng lỗi'
                        }
                    }
                }
            ]
        }
    });
};
