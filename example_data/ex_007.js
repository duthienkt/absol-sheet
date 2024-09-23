module.exports = {
    name: "4",
    id: "Q9LbVRShJfCvu7BJ",
    propertyNames: [
        "type_1_1651227307699",
        "type_1_1651227314730",
        "type_1_1651227330287",
        "type_1_1651227352837"
    ],
    propertyDescriptors: {
        type_1_1651227307699: {
            type: "Date",
            text: "Ngày phát sinh",
            required: true
        },
        type_1_1651227314730: {
            type: "enum",
            emptyValue: 0,
            text: "Nhãn hiệu",
            items: [
                {
                    text: "-- Chọn giá trị --",
                    value: 0
                },
                {
                    text: "Tiền Phong",
                    value: "type_1_1651227035533"
                },
                {
                    text: "Dismy",
                    value: "type_1_1651227050181"
                },
                {
                    text: "Vesbo",
                    value: "type_1_1651227058116"
                },
                {
                    text: "Tân Á",
                    value: "type_1_1651227066869"
                },
                {
                    text: "Asico",
                    value: "type_1_1651227073850"
                },
                {
                    text: "Đệ Nhất",
                    value: "type_1_1651227085679"
                },
                {
                    text: "Bình Minh",
                    value: "type_1_1651227093141"
                },
                {
                    text: "Hoa Sen",
                    value: "type_1_1651227096208"
                },
                {
                    text: "Dekko",
                    value: "type_1_1651227108898"
                },
                {
                    text: "Sino",
                    value: "type_1_1651227115627"
                },
                {
                    text: "ERP",
                    value: "type_1_1651227122159"
                },
                {
                    text: "Khác",
                    value: "type_1_1651227134847"
                }
            ],
            required: true
        },
        type_1_1651227330287: {
            type: "enum",
            emptyValue: 0,
            text: "Sản phẩm",
            items: [
                {
                    text: "-- Chọn giá trị --",
                    value: 0
                },
                {
                    text: "PVC",
                    value: "type_1_1651227179076"
                },
                {
                    text: "PP-R",
                    value: "type_1_1651227182306"
                },
                {
                    text: "HDPE",
                    value: "type_1_1651227192307"
                }
            ],
            required: true
        },
        type_1_1651227352837: {
            type: "number",
            text: "Số tiền (Đã chiết khấu, trước VAT, VNĐ)",
            required: true,
            format: {
                maximumFractionDigits: 20,
                minimumFractionDigits: 0
            }
        },
    },

    records: [
        {
            type_1_1651227307699: new Date(1682096400000),
            type_1_1651227314730: "type_1_1651227035533",
            type_1_1651227330287: "type_1_1651227179076",
            type_1_1651227352837: 6000000
        },
        {
            type_1_1651227307699: new Date(1687798800000),
            type_1_1651227314730: "type_1_1651227035533",
            type_1_1651227330287: "type_1_1651227182306",
            type_1_1651227352837: 4000000
        },
        {
            type_1_1651227307699: new Date(1687798800000),
            type_1_1651227314730: "type_1_1651227035533",
            type_1_1651227330287: "type_1_1651227192307",
            type_1_1651227352837: 2000000
        },
        {
            type_1_1651227307699: new Date(1687798800000),
            type_1_1651227314730: "type_1_1651227093141",
            type_1_1651227330287: "type_1_1651227182306",
            type_1_1651227352837: 2000000
        },
        ...Array(100).fill(0).map((_, i) => ({
            type_1_1651227307699: new Date(1687798800000 + i * 86400000),
            type_1_1651227314730: "type_1_1651227035533",
            type_1_1651227330287: "type_1_1651227179076",
            type_1_1651227352837: 6000000
        }))
    ]
  }