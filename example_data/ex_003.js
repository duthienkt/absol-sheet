export default {
    exampleTitle: "Bất đồng bộ",
    propertyNames: [
        'department',
        'staff',
        'KPI',
        'lock'
    ],
    propertyDescriptors: {
        department: {
            text: "Bộ phận",
            type: 'TreeEnum',
            items:'= data_module.load_department(this.fragment)',
            readOnly: '= lock'
        },
        staff: {
            type: 'enum',
            text: "Nhân viên",
            items:'= data_module.load_staff_by_org(this, department)',
            readOnly: '= lock'
        },
        KPI:{
            type:'{enum}',
            items:'= data_module.load_kpi_list(this.fragment)',
            readOnly: '= lock'
        },
        lock:{
            type: 'bool',
            text:"Hoàn thành"
        }
    },
    records: [
        {
            "department": 1392,
            "staff": 699,
            "KPI": [
                63,
                6,
                61
            ],
            "lock": true
        },
        {
            "KPI": [
                42
            ],
            "department": 1393,
            "staff": 708,
            "lock": true
        },
        {
            "KPI": [
                64,
                63,
                54
            ],
            "department": 1400,
            "staff": 718
        }
    ]
}// còn 5p