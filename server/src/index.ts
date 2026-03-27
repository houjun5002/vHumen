import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat";
import asrRoutes from "./routes/asr";
import ttsRoutes from "./routes/tts";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 健康检查
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// 注册路由
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/asr', asrRoutes);
app.use('/api/v1/tts', ttsRoutes);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
