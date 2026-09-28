import { Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined, TeamOutlined, ClockCircleOutlined, CalendarOutlined,
  DollarOutlined, CheckSquareOutlined, VideoCameraOutlined,
  UserOutlined, ApartmentOutlined, ContactsOutlined, FunnelPlotOutlined,
  FileTextOutlined, LineChartOutlined, CustomerServiceOutlined, TagsOutlined
} from '@ant-design/icons'

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: 'hrm', icon: <ApartmentOutlined />, label: 'HRM',
    children: [
      { key: '/hrm/employees',   icon: <TeamOutlined />,          label: 'Nhân viên' },
      { key: '/hrm/departments', icon: <ApartmentOutlined />,     label: 'Phòng ban' },
      { key: '/hrm/attendance',  icon: <ClockCircleOutlined />,   label: 'Chấm công' },
      { key: '/hrm/leave',       icon: <CalendarOutlined />,      label: 'Nghỉ phép' },
      { key: '/hrm/payroll',     icon: <DollarOutlined />,        label: 'Lương' },
      { key: '/hrm/tasks',       icon: <CheckSquareOutlined />,   label: 'Task' },
      { key: '/hrm/meetings',    icon: <VideoCameraOutlined />,   label: 'Cuộc họp' },
    ]
  },
  {
    key: 'crm', icon: <ContactsOutlined />, label: 'CRM',
    children: [
      { key: '/crm/companies',   icon: <UserOutlined />,          label: 'Công ty KH' },
      { key: '/crm/contacts',    icon: <ContactsOutlined />,      label: 'Người liên hệ' },
      { key: '/crm/leads',       icon: <TagsOutlined />,          label: 'Leads' },
      { key: '/crm/pipeline',    icon: <FunnelPlotOutlined />,    label: 'Pipeline' },
      { key: '/crm/activities',  icon: <CalendarOutlined />,      label: 'Hoạt động' },
      { key: '/crm/quotations',  icon: <FileTextOutlined />,      label: 'Báo giá' },
      { key: '/crm/invoices',    icon: <DollarOutlined />,        label: 'Hoá đơn' },
      { key: '/crm/tickets',     icon: <CustomerServiceOutlined />, label: 'Support' },
    ]
  },
  { key: '/reports', icon: <LineChartOutlined />, label: 'Báo cáo' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

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
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  )
}
