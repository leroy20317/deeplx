import { App, Card, ConfigProvider, Form, Popconfirm } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';

import { useMemo, useState } from 'react';

import { useRequest } from 'ahooks';
import axios from 'axios';
import { Button, Input, Space, Typography } from 'antd';

type TableListItem = { url: string } & API.UrlData;

const Main = () => {
  const { message } = App.useApp();
  const {
    data,
    loading,
    refresh: refreshList,
  } = useRequest(() => axios.get<{ status: string; data: TableListItem[] }>('/api/url/list'));
  const onSuccess = ({
    data: res,
  }: {
    data: { status: string; message?: string; data?: Record<string, API.UrlData> };
  }) => {
    if (res.status !== 'success') {
      message.error(res?.message || '操作失败');
      return;
    }
    if (res?.message) message.success(res.message);
    refreshList();
  };
  const { loading: addLoading, run: addUrls } = useRequest(
    (params) => axios.post('/api/url/add', params),
    {
      manual: true,
      onSuccess,
      onError: (e) => {
        console.log('error', e);
      },
    },
  );
  const { loading: testLoading, run: testUrls } = useRequest(
    (params) => axios.post('/api/url/test', params),
    {
      manual: true,
      onSuccess,
      onError: (e) => {
        console.log('error', e);
      },
    },
  );
  const { run: deleteUrls } = useRequest((params) => axios.post('/api/url/delete', params), {
    manual: true,
    onSuccess,
    onError: (e) => {
      console.log('error', e);
    },
  });
  const [filter, setFilter] = useState<{ url?: string; status?: string } | undefined>(undefined);

  const list = useMemo(() => {
    let defaultList = [...(data?.data.data || [])];
    if (filter?.url) {
      defaultList = defaultList.filter((item) => item.url.includes(filter.url || ''));
    }
    if (filter?.status) {
      defaultList = defaultList.filter((item) => item.status === Number(filter.status));
    }
    return defaultList;
  }, [filter, data?.data.data]);

  const columns: ProColumns<TableListItem>[] = [
    {
      title: 'ID',
      key: 'id',
      width: 60,
      render: (_, __, i) => i + 1,
      search: false,
    },
    {
      title: '接口链接',
      dataIndex: 'url',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        1: { text: '可用', status: 'Success' },
        0: { text: '不可用', status: 'Error' },
      },
      width: '10%',
      sorter: (a, b) => a.status - b.status,
    },
    {
      title: '翻译次数',
      dataIndex: 'translate_times',
      search: false,
      width: 120,
      sorter: (a, b) => a.translate_times - b.translate_times,
      render: (text) => (text ? <Typography.Text type="success">{text}</Typography.Text> : '-'),
    },
    {
      title: '错误次数',
      dataIndex: 'failure_times',
      search: false,
      width: 120,
      sorter: (a, b) => a.failure_times - b.failure_times,

      render: (text) => (text ? <Typography.Text type="danger">{text}</Typography.Text> : '-'),
    },
    {
      title: '最后成功时间',
      dataIndex: 'last_success',
      search: false,
      width: 200,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      search: false,
      render: (_, item) => (
        <Space size={[16, 8]} wrap>
          <Typography.Link
            onClick={() => {
              console.log('测试', item.url);
              testUrls({
                url: [item.url],
              });
            }}
          >
            测试
          </Typography.Link>
          <Popconfirm
            title="删除接口"
            description="是否删除所选接口?"
            onConfirm={() => {
              console.log('删除', item.url);
              deleteUrls({
                url: [item.url],
              });
            }}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Typography.Link type="danger">删除</Typography.Link>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <div className="flex-1 p-12 gap-4 flex flex-col">
      <Card>
        <ConfigProvider
          theme={{
            components: {
              Typography: {
                fontSize: 18,
              },
            },
          }}
        >
          <Space direction="vertical">
            <Typography.Text strong>
              通过
              <Typography.Link
                style={{ marginInline: 10 }}
                rel="noreferrer"
                target="_blank"
                href="https://fofa.info/result?qbase64=Ym9keT0neyJjb2RlIjoyMDAsIm1lc3NhZ2UiOiJEZWVwTCBGcmVlIEFQSSwgRGV2ZWxvcGVkIGJ5IHNqbGxlbyBhbmQgbWlzc3VvLiBHbyB0byAvdHJhbnNsYXRlIHdpdGggUE9TVC4gaHR0cDovL2dpdGh1Yi5jb20vT3dPLU5ldHdvcmsvRGVlcExYIn0n"
              >
                Fofa
              </Typography.Link>
              搜索接口
            </Typography.Text>
            <Typography.Text strong>填进输入框中，接口末尾带不带 /translate 都可以</Typography.Text>
            <Typography.Text strong>支持沉浸式翻译</Typography.Text>
            <Typography.Text strong copyable={{ text: `${window.location.origin}/translate` }}>
              使用链接：{window.location.origin}/translate
            </Typography.Text>
          </Space>
        </ConfigProvider>
      </Card>
      <Card>
        <Form<{ urls: string }>
          onFinish={({ urls }) => {
            if (!urls) {
              message.error('数据不能为空！');
              return;
            }
            const handleUrls = urls
              .split(/\n|\|/)
              .map((ele) => {
                if (!URL.canParse(ele)) return undefined;
                const url = new URL(ele);
                if (!/\/translate$/.test(url.pathname)) {
                  url.pathname += '/translate';
                }
                return url.toString();
              })
              .filter(Boolean);
            console.log('提交数据', handleUrls);
            addUrls({
              url: handleUrls,
            });
          }}
        >
          <Form.Item name="urls">
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 8 }}
              placeholder="支持翻译的接口链接，多个接口链接每行一个或用 | 分隔"
            />
          </Form.Item>
          <Button htmlType="submit" type="primary" loading={addLoading}>
            提交数据
          </Button>
        </Form>
      </Card>
      <ProTable<TableListItem>
        dataSource={list}
        loading={loading}
        bordered
        columns={columns}
        pagination={false}
        onReset={() => {
          setFilter(undefined);
        }}
        onSubmit={(values) => {
          setFilter(values);
        }}
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
          <Button
            key="retest"
            loading={testLoading}
            onClick={() => {
              const handleUrls = list.filter((ele) => ele.status === 0).map((ele) => ele.url);
              if (!handleUrls.length) {
                message.error('没有需要重新测试的接口');
                return;
              }
              console.log('retest', handleUrls);
              testUrls({
                url: handleUrls,
              });
            }}
          >
            重新测试不可用
          </Button>,
          <Button
            key="delete"
            danger
            onClick={() => {
              const handleUrls = list
                .filter((ele) => ele.status === 0 && ele.failure_times >= 10)
                .map((ele) => ele.url);
              if (!handleUrls.length) {
                message.error('没有超过十次失败的接口');
                return;
              }
              console.log('delete', handleUrls);
              deleteUrls({
                url: handleUrls,
              });
            }}
          >
            删除十次失败
          </Button>,
        ]}
      />
    </div>
  );
};
export default Main;
