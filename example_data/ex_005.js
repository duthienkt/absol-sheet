module.exports =  {
    exampleTitle: "Các loại khác",
    propertyNames: [
        'date_time_type',
        'value',
    ],
    propertyDescriptors: {
        date_time_type: {
            type: "DateTime",
            text: "Ngày giờ",
            onchange:"{{console.log(this,date_time_type)}}",
            required: true
        },
        value: {
            type: 'number',
            text: "Tiền",
            required: true
        }
    },
    records: [
        {date_time_type: new Date(), value: 300}
    ]
}
