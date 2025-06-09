const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const wellsRouter = require('./routes/wells');
const computeRouter = require('./routes/compute');
const fileRouter = require('./routes/file');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet()); // 安全头部
app.use(cors()); // 跨域支持
app.use(morgan('combined')); // 日志记录
app.use(express.json({ limit: '10mb' })); // JSON解析，限制10MB
app.use(express.urlencoded({ extended: true }));

// 路由配置
app.use('/api/wells', wellsRouter);
app.use('/api/compute', computeRouter);
app.use('/api/file', fileRouter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'FieldOpt Backend'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '接口不存在',
    message: `路径 ${req.originalUrl} 未找到`
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
  });
});

app.listen(PORT, () => {
  console.log(`FieldOpt 后端服务运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;