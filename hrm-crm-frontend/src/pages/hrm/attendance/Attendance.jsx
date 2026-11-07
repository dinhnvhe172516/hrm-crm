import React, { useState, useEffect } from 'react'
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
  Input,
  InputNumber,
  Space,
  Statistic,
  Tabs,
  Avatar,
  message,
  Tooltip,
} from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  SearchOutlined,
  EditOutlined,
  TeamOutlined,
  UserOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import attendanceService from '@/services/hrm/attendance.service'
import departmentService from '@/services/hrm/department.service'
import Can from '@/components/common/Can/Can'

const { Title, Text } = Typography

export default function AttendancePage() {
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState(dayjs())
  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [adjustRecord, setAdjustRecord] = useState(null)
  const [adjustForm] = Form.useForm()

  // Bộ lọc cho Tab Quản lý chấm công
  const [filterDate, setFilterDate] = useState(dayjs())
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)

  // Đồng hồ chạy thời gian thực
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 1. Lấy trạng thái chấm công hôm nay của cá nhân
  const { data: todayStatus, isLoading: isLoadingToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceService.getTodayStatus(),
    select: (res) => res.data || {},
  })

  // 2. Lấy bảng chấm công cá nhân theo tháng
  const { data: timesheetData, isLoading: isLoadingTimesheet } = useQuery({
    queryKey: ['attendance-my-timesheet', selectedMonth.format('YYYY-MM')],
    queryFn: () =>
      attendanceService.getMyTimesheet({
        month: selectedMonth.month() + 1,
        year: selectedMonth.year(),
      }),
    select: (res) => res.data || {},
  })

  // 3. Lấy danh sách chấm công toàn công ty (cho HR / Quản lý)
  const { data: allAttendance, isLoading: isLoadingAll } = useQuery({
    queryKey: ['attendance-all', filterDate.format('YYYY-MM-DD'), selectedDept, selectedStatus],
    queryFn: () =>
      attendanceService.getAll({
        date: filterDate.format('YYYY-MM-DD'),
        department: selectedDept || undefined,
        status: selectedStatus || undefined,
        limit: 100,
      }),
    select: (res) => res.data?.data || [],
  })

  // 4. Lấy danh mục phòng ban
  const { data: departments } = useQuery({
    queryKey: ['departments-short'],
    queryFn: () => departmentService.getAll({ limit: 100 }),
    select: (res) => res.data?.data || [],
  })

  // 5. Mutation Check-in
  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn({}),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Check-in thành công!')
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-my-timesheet'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-all'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Check-in thất bại')
    },
  })

  // 6. Mutation Check-out
  const checkOutMutation = useMutation({
    mutationFn: () => attendanceService.checkOut({}),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Check-out thành công!')
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-my-timesheet'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-all'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Check-out thất bại')
    },
  })

  // 7. Mutation Điều chỉnh công bởi HR
  const adjustMutation = useMutation({
    mutationFn: ({ id, values }) => attendanceService.adjustAttendance(id, values),
    onSuccess: () => {
      message.success('Đã cập nhật điều chỉnh chấm công thành công!')
      queryClient.invalidateQueries({ queryKey: ['attendance-all'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      setAdjustRecord(null)
      adjustForm.resetFields()
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Thao tác không thành công')
    },
  })

  const handleOpenAdjust = (record) => {
    setAdjustRecord(record)
    adjustForm.setFieldsValue({
      status: record.status,
      workUnits: record.workUnits,
      workingHours: record.workingHours,
      checkInTime: record.checkIn?.time ? dayjs(record.checkIn.time) : null,
      checkOutTime: record.checkOut?.time ? dayjs(record.checkOut.time) : null,
      reason: record.adjustedReason || '',
    })
  }

  const handleAdjustSubmit = async () => {
    try {
      const values = await adjustForm.validateFields()
      adjustMutation.mutate({
        id: adjustRecord._id,
        values: {
          ...values,
          checkInTime: values.checkInTime ? values.checkInTime.toISOString() : undefined,
          checkOutTime: values.checkOutTime ? values.checkOutTime.toISOString() : undefined,
        },
      })
    } catch {
      // Validate error
    }
  }

  const getStatusTag = (status) => {
    switch (status) {
      case 'present':
        return <Tag color="success">Đúng giờ</Tag>
      case 'late':
        return <Tag color="warning">Đi muộn</Tag>
      case 'early_leave':
        return <Tag color="orange">Về sớm</Tag>
      case 'late_and_early':
        return <Tag color="volcano">Muộn &amp; Về sớm</Tag>
      case 'on_leave':
        return <Tag color="cyan">Nghỉ phép</Tag>
      case 'absent':
        return <Tag color="error">Vắng mặt</Tag>
      case 'wfh':
        return <Tag color="purple">Làm từ xa (WFH)</Tag>
      default:
        return <Tag>{status || 'N/A'}</Tag>
    }
  }

  // Cột bảng Timesheet cá nhân
  const timesheetColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <span className="font-semibold text-slate-800">
          {dayjs(date).format('DD/MM/YYYY')} ({dayjs(date).format('ddd')})
        </span>
      ),
    },
    {
      title: 'Giờ vào (Check-in)',
      key: 'checkIn',
      render: (_, record) =>
        record.checkIn?.time ? (
          <span className="font-mono text-emerald-600 font-medium">
            {dayjs(record.checkIn.time).format('HH:mm:ss')}
          </span>
        ) : (
          <span className="text-slate-400 italic">—</span>
        ),
    },
    {
      title: 'Giờ ra (Check-out)',
      key: 'checkOut',
      render: (_, record) =>
        record.checkOut?.time ? (
          <span className="font-mono text-blue-600 font-medium">
            {dayjs(record.checkOut.time).format('HH:mm:ss')}
          </span>
        ) : (
          <span className="text-slate-400 italic">—</span>
        ),
    },
    {
      title: 'Số giờ làm',
      dataIndex: 'workingHours',
      key: 'workingHours',
      align: 'center',
      render: (hours) => (hours > 0 ? `${hours}h` : '—'),
    },
    {
      title: 'Công chuẩn',
      dataIndex: 'workUnits',
      key: 'workUnits',
      align: 'center',
      render: (units) => (
        <span className="font-bold text-slate-900">{units || 0} công</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Space size={4}>
          {getStatusTag(status)}
          {record.lateMinutes > 0 && (
            <span className="text-xs text-amber-600 font-medium">(+{record.lateMinutes}p)</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (note) => <span className="text-xs text-slate-500 line-clamp-1">{note || '—'}</span>,
    },
  ]

  // Cột bảng Quản lý Chấm công
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
            <div className="text-xs font-mono text-slate-400">{record.userId?.employeeCode || record.userId?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Phòng ban',
      key: 'dept',
      render: (_, record) => (
        <Tag color="geekblue" className="font-medium text-xs">
          {record.userId?.department?.name || 'Chưa gán'}
        </Tag>
      ),
    },
    {
      title: 'Vào ca (In)',
      key: 'checkIn',
      render: (_, record) =>
        record.checkIn?.time ? (
          <span className="font-mono text-emerald-600 font-medium text-xs">
            {dayjs(record.checkIn.time).format('HH:mm')}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
        ),
    },
    {
      title: 'Hết ca (Out)',
      key: 'checkOut',
      render: (_, record) =>
        record.checkOut?.time ? (
          <span className="font-mono text-blue-600 font-medium text-xs">
            {dayjs(record.checkOut.time).format('HH:mm')}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
        ),
    },
    {
      title: 'Số giờ',
      dataIndex: 'workingHours',
      key: 'workingHours',
      align: 'center',
      render: (hours) => (hours > 0 ? `${hours}h` : '—'),
    },
    {
      title: 'Công',
      dataIndex: 'workUnits',
      key: 'workUnits',
      align: 'center',
      render: (units) => <strong>{units || 0}</strong>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Can I="attendance:update">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined className="text-blue-600" />}
            onClick={() => handleOpenAdjust(record)}
          >
            Sửa
          </Button>
        </Can>
      ),
    },
  ]

  const summary = timesheetData?.summary || {}

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 !text-slate-900 font-bold tracking-tight">
            Quản trị Thời gian &amp; Chấm công
          </Title>
          <Text className="text-slate-500 text-sm">
            Chấm công hàng ngày, theo dõi giờ giấc làm việc và bảng chấm công chi tiết
          </Text>
        </div>
      </div>

      {/* ── Thẻ Chấm công Nhanh (Punch In/Out Hero Card) ──────────── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-xs bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-2">
          {/* Cột trái: Đồng hồ thời gian thực */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-blue-200 font-semibold flex items-center gap-2">
              <ClockCircleOutlined className="animate-spin text-blue-400" />
              Thời gian thực tế hệ thống
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight">
              {currentTime.format('HH:mm:ss')}
            </div>
            <div className="text-sm text-slate-300 font-medium">
              {currentTime.format('dddd, [ngày] DD [tháng] MM [năm] YYYY')}
            </div>
          </div>

          {/* Cột giữa: Thông tin ca làm việc hôm nay */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[240px]">
            <div className="text-xs text-blue-200 font-medium mb-1">Ca làm việc hôm nay:</div>
            <div className="text-base font-bold text-white">
              {todayStatus?.shift?.name || 'Ca hành chính chuẩn'}
            </div>
            <div className="text-xs text-slate-300 font-mono mt-1">
              Khung giờ: {todayStatus?.shift?.startTime || '08:30'} - {todayStatus?.shift?.endTime || '17:30'}
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className="text-slate-300">Vào:</span>
              <strong className="text-emerald-400 font-mono">
                {todayStatus?.attendance?.checkIn?.time
                  ? dayjs(todayStatus.attendance.checkIn.time).format('HH:mm')
                  : 'Chưa'}
              </strong>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">Ra:</span>
              <strong className="text-cyan-400 font-mono">
                {todayStatus?.attendance?.checkOut?.time
                  ? dayjs(todayStatus.attendance.checkOut.time).format('HH:mm')
                  : 'Chưa'}
              </strong>
            </div>
          </div>

          {/* Cột phải: Nút Check-in / Check-out */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!todayStatus?.hasCheckedIn ? (
              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                loading={checkInMutation.isPending}
                onClick={() => checkInMutation.mutate()}
                className="bg-emerald-500 hover:bg-emerald-600 border-none font-bold text-base h-13 px-7 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                CHECK-IN VÀO CA
              </Button>
            ) : !todayStatus?.hasCheckedOut ? (
              <Button
                type="primary"
                danger
                size="large"
                icon={<LogoutOutlined />}
                loading={checkOutMutation.isPending}
                onClick={() => checkOutMutation.mutate()}
                className="bg-rose-500 hover:bg-rose-600 border-none font-bold text-base h-13 px-7 rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
              >
                CHECK-OUT HẾT CA
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-5 py-3 rounded-xl font-semibold">
                <CheckCircleOutlined className="text-lg" />
                Đã hoàn thành chấm công hôm nay
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Tabs Chấm công: Cá nhân & Toàn công ty ─────────────────── */}
      <Tabs
        defaultActiveKey="timesheet"
        items={[
          {
            key: 'timesheet',
            label: (
              <span className="font-semibold flex items-center gap-1.5">
                <CalendarOutlined /> Bảng công cá nhân
              </span>
            ),
            children: (
              <div className="space-y-5">
                {/* Thanh điều hướng tháng & Thống kê nhanh */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Xem bảng công tháng:</span>
                    <DatePicker
                      picker="month"
                      value={selectedMonth}
                      onChange={(d) => d && setSelectedMonth(d)}
                      format="MM/YYYY"
                      allowClear={false}
                    />
                  </div>
                </div>

                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
                      <Statistic
                        title={<span className="text-xs font-semibold text-slate-500 uppercase">Công thực tế</span>}
                        value={summary.totalWorkUnits || 0}
                        suffix="công"
                        valueStyle={{ fontWeight: 700, color: '#2563eb' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
                      <Statistic
                        title={<span className="text-xs font-semibold text-slate-500 uppercase">Tổng giờ làm</span>}
                        value={summary.totalWorkingHours || 0}
                        suffix="giờ"
                        valueStyle={{ fontWeight: 700, color: '#059669' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
                      <Statistic
                        title={<span className="text-xs font-semibold text-slate-500 uppercase">Số lần đi muộn</span>}
                        value={summary.lateCount || 0}
                        suffix="lần"
                        valueStyle={{ fontWeight: 700, color: '#d97706' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
                      <Statistic
                        title={<span className="text-xs font-semibold text-slate-500 uppercase">Số ngày nghỉ phép</span>}
                        value={summary.onLeaveCount || 0}
                        suffix="ngày"
                        valueStyle={{ fontWeight: 700, color: '#4f46e5' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card className="rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <Table
                    columns={timesheetColumns}
                    dataSource={timesheetData?.records || []}
                    rowKey="_id"
                    loading={isLoadingTimesheet}
                    pagination={false}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'management',
            label: (
              <span className="font-semibold flex items-center gap-1.5">
                <TeamOutlined /> Quản lý Chấm công toàn công ty
              </span>
            ),
            children: (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <DatePicker
                      value={filterDate}
                      onChange={(d) => d && setFilterDate(d)}
                      format="DD/MM/YYYY"
                      allowClear={false}
                    />

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
                        { label: 'Đúng giờ', value: 'present' },
                        { label: 'Đi muộn', value: 'late' },
                        { label: 'Về sớm', value: 'early_leave' },
                        { label: 'Nghỉ phép', value: 'on_leave' },
                        { label: 'Vắng mặt', value: 'absent' },
                      ]}
                    />
                  </div>
                </div>

                <Card className="rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <Table
                    columns={allColumns}
                    dataSource={allAttendance || []}
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

      {/* ── Modal Điều chỉnh Chấm công (HR Manual Adjustment) ─────── */}
      <Modal
        title={
          <div className="text-base font-bold text-slate-800">
            Điều chỉnh chấm công: {adjustRecord?.userId?.fullName}
          </div>
        }
        open={Boolean(adjustRecord)}
        onOk={handleAdjustSubmit}
        onCancel={() => {
          setAdjustRecord(null)
          adjustForm.resetFields()
        }}
        confirmLoading={adjustMutation.isPending}
        okText="Lưu điều chỉnh"
        cancelText="Hủy"
        width={520}
      >
        <Form form={adjustForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Trạng thái</span>} name="status">
                <Select
                  options={[
                    { label: 'Đúng giờ', value: 'present' },
                    { label: 'Đi muộn', value: 'late' },
                    { label: 'Về sớm', value: 'early_leave' },
                    { label: 'Nghỉ phép', value: 'on_leave' },
                    { label: 'Vắng mặt', value: 'absent' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Công làm việc</span>} name="workUnits">
                <InputNumber min={0} max={1} step={0.5} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Số giờ làm</span>} name="workingHours">
                <InputNumber min={0} max={24} step={0.5} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Lý do điều chỉnh</span>}
                name="reason"
                rules={[{ required: true, message: 'Vui lòng ghi lý do giải trình' }]}
              >
                <Input placeholder="Quên quẹt thẻ / Đi công tác..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
