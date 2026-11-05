import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Result
        status="403"
        title="403 - Quyền truy cập bị từ chối"
        subTitle="Tài khoản của bạn không có đủ quyền hạn để truy cập vào chức năng hoặc tài nguyên này."
        extra={[
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>,
          <Button
            key="home"
            type="primary"
            icon={<HomeOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            Về trang chủ
          </Button>,
        ]}
      />
    </div>
  )
}

