import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { useMe } from '@/hooks/useAuth'

const { Content, Sider } = Layout

export default function MainLayout() {
  // Tự động đồng bộ hồ sơ và permissions mới nhất từ backend
  useMe()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: '#001529' }}>
        <Sidebar />
      </Sider>
      <Layout>
        <Header />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
