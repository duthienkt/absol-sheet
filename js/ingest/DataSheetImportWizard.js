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
import { fileXlsxToExcelData, htmlToExcelData, isEmptyExcelData, textToExcelData } from "./DSIHelpers";
import { openFileDialog } from "absol-acomp/js/utils";

/**
 * @extends Fragment
 * @constructor
 */
function DataSheetImportWizard() {
    Fragment.call(this);
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
        if (key[0] === '$') {
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
    this.$timeline.value = index;
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
            text = `${excelData.name || ''} - ${excelData.sheets[0].data.length} cell`;
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
                this.handleExcelData(res[0]);
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
        child: {
            class: 'asi-panel',
            child: [
                {
                    tag: 'h2',
                    child: { text: 'Chọn sheet làm việc' }
                },
                {
                    class: 'asi-toolbar',
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
}


/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSIPrepareEditingFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSIPrepareEditingFragment, DSIBaseStep);

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
                    class: 'asi-toolbar',
                    child: [
                        {
                            class: 'asi-action',
                            attr: { 'data-action': 'choose-header' },
                            child: {
                                tag: 'label',
                                child: [
                                    { text: 'Dòng tiêu đề: ' },
                                    {
                                        tag: 'selectmenu',
                                        class: 'asi-select',
                                        id: 'headerRow',
                                        props: {
                                            items: [
                                                { text: 'Dòng 1', value: 0 },
                                                { text: 'Dòng 2', value: 1 },
                                                { text: 'Dòng 3', value: 2 }
                                            ],
                                            value: 0
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            class: 'asi-action',
                            attr: { 'data-action': 'add-row' },
                            child: {
                                tag: FlexiconButton,
                                style: {
                                    size: 'regular',
                                    variant: 'secondary'
                                },
                                id: 'addRowButton',
                                props: {
                                    icon: 'span.mdi.mdi-plus',
                                    text: 'Thêm dòng'
                                }
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
};


/**
 * @extends DSIBaseStep
 * @constructor
 */
function DSIColumnMappingFragment(wizard) {
    DSIBaseStep.call(this, wizard);
}

mixClass(DSIColumnMappingFragment, DSIBaseStep);

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
