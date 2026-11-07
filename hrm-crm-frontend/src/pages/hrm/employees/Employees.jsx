import React, { useState } from 'react'
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Avatar,
  Statistic,
  DatePicker,
  Dropdown,
  Badge,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  KeyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  MoreOutlined,
  SafetyCertificateOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import employeeService from '@/services/hrm/employee.service'
import departmentService from '@/services/hrm/department.service'
import positionService from '@/services/hrm/position.service'
import { roleService } from '@/services/hrm/role.service'
import Can from '@/components/common/Can/Can'

const { Title, Text } = Typography

export default function EmployeesPage() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [resetPwForm] = Form.useForm()

  // Filters & Pagination State
  const [searchText, setSearchText] = useState('')
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [viewingEmployee, setViewingEmployee] = useState(null)
  const [resetPwEmployee, setResetPwEmployee] = useState(null)
  const [createdCredentials, setCreatedCredentials] = useState(null)

  // 1. Lấy danh sách nhân viên có lọc & phân trang
  const { data: employeeData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', searchText, selectedDept, selectedRole, selectedStatus, page, pageSize],
    queryFn: () =>
      employeeService.getAll({
        search: searchText || undefined,
        department: selectedDept || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        page,
        limit: pageSize,
      }),
    select: (res) => res.data || { data: [], total: 0 },
  })

  // 2. Lấy thống kê nhân sự
  const { data: statsData } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: () => employeeService.getStats(),
    select: (res) => res.data || {},
  })

  // 3. Lấy danh mục Phòng ban, Vị trí chức danh và Vai trò
  const { data: departments } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentService.getAll({ limit: 100 }),
    select: (res) => res.data?.data || [],
  })

  const { data: positions } = useQuery({
    queryKey: ['positions-all'],
    queryFn: () => positionService.getAll({ limit: 100 }),
    select: (res) => res.data?.data || [],
  })

  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => roleService.getRoles({ limit: 50 }),
    select: (res) => res.data || [],
  })

  // 4. Mutation Tạo / Cập nhật Nhân viên
  const saveMutation = useMutation({
    mutationFn: (values) => {
      if (editingEmployee) {
        return employeeService.update(editingEmployee._id, values)
      }
      return employeeService.create(values)
    },
    onSuccess: (res) => {
      message.success(editingEmployee ? 'Cập nhật nhân sự thành công!' : 'Tạo mới nhân sự thành công!')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] })
      setIsCreateModalOpen(false)
      const isNew = !editingEmployee
      setEditingEmployee(null)
      form.resetFields()

      if (isNew && res.data?.initialPassword) {
        setCreatedCredentials({
          employeeCode: res.data.employeeCode,
          email: res.data.email,
          fullName: res.data.fullName,
          password: res.data.initialPassword,
        })
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Thao tác không thành công')
    },
  })

  // 5. Mutation Reset Mật khẩu
  const resetPwMutation = useMutation({
    mutationFn: ({ id, values }) => employeeService.resetPassword(id, values),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Đã đặt lại mật khẩu thành công!')
      setResetPwEmployee(null)
      resetPwForm.resetFields()
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu')
    },
  })

  // 6. Mutation Vô hiệu hóa nhân viên
  const deleteMutation = useMutation({
    mutationFn: (id) => employeeService.remove(id),
    onSuccess: () => {
      message.success('Đã vô hiệu hóa tài khoản nhân sự thành công!')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    },
  })

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp)
    form.setFieldsValue({
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      employeeCode: emp.employeeCode,
      department: emp.department?._id || emp.department || null,
      position: emp.position?._id || emp.position || null,
      role: emp.role?._id || emp.role || null,
      managerId: emp.managerId?._id || emp.managerId || null,
      status: emp.status || 'probation',
      gender: emp.gender,
      dateOfBirth: emp.dateOfBirth ? dayjs(emp.dateOfBirth) : null,
      joinDate: emp.joinDate ? dayjs(emp.joinDate) : null,
      probationEndDate: emp.probationEndDate ? dayjs(emp.probationEndDate) : null,
      taxCode: emp.taxCode,
      insuranceCode: emp.insuranceCode,
    })
    setIsCreateModalOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingEmployee(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'probation',
      gender: 'male',
      joinDate: dayjs(),
      initialPassword: 'Password@123',
    })
    setIsCreateModalOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
        joinDate: values.joinDate ? values.joinDate.toISOString() : undefined,
        probationEndDate: values.probationEndDate ? values.probationEndDate.toISOString() : undefined,
      }
      saveMutation.mutate(payload)
    } catch {
      // Validate error
    }
  }

  const handleResetPwSubmit = async () => {
    try {
      const values = await resetPwForm.validateFields()
      resetPwMutation.mutate({
        id: resetPwEmployee._id,
        values: {
          newPassword: values.newPassword,
          mustChangePassword: true,
        },
      })
    } catch {
      // Validate error
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    message.success('Đã sao chép vào bộ nhớ tạm!')
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'official':
        return <Tag color="success">Chính thức</Tag>
      case 'probation':
        return <Tag color="warning">Thử việc</Tag>
      case 'resigned':
        return <Tag color="default">Đã nghỉ việc</Tag>
      case 'terminated':
        return <Tag color="error">Sa thải</Tag>
      default:
        return <Tag>{status || 'N/A'}</Tag>
    }
  }

  const columns = [
    {
      title: 'Nhân viên',
      key: 'employee',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            size={40}
            className="bg-blue-600 font-semibold shrink-0 ring-2 ring-blue-100"
          >
            {record.fullName?.charAt(0)}
          </Avatar>
          <div>
            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span
                className="hover:text-blue-600 cursor-pointer transition-colors"
                onClick={() => setViewingEmployee(record)}
              >
                {record.fullName}
              </span>
              <Tag color="blue" className="font-mono text-xs m-0">
                {record.employeeCode || 'CHƯA CÓ'}
              </Tag>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Phòng ban & Vị trí',
      key: 'dept_position',
      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-700 text-xs">
            {record.department?.name || <span className="text-slate-400 italic">Chưa xếp phòng</span>}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {record.position?.title || 'Chưa phân chức vụ'}
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò hệ thống',
      dataIndex: 'role',
      key: 'role',
      render: (role) =>
        role ? (
          <Tag color={role.code === 'super_admin' ? 'purple' : role.code.includes('manager') ? 'indigo' : 'cyan'}>
            <SafetyCertificateOutlined className="mr-1" />
            {role.name || role.code}
          </Tag>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
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
      title: 'Ngày vào làm',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date) => (
        <span className="text-xs font-mono text-slate-600">
          {date ? dayjs(date).format('DD/MM/YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            icon: <UserOutlined />,
            label: 'Xem hồ sơ chi tiết',
            onClick: () => setViewingEmployee(record),
          },
          {
            key: 'edit',
            icon: <EditOutlined className="text-blue-600" />,
            label: 'Chỉnh sửa thông tin',
            onClick: () => handleOpenEdit(record),
          },
          {
            key: 'reset-password',
            icon: <KeyOutlined className="text-amber-600" />,
            label: 'Đặt lại mật khẩu',
            onClick: () => {
              setResetPwEmployee(record)
              resetPwForm.setFieldsValue({ newPassword: 'Password@123' })
            },
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
            label: (
              <Popconfirm
                title="Vô hiệu hóa tài khoản"
                description={`Bạn có chắc muốn vô hiệu hóa tài khoản của "${record.fullName}"?`}
                onConfirm={() => deleteMutation.mutate(record._id)}
                okText="Đồng ý"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <span>Vô hiệu hóa tài khoản</span>
              </Popconfirm>
            ),
          },
        ]

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang & Nút thêm nhân viên ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 !text-slate-900 font-bold tracking-tight">
            Quản trị Hồ sơ Nhân sự
          </Title>
          <Text className="text-slate-500 text-sm">
            Quản lý hồ sơ nhân viên, phân quyền vai trò, tài khoản và trạng thái công tác
          </Text>
        </div>
        <Can I="employee:create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm font-semibold"
          >
            Thêm nhân viên mới
          </Button>
        </Can>
      </div>

      {/* ── Thống kê tổng quan ────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Tổng nhân sự</span>}
              value={statsData?.total || 0}
              prefix={<TeamOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Chính thức</span>}
              value={statsData?.official || 0}
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Đang thử việc</span>}
              value={statsData?.probation || 0}
              prefix={<ClockCircleOutlined className="text-amber-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Đã nghỉ việc</span>}
              value={statsData?.resigned || 0}
              prefix={<StopOutlined className="text-slate-400 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#64748b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Bảng Nhân sự & Thanh lọc ───────────────────────────────── */}
      <Card className="rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <Input
              placeholder="Tìm theo tên, email, mã NV, số ĐT..."
              prefix={<SearchOutlined className="text-slate-400" />}
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setPage(1)
              }}
              className="w-full sm:w-64 rounded-lg"
            />

            <Select
              placeholder="Lọc phòng ban"
              allowClear
              className="w-44"
              value={selectedDept}
              onChange={(val) => {
                setSelectedDept(val)
                setPage(1)
              }}
              options={departments?.map((d) => ({ label: d.name, value: d._id }))}
            />

            <Select
              placeholder="Lọc vai trò"
              allowClear
              className="w-44"
              value={selectedRole}
              onChange={(val) => {
                setSelectedRole(val)
                setPage(1)
              }}
              options={roles?.map((r) => ({ label: r.name, value: r._id }))}
            />

            <Select
              placeholder="Trạng thái"
              allowClear
              className="w-36"
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val)
                setPage(1)
              }}
              options={[
                { label: 'Chính thức', value: 'official' },
                { label: 'Thử việc', value: 'probation' },
                { label: 'Đã nghỉ việc', value: 'resigned' },
                { label: 'Sa thải', value: 'terminated' },
              ]}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={employeeData?.data || []}
          rowKey="_id"
          loading={isLoadingEmployees}
          pagination={{
            current: page,
            pageSize,
            total: employeeData?.total || 0,
            showTotal: (total) => `Tổng cộng: ${total} nhân sự`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      {/* ── Modal Thêm / Chỉnh sửa Nhân sự ─────────────────────────── */}
      <Modal
        title={
          <div className="text-base font-bold text-slate-800">
            {editingEmployee ? `Cập nhật hồ sơ: ${editingEmployee.fullName}` : 'Thêm mới nhân sự'}
          </div>
        }
        open={isCreateModalOpen}
        onOk={handleFormSubmit}
        onCancel={() => {
          setIsCreateModalOpen(false)
          setEditingEmployee(null)
          form.resetFields()
        }}
        confirmLoading={saveMutation.isPending}
        okText={editingEmployee ? 'Lưu thay đổi' : 'Tạo nhân viên'}
        cancelText="Hủy"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Họ và tên</span>}
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên nhân sự' }]}
              >
                <Input placeholder="VD: Nguyễn Văn An" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Email công ty</span>}
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="an.nguyen@nexus-corp.com" disabled={Boolean(editingEmployee)} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Số điện thoại</span>} name="phone">
                <Input placeholder="0912345678" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Mã nhân viên</span>}
                name="employeeCode"
                tooltip="Bỏ trống để hệ thống tự động sinh mã kế tiếp (VD: NV004)"
              >
                <Input placeholder="Tự động sinh (VD: NV004)" className="uppercase font-mono" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Phòng ban</span>} name="department">
                <Select
                  placeholder="Chọn phòng ban trực thuộc"
                  allowClear
                  options={departments?.map((d) => ({ label: `${d.name} (${d.code})`, value: d._id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Vị trí chức danh</span>} name="position">
                <Select
                  placeholder="Chọn vị trí công việc"
                  allowClear
                  options={positions?.map((p) => ({ label: `${p.title} (Level ${p.level})`, value: p._id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Vai trò phân quyền hệ thống</span>}
                name="role"
                rules={[{ required: true, message: 'Vui lòng gán vai trò truy cập' }]}
              >
                <Select
                  placeholder="Chọn vai trò truy cập"
                  options={roles?.map((r) => ({ label: `${r.name} (${r.code})`, value: r._id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Trạng thái công tác</span>} name="status">
                <Select
                  options={[
                    { label: 'Thử việc', value: 'probation' },
                    { label: 'Chính thức', value: 'official' },
                    { label: 'Đã nghỉ việc', value: 'resigned' },
                    { label: 'Sa thải', value: 'terminated' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Ngày vào làm</span>} name="joinDate">
                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày bắt đầu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="font-semibold text-slate-700">Ngày kết thúc thử việc</span>} name="probationEndDate">
                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
              </Form.Item>
            </Col>
          </Row>

          {!editingEmployee && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label={<span className="font-semibold text-slate-700">Mật khẩu khởi tạo ban đầu</span>}
                  name="initialPassword"
                  tooltip="Nhân viên sẽ được yêu cầu đổi mật khẩu ngay lần đầu đăng nhập"
                >
                  <Input.Password placeholder="Mặc định: Password@123" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>

      {/* ── Modal Bàn giao Tài khoản Mới ───────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <CheckCircleOutlined /> Tài khoản nhân viên mới đã được kích hoạt!
          </div>
        }
        open={Boolean(createdCredentials)}
        onOk={() => setCreatedCredentials(null)}
        onCancel={() => setCreatedCredentials(null)}
        okText="Đã lưu lại"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={480}
      >
        <div className="py-2 space-y-3">
          <p className="text-slate-600 text-sm">
            Vui lòng gửi thông tin đăng nhập bên dưới cho nhân sự <strong>{createdCredentials?.fullName}</strong>:
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 font-mono text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Mã nhân viên:</span>
              <strong className="text-slate-900">{createdCredentials?.employeeCode}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Email:</span>
              <strong className="text-slate-900">{createdCredentials?.email}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Mật khẩu tạm:</span>
              <span className="flex items-center gap-2">
                <strong className="text-blue-600">{createdCredentials?.password}</strong>
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(createdCredentials?.password)}
                />
              </span>
            </div>
          </div>
          <p className="text-xs text-amber-600 italic">
            * Nhân sự sẽ được yêu cầu đổi mật khẩu cá nhân ngay lần đầu tiên đăng nhập vào hệ thống.
          </p>
        </div>
      </Modal>

      {/* ── Modal Đặt lại Mật khẩu bởi HR ──────────────────────────── */}
      <Modal
        title={
          <div className="text-base font-bold text-slate-800">
            Đặt lại mật khẩu cho: {resetPwEmployee?.fullName} ({resetPwEmployee?.employeeCode})
          </div>
        }
        open={Boolean(resetPwEmployee)}
        onOk={handleResetPwSubmit}
        onCancel={() => {
          setResetPwEmployee(null)
          resetPwForm.resetFields()
        }}
        confirmLoading={resetPwMutation.isPending}
        okText="Xác nhận đổi mật khẩu"
        cancelText="Hủy"
        width={450}
      >
        <Form form={resetPwForm} layout="vertical" className="mt-4">
          <Form.Item
            label={<span className="font-semibold text-slate-700">Mật khẩu mới</span>}
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải từ 8 ký tự trở lên' },
            ]}
          >
            <Input.Password placeholder="Password@123" />
          </Form.Item>
          <p className="text-xs text-slate-500">
            Hệ thống sẽ tự động thu hồi tất cả các phiên đăng nhập trước đó và yêu cầu nhân viên đổi mật khẩu ở lần đăng nhập tiếp theo.
          </p>
        </Form>
      </Modal>

      {/* ── Modal Xem Hồ sơ Chi tiết ───────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <Avatar src={viewingEmployee?.avatar} size={42} className="bg-blue-600 font-bold">
              {viewingEmployee?.fullName?.charAt(0)}
            </Avatar>
            <div>
              <div className="text-base font-bold text-slate-900">{viewingEmployee?.fullName}</div>
              <div className="text-xs text-slate-400 font-mono">{viewingEmployee?.employeeCode} · {viewingEmployee?.email}</div>
            </div>
          </div>
        }
        open={Boolean(viewingEmployee)}
        onCancel={() => setViewingEmployee(null)}
        footer={[
          <Button key="close" onClick={() => setViewingEmployee(null)}>
            Đóng
          </Button>,
        ]}
        width={680}
      >
        <div className="py-4 space-y-4">
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Mã nhân viên">
              <span className="font-mono font-semibold text-blue-600">{viewingEmployee?.employeeCode}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusBadge(viewingEmployee?.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng ban">
              {viewingEmployee?.department?.name || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Chức vụ">
              {viewingEmployee?.position?.title || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò">{viewingEmployee?.role?.name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{viewingEmployee?.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày vào làm">
              {viewingEmployee?.joinDate ? dayjs(viewingEmployee.joinDate).format('DD/MM/YYYY') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Hết hạn thử việc">
              {viewingEmployee?.probationEndDate ? dayjs(viewingEmployee.probationEndDate).format('DD/MM/YYYY') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Mã số thuế">{viewingEmployee?.taxCode || '—'}</Descriptions.Item>
            <Descriptions.Item label="Mã BHXH">{viewingEmployee?.insuranceCode || '—'}</Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    </div>
  )
}
