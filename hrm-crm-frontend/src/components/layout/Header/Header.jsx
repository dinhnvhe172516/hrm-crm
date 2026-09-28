import { Layout, Avatar, Dropdown, Badge, Button } from 'antd'
import { BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'

const { Header: AntHeader } = Layout

export default function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const menuItems = [
    { key: 'profile', label: 'Hồ sơ', icon: <UserOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true },
  ]

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login') }
    if (key === 'profile') navigate('/profile')
  }

  return (
    <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, boxShadow: '0 1px 4px rgba(0,21,41,0.08)' }}>
      <Badge count={5}>
        <Button type="text" icon={<BellOutlined />} size="large" />
      </Badge>
      <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={user?.avatar} icon={<UserOutlined />} />
          <span>{user?.fullName || 'User'}</span>
        </div>
      </Dropdown>
    </AntHeader>
  )
}
