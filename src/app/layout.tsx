import './global.css';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Deeplx 负载均衡',
  description: 'Deeplx 负载均衡',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <App>{children}</App>
        </AntdRegistry>
      </body>
    </html>
  );
}
