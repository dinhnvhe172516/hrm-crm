import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Table,
  DatePicker,
  Select,
  Modal,
  Form,
  InputNumber,
  Space,
  Statistic,
  Tabs,
  Avatar,
  message,
  Descriptions,
  Popconfirm,
  Divider,
} from 'antd'
import {
  DollarOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  UserOutlined,
  EyeOutlined,
  BankOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import payrollService from '@/services/hrm/payroll.service'
import departmentService from '@/services/hrm/department.service'
import Can from '@/components/common/Can/Can'

const { Title, Text } = Typography

export default function PayrollPage() {
  const queryClient = useQueryClient()
  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [viewingPayroll, setViewingPayroll] = useState(null)
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false)
  const [calcForm] = Form.useForm()

  const currentMonthNum = selectedMonth.month() + 1
  const currentYearNum  = selectedMonth.year()

  // 1. Lấy phiếu lương của cá nhân
  const { data: myPayslip, isLoading: isLoadingMyPayslip } = useQuery({
    queryKey: ['payroll-my-payslip', currentMonthNum, currentYearNum],
    queryFn: () =>
      payrollService.getMyPayslip({
        month: currentMonthNum,
        year:  currentYearNum,
      }),
    select: (res) => res.data || null,
  })

  // 2. Lấy danh sách bảng lương toàn công ty (cho HR / Kế toán / BOD)
  const { data: allPayrollRes, isLoading: isLoadingAll } = useQuery({
    queryKey: ['payroll-all', currentMonthNum, currentYearNum, selectedDept, selectedStatus],
    queryFn: () =>
      payrollService.getAll({
        month:      currentMonthNum,
        year:       currentYearNum,
        department: selectedDept || undefined,
        status:     selectedStatus || undefined,
        limit:      100,
      }),
    select: (res) => res.data || { data: [], total: 0, totalGross: 0, totalNet: 0 },
  })

  // 3. Lấy danh sách phòng ban
  const { data: departments } = useQuery({
    queryKey: ['departments-short-payroll'],
    queryFn: () => departmentService.getAll({ limit: 100 }),
    select: (res) => res.data?.data || [],
  })

  // 4. Mutation 1-Click Tính lương tự động
  const calcMutation = useMutation({
    mutationFn: (values) =>
      payrollService.generateMonthlyPayroll({
        month:            values.month,
        year:             values.year,
        department:       values.department || undefined,
        standardWorkDays: values.standardWorkDays || 22,
      }),
    onSuccess: (res) => {
      message.success(`Đã tính toán thành công bảng lương cho ${res.data?.totalEmployees || 0} nhân sự!`)
      queryClient.invalidateQueries({ queryKey: ['payroll-all'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-my-payslip'] })
      setIsCalcModalOpen(false)
      calcForm.resetFields()
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Tính lương thất bại')
    },
  })

  // 5. Mutation Duyệt bảng lương
  const approveMutation = useMutation({
    mutationFn: (id) => payrollService.approvePayroll(id),
    onSuccess: () => {
      message.success('Đã phê duyệt bảng lương!')
      queryClient.invalidateQueries({ queryKey: ['payroll-all'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-my-payslip'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    },
  })

  // 6. Mutation Xác nhận thanh toán lương
  const payMutation = useMutation({
    mutationFn: (id) => payrollService.markAsPaid(id, { paymentMethod: 'bank_transfer' }),
    onSuccess: () => {
      message.success('Đã xác nhận chi trả lương thành công!')
      queryClient.invalidateQueries({ queryKey: ['payroll-all'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-my-payslip'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    },
  })

  const handleOpenCalcModal = () => {
    calcForm.setFieldsValue({
      month: currentMonthNum,
      year: currentYearNum,
      standardWorkDays: 22,
      department: null,
    })
    setIsCalcModalOpen(true)
  }

  const handleCalcSubmit = async () => {
    try {
      const values = await calcForm.validateFields()
      calcMutation.mutate(values)
    } catch {
      // Validate error
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Tag color="success">Đã chi trả</Tag>
      case 'approved':
        return <Tag color="processing">Đã phê duyệt</Tag>
      case 'pending_approval':
        return <Tag color="warning">Chờ duyệt</Tag>
      case 'draft':
      default:
        return <Tag color="default">Bản nháp</Tag>
    }
  }

  const payrolls = allPayrollRes?.data || []
  const totalGross = allPayrollRes?.totalGross || 0
  const totalNet = allPayrollRes?.totalNet || 0

  const allColumns = [
    {
      title: 'Nhân viên',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={record.userId?.avatar} icon={<UserOutlined />} className="bg-blue-600 font-bold shrink-0">
            {record.userId?.fullName?.charAt(0)}
          </Avatar>
          <div>
            <div className="text-sm font-semibold text-slate-800">{record.userId?.fullName}</div>
            <div className="text-xs font-mono text-slate-400">
              {record.userId?.employeeCode || record.userId?.email} · {record.userId?.department?.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Công thực tế',
      key: 'days',
      align: 'center',
      render: (_, record) => (
        <div>
          <span className="font-bold text-slate-900">{record.actualWorkDays || 0}</span>
          <span className="text-xs text-slate-400"> / {record.standardWorkDays || 22} công</span>
          {record.paidLeaveDays > 0 && (
            <div className="text-[11px] text-cyan-600 font-medium">+{record.paidLeaveDays} phép</div>
          )}
        </div>
      ),
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'salaryBase',
      key: 'salaryBase',
      align: 'right',
      render: (val) => <span className="font-mono text-xs">{(val || 0).toLocaleString('vi-VN')} ₫</span>,
    },
    {
      title: 'Tổng thu nhập (Gross)',
      dataIndex: 'grossIncome',
      key: 'grossIncome',
      align: 'right',
      render: (val) => (
        <span className="font-mono font-semibold text-slate-900 text-xs">
          {(val || 0).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Bảo hiểm & Thuế',
      key: 'deductions',
      align: 'right',
      render: (_, record) => (
        <span className="font-mono text-rose-600 text-xs">
          -{(record.deductions?.total || 0).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Thực lĩnh (Net)',
      dataIndex: 'netSalary',
      key: 'netSalary',
      align: 'right',
      render: (val) => (
        <span className="font-mono font-bold text-emerald-700 text-sm">
          {(val || 0).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setViewingPayroll(record)}
          />
          <Can I="payroll:approve">
            {record.status === 'draft' && (
              <Popconfirm
                title="Phê duyệt bảng lương"
                description={`Xác nhận duyệt bảng lương của ${record.userId?.fullName}?`}
                onConfirm={() => approveMutation.mutate(record._id)}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button size="small" type="primary" className="bg-emerald-600 hover:bg-emerald-700">
                  Duyệt
                </Button>
              </Popconfirm>
            )}
            {record.status === 'approved' && (
              <Popconfirm
                title="Xác nhận chi trả"
                description={`Đã chuyển khoản thực lĩnh ${(record.netSalary || 0).toLocaleString('vi-VN')} ₫ cho nhân sự?`}
                onConfirm={() => payMutation.mutate(record._id)}
                okText="Đã thanh toán"
                cancelText="Hủy"
              >
                <Button size="small" type="primary" className="bg-indigo-600 hover:bg-indigo-700">
                  Chi trả
                </Button>
              </Popconfirm>
            )}
          </Can>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang & Nút tính lương ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 !text-slate-900 font-bold tracking-tight">
            Quản trị Tiền lương &amp; Phúc lợi
          </Title>
          <Text className="text-slate-500 text-sm">
            Tính lương tự động từ công thực tế, tính bảo hiểm, thuế TNCN và phát hành phiếu lương
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(d) => d && setSelectedMonth(d)}
            format="MM/YYYY"
            allowClear={false}
          />

          <Can I="payroll:create">
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={handleOpenCalcModal}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm font-semibold"
            >
              Tính lương tự động
            </Button>
          </Can>
        </div>
      </div>

      {/* ── Thống kê Quỹ lương Tháng ──────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Tổng nhân sự tính lương</span>}
              value={payrolls.length}
              suffix="người"
              prefix={<TeamOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Tổng quỹ lương (Gross)</span>}
              value={totalGross}
              prefix={<DollarOutlined className="text-indigo-500 mr-2" />}
              suffix="₫"
              formatter={(v) => Number(v).toLocaleString('vi-VN')}
              valueStyle={{ fontWeight: 700, color: '#334155' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-emerald-50/50">
            <Statistic
              title={<span className="text-xs font-semibold text-emerald-700 uppercase">Tổng chi trả thực lĩnh (Net)</span>}
              value={totalNet}
              prefix={<CheckCircleOutlined className="text-emerald-600 mr-2" />}
              suffix="₫"
              formatter={(v) => Number(v).toLocaleString('vi-VN')}
              valueStyle={{ fontWeight: 800, color: '#065f46' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Đã thanh toán</span>}
              value={payrolls.filter((p) => p.status === 'paid').length}
              suffix={`/ ${payrolls.length}`}
              prefix={<CreditCardOutlined className="text-cyan-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0891b2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Tabs Lương: Phiếu lương cá nhân & Toàn công ty ────────── */}
      <Tabs
        defaultActiveKey="my-payslip"
        items={[
          {
            key: 'my-payslip',
            label: (
              <span className="font-semibold flex items-center gap-1.5">
                <BankOutlined /> Phiếu lương cá nhân
              </span>
            ),
            children: myPayslip ? (
              <Card className="rounded-xl border border-slate-200/80 shadow-2xs max-w-3xl mx-auto">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      PHIẾU LƯƠNG THÁNG {myPayslip.month}/{myPayslip.year}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Họ và tên: <strong className="text-slate-800">{myPayslip.userId?.fullName}</strong> ({myPayslip.userId?.employeeCode}) · Phòng: {myPayslip.userId?.department?.name}
                    </p>
                  </div>
                  <div>{getStatusBadge(myPayslip.status)}</div>
                </div>

                <div className="py-4 space-y-4">
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="text-xs text-slate-500">Công chuẩn trong tháng:</div>
                      <div className="text-sm font-semibold">{myPayslip.standardWorkDays} ngày</div>
                    </Col>
                    <Col span={12}>
                      <div className="text-xs text-slate-500">Công thực tế hoàn thành:</div>
                      <div className="text-sm font-bold text-blue-600">
                        {myPayslip.actualWorkDays} ngày công
                        {myPayslip.paidLeaveDays > 0 && ` (+${myPayslip.paidLeaveDays} phép)`}
                      </div>
                    </Col>
                  </Row>

                  <Divider className="!my-2" />

                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">1. Lương cơ bản theo hợp đồng:</span>
                      <strong>{(myPayslip.salaryBase || 0).toLocaleString('vi-VN')} ₫</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">2. Phụ cấp (Cơm trưa, điện thoại, xăng xe):</span>
                      <strong className="text-emerald-600">+{(myPayslip.allowances || 0).toLocaleString('vi-VN')} ₫</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">3. Thưởng hiệu quả / Chuyên cần:</span>
                      <strong className="text-emerald-600">+{(myPayslip.bonus || 0).toLocaleString('vi-VN')} ₫</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">4. Tiền làm thêm giờ (OT):</span>
                      <strong className="text-emerald-600">+{(myPayslip.overtimePay || 0).toLocaleString('vi-VN')} ₫</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                      <span className="font-sans">TỔNG THU NHẬP (GROSS):</span>
                      <span className="text-blue-700">{(myPayslip.grossIncome || 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>

                  <Divider className="!my-2" />

                  <div className="space-y-1.5 text-xs font-mono text-slate-600">
                    <div className="font-sans font-semibold text-slate-700 mb-1">Các khoản trích nộp theo lương:</div>
                    <div className="flex justify-between">
                      <span className="font-sans">- BHXH (8%):</span>
                      <span>-{(myPayslip.deductions?.bhxh || 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">- BHYT (1.5%):</span>
                      <span>-{(myPayslip.deductions?.bhyt || 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">- BHTN (1%):</span>
                      <span>-{(myPayslip.deductions?.bhtn || 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">- Thuế thu nhập cá nhân (TNCN):</span>
                      <span>-{(myPayslip.deductions?.tax || 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200/80 flex justify-between items-center">
                    <div>
                      <div className="text-xs uppercase font-bold text-emerald-800">THỰC LĨNH CHUYỂN KHOẢN (NET)</div>
                      <div className="text-[11px] text-emerald-600">Tài khoản: {myPayslip.userId?.bankAccount?.accountNumber || 'Mặc định ngân hàng'}</div>
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-emerald-700">
                      {(myPayslip.netSalary || 0).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="text-center py-12 text-slate-400 italic">
                Chưa có dữ liệu phiếu lương của tháng {currentMonthNum}/{currentYearNum}.
              </div>
            ),
          },
          {
            key: 'all-payroll',
            label: (
              <span className="font-semibold flex items-center gap-1.5">
                <TeamOutlined /> Bảng lương toàn công ty
              </span>
            ),
            children: (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      placeholder="Lọc phòng ban"
                      allowClear
                      className="w-48"
                      value={selectedDept}
                      onChange={setSelectedDept}
                      options={departments?.map((d) => ({ label: d.name, value: d._id }))}
                    />

                    <Select
                      placeholder="Trạng thái"
                      allowClear
                      className="w-40"
                      value={selectedStatus}
                      onChange={setSelectedStatus}
                      options={[
                        { label: 'Bản nháp', value: 'draft' },
                        { label: 'Đã duyệt', value: 'approved' },
                        { label: 'Đã chi trả', value: 'paid' },
                      ]}
                    />
                  </div>
                </div>

                <Card className="rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <Table
                    columns={allColumns}
                    dataSource={payrolls}
                    rowKey="_id"
                    loading={isLoadingAll}
                    pagination={{ pageSize: 20 }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* ── Modal Tự động Tính Lương Tháng (1-Click Run) ──────────── */}
      <Modal
        title={<div className="text-base font-bold text-slate-800">Tính toán Bảng lương tự động</div>}
        open={isCalcModalOpen}
        onOk={handleCalcSubmit}
        onCancel={() => {
          setIsCalcModalOpen(false)
          calcForm.resetFields()
        }}
        confirmLoading={calcMutation.isPending}
        okText="Chạy tính lương ngay"
        cancelText="Hủy"
        width={480}
      >
        <Form form={calcForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Tháng</span>} name="month">
                <InputNumber min={1} max={12} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Năm</span>} name="year">
                <InputNumber min={2020} max={2030} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span className="font-semibold text-slate-700">Số ngày công chuẩn của tháng</span>}
            name="standardWorkDays"
            initialValue={22}
          >
            <InputNumber min={15} max={31} className="w-full" />
          </Form.Item>

          <Form.Item label={<span className="font-semibold text-slate-700">Phòng ban (Bỏ trống để tính tất cả)</span>} name="department">
            <Select
              allowClear
              placeholder="Toàn bộ công ty"
              options={departments?.map((d) => ({ label: d.name, value: d._id }))}
            />
          </Form.Item>

          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
            * Hệ thống sẽ tự động quét công thực tế từ Attendance, ngày phép có lương từ LeaveRequest, tính phụ cấp cơm trưa, OT, trích trừ BHXH (8%), BHYT (1.5%), BHTN (1%) và thuế TNCN lũy tiến.
          </p>
        </Form>
      </Modal>

      {/* ── Modal Xem Chi tiết Phiếu lương Nhân viên ───────────────── */}
      <Modal
        title={
          <div className="text-base font-bold text-slate-800">
            Chi tiết bảng lương: {viewingPayroll?.userId?.fullName}
          </div>
        }
        open={Boolean(viewingPayroll)}
        onCancel={() => setViewingPayroll(null)}
        footer={[
          <Button key="close" onClick={() => setViewingPayroll(null)}>
            Đóng
          </Button>,
        ]}
        width={620}
      >
        {viewingPayroll && (
          <div className="py-2 space-y-3">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã nhân sự">{viewingPayroll.userId?.employeeCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{getStatusBadge(viewingPayroll.status)}</Descriptions.Item>
              <Descriptions.Item label="Công thực tế">{viewingPayroll.actualWorkDays} / {viewingPayroll.standardWorkDays} ngày</Descriptions.Item>
              <Descriptions.Item label="Nghỉ phép">{viewingPayroll.paidLeaveDays} ngày</Descriptions.Item>
              <Descriptions.Item label="Lương cơ bản">{(viewingPayroll.salaryBase || 0).toLocaleString('vi-VN')} ₫</Descriptions.Item>
              <Descriptions.Item label="Phụ cấp">{(viewingPayroll.allowances || 0).toLocaleString('vi-VN')} ₫</Descriptions.Item>
              <Descriptions.Item label="Thưởng">{(viewingPayroll.bonus || 0).toLocaleString('vi-VN')} ₫</Descriptions.Item>
              <Descriptions.Item label="Làm thêm (OT)">{(viewingPayroll.overtimePay || 0).toLocaleString('vi-VN')} ₫</Descriptions.Item>
              <Descriptions.Item label="Tổng Gross" span={2}>
                <strong className="text-blue-700">{(viewingPayroll.grossIncome || 0).toLocaleString('vi-VN')} ₫</strong>
              </Descriptions.Item>
              <Descriptions.Item label="BHXH + BHYT + BHTN">
                -{( (viewingPayroll.deductions?.bhxh || 0) + (viewingPayroll.deductions?.bhyt || 0) + (viewingPayroll.deductions?.bhtn || 0) ).toLocaleString('vi-VN')} ₫
              </Descriptions.Item>
              <Descriptions.Item label="Thuế TNCN">-{(viewingPayroll.deductions?.tax || 0).toLocaleString('vi-VN')} ₫</Descriptions.Item>
              <Descriptions.Item label="Thực lĩnh (Net)" span={2}>
                <strong className="text-emerald-700 text-lg">{(viewingPayroll.netSalary || 0).toLocaleString('vi-VN')} ₫</strong>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}
