export default {
    exampleTitle: "Sử dụng công thức",
    opt: { readOnly: false },
    propertyNames: [
        'full_name',
        'last_name',
        'mid_name',
        'first_name',
        'birthday',
        'this_year_birthday',
        'old',
        'old_after',
        'is_young',
        'married',
        'note',
        'salary',
        'dayAlive'
    ],
    propertyDescriptors: {
        full_name: {
            type: 'text',
            text: 'Họ và tên',
            defaultValue: '= "No Name "+ new Date().getTime()'
        },
        last_name: {
            text: 'Họ',
            type: 'text',
            calc: '= full_name && full_name.split(/\\s+/).shift()'
        },
        first_name: {
            text: 'Tên',
            type: 'text',
            calc: '= full_name && full_name.split(/\\s+/).pop()'
        },
        mid_name: {
            type: 'text',
            text: 'Tên đệm',
            calc: '{{if(!full_name) return undefined;' +
                'var ws =  full_name.split(/\\s+/); ws.shift(); ws.pop(); RET =  ws.join(" ");}}'
        },
        birthday: {
            type: 'Date',
            text: 'Ngày sinh',
            max: '= TODAY()',
            required: true,
            defaultValue: new Date(1995, 0, 1)
        }
        ,
        this_year_birthday: {
            type: 'Date',
            calc: '= birthday &&  DATE(YEAR(NOW()), MONTH(birthday), DAY(birthday))',
            text: 'Sinh nhật năm nay'
        }
        ,
        is_young: {
            type: 'bool',
            text: "Trẻ em",
            calc: '= !isNaN(old) && old < 18  '
        }
        ,
        old: {
            type: 'number',
            text: 'Tuổi hiện tại',
            calc: '= YEAR(NOW()) - YEAR(birthday)'
        }
        ,
        old_after: {
            type: 'number',
            text: 'Tuổi năm sau',
            calc: '= old + 1'
        },
        married: {
            text: "Đã lập gia đình",
            type: 'bool',
            defaultValue: false
        },
        salary: {
            type: 'number',
            text: 'Lương',
            format: {
                locales: 'vi-VN',
                style: 'currency',
                currency: 'VND'
            },
            defaultValue: 10000000
        },
        note: {
            type: 'text',
            text:
                'Ghi chú',
            calc:
                '{{ ' +
                'if (!married && old > 24){' +
                '    if (old <= 27) RET = "Đang bị ế";' +
                '    else RET = "Áp lực quá"' +
                '}' +
                'else if(old < 18 && married) RET = "Chưa đủ tuổi kết hôn"' +
                '}}'// hàm nhiều bước dùng {{ để bắt đầu và }} để kết thúc
        },
        dayAlive: {
            type: 'number',
            text: "Số ngày",
            calc: '= DATEDIF(birthday, TODAY(),"D")'
        }
    },
    records: [
        { full_name: 'Nguyễn Văn An', birthday: new Date(1996, 5, 19), salary: 30000000 },
        { full_name: 'Trần Đức Tân', salary: 25000000 },
        { full_name: 'Phan Bá Quân', married: true, salary: 32000000 }
    ]
}