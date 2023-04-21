import {_} from "../dom/SCore";
import Dom from "absol/src/HTML5/Dom";
import '../../css/dialogs.css';

export function selectRowHeight(opt) {
    var okBtn = _({
        tag: 'button',
        style: {
            display: 'block',
            width: '80px'
        },
        child: { text: "OK" }
    });
    var cancelBtn = _({
        tag: 'button',
        style: {
            display: 'block',
            width: '80px',
            marginTop: '5px'
        },
        child: { text: "Cancel" }
    });
    var valueInput = _({
        tag: 'input',
        attr: {
            type: 'number',
            step: '0.5',
            min: '0',
            value: opt.value + ''
        },
        style: {
            marginLeft: '5px',
            width: '50px'
        },
    });

    var standardCBx = _('checkboxbutton')
        .on('change', function (event) {
            if (this.checked) {
                valueInput.value = opt.standard;
            }
        });


    var windowElt = _({
        tag: 'onscreenwindow',
        class: ['asht-window', 'asht-select-row-width-window'],
        style: {
            top: '30vh',
            left: '30vw',
            width: '250px',
            height: '85px'
        },
        props: {
            windowTitle: 'Row Height',
            windowIcon: 'span.mdi.mdi-table-row-height'
        },
        child: {
            class: 'asht-select-row-width-window-content',
            style: { whiteSpace: 'nowrap' },
            child: [
                {
                    style: {
                        verticalAlign: 'top',
                        display: 'inline-block'
                    },
                    child: [
                        {
                            child: [
                                { tag: 'span', child: { text: "Row Height:" } },
                                valueInput
                            ]
                        },
                        {
                            child: [
                                standardCBx,
                                {
                                    tag: 'span',
                                    style: {
                                        marginLeft: '5px',
                                    },
                                    child: { text: 'Standard Height' }
                                }
                            ]
                        }
                    ]
                },
                {
                    style: {
                        verticalAlign: 'top',
                        display: 'inline-block',
                        marginLeft: '10px'
                    },
                    child: [
                        okBtn,
                        cancelBtn
                    ]
                }
            ]
        }
    });

    var blinkTO = -1;
    var modal = _({
        class: 'asht-modal',
        child: windowElt,
        on: {
            mousedown: function () {
                if (blinkTO >= 0) clearTimeout(blinkTO);
                windowElt.removeClass('as-blink')
            },
            click: function (event) {
                if (event.target === this) {
                    windowElt.addClass('as-blink');
                    blinkTO = setTimeout(function () {
                        blinkTO = -1;
                        windowElt.removeClass('as-blink');
                    }, 1000);
                }
            }
        }
    });
    modal.addTo(document.body);


    return new Promise(function (resolve, reject) {
        okBtn.once('click', function () {
            modal.remove();
            resolve(parseFloat(valueInput.value));
        });
        cancelBtn.once('click', function () {
            modal.remove();
            reject();
        });
    });
}