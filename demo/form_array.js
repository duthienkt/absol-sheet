var data = require('../example_data/ex_001.js');
console.log(data)
var editor = new absol.sheet.FormArrayEditor({
    elt:  absol.$('.editor-ctn')
});
editor.getView().addTo(document.body);
editor.setData(data);