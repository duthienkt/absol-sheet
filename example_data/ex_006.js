module.exports = {
    exampleTitle: "Các loại khác",
    propertyNames: [
        'type_piece_wage_table_field_name',
        'type_piece_wage_table_field_unit',
        'type_piece_wage_table_field_unit_price',
        'type_piece_wage_table_field_quantity',
        'type_piece_wage_table_field_coefficient',
        'type_piece_wage_table_field_money'
    ],
    propertyDescriptors: {
        type_piece_wage_table_field_name: {
            type: "treeleafenum",
            emptyValue: 0,
            text: "Tên",
            items: [
                {
                    value: 0,
                    text: "-- Chọn giá trị --"
                },
                {
                    value: "g_1",
                    text: "test 123",
                    items: [
                        {
                            value: 1,
                            text: "keo 123",
                            isLeaf: true
                        },
                        {
                            value: 3,
                            text: "Ba chạc chuyển bậc 90 độ phun hàn HDPE PE100",
                            isLeaf: true
                        }
                    ]
                },
                {
                    value: "g_5",
                    text: "yyyyyyyyyx",
                    items: [
                        {
                            value: 2,
                            text: "abc",
                            isLeaf: true
                        }
                    ]
                }
            ],
            required: true,
            onchange: "{{type_piece_wage_table_field_unit_price = 123; type_piece_wage_table_field_unit = 'abc'}}"
        },
        type_piece_wage_table_field_unit: {
            type: "text",
            text: "Đơn vị tính",
            required: true
        },
        type_piece_wage_table_field_unit_price: {
            type: "number",
            text: "Đơn giá",
            required: true
        },
        type_piece_wage_table_field_quantity: {
            type: "number",
            text: "Số lượng",
            required: true
        },
        type_piece_wage_table_field_coefficient: {
            type: "number",
            text: "Hệ số",
            required: true
        },
        type_piece_wage_table_field_money: {
            type: "number",
            text: "Thành tiền",
            required: true,
            calc: "= type_piece_wage_table_field_unit_price * type_piece_wage_table_field_quantity * type_piece_wage_table_field_coefficient"
        },
    },
    records: []
}
