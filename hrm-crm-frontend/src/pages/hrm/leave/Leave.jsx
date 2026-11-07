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
  Input,
  Space,
  Statistic,
  Tabs,
  Avatar,
  message,
  Popconfirm,
  Radio,
  Progress,
} from 'antd'
import {
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  AuditOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import leaveService from '@/services/hrm/leave.service'
import Can from '@/components/common/Can/Can'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function LeavePage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rejectModalReq, setRejectModalReq] = useState(null)
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [form] = Form.useForm()
  const [rejectForm] = Form.useForm()

  // 1. Lấy danh sách các loại nghỉ phép
  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveService.getLeaveTypes(),
    select: (res) => res.data || [],
  })

  // 2. Lấy số dư quỹ phép cá nhân trong năm
  const { data: myBalances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['leave-balances-my', dayjs().year()],
    queryFn: () => leaveService.getMyBalances({ year: dayjs().year() }),
    select: (res) => res.data || {},
  })

  // 3. Lấy danh sách đơn nghỉ phép của bản thân
  const { data: myRequests, isLoading: isLoadingMyRequests } = useQuery({
    queryKey: ['leave-requests-my'],
    queryFn: () => leaveService.getRequests({ mode: 'my', limit: 50 }),
    select: (res) => res.data?.data || [],
  })

  // 4. Lấy danh sách đơn cần duyệt (cho Quản lý / HR)
  const { data: approvalRequests, isLoading: isLoadingApprovals } = useQuery({
    queryKey: ['leave-requests-approvals'],
    queryFn: () => leaveService.getRequests({ mode: 'approvals', limit: 50 }),
    select: (res) => res.data?.data || [],
  })

  // 5. Mutation Tạo đơn nghỉ phép
  const createMutation = useMutation({
    mutationFn: (values) => leaveService.createRequest(values),
    onSuccess: () => {
      message.success('Đã gửi đơn xin nghỉ phép thành công!')
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] })
      setIsModalOpen(false)
      form.resetFields()
      setIsHalfDay(false)
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Gửi đơn thất bại')
    },
  })

  // 6. Mutation Duyệt đơn
  const approveMutation = useMutation({
    mutationFn: ({ id, comment }) => leaveService.approveRequest(id, { comment }),
    onSuccess: () => {
      message.success('Đã phê duyệt đơn nghỉ phép!')
      queryClient.invalidateQueries({ queryKey: ['leave-requests-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Duyệt đơn thất bại')
    },
  })

  // 7. Mutation Từ chối đơn
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => leaveService.rejectRequest(id, { reason }),
    onSuccess: () => {
      message.success('Đã từ chối đơn nghỉ phép!')
      queryClient.invalidateQueries({ queryKey: ['leave-requests-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] })
      setRejectModalReq(null)
      rejectForm.resetFields()
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    },
  })

  // 8. Mutation Hủy đơn
  const cancelMutation = useMutation({
    mutationFn: (id) => leaveService.cancelRequest(id),
    onSuccess: () => {
      message.success('Đã hủy đơn nghỉ phép thành công!')
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Hủy đơn thất bại')
    },
  })

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      let startDate = null
      let endDate = null
      let totalDays = 1

      if (isHalfDay) {
        startDate = values.singleDate.toISOString()
        endDate = values.singleDate.toISOString()
        totalDays = 0.5
      } else {
        startDate = values.dateRange[0].toISOString()
        endDate = values.dateRange[1].toISOString()
        const diffDays = values.dateRange[1].diff(values.dateRange[0], 'day') + 1
        totalDays = diffDays
      }

      createMutation.mutate({
        leaveTypeId: values.leaveTypeId,
        startDate,
        endDate,
        totalDays,
        isHalfDay,
        halfDaySession: values.halfDaySession || null,
        reason: values.reason,
      })
    } catch {
      // Validate error
    }
  }

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields()
      rejectMutation.mutate({
        id: rejectModalReq._id,
        reason: values.reason,
      })
    } catch {
      // Validate error
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Tag color="success">Đã duyệt</Tag>
      case 'pending':
        return <Tag color="processing">Chờ duyệt</Tag>
      case 'rejected':
        return <Tag color="error">Từ chối</Tag>
      case 'cancelled':
        return <Tag color="default">Đã hủy</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  // Lấy thống kê số ngày phép năm từ balances
  const annualBalance = myBalances?.balances?.find(
    (b) => b.leaveType?.code === 'annual' || b.leaveType?.name?.includes('phép năm')
  ) || {}

  // Cột bảng Đơn của tôi
  const myColumns = [
    {
      title: 'Loại nghỉ phép',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type) => (
        <span className="font-semibold text-slate-800 text-sm">
          {type?.name || 'Nghỉ phép'}
        </span>
      ),
    },
    {
      title: 'Thời gian nghỉ',
      key: 'period',
      render: (_, record) => (
        <div>
          <div className="font-mono text-xs font-semibold text-slate-800">
            {dayjs(record.startDate).format('DD/MM/YYYY')} - {dayjs(record.endDate).format('DD/MM/YYYY')}
          </div>
          {record.isHalfDay && (
            <div className="text-[11px] text-indigo-600 font-medium">
              Nửa ngày ({record.halfDaySession === 'morning' ? 'Buổi sáng' : 'Buổi chiều'})
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Số ngày',
      dataIndex: 'totalDays',
      key: 'totalDays',
      align: 'center',
      render: (days) => <strong className="text-slate-900">{days} ngày</strong>,
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => <span className="text-xs text-slate-600 line-clamp-1">{reason}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) =>
        record.status === 'pending' ? (
          <Popconfirm
            title="Hủy đơn xin nghỉ phép"
            description="Bạn có chắc chắn muốn hủy đơn xin nghỉ phép này không?"
            onConfirm={() => cancelMutation.mutate(record._id)}
            okText="Hủy đơn"
            cancelText="Không"
            okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
          >
            <Button size="small" danger>
              Hủy đơn
            </Button>
          </Popconfirm>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
        ),
    },
  ]

  // Cột bảng Duyệt đơn (Approvals Inbox)
  const approvalColumns = [
    {
      title: 'Nhân viên gửi đơn',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={record.userId?.avatar} icon={<UserOutlined />} className="bg-blue-600 shrink-0 font-bold">
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
      title: 'Loại phép',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type) => <Tag color="blue">{type?.name || 'Nghỉ phép'}</Tag>,
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <div>
          <div className="font-mono text-xs font-semibold text-slate-800">
            {dayjs(record.startDate).format('DD/MM/YYYY')} - {dayjs(record.endDate).format('DD/MM/YYYY')}
          </div>
          <div className="text-xs text-slate-500">{record.totalDays} ngày</div>
        </div>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => <span className="text-xs text-slate-700">{reason}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right',
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Button
              size="small"
              type="primary"
              className="bg-emerald-600 hover:bg-emerald-700"
              icon={<CheckCircleOutlined />}
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate({ id: record._id, comment: 'Đã duyệt' })}
            >
              Duyệt
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setRejectModalReq(record)}
            >
              Từ chối
            </Button>
          </Space>
        ) : (
          <span className="text-slate-400 text-xs italic">Đã xử lý</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang & Nút nộp đơn ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 !text-slate-900 font-bold tracking-tight">
            Quản trị Nghỉ phép &amp; Đơn từ
          </Title>
          <Text className="text-slate-500 text-sm">
            Theo dõi quỹ phép năm, tạo đơn nghỉ phép và quy trình xét duyệt trực tuyến
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields()
            setIsHalfDay(false)
            setIsModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm font-semibold"
        >
          Tạo đơn xin nghỉ phép
        </Button>
      </div>

      {/* ── Thẻ Thống kê Quỹ phép Năm (Leave Balance Card) ─────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Phép năm được cấp</span>}
              value={annualBalance.entitled || 12}
              suffix="ngày"
              prefix={<CalendarOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Đã sử dụng</span>}
              value={annualBalance.used || 0}
              suffix="ngày"
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Đang chờ duyệt</span>}
              value={annualBalance.pending || 0}
              suffix="ngày"
              prefix={<ClockCircleOutlined className="text-amber-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#d97706' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-blue-50/50">
            <Statistic
              title={<span className="text-xs font-semibold text-blue-700 uppercase">Số ngày phép còn lại</span>}
              value={annualBalance.remaining || 12}
              suffix="ngày"
              valueStyle={{ fontWeight: 800, color: '#1d4ed8' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Tabs Danh sách Đơn: Cá nhân & Duyệt đơn ───────────────── */}
      <Tabs
        defaultActiveKey="my-requests"
        items={[
          {
            key: 'my-requests',
            label: (
              <span className="font-semibold flex items-center gap-1.5">
                <FileTextOutlined /> Đơn nghỉ phép của tôi
              </span>
            ),
            children: (
              <Card className="rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <Table
                  columns={myColumns}
                  dataSource={myRequests || []}
                  rowKey="_id"
                  loading={isLoadingMyRequests}
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'approvals',
            label: (
              <span className="font-semibold flex items-center gap-1.5">
                <AuditOutlined /> Hộp thư Phê duyệt đơn
                {approvalRequests?.filter((r) => r.status === 'pending').length > 0 && (
                  <Tag color="error" className="ml-1 rounded-full text-xs">
                    {approvalRequests.filter((r) => r.status === 'pending').length}
                  </Tag>
                )}
              </span>
            ),
            children: (
              <Card className="rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <Table
                  columns={approvalColumns}
                  dataSource={approvalRequests || []}
                  rowKey="_id"
                  loading={isLoadingApprovals}
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* ── Modal Tạo Đơn Xin Nghỉ Phép ────────────────────────────── */}
      <Modal
        title={<div className="text-base font-bold text-slate-800">Tạo đơn xin nghỉ phép</div>}
        open={isModalOpen}
        onOk={handleFormSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        confirmLoading={createMutation.isPending}
        okText="Gửi đơn phê duyệt"
        cancelText="Hủy"
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label={<span className="font-semibold text-slate-700">Loại nghỉ phép</span>}
            name="leaveTypeId"
            rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ phép' }]}
          >
            <Select
              placeholder="Chọn loại nghỉ phép"
              options={leaveTypes?.map((lt) => ({
                label: `${lt.name} ${lt.isPaid ? '(Hưởng nguyên lương)' : '(Không hưởng lương)'}`,
                value: lt._id,
              }))}
            />
          </Form.Item>

          <Form.Item label={<span className="font-semibold text-slate-700">Hình thức nghỉ</span>}>
            <Radio.Group value={isHalfDay} onChange={(e) => setIsHalfDay(e.target.value)}>
              <Radio value={false}>Nghỉ theo ngày (Trọn ngày)</Radio>
              <Radio value={true}>Nghỉ nửa ngày (0.5 ngày)</Radio>
            </Radio.Group>
          </Form.Item>

          {isHalfDay ? (
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  label={<span className="font-semibold text-slate-700">Ngày nghỉ</span>}
                  name="singleDate"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày nghỉ' }]}
                >
                  <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  label={<span className="font-semibold text-slate-700">Buổi nghỉ</span>}
                  name="halfDaySession"
                  initialValue="morning"
                  rules={[{ required: true, message: 'Vui lòng chọn buổi' }]}
                >
                  <Select
                    options={[
                      { label: 'Buổi sáng', value: 'morning' },
                      { label: 'Buổi chiều', value: 'afternoon' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <Form.Item
              label={<span className="font-semibold text-slate-700">Khoảng thời gian nghỉ</span>}
              name="dateRange"
              rules={[{ required: true, message: 'Vui lòng chọn khoảng ngày nghỉ' }]}
            >
              <RangePicker className="w-full" format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} />
            </Form.Item>
          )}

          <Form.Item
            label={<span className="font-semibold text-slate-700">Lý do xin nghỉ</span>}
            name="reason"
            rules={[{ required: true, message: 'Vui lòng ghi rõ lý do xin nghỉ' }]}
          >
            <Input.TextArea rows={3} placeholder="Ghi rõ lý do nghỉ phép, kế hoạch bàn giao công việc..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal Từ chối Đơn (Nhập Lý do) ─────────────────────────── */}
      <Modal
        title={<div className="text-base font-bold text-rose-600">Từ chối đơn xin nghỉ phép</div>}
        open={Boolean(rejectModalReq)}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setRejectModalReq(null)
          rejectForm.resetFields()
        }}
        confirmLoading={rejectMutation.isPending}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical" className="mt-3">
          <Form.Item
            label={<span className="font-semibold text-slate-700">Lý do từ chối</span>}
            name="reason"
            rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối đơn' }]}
          >
            <Input.TextArea rows={3} placeholder="VD: Trùng lịch họp quan trọng với đối tác..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
