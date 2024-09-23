module.exports =  {
    exampleTitle: "Min max ngày tháng",
    propertyNames: [
        "id",
        'start_date',
        'end_date',
        'duration',
        'status'
    ],
    propertyDescriptors: {
        id:{
          type:'unique<string>',
          text:"Mã"
        },
        start_date: {
            text: "Ngày bắt đầu",
            type: 'Date',
            max: '= end_date',
            readOnly:'= status > 0',
            required: true
        },
        end_date: {
            type: 'Date',
            text: "Ngày kết thúc",
            min: '= start_date',
            readOnly:'= status > 1',
            required: true
        },
        duration: {
            type: 'number',
            text: "Thời gian",
            calc: '= DATEDIF(start_date, end_date, "D")'
        },
        status: {
            text: 'Tình trạng',
            type: 'enum',
            readOnly:'= !start_date || !end_date',
            items: [{ text: 'Chưa làm', value: 0 }, { text: "Đang làm", value: 1 }, { text: "Hoàn thành", value: 2 }]
        }
    },
    records: [
        {
            "start_date": "2010-11-11T17:00:00.000Z",
            "end_date": "2010-12-28T17:00:00.000Z",
            "duration": 47,
            "status": 1
        },
        {
            "duration": 14,
            "status": 0,
            "start_date": "2021-07-22T17:00:00.000Z",
            "end_date": "2021-08-05T17:00:00.000Z"
        }
    ]
};