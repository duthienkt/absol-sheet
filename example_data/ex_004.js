export default {
    exampleTitle: "Các loại khác",
    propertyNames: [
        'date_time_type',
        'date_time_text',
        'time'
    ],
    propertyDescriptors: {
        date_time_type: {
            type: "DateTime",
            text: "Ngày giờ",
            onchange:"{{console.log(this,date_time_type)}}"
        },
        date_time_text: {
            type: 'text',
            text: "Ngày giờ trong JSON",
            calc: "= JSON.stringify(date_time_type)"
        },
        time:{
            type:'time',
            text:"Giờ"
        }
    },
    records: [
        {
            date_time_type: new Date(),
            time: 234
        },
        {
            time: 232
        }
    ]
}
