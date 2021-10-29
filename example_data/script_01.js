var _ = absol._;
var $ = absol.$;
var TableEditor = absol.sheet.TableEditor;
var data = {
    exampleTitle: "Các loại khác",
    propertyNames: [
        "_47_choose_company",
        "_47_choose_department",
        '_47_choose_employee'
    ],
    propertyDescriptors: {
        _47_choose_company: {
            type: 'enum',
            items: '= form_module.tag2OnCreated.member_of_employee_choose_company(this.table)',
            text: "Công ty"
        },
        _47_choose_department: {
            type: "TreeEnum",
            items: '= form_module.tag2OnCreated.member_of_employee_choose_department(this.table, _47_choose_company)',
            text: "Bộ phận"
        },
        _47_choose_employee: {
            type:'enum',
            items: '= form_module.tag2OnCreated.member_of_employee_by_departmentid(_47_choose_department)',
            text: "Nhân viên"
        }
    },
    records: [
        {
            _47_choose_department: 19,
            _47_choose_employee: 7,
            _47_choose_company: 9
        },
        {
            _47_choose_department: 18,
            _47_choose_company: 9,
            _47_choose_employee: 0
        },
        {
            _47_choose_department: 17,
            _47_choose_employee: 6,
            _47_choose_company: 16
        }
    ]
}


var table = new TableEditor();
var demoDiv = _({
    style: {
        left: '10px',
        top: '10px',
        padding: '5px',
        position: 'fixed',
        backgroundColor: 'white', zIndex: 1000000
    },
    child: table.getView()
});

demoDiv.addTo(document.body);

table.setData(data);

absol.ResizeSystem.update()
