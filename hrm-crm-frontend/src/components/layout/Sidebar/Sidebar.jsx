import { Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined, TeamOutlined, ClockCircleOutlined, CalendarOutlined,
  DollarOutlined, CheckSquareOutlined, VideoCameraOutlined,
  UserOutlined, ApartmentOutlined, ContactsOutlined, FunnelPlotOutlined,
  FileTextOutlined, LineChartOutlined, CustomerServiceOutlined, TagsOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { usePermission } from '@/hooks/usePermission'

const rawMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: 'hrm', icon: <ApartmentOutlined />, label: 'HRM',
    children: [
      { key: '/hrm/roles',       icon: <SafetyCertificateOutlined />, label: 'Vai trò & Quyền', permission: 'system:read' },
      { key: '/hrm/employees',   icon: <TeamOutlined />,              label: 'Nhân viên',       permission: 'employee:read' },
      { key: '/hrm/departments', icon: <ApartmentOutlined />,         label: 'Phòng ban',       permission: 'department:read' },
      { key: '/hrm/attendance',  icon: <ClockCircleOutlined />,       label: 'Chấm công',       permission: 'attendance:read' },
      { key: '/hrm/leave',       icon: <CalendarOutlined />,          label: 'Nghỉ phép',       permission: 'leave:read' },
      { key: '/hrm/payroll',     icon: <DollarOutlined />,            label: 'Lương',           permission: 'payroll:read' },
      { key: '/hrm/tasks',       icon: <CheckSquareOutlined />,       label: 'Task',            permission: 'task:read' },
      { key: '/hrm/meetings',    icon: <VideoCameraOutlined />,       label: 'Cuộc họp',        permission: 'meeting:read' },
    ]
  },
  {
    key: 'crm', icon: <ContactsOutlined />, label: 'CRM',
    children: [
      { key: '/crm/companies',   icon: <UserOutlined />,              label: 'Công ty KH',      permission: 'crm_company:read' },
      { key: '/crm/contacts',    icon: <ContactsOutlined />,          label: 'Người liên hệ',   permission: 'crm_contact:read' },
      { key: '/crm/leads',       icon: <TagsOutlined />,              label: 'Leads',           permission: 'crm_lead:read' },
      { key: '/crm/pipeline',    icon: <FunnelPlotOutlined />,        label: 'Pipeline',        permission: 'crm_opportunity:read' },
      { key: '/crm/activities',  icon: <CalendarOutlined />,          label: 'Hoạt động',       permission: 'crm_activity:read' },
      { key: '/crm/quotations',  icon: <FileTextOutlined />,          label: 'Báo giá',         permission: 'crm_quotation:read' },
      { key: '/crm/invoices',    icon: <DollarOutlined />,            label: 'Hoá đơn',         permission: 'crm_invoice:read' },
      { key: '/crm/tickets',     icon: <CustomerServiceOutlined />,   label: 'Support',         permission: 'crm_ticket:read' },
    ]
  },
  { key: '/reports', icon: <LineChartOutlined />, label: 'Báo cáo', permission: 'report:read' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = usePermission()

  // Lọc menu theo quyền người dùng
  const filteredMenuItems = rawMenuItems
    .map((group) => {
      if (group.children) {
        const visibleChildren = group.children.filter(
          (child) => !child.permission || hasPermission(child.permission)
        )
        if (visibleChildren.length === 0) return null
        return { ...group, children: visibleChildren }
      }

      if (group.permission && !hasPermission(group.permission)) {
        return null
      }
      return group
    })
    .filter(Boolean)

  return (
    <div>
      <div style={{ padding: '20px 16px', color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
        🏢 HRM + CRM
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['hrm', 'crm']}
        items={filteredMenuItems}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  )
}
