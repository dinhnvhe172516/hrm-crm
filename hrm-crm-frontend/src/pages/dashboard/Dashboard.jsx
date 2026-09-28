import { Row, Col, Card, Statistic } from 'antd'
import { TeamOutlined, CheckSquareOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons'

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="Tổng nhân viên" value={120} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Task đang làm" value={34} prefix={<CheckSquareOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Cuộc họp hôm nay" value={5} prefix={<CalendarOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Leads mới" value={18} prefix={<DollarOutlined />} /></Card></Col>
      </Row>
    </div>
  )
}
