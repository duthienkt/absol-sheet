var languageTexts = {
    vi: {
        cut: 'Cắt',
        copy: 'Sao chép',
        'delete': 'Xóa hàng',
        paste: 'Dán',
        addRowBefore: 'Thêm hàng trước',
        addRowAfter: 'Thêm hàng sau',
    },
    en: {
        cut: 'Cut',
        copy: 'Copy',
        'delete': 'Delete Row',
        paste: 'Paste',
        addRowBefore: 'Add Row Before',
        addRowAfter: 'Add Row After',
    }
};

var getCode = ()=>{
    var code;
    if (window.LanguageModule) code = window.LanguageModule.code;
    if (!code) code = navigator.language;
    if (!code) code = 'en';
    code = code.toLowerCase();
    if (['vi', 'vn'].indexOf(code)>=0) code = 'vi';
    return code;
}

var mlTextOf = (key)=>{
    var code = getCode();
    var text = languageTexts[code] && languageTexts[code][key];
    if (text) return text;
    return languageTexts.en[key];
}

var TECommandDescriptors = {
    cut: {
        type: 'trigger',
        icon: 'span.mdi.mdi-content-cut',
        desc: 'Cut',
        bindKey: { win: 'Ctrl-X', mac: 'TODO?' }
    },
    copy: {
        type: 'trigger',
        icon: 'span.mdi.mdi-content-copy',
        desc: 'Copy',
        bindKey: { win: 'Ctrl-C', mac: 'TODO?' }
    },
    delete: {
        type: 'trigger',
        icon: 'span.mdi.mdi-table-row-remove',
        desc: mlTextOf('delete'),
        bindKey: { win: 'Delete', mac: 'TODO?' }
    },
    paste: {
        type: 'ribbon',
        desc: 'Paste',
        icon: 'span.mdi.mdi-content-paste',
        items: [
            {
                text: 'Paste In',
                icon: 'span.mdi.mdi-content-paste',
            },
            {
                text: 'Paste Before',
                icon: 'span.mdi.mdi-content-paste',
                args: ['BEFORE']
            },
            {
                text: 'Paste After',
                icon: 'span.mdi.mdi-content-paste',
                args: ['AFTER']
            }
        ]
    },
    addRowBefore:{
        type: 'trigger',
        icon:"span.mdi.mdi-table-row-plus-before",
        desc: mlTextOf('addRowBefore'),
    },
    addRowAfter:{
        type: 'trigger',
        icon:"span.mdi.mdi-table-row-plus-after",
        desc: mlTextOf('addRowAfter'),
    },
    export: {
        type: 'trigger',
        icon: 'span.mdi.mdi-file-export',
        desc: 'Xuất file',
        bindKey: { win: 'Ctrl-E', mac: 'TODO?' }
    }
};


export default TECommandDescriptors;