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
  Checkbox,
  Card,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Badge,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleService } from '@/services/hrm/role.service'
import { usePermission } from '@/hooks/usePermission'
import Can from '@/components/common/Can/Can'

const { Title, Text } = Typography

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [form] = Form.useForm()

  const { hasPermission } = usePermission()

  // 1. Lấy danh sách Roles
  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getRoles({ limit: 50 }),
    select: (res) => res.data,
  })

  // 2. Lấy danh mục Permissions grouped
  const { data: permissionsResponse, isLoading: isLoadingPerms } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: roleService.getPermissions,
    select: (res) => res.data,
  })

  const roles = rolesResponse || []
  const groupedPerms = permissionsResponse?.grouped || {}

  // 3. Mutation Tạo / Cập nhật Role
  const saveMutation = useMutation({
    mutationFn: (values) => {
      if (editingRole) {
        return roleService.updateRole(editingRole._id, values)
      }
      return roleService.createRole(values)
    },
    onSuccess: () => {
      message.success(editingRole ? 'Cập nhật vai trò thành công!' : 'Tạo vai trò mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      handleCloseModal()
    },
    onError: (err) => {
      message.error(err?.message || 'Có lỗi xảy ra khi lưu vai trò')
    },
  })

  // 4. Mutation Xóa Role
  const deleteMutation = useMutation({
    mutationFn: (id) => roleService.deleteRole(id),
    onSuccess: () => {
      message.success('Xóa vai trò thành công!')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (err) => {
      message.error(err?.message || 'Không thể xóa vai trò này')
    },
  })

  const handleOpenModal = (role = null) => {
    setEditingRole(role)
    if (role) {
      form.setFieldsValue({
        name: role.name,
        code: role.code,
        description: role.description,
        level: role.level,
        permissions: (role.permissions || []).map((p) => (typeof p === 'object' ? p._id : p)),
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ level: 3, permissions: [] })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRole(null)
    form.resetFields()
  }

  const handleSubmit = (values) => {
    saveMutation.mutate(values)
  }

  // Cấu hình bảng
  const columns = [
    {
      title: 'Mã định danh',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <Space orientation="vertical" size={2}>
          <Text strong className="font-mono text-blue-600">
            {code}
          </Text>
          {record.isSystem && <Tag color="gold">Hệ thống</Tag>}
        </Space>
      ),
    },
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.description || 'Chưa có mô tả'}</div>
        </div>
      ),
    },
    {
      title: 'Cấp bậc (Level)',
      dataIndex: 'level',
      key: 'level',
      render: (level) => {
        const color = level === 1 ? 'red' : level === 2 ? 'orange' : level === 3 ? 'blue' : 'default'
        return <Tag color={color}>Cấp {level}</Tag>
      },
    },
    {
      title: 'Số quyền hạn',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      render: (count, record) => {
        if (record.code === 'super_admin') {
          return <Tag color="green"><SafetyCertificateOutlined /> Toàn quyền (*)</Tag>
        }
        return <Badge count={count || 0} overflowCount={999} style={{ backgroundColor: '#108ee9' }} />
      },
    },
    {
      title: 'Nhân viên gán',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => <Tag color="purple">{count || 0} người</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Can do="system:update">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            >
              Sửa
            </Button>
          </Can>

          {!record.isSystem && (
            <Can do="system:delete">
              <Popconfirm
                title="Xóa vai trò"
                description={`Bạn có chắc muốn xóa vai trò "${record.name}"?`}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={() => deleteMutation.mutate(record._id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            </Can>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Quản lý Vai trò & Phân quyền (RBAC)
          </Title>
          <Text type="secondary">
            Thiết lập danh sách vai trò và phân bổ quyền hạn truy cập các module cho nhân sự
          </Text>
        </div>
        <Can do="system:create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal(null)}
          >
            Thêm vai trò mới
          </Button>
        </Can>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="_id"
          loading={isLoadingRoles}
          pagination={false}
        />
      </Card>

      {/* Modal Thêm / Chỉnh sửa Role */}
      <Modal
        title={editingRole ? `Chỉnh sửa vai trò: ${editingRole.name}` : 'Tạo vai trò mới'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        width={900}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={saveMutation.isPending}
            onClick={() => form.submit()}
          >
            Lưu vai trò
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên vai trò"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
              >
                <Input placeholder="Ví dụ: Trưởng phòng Kỹ thuật" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mã vai trò (Code)"
                name="code"
                rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }]}
              >
                <Input
                  placeholder="Ví dụ: tech_lead"
                  disabled={editingRole?.isSystem}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mô tả nhiệm vụ" name="description">
                <Input.TextArea rows={2} placeholder="Mô tả chức năng của vai trò..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Cấp bậc phân quyền (1: Cao nhất -> 4: Thấp nhất)"
                name="level"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={5} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          {/* Ma trận phân quyền */}
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <Text strong className="text-base">
                Danh sách quyền hạn cho phép:
              </Text>
              <Text type="secondary" className="text-xs">
                Tick chọn các hành động được phép thực thi
              </Text>
            </div>

            <Form.Item name="permissions">
              <Checkbox.Group className="w-full">
                <div className="max-h-[350px] overflow-y-auto space-y-4 pr-2">
                  {Object.entries(groupedPerms).map(([modName, perms]) => (
                    <Card
                      key={modName}
                      size="small"
                      title={
                        <Space>
                          <Tag color="cyan">{modName.toUpperCase()}</Tag>
                          <span className="text-xs text-gray-500 font-normal">
                            ({perms.length} hành động)
                          </span>
                        </Space>
                      }
                      className="bg-gray-50 border border-gray-200"
                    >
                      <Row gutter={[8, 8]}>
                        {perms.map((p) => (
                          <Col span={6} key={p._id}>
                            <Checkbox value={p._id}>
                              <span className="text-xs capitalize font-medium">{p.action}</span>
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  ))}
                </div>
              </Checkbox.Group>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

