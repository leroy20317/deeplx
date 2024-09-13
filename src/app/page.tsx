'use client';
import Login from '@/components/Login';
import Main from 'src/components/Main';
import { Spin } from 'antd';
import axios from 'axios';
import { useRequest } from 'ahooks';
import { useState } from 'react';

async function checkLogin() {
  const res = await axios.get(`/api/user/check`, { withCredentials: true });
  return res.data.status === 'success';
}
const Home = () => {
  const [loading, setLoading] = useState(true);
  const { data: isLogin } = useRequest(checkLogin, {
    onSuccess: () => {
      setLoading(false);
    },
  });
  if (loading) {
    return <Spin fullscreen size="large" />;
  }
  return (
    <>
      <header className="h-16 bg-gray-900 text-amber-50 px-12 text-lg flex items-center">
        Deeplx 负载均衡
      </header>
      {isLogin ? <Main /> : <Login />}
    </>
  );
};

export default Home;
