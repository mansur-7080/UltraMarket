import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Table,
  Tag,
  Progress,
  Timeline,
  Select,
  DatePicker,
  Button,
  Space,
  Spin,
  notification,
  Tabs,
  Badge,
  Typography,
  Tooltip,
  Drawer,
} from 'antd';
import {
  DashboardOutlined,
  ServerOutlined,
  DatabaseOutlined,
  CloudOutlined,
  BugOutlined,
  ReloadOutlined,
  SettingOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import io from 'socket.io-client';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
    iops: number;
  };
  network: {
    incoming: number;
    outgoing: number;
    connections: number;
  };
}

interface ServiceHealth {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  uptime: number;
  responseTime: number;
  errorRate: number;
  version: string;
  lastCheck: Date;
  endpoints: Array<{
    path: string;
    method: string;
    status: number;
    responseTime: number;
  }>;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  acknowledgedBy?: string;
}

interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  message: string;
  metadata?: any;
  traceId?: string;
}

const SystemMonitoring: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertDrawerVisible, setAlertDrawerVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('all');

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = io(process.env.REACT_APP_MONITORING_WS_URL || 'ws://localhost:3010');

    socket.on('connect', () => {
      // WebSocket connection established
      setConnectionStatus('connected');
    });

    socket.on('metrics', (data: SystemMetrics) => {
      setSystemMetrics((prev) => [...prev.slice(-99), data]);
    });

    socket.on('serviceHealth', (data: ServiceHealth) => {
      setServices((prev) => prev.map((service) => (service.id === data.id ? data : service)));
    });

    socket.on('alert', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 99)]);

      // Show notification for critical alerts
      if (alert.type === 'critical' || alert.type === 'error') {
        notification.error({
          message: `${alert.type.toUpperCase()} Alert`,
          description: `${alert.service}: ${alert.message}`,
          duration: 0,
          onClick: () => setAlertDrawerVisible(true),
        });
      }
    });

    socket.on('log', (log: LogEntry) => {
      setLogs((prev) => [log, ...prev.slice(0, 999)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, [selectedTimeRange]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCurrentMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch metrics, services, alerts, and logs
      const [metricsRes, servicesRes, alertsRes, logsRes] = await Promise.all([
        fetch(`/api/v1/monitoring/metrics?range=${selectedTimeRange}`),
        fetch('/api/v1/monitoring/services'),
        fetch('/api/v1/monitoring/alerts?limit=100'),
        fetch('/api/v1/monitoring/logs?limit=1000'),
      ]);

      const [metrics, servicesData, alertsData, logsData] = await Promise.all([
        metricsRes.json(),
        servicesRes.json(),
        alertsRes.json(),
        logsRes.json(),
      ]);

      setSystemMetrics(metrics);
      setServices(servicesData);
      setAlerts(alertsData);
      setLogs(logsData);
    } catch (error) {
      // Error tracking will be handled by error boundary
      setError('Failed to fetch monitoring data');
      notification.error({
        message: 'Error',
        description: 'Failed to load monitoring data',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMetrics = async () => {
    try {
      const response = await fetch('/api/v1/monitoring/metrics/current');
      const metrics = await response.json();
      setSystemMetrics((prev) => [...prev.slice(-99), metrics]);
    } catch (error) {
      // Error tracking will be handled by error boundary
      // Failed to fetch current metrics
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/v1/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledgedBy: 'current-user' } : alert
        )
      );

      notification.success({
        message: 'Alert Acknowledged',
        description: 'Alert has been acknowledged successfully',
      });
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to acknowledge alert',
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/v1/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, resolved: true, resolvedAt: new Date() } : alert
        )
      );

      notification.success({
        message: 'Alert Resolved',
        description: 'Alert has been resolved successfully',
      });
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to resolve alert',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'critical':
        return '#ff4d4f';
      case 'down':
        return '#8c8c8c';
      default:
        return '#d9d9d9';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'blue';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      case 'critical':
        return 'magenta';
      default:
        return 'default';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'default';
      case 'info':
        return 'blue';
      case 'warn':
        return 'orange';
      case 'error':
        return 'red';
      case 'fatal':
        return 'magenta';
      default:
        return 'default';
    }
  };

  const currentMetrics = systemMetrics[systemMetrics.length - 1];
  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const criticalAlerts = activeAlerts.filter((alert) => alert.type === 'critical');

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ServiceHealth) => (
        <Space>
          <Badge
            status={
              record.status === 'healthy'
                ? 'success'
                : record.status === 'warning'
                  ? 'warning'
                  : 'error'
            }
          />
          <Text strong>{name}</Text>
          <Tag>{record.version}</Tag>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: number) => `${(uptime / 3600).toFixed(1)}h`,
    },
    {
      title: 'Response Time',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => `${time}ms`,
    },
    {
      title: 'Error Rate',
      dataIndex: 'errorRate',
      key: 'errorRate',
      render: (rate: number) => (
        <Text type={rate > 5 ? 'danger' : rate > 1 ? 'warning' : 'success'}>
          {rate.toFixed(2)}%
        </Text>
      ),
    },
  ];

  const alertColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={getAlertTypeColor(type)}>{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => new Date(timestamp).toLocaleTimeString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Alert) => (
        <Space>
          {!record.acknowledgedBy && (
            <Button size="small" onClick={() => acknowledgeAlert(record.id)}>
              Acknowledge
            </Button>
          )}
          {!record.resolved && (
            <Button size="small" type="primary" onClick={() => resolveAlert(record.id)}>
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (timestamp: Date) => new Date(timestamp).toLocaleTimeString(),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={getLogLevelColor(level)} size="small">
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 120,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <DashboardOutlined /> System Monitoring
          </Title>
        </Col>
        <Col>
          <Space>
            <Select
              value={selectedTimeRange}
              onChange={setSelectedTimeRange}
              style={{ width: 120 }}
            >
              <Option value="1h">Last Hour</Option>
              <Option value="6h">Last 6 Hours</Option>
              <Option value="24h">Last 24 Hours</Option>
              <Option value="7d">Last 7 Days</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchCurrentMetrics} loading={loading}>
              Refresh
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setAutoRefresh(!autoRefresh)}
              type={autoRefresh ? 'primary' : 'default'}
            >
              Auto Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert
          message={`${criticalAlerts.length} Critical Alert${criticalAlerts.length > 1 ? 's' : ''}`}
          description="Immediate attention required"
          type="error"
          icon={<AlertOutlined />}
          action={
            <Button size="small" danger onClick={() => setAlertDrawerVisible(true)}>
              View Details
            </Button>
          }
          style={{ marginBottom: 24 }}
          closable
        />
      )}

      {/* Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="CPU Usage"
              value={currentMetrics?.cpu.usage || 0}
              suffix="%"
              valueStyle={{
                color: (currentMetrics?.cpu.usage || 0) > 80 ? '#ff4d4f' : '#3f8600',
              }}
              prefix={<ServerOutlined />}
            />
            <Progress
              percent={currentMetrics?.cpu.usage || 0}
              showInfo={false}
              strokeColor={(currentMetrics?.cpu.usage || 0) > 80 ? '#ff4d4f' : '#52c41a'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={currentMetrics?.memory.usage || 0}
              suffix="%"
              valueStyle={{
                color: (currentMetrics?.memory.usage || 0) > 85 ? '#ff4d4f' : '#3f8600',
              }}
              prefix={<DatabaseOutlined />}
            />
            <Progress
              percent={currentMetrics?.memory.usage || 0}
              showInfo={false}
              strokeColor={(currentMetrics?.memory.usage || 0) > 85 ? '#ff4d4f' : '#52c41a'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={activeAlerts.length}
              valueStyle={{
                color: activeAlerts.length > 0 ? '#ff4d4f' : '#3f8600',
              }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Services Status"
              value={services.filter((s) => s.status === 'healthy').length}
              suffix={`/ ${services.length}`}
              valueStyle={{
                color: services.every((s) => s.status === 'healthy') ? '#3f8600' : '#ff4d4f',
              }}
              prefix={<CloudOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts and Data */}
      <Tabs defaultActiveKey="metrics">
        <TabPane
          tab={
            <span>
              <DashboardOutlined />
              System Metrics
            </span>
          }
          key="metrics"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="CPU & Memory Usage" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemMetrics.slice(-50)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                    />
                    <YAxis />
                    <RechartsTooltip labelFormatter={(time) => new Date(time).toLocaleString()} />
                    <Line
                      type="monotone"
                      dataKey="cpu.usage"
                      stroke="#8884d8"
                      name="CPU %"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory.usage"
                      stroke="#82ca9d"
                      name="Memory %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Network Traffic" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics.slice(-50)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                    />
                    <YAxis />
                    <RechartsTooltip labelFormatter={(time) => new Date(time).toLocaleString()} />
                    <Area
                      type="monotone"
                      dataKey="network.incoming"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Incoming (MB/s)"
                    />
                    <Area
                      type="monotone"
                      dataKey="network.outgoing"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Outgoing (MB/s)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ServerOutlined />
              Services
              <Badge count={services.filter((s) => s.status !== 'healthy').length} />
            </span>
          }
          key="services"
        >
          <Card>
            <Table
              dataSource={services}
              columns={serviceColumns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BugOutlined />
              Alerts
              <Badge count={activeAlerts.length} />
            </span>
          }
          key="alerts"
        >
          <Card>
            <Table
              dataSource={activeAlerts}
              columns={alertColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              Logs
            </span>
          }
          key="logs"
        >
          <Card
            extra={
              <Select value={selectedService} onChange={setSelectedService} style={{ width: 150 }}>
                <Option value="all">All Services</Option>
                {services.map((service) => (
                  <Option key={service.id} value={service.id}>
                    {service.name}
                  </Option>
                ))}
              </Select>
            }
          >
            <Table
              dataSource={logs.filter(
                (log) => selectedService === 'all' || log.service === selectedService
              )}
              columns={logColumns}
              rowKey={(record, index) => `${record.timestamp}-${index}`}
              pagination={{ pageSize: 20 }}
              size="small"
              scroll={{ y: 400 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Alert Details Drawer */}
      <Drawer
        title="Alert Details"
        placement="right"
        onClose={() => setAlertDrawerVisible(false)}
        open={alertDrawerVisible}
        width={600}
      >
        <Timeline>
          {alerts.slice(0, 20).map((alert) => (
            <Timeline.Item
              key={alert.id}
              color={getStatusColor(alert.type)}
              dot={
                alert.type === 'critical' ? (
                  <ExclamationCircleOutlined />
                ) : alert.resolved ? (
                  <CheckCircleOutlined />
                ) : (
                  <StopOutlined />
                )
              }
            >
              <div style={{ marginBottom: 8 }}>
                <Tag color={getAlertTypeColor(alert.type)}>{alert.type.toUpperCase()}</Tag>
                <Text strong>{alert.service}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text>{alert.message}</Text>
              </div>
              <div>
                <Text type="secondary">{new Date(alert.timestamp).toLocaleString()}</Text>
                {alert.resolved && (
                  <Text type="success" style={{ marginLeft: 16 }}>
                    Resolved
                  </Text>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Drawer>
    </motion.div>
  );
};

export default SystemMonitoring;
