'use client';
import { App, Button, Card, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import axios from 'axios';

const Login = () => {
  const { message } = App.useApp();
  const { loading, run } = useRequest((data) => axios.post('/api/user/login', data), {
    manual: true,
    onSuccess: (res) => {
      if (res.data.status === 'success') {
        window.location.reload();
        return;
      }
      message.error('账号错误！');
    },
  });
  return (
    <div className="flex-1 pt-[18%] px-12 flex flex-col justify-center items-center">
      <h3 className="mb-4 text-2xl">Account Login</h3>
      <Card bordered={false} style={{ width: 'min(500px, 80vw)', height: 'max-content' }}>
        <Form size="large" action="/api/user/login" onFinish={run}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}>
            Log in
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
