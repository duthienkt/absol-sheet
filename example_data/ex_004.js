export default {
    exampleTitle: "Các loại khác",
    propertyNames: [
        'date_time_type',
        'date_time_text'
    ],
    propertyDescriptors: {
        date_time_type: {
            type: "DateTime",
            text: "Ngày giờ"
        },
        date_time_text: {
            type: 'text',
            text: "Ngày giờ trong JSON",
            calc: "= JSON.stringify(date_time_type)"
        }
    },
    records: [
        {
            date_time_type: new Date()
        }
    ]
}