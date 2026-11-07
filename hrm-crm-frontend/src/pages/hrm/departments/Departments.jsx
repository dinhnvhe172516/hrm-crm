import React, { useState } from 'react'
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Avatar,
  Radio,
  Tree,
  Statistic,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SearchOutlined,
  DollarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import departmentService from '@/services/hrm/department.service'
import employeeService from '@/services/hrm/employee.service'
import Can from '@/components/common/Can/Can'

const { Title, Text } = Typography

export default function DepartmentsPage() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState('table') // 'table' | 'tree'
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [form] = Form.useForm()

  // 1. Lấy danh sách phòng ban
  const { data: deptData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments', searchText],
    queryFn: () => departmentService.getAll({ search: searchText, limit: 100 }),
    select: (res) => res.data?.data || [],
  })

  // 2. Lấy cây cơ cấu tổ chức
  const { data: treeData, isLoading: isLoadingTree } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: () => departmentService.getTree(),
    select: (res) => res.data || [],
    enabled: viewMode === 'tree',
  })

  // 3. Lấy danh sách nhân viên để chọn Trưởng phòng
  const { data: employees } = useQuery({
    queryKey: ['employees-short'],
    queryFn: () => employeeService.getAll({ limit: 200, isActive: true }),
    select: (res) => res.data?.data || [],
  })

  // 4. Mutation Tạo / Cập nhật phòng ban
  const saveMutation = useMutation({
    mutationFn: (values) => {
      if (editingDept) {
        return departmentService.update(editingDept._id, values)
      }
      return departmentService.create(values)
    },
    onSuccess: () => {
      message.success(editingDept ? 'Cập nhật phòng ban thành công!' : 'Tạo mới phòng ban thành công!')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-tree'] })
      setIsModalOpen(false)
      setEditingDept(null)
      form.resetFields()
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Thao tác không thành công')
    },
  })

  // 5. Mutation Xóa phòng ban
  const deleteMutation = useMutation({
    mutationFn: (id) => departmentService.remove(id),
    onSuccess: () => {
      message.success('Đã xóa phòng ban thành công!')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-tree'] })
    },
    onError: (err) => {
      message.error(err.response?.data?.message || err.message || 'Không thể xóa phòng ban này')
    },
  })

  const handleOpenModal = (dept = null) => {
    setEditingDept(dept)
    if (dept) {
      form.setFieldsValue({
        name: dept.name,
        code: dept.code,
        parentId: dept.parentId?._id || dept.parentId || null,
        managerId: dept.managerId?._id || dept.managerId || null,
        location: dept.location,
        email: dept.email,
        budgetMonthly: dept.budget?.monthly || 0,
        order: dept.order || 0,
        description: dept.description,
        isActive: dept.isActive !== false,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        order: (deptData?.length || 0) + 1,
        isActive: true,
        budgetMonthly: 0,
      })
    }
    setIsModalOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        name: values.name,
        code: values.code,
        parentId: values.parentId || null,
        managerId: values.managerId || null,
        location: values.location,
        email: values.email,
        description: values.description,
        order: values.order,
        isActive: values.isActive,
        budget: {
          monthly: values.budgetMonthly || 0,
          yearly: (values.budgetMonthly || 0) * 12,
          currency: 'VND',
        },
      }
      saveMutation.mutate(payload)
    } catch {
      // Validate error
    }
  }

  // Thống kê nhanh
  const totalEmployees = deptData?.reduce((acc, d) => acc + (d.employeeCount || 0), 0) || 0
  const totalBudget = deptData?.reduce((acc, d) => acc + (d.budget?.monthly || 0), 0) || 0

  // Bảng dữ liệu
  const columns = [
    {
      title: 'Phòng ban',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <span>{record.name}</span>
            <Tag color="blue" className="font-mono text-xs m-0">
              {record.code}
            </Tag>
          </div>
          {record.description && (
            <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Phòng ban cấp trên',
      dataIndex: 'parentId',
      key: 'parentId',
      render: (parent) =>
        parent ? (
          <Tag color="cyan" className="font-medium">
            {parent.name || parent.code}
          </Tag>
        ) : (
          <Tag color="purple">Phòng ban gốc (Trụ sở)</Tag>
        ),
    },
    {
      title: 'Trưởng phòng',
      dataIndex: 'managerId',
      key: 'managerId',
      render: (manager) =>
        manager ? (
          <div className="flex items-center gap-2">
            <Avatar
              src={manager.avatar}
              icon={<UserOutlined />}
              size="small"
              className="bg-indigo-600 shrink-0"
            />
            <div>
              <div className="text-xs font-semibold text-slate-800">{manager.fullName}</div>
              <div className="text-[11px] text-slate-400 font-mono">{manager.employeeCode || manager.email}</div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Chưa bổ nhiệm</span>
        ),
    },
    {
      title: 'Nhân sự',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      align: 'center',
      render: (count) => (
        <Tag color="geekblue" className="font-semibold px-2 py-0.5">
          <TeamOutlined className="mr-1" />
          {count || 0} người
        </Tag>
      ),
    },
    {
      title: 'Ngân sách (Tháng)',
      key: 'budget',
      render: (_, record) => (
        <span className="text-xs font-mono font-medium text-slate-700">
          {(record.budget?.monthly || 0).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      render: (loc) =>
        loc ? (
          <span className="text-xs text-slate-600 flex items-center gap-1">
            <EnvironmentOutlined className="text-slate-400" />
            {loc}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Can I="department:update">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => handleOpenModal(record)}
            />
          </Can>
          <Can I="department:delete">
            <Popconfirm
              title="Xác nhận xóa phòng ban"
              description={`Bạn có chắc muốn xóa phòng ban "${record.name}"?`}
              onConfirm={() => deleteMutation.mutate(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ]

  // Chuyển đổi dữ liệu cây tổ chức cho Tree Antd
  const mapTreeNodes = (nodes) =>
    nodes.map((node) => ({
      title: (
        <div className="flex items-center gap-2 py-1">
          <span className="font-semibold text-slate-800">{node.name}</span>
          <Tag color="blue" className="font-mono text-[11px] m-0">
            {node.code}
          </Tag>
          <Tag color="geekblue" className="text-[11px] m-0">
            {node.employeeCount || 0} nhân sự
          </Tag>
          {node.managerId && (
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-2">
              <UserOutlined className="text-indigo-500" />
              TP: {node.managerId.fullName}
            </span>
          )}
        </div>
      ),
      key: node._id,
      children: node.children?.length ? mapTreeNodes(node.children) : undefined,
    }))

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang & Nút hành động ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 !text-slate-900 font-bold tracking-tight">
            Cơ cấu Phòng ban &amp; Tổ chức
          </Title>
          <Text className="text-slate-500 text-sm">
            Quản lý sơ đồ phân cấp phòng ban, phân bổ nhân sự và ngân sách hoạt động
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="table">
              <UnorderedListOutlined className="mr-1.5" />
              Bảng biểu
            </Radio.Button>
            <Radio.Button value="tree">
              <ApartmentOutlined className="mr-1.5" />
              Sơ đồ cây
            </Radio.Button>
          </Radio.Group>

          <Can I="department:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm font-semibold"
            >
              Thêm phòng ban
            </Button>
          </Can>
        </div>
      </div>

      {/* ── Thống kê tổng quan ────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Tổng số phòng ban</span>}
              value={deptData?.length || 0}
              prefix={<ApartmentOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Tổng nhân sự trực thuộc</span>}
              value={totalEmployees}
              prefix={<TeamOutlined className="text-indigo-500 mr-2" />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase">Tổng ngân sách hàng tháng</span>}
              value={totalBudget}
              prefix={<DollarOutlined className="text-emerald-500 mr-2" />}
              suffix="₫"
              formatter={(val) => Number(val).toLocaleString('vi-VN')}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Nội dung chính theo View Mode ─────────────────────────── */}
      {viewMode === 'table' ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Tìm theo tên hoặc mã phòng ban..."
              prefix={<SearchOutlined className="text-slate-400" />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <Table
            columns={columns}
            dataSource={deptData || []}
            rowKey="_id"
            loading={isLoadingDepts}
            pagination={{ pageSize: 15, showTotal: (total) => `Tổng cộng: ${total} phòng ban` }}
            className="border-slate-100"
          />
        </Card>
      ) : (
        <Card className="rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="p-4">
            <Title level={5} className="!mb-4 text-slate-700">
              Sơ đồ phân cấp cơ cấu tổ chức doanh nghiệp
            </Title>
            {treeData?.length ? (
              <Tree
                showLine={{ showLeafIcon: false }}
                defaultExpandAll
                treeData={mapTreeNodes(treeData)}
                className="font-medium text-slate-800"
              />
            ) : (
              <div className="text-slate-400 py-8 text-center italic">
                Chưa có dữ liệu phòng ban hoặc đang tải...
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Modal Thêm / Chỉnh sửa Phòng ban ───────────────────────── */}
      <Modal
        title={
          <div className="text-base font-bold text-slate-800">
            {editingDept ? `Chỉnh sửa phòng ban: ${editingDept.name}` : 'Thêm mới phòng ban'}
          </div>
        }
        open={isModalOpen}
        onOk={handleFormSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingDept(null)
          form.resetFields()
        }}
        confirmLoading={saveMutation.isPending}
        okText={editingDept ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Tên phòng ban</span>}
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
              >
                <Input placeholder="VD: Phòng Kỹ thuật Công nghệ" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Mã phòng ban</span>}
                name="code"
                rules={[{ required: true, message: 'Vui lòng nhập mã viết tắt' }]}
              >
                <Input placeholder="VD: TECH, HR, SALE" className="uppercase" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Phòng ban cấp trên</span>}
                name="parentId"
              >
                <Select
                  placeholder="Chọn phòng ban cha (nếu có)"
                  allowClear
                  options={deptData
                    ?.filter((d) => !editingDept || d._id !== editingDept._id)
                    ?.map((d) => ({
                      label: `${d.name} (${d.code})`,
                      value: d._id,
                    }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Bổ nhiệm Trưởng phòng</span>}
                name="managerId"
              >
                <Select
                  placeholder="Chọn nhân sự làm Trưởng phòng"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={employees?.map((emp) => ({
                    label: `${emp.fullName} (${emp.employeeCode || emp.email})`,
                    value: emp._id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Ngân sách hàng tháng (VNĐ)</span>}
                name="budgetMonthly"
              >
                <InputNumber
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Thứ tự hiển thị</span>}
                name="order"
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Địa điểm làm việc</span>}
                name="location"
              >
                <Input placeholder="VD: Tầng 4 - Trụ sở chính" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="font-semibold text-slate-700">Email phòng ban</span>}
                name="email"
              >
                <Input placeholder="tech-dept@nexus-corp.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span className="font-semibold text-slate-700">Mô tả chức năng &amp; nhiệm vụ</span>}
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Mô tả chức năng chính của phòng ban..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
