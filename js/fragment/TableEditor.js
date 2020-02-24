import '../../css/tableeditor.css';
import SComp from "../dom/SComp";
import TableData from "../viewer/TableData";

var _ = SComp._;
var $ = SComp.$;


function TableEidtor() {
    this.ev_wheel = this.ev_wheel.bind(this);
    this.ev_mosemove = this.ev_mosemove.bind(this);
    this.ev_forcegroundMouseDown = this.ev_forcegroundMouseDown.bind(this);
    this.ev_scrollBody = this.ev_scrollBody.bind(this);
    this.hoverRow = null;
    this.editingData = null;
    this.selectedData = null;
}


TableEidtor.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _({
        class: 'asht-table-editor',
        child: [
            'bscroller.asht-table-editor-body',
            {
                class: 'asht-table-editor-forceground',
                child: [
                    {
                        tag: 'table',
                        class: ['asht-table-editor-header', 'asht-table-data'],
                        child: {
                            tag: 'thead',
                            child: 'tr'
                        }
                    },
                    '.asht-table-editor-editing-box',
                    '.asht-table-editor-selected-box'
                ]
            }
        ]
    });

    this.$body = $('.asht-table-editor-body', this.$view);
    this.$body.on('scroll', this.ev_scrollBody);
    this.$forceground = $('.asht-table-editor-forceground', this.$view);
    this.$forceground.on('mousedown', this.ev_forcegroundMouseDown);
    this.$editingbox = $('.asht-table-editor-editing-box', this.$forceground).addStyle('display', 'none');
    this.$selectedbox = $('.asht-table-editor-selected-box', this.$forceground).addStyle('display', 'none');
    this.$view.on('wheel', this.ev_wheel)
        .on('mousemove', this.ev_mosemove);

    this.$header = $('.asht-table-editor-header', this.$view);
    this.$headRow = $('tr', this.$header);
    return this.$view;
};



TableEidtor.prototype.setData = function (data) {
    this.$body.clearChild();
    var tableData = new TableData(this);
    tableData.getView().addTo(this.$body);
    tableData.import(data);
    this.tableData = tableData;
    this.loadHeader();
};


TableEidtor.prototype.getData = function () {

};

TableEidtor.prototype.scrollYBy = function (dy) {
    if (this.$body.scrollTop + dy > this.$body.scrollHeight - this.$body.offsetHeight) {
        dy = this.$body.scrollHeight - this.$body.offsetHeight - this.$body.scrollTop;
    }
    else if (this.$body.scrollTop + dy < 0) {
        dy = - this.$body.scrollTop;
    }
    this.$body.scrollTop += dy;
    return dy;
};



TableEidtor.prototype.ev_wheel = function (ev) {
    var dy = this.scrollYBy(ev.deltaY);
    if (dy != 0) ev.preventDefault();
};

TableEidtor.prototype.ev_scrollBody = function () {
    this.updateEditingBoxPosition();
    this.updateSelectedPosition();
};



TableEidtor.prototype.ev_mosemove = function (ev) {
    if (!this.tableData) return;
    var x = ev.clientX;
    var y = ev.clientY;
    var now = new Date().getTime();
    this.hoverRow = this.tableData.findRowByClientY(y);
    this.hoverCol = this.tableData.findColByClientX(x);
};

TableEidtor.prototype.ev_forcegroundMouseDown = function (ev) {
    if (ev.target == this.$forceground) {
        if (this.hoverRow) {
            if (this.hoverCol) {
                this.editCell(this.hoverRow, this.hoverCol);
                this.selectRow(null);
            }
            else {
                this.selectRow(this.hoverRow);
                this.editCell(this.hoverRow, this.tableData.headCells[0]);

            }
        }
        else {
            if (this.hoverCol) {
                this.selectCol(this.hoverCol);
                var firsRow = this.tableData.findRowByIndex(0);
                if (firsRow)
                    this.editCell(firsRow, this.hoverCol);
            }
        }
    }
};

TableEidtor.prototype.editCell = function (row, col) {
    if (row && col) {
        this.$editingbox.removeStyle('display');
        this.editingData = {
            row: row,
            col: col
        };
        this.updateEditingBoxPosition();
    }
    else {
        this.$editingbox.addStyle('display', 'none');
        this.editingData = null;
    }
};


TableEidtor.prototype.updateEditingBoxPosition = function () {
    if (!this.editingData) return;
    var row = this.editingData.row;
    var col = this.editingData.col;
    var elt = row.cells[col.index].elt;
    var fBound = this.$forceground.getBoundingClientRect();
    var eBoud = elt.getBoundingClientRect();
    this.$editingbox.addStyle({
        left: eBoud.left - fBound.left - 2 + 'px',// boder-width = 2px
        top: eBoud.top - fBound.top - 2 + 'px',
        'min-width': eBoud.width + 4 + 'px',
        'min-height': eBoud.height + 4 + 'px'
    });
};



TableEidtor.prototype.selectRow = function (row) {
    if (row) {
        this.selectedData = {
            type: 'row',
            row: row
        };
        this.$selectedbox.removeStyle('display');
        this.updateSelectedPosition();
    }
    else {
        // this.$selectrow
        this.selectedData = null;
        this.$selectedbox.addStyle('display', 'none');
    }
};

TableEidtor.prototype.selectCol = function (col) {
    if (col) {
        this.selectedData = {
            type: 'col',
            col: col
        };
        this.$selectedbox.removeStyle('display');
        this.updateSelectedPosition();
    }
    else {
        // this.$selectrow
        this.selectedData = null;
        this.$selectedbox.addStyle('display', 'none');
    }
};



TableEidtor.prototype.updateSelectedPosition = function () {
    if (!this.selectedData) return;
    var fBound = this.$forceground.getBoundingClientRect();
    if (this.selectedData.row) {
        var row = this.selectedData.row;
        var rBound = row.elt.getBoundingClientRect();
        this.$selectedbox.addStyle({
            left: rBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: rBound.top - fBound.top - 1 + 'px',
            'min-width': rBound.width + 2 + 'px',
            'min-height': rBound.height + 2 + 'px'
        });
        this.$header.addStyle('z-index', '21');
    }
    else if (this.selectedData.col) {
        var col = this.selectedData.col;
        var cBound = col.elt.getBoundingClientRect();
        var tBount = col.elt.parentElement.parentElement.parentElement.getBoundingClientRect();
        this.$selectedbox.addStyle({
            left: cBound.left - fBound.left - 1 + 'px',// boder-width = 2px
            top: tBount.top - fBound.top - 1 + 'px',
            'min-width': cBound.width + 2 + 'px',
            'min-height': tBount.height + 2 + 'px'
        });
        this.$header.addStyle('z-index', '19');
    }
};

TableEidtor.prototype.loadHeader = function () {
    var thisEditor = this;

    var $headRow = this.$headRow;
    Array.prototype.forEach.call(this.tableData.$headRow.children, function (td, index) {
        var newTd = $(td.cloneNode(true));
        newTd.$originElt = td;
        newTd.__index__ = index - 1;
        newTd.on('mousedown', function (event) {
            var col = thisEditor.tableData.findColByIndex(index - 1);
            var row = thisEditor.tableData.findRowByClientY(this.getBoundingClientRect().bottom - 2);

            if (col) {
                thisEditor.selectCol(col);
                var nextRow = row ? thisEditor.tableData.findRowByIndex(row.index + 1) : thisEditor.tableData.findRowByIndex(0);
                if (nextRow)
                    thisEditor.editCell(nextRow, col);
            }
        });
        $headRow.addChild(newTd);
    });
    this.updateHeaderPosition();
};


TableEidtor.prototype.updateHeaderPosition = function () {
    Array.prototype.forEach.call(this.$headRow.children, function (td) {
        var originTd = td.$originElt;
        var bound = originTd.getBoundingClientRect();
        td.addStyle({
            width: bound.width + 'px'
        })
    });
};




var mSE = new TableEidtor();
mSE.getView().addTo(document.body);

var ct = _('contextcaptor').addTo(document.body);
ct.attachTo(document.body)

var sheetText = `1||12123097||Lê Thị Hoài An||DH12KE||Kế toán||Thứ 3_ tiết 1||1
2||11145043||Phạm Tuấn Anh||DH11BV||Bảo vệ thực vật||Thứ 3_ tiết 1||2
3||12113002||Lê Thị Kim Anh||DH12NH||Nông học||Thứ 3_ tiết 1||3
4||12122098||Trần Thị Kim Anh||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 1||4
5||13113007||Nguyễn Phước Anh||DH13NH||Nông học||Thứ 3_ tiết 1||5
6||12113333||Tôn Nữ Khánh Bình||DH12NH||Nông học||Thứ 3_ tiết 1||6
7||11363115||Nguyễn Thị Ngọc Châu||CD11CA||Kế toán||Thứ 3_ tiết 1||7
8||13113023||Nguyễn Thị Ngọc Châu||DH13NH||Nông học||Thứ 3_ tiết 1||8
9||13125040||Nguyễn Ngọc Bảo Châu||DH13VT||Bảo quản chế biến NS và vi sinh thực phẩm||Thứ 3_ tiết 1||9
10||12145093||Nguyễn Hoàng Chương||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 1||10
11||10124020||Dương Biên Cương||DH10QL||Đại học chính quy (Tín chỉ)-Quản lý đất đai-2010||Thứ 3_ tiết 1||11
12||12145104||Dương Hải Đăng||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 1||12
13||12155010||Trần Thị Đào||DH12KN||Kinh doanh nông nghiệp(Quản trị kinh doanh nông nghiệp)||Thứ 3_ tiết 1||13
14||13122022||Phan Thanh Diệu||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||14
15||13120166||Mai Thị Dung||DH13KT||Kinh tế||Thứ 3_ tiết 1||1
16||13120017||Thái Văn Dũng||DH13KT||Kinh tế||Thứ 3_ tiết 1||2
17||13122038||Phạm Thị Được||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||3
18||13113037||Hà Thanh Dương||DH13NH||Nông học||Thứ 3_ tiết 1||4
19||13122032||Nguyễn Thị Thùy Dương||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||5
20||13116341||Huỳnh Thị Mỹ Duyên||DH13NY||Chuyên ngành Ngư y (Bệnh học thủy sản)||Thứ 3_ tiết 1||6
21||12363162||Ngô Thị Hằng||CD12CA||Kế toán||Thứ 3_ tiết 1||7
22||12155085||Lê Thị Hằng||DH12KN||Kinh doanh nông nghiệp(Quản trị kinh doanh nông nghiệp)||Thứ 3_ tiết 1||8
23||13113308||Hoàng Thúy Hằng||DH13NH||Nông học||Thứ 3_ tiết 1||9
24||13113057||Hoàng Thị Hằng||DH13NH||Nông học||Thứ 3_ tiết 1||10
25||12122131||Nguyễn Thị Ngọc Hạnh||DH12TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||11
26||13120037||Hồ Thị Hoài||DH13KT||Kinh tế||Thứ 3_ tiết 1||12
27||12113141||Trần Đình Hoàng||DH12NH||Nông học||Thứ 3_ tiết 1||13
28||13124130||Bùi Thị Huệ||DH13QL||Quản lí đất đai||Thứ 3_ tiết 1||14
29||13122057||Hồ Thị Huệ||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||1
30||12124035||Phạm Duy Hưng||DH12QD||Công nghệ Địa chính & Quản lý Đô thị||Thứ 3_ tiết 1||2
31||12113343||Trần Thị Thu Hương||DH12NH||Nông học||Thứ 3_ tiết 1||3
32||13162034||Phạm Thị Hương||DH13GI||Bản đồ học||Thứ 3_ tiết 1||4
33||13162037||Lý Hoàng Duy Khanh||DH13GI||Bản đồ học||Thứ 3_ tiết 1||5
34||13122069||Đặng Thị Kiền||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||6
35||13162042||Lê Anh Kiệt||DH13GI||Bản đồ học||Thứ 3_ tiết 1||7
36||12122159||Nguyễn Văn Thủy Lâm||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 1||8
37||12122158||Trần Thị Tuyết Lan||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 1||9
38||13122311||Đinh Thị Lan||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||10
39||13125232||Nguyễn Mai Tuyết Lê||DH13BQ||Công nghệ thực phẩm||Thứ 3_ tiết 1||11
40||13120267||Lê Thị Trúc Linh||DH13KT||Kinh tế||Thứ 3_ tiết 1||12
41||13113111||Hà Trương Hoàng Linh||DH13NH||Nông học||Thứ 3_ tiết 1||13
42||12123138||Nguyễn Tấn Thanh Lỉnh||DH12KE||Kế toán||Thứ 3_ tiết 1||14
43||13125273||Nguyễn Thị Cẩm Luyến||DH13BQ||Công nghệ thực phẩm||Thứ 3_ tiết 1||1
44||13122101||Nguyễn Thị Thanh Ngân||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||2
45||13113137||Trần Hữu Nghị||DH13NH||Nông học||Thứ 3_ tiết 1||3
46||13162056||Trần Trọng Nghĩa||DH13GI||Bản đồ học||Thứ 3_ tiết 1||4
47||12124239||Đặng Thụy Bạch Ngọc||DH12QL||Quản lí đất đai||Thứ 3_ tiết 1||5
48||12122185||Phạm Phương Nguyên||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 1||6
49||13120317||Võ Hoàng Nguyên||DH13KT||Kinh tế||Thứ 3_ tiết 1||7
50||13122109||Lê Thái Nguyên||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||8
51||13113144||Phạm Thị Nhật Nguyệt||DH13NH||Nông học||Thứ 3_ tiết 1||9
52||12113042||Trương Hoài Nhân||DH12NH||Nông học||Thứ 3_ tiết 1||10
53||12113206||Phan Công Nhân||DH12NH||Nông học||Thứ 3_ tiết 1||11
54||13162064||Hồ Ngọc Hiếu Nhơn||DH13GI||Bản đồ học||Thứ 3_ tiết 1||12
55||13124269||Huỳnh Yên Như||DH13QL||Quản lí đất đai||Thứ 3_ tiết 1||13
56||13122118||Nguyễn Thị Huỳnh Như||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||14
57||12113364||Nguyễn Thị Oanh||DH12NH||Nông học||Thứ 3_ tiết 1||1
58||11333026||Nông Thị Phượng||CD11CQ||Quản lý đất đai||Thứ 3_ tiết 1||2
59||12333422||Triệu Thị Mỹ Phượng||CD12CQ||Quản lý đất đai||Thứ 3_ tiết 1||3
60||12123043||Doãn Đình Quang||DH12KE||Kế toán||Thứ 3_ tiết 1||4
61||13124304||Đỗ Thị Thảo Quyên||DH13QL||Quản lí đất đai||Thứ 3_ tiết 1||5
62||13117120||Nguyễn Thị Quyết||DH13CT||Công nghệ Chế biến thủy sản||Thứ 3_ tiết 1||6
63||12123281||Đàng Phú Nữ Saman||DH12KE||Kế toán||Thứ 3_ tiết 1||7
64||13116609||Bùi Ngọc Sơn||DH13NT||Nuôi trồng thủy sản||Thứ 3_ tiết 1||8
65||13124324||Lưu Thị Kiên Tâm||DH13QL||Quản lí đất đai||Thứ 3_ tiết 1||9
66||13122146||Võ Thanh Tân||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||10
67||13122155||Dương Ngọc Thạch||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||11
68||12113354||Nguyễn Đức Thắng||DH12NH||Nông học||Thứ 3_ tiết 1||12
69||11113188||Đặng Vũ Hà Thanh||DH11NH||Nông học (Cây trồng & giống cây trồng)||Thứ 3_ tiết 1||13
70||12113252||Nguyễn Cao Thanh||DH12NH||Nông học||Thứ 3_ tiết 1||14
71||13120371||Đinh Thị Thiên Thanh||DH13KT||Kinh tế||Thứ 3_ tiết 1||1
72||12120021||Phạm Thị Thảo||DH12KT||Kinh tế||Thứ 3_ tiết 1||2
73||13120093||Phan Thị Thu Thảo||DH13KT||Kinh tế||Thứ 3_ tiết 1||3
74||13113199||Huỳnh Ngọc Thảo||DH13NH||Nông học||Thứ 3_ tiết 1||4
75||13162089||Nguyễn Đức Thiện||DH13GI||Bản đồ học||Thứ 3_ tiết 1||5
76||12124299||Nguyễn Hoàng Thơ||DH12QL||Quản lí đất đai||Thứ 3_ tiết 1||6
77||12122235||Nguyễn Thị Anh Thư||DH12TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||7
78||13117150||Nguyễn Thị Hồng Thư||DH13CT||Công nghệ Chế biến thủy sản||Thứ 3_ tiết 1||8
79||12120131||Lê Hữu Thuận||DH12KT||Kinh tế||Thứ 3_ tiết 1||9
80||13125496||Nguyễn Thị Thu Thủy||DH13BQ||Công nghệ thực phẩm||Thứ 3_ tiết 1||10
81||13113241||Lê Trịnh Ngọc Trâm||DH13NH||Nông học||Thứ 3_ tiết 1||11
82||13122422||Ngô Thị Hồng Trâm||DH13TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||12
83||13162096||Nguyễn Thị Thanh Trầm||DH13GI||Bản đồ học||Thứ 3_ tiết 1||13
84||11333206||Lê Thị Thùy Trang||CD11CQ||Quản lý đất đai||Thứ 3_ tiết 1||14
85||12124319||Long Thị Trang||DH12QL||Quản lí đất đai||Thứ 3_ tiết 1||1
86||12363305||Nguyễn Thị Tố Trinh||CD12CA||Kế toán||Thứ 3_ tiết 1||2
87||12113358||Đỗ Thùy Thảo Trúc||DH12NH||Nông học||Thứ 3_ tiết 1||3
88||11150025||Ngô Chí Trung||DH11TM||Chuyên ngành Quản trị kinh doanh thương mại||Thứ 3_ tiết 1||4
89||12333326||Nguyễn Văn Trường||CD12CQ||Quản lý đất đai||Thứ 3_ tiết 1||5
90||13162107||Nguyễn Thị Tú||DH13GI||Bản đồ học||Thứ 3_ tiết 1||6
91||12114067||Võ Hoàng Anh Tuấn||DH12QR||Quản lý tài nguyên rừng||Thứ 3_ tiết 1||7
92||13122212||Chế Văn Tùng||DH13QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 1||8
93||13122209||Hà Thị Thanh Tuyền||DH13QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 1||9
94||12113071||Võ Thị Bạch Tuyết||DH12NH||Nông học||Thứ 3_ tiết 1||10
95||11123057||Trần Thanh Vân||DH11KE||Kế toán||Thứ 3_ tiết 1||11
96||12131196||Nguyễn Thị Thanh Vân||DH12TK||Thiết kế cảnh quan||Thứ 3_ tiết 1||12
97||12113363||Trương Xuân Vinh||DH12NH||Nông học||Thứ 3_ tiết 1||13
98||13113273||Nguyễn Thị Tú Vy||DH13NH||Nông học||Thứ 3_ tiết 1||14
99||13124501||Phạm Thị Như ý||DH13QL||Quản lí đất đai||Thứ 3_ tiết 1||1
100||12122281||Nguyễn Thị Phi Yến||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 1||2
1||12125098||Huỳnh Thị Kim Anh||DH12BQ||Công nghệ thực phẩm||Thứ 3_ tiết 4||3
2||12131120||Đinh Thị Thúy Vân Anh||DH12TK||Thiết kế cảnh quan||Thứ 3_ tiết 4||4
3||12117002||Nguyễn Văn Bình||DH12CT||Công nghệ Chế biến thủy sản||Thứ 3_ tiết 4||5
4||12123101||Nguyễn Thị Ngọc Cẩm||DH12KE||Kế toán||Thứ 3_ tiết 4||6
5||12124005||Bạch Thị Chi||DH12QD||Công nghệ Địa chính & Quản lý Đô thị||Thứ 3_ tiết 4||7
6||12122006||Lê Thị Ngọc Cúc||DH12TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 4||8
7||12113008||Lý Minh Cường||DH12NH||Nông học||Thứ 3_ tiết 4||9
8||12145281||Trần Mạnh Đàm||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||10
9||12145004||Nguyễn Thị Thanh Đào||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||11
10||11333170||Nguyễn Thành Đạt||CD11CQ||Quản lý đất đai||Thứ 3_ tiết 4||12
11||12333064||Vũ Tài Đạt||CD12CQ||Quản lý đất đai||Thứ 3_ tiết 4||13
12||12115227||Nguyễn Viết Đạt||DH12GN||Thiết kế đồ gỗ nội thất||Thứ 3_ tiết 4||14
13||12363259||Trương Thị Lệ Diễm||CD12CA||Kế toán||Thứ 3_ tiết 4||1
14||12145280||Nguyễn Thị Thu Diễm||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||2
15||12145238||Nguyễn Nhật Điền||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||3
16||12122297||Nguyễn Thị Thanh Diệu||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 4||4
17||12123017||Nguyễn Kinh Đô||DH12KE||Kế toán||Thứ 3_ tiết 4||5
18||12145235||Nguyễn Ngọc Thanh Dương||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||6
19||12123246||Cao Thị Hà Giang||DH12KE||Kế toán||Thứ 3_ tiết 4||7
20||10134901||Nguyễn Thị Thu Hà||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||8
21||10134902||Bùi Hữu Hanh||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||9
22||12123122||Nguyễn Thị Diệu Hiền||DH12KE||Kế toán||Thứ 3_ tiết 4||10
23||12120280||Đặng Thị Hồng Huệ||DH12KT||Kinh tế||Thứ 3_ tiết 4||11
24||11139158||Nguyễn Quốc Hùng||DH11HH||Công nghệ kĩ thuật hóa học||Thứ 3_ tiết 4||12
25||12123024||Trịnh Đức Huy||DH12KE||Kế toán||Thứ 3_ tiết 4||13
26||12131003||Nguyễn Thanh Huy||DH12TK||Thiết kế cảnh quan||Thứ 3_ tiết 4||14
27||12139054||Tô Thị Diễm Huỳnh||DH12HH||Công nghệ kĩ thuật hóa học||Thứ 3_ tiết 4||1
28||12113024||Kiều Hoàng Khải||DH12NH||Nông học||Thứ 3_ tiết 4||2
29||12123028||Nguyễn Huỳnh Khuyên||DH12KE||Kế toán||Thứ 3_ tiết 4||3
30||12125410||Huỳnh Thiên Kim||DH12BQ||Công nghệ thực phẩm||Thứ 3_ tiết 4||4
31||12122285||Sơn Từ Thái Mỹ Lăng||DH12TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 4||5
32||12123132||Hồ Thị Lành||DH12KE||Kế toán||Thứ 3_ tiết 4||6
33||12123134||Hoàng Việt Liên||DH12KE||Kế toán||Thứ 3_ tiết 4||7
34||12117008||Nguyễn Văn Liết||DH12CT||Công nghệ Chế biến thủy sản||Thứ 3_ tiết 4||8
35||11145028||Nguyễn Đoàn Phụng Linh||DH11BV||Bảo vệ thực vật||Thứ 3_ tiết 4||9
36||12125027||Trần Phan Quang Minh||DH12BQ||Công nghệ thực phẩm||Thứ 3_ tiết 4||10
37||12145017||Lê Thị Hồng Minh||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||11
38||12117082||Nguyễn Hồng Minh||DH12CT||Công nghệ Chế biến thủy sản||Thứ 3_ tiết 4||12
39||12124234||Lê Thị Hoàng Nga||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||13
40||12123150||Nguyễn Thị Kim Ngân||DH12KE||Kế toán||Thứ 3_ tiết 4||14
41||12113192||Nguyễn Thị Kim Ngân||DH12NH||Nông học||Thứ 3_ tiết 4||1
42||12145147||Võ Thành Nghĩa||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||2
43||12125078||Trương Thị ánh Ngọc||DH12BQ||Công nghệ thực phẩm||Thứ 3_ tiết 4||3
44||12145149||Huỳnh Tiến Ngọc||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||4
45||12145151||Nguyễn Minh Nguyên||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||5
46||12145150||Lê Văn Nguyên||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||6
47||12123153||Nguyễn Ngọc Thảo Nguyên||DH12KE||Kế toán||Thứ 3_ tiết 4||7
48||12124243||Lý Thái Nguyên||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||8
49||12120518||Nguyễn Minh Nhật||DH12KT||Kinh tế||Thứ 3_ tiết 4||9
50||12122193||Nguyễn Thị Mai Nhi||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 4||10
51||12145158||Nguyễn Thị Quỳnh Như||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||11
52||12145021||Lê Hồng Nhung||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||12
53||12145024||Kiều Thanh Phong||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||13
54||12115007||Nguyễn Đại Phúc||DH12GN||Thiết kế đồ gỗ nội thất||Thứ 3_ tiết 4||14
55||12113225||Phan Văn Phúc||DH12NH||Nông học||Thứ 3_ tiết 4||1
56||12145062||Nguyễn Duy Phương||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||2
57||12116100||Huỳnh Thanh Phương||DH12KS||Kinh tế- quản lí nuôi trồng thủy sản||Thứ 3_ tiết 4||3
58||12145030||Nguyễn Thị Thúy Phượng||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||4
59||12120294||Nguyễn Thị Xuyên Quy||DH12KT||Kinh tế||Thứ 3_ tiết 4||5
60||12124069||Bùi Duy Quyết||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||6
61||12115302||Bùi Nguyễn Như Quỳnh||DH12GN||Thiết kế đồ gỗ nội thất||Thứ 3_ tiết 4||7
62||12114277||Nguyễn Ngọc Sơn||DH12LN||Lâm nghiệp||Thứ 3_ tiết 4||8
63||12113245||Nguyễn Thái Tài||DH12NH||Nông học||Thứ 3_ tiết 4||9
64||12115256||Trần Việt Tân||DH12GN||Thiết kế đồ gỗ nội thất||Thứ 3_ tiết 4||10
65||12122228||Phạm Thị Ngọc Thắm||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 4||11
66||09130900||Trần Bảo Thắng||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||12
67||12113055||Nguyễn Tiến Thành||DH12NH||Nông học||Thứ 3_ tiết 4||13
68||12124285||Lê Tiến Thành||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||14
69||12145034||Hồ Phạm Như Thảo||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||1
70||12123169||Nguyễn Thị Thanh Thảo||DH12KE||Kế toán||Thứ 3_ tiết 4||2
71||12122224||Nguyễn Thị Thảo||DH12TM||Quản trị kinh doanh thương mại||Thứ 3_ tiết 4||3
72||12115304||Võ Thanh Thiện||DH12GN||Thiết kế đồ gỗ nội thất||Thứ 3_ tiết 4||4
73||12145197||Ngô Văn Thịnh||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||5
74||12123052||Nguyễn Thị Kim Thư||DH12KE||Kế toán||Thứ 3_ tiết 4||6
75||12125084||Lê Thị Thanh Thúy||DH12DD||Bảo quản chế biến NSTP & dinh dưỡng người||Thứ 3_ tiết 4||7
76||13120406||Bùi Thị Thanh Thúy||DH13KT||Kinh tế||Thứ 3_ tiết 4||8
77||12155136||Nguyễn Lê Minh Thùy||DH12KN||Kinh doanh nông nghiệp(Quản trị kinh doanh nông nghiệp)||Thứ 3_ tiết 4||9
78||12122233||Phạm Thị Bích Thủy||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 4||10
79||12115305||Trần Nhật Tiến||DH12GN||Thiết kế đồ gỗ nội thất||Thứ 3_ tiết 4||11
80||12113063||Lê Trung Tiến||DH12NH||Nông học||Thứ 3_ tiết 4||12
81||12124084||Đỗ Phát Tiến||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||13
82||12124085||Nguyễn Minh Tiến||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||14
83||12122060||Trần Minh Tiến||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 4||1
84||12145038||Dương Bảo Toàn||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||2
85||12145206||Đặng Bảo Toàn||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||3
86||12333259||Trần Xuân Tôn||CD12CQ||Quản lý đất đai||Thứ 3_ tiết 4||4
87||12123095||Trần Thị Nghệ Tông||DH12KE||Kế toán||Thứ 3_ tiết 4||5
88||12145208||Nguyễn Thị Thùy Trang||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||6
89||12116139||Lại Thị Minh Trang||DH12NT||Nuôi trồng thủy sản||Thứ 3_ tiết 4||7
90||12124317||Đinh Thị Quyền Trang||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||8
91||12124330||Phạm Đăng Trình||DH12QD||Công nghệ Địa chính & Quản lý Đô thị||Thứ 3_ tiết 4||9
92||12125422||Võ Phước Trung||DH12BQ||Công nghệ thực phẩm||Thứ 3_ tiết 4||10
93||11363171||Nguyễn Hồng Trường||CD11CA||Kế toán||Thứ 3_ tiết 4||11
94||12145072||Lê Minh Tuấn||DH12BV||Bảo vệ thực vật||Thứ 3_ tiết 4||12
95||12114323||Trịnh Trọng Tùng||DH12NK||Nông lâm kết hợp||Thứ 3_ tiết 4||13
96||12124407||Bế Thị Kim Tuyến||DH12QL||Quản lí đất đai||Thứ 3_ tiết 4||14
97||12114265||Đỗ Lê Vinh||DH12NK||Nông lâm kết hợp||Thứ 3_ tiết 4||1
98||12123210||Phan Thị Thanh Xuân||DH12KE||Kế toán||Thứ 3_ tiết 4||2
99||12123219||Võ Thị Như ý||DH12KE||Kế toán||Thứ 3_ tiết 4||3
100||12122074||Nguyễn Thị Hải Yến||DH12QT||Quản trị kinh doanh(Tổng hợp)||Thứ 3_ tiết 4||4\n`;


mSE.setData({
    propertyNames: ['SID', 'Names', 'Class'],
    records: sheetText.trim().split(/[\r\n]+/).map(function (rowText) {
        var cells = rowText.trim().split(/[\|]+/);
        return { SID: cells[1], Names: cells[2], Class: cells[3] }
    })
});

export default TableEidtor;