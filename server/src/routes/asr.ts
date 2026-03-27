import express, { type Request, type Response } from 'express';
import { ASRClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import multer from 'multer';

const router = express.Router();

// 配置multer用于接收音频文件
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB限制
});

/**
 * 语音识别接口
 * 接收音频文件，返回识别的文字
 */
router.post('/recognize', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传音频文件' });
      return;
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const client = new ASRClient(config, customHeaders);

    // 将音频文件转为base64
    const audioBase64 = req.file.buffer.toString('base64');

    const result = await client.recognize({
      uid: 'police_assistant_user',
      base64Data: audioBase64
    });

    res.json({
      success: true,
      text: result.text,
      duration: result.duration
    });

  } catch (error) {
    console.error('ASR error:', error);
    res.status(500).json({ 
      success: false, 
      error: '语音识别失败，请稍后重试' 
    });
  }
});

/**
 * 从URL识别语音
 */
router.post('/recognize-url', async (req: Request, res: Response) => {
  const { audioUrl } = req.body;

  if (!audioUrl) {
    res.status(400).json({ error: '请提供音频URL' });
    return;
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const client = new ASRClient(config, customHeaders);

    const result = await client.recognize({
      uid: 'police_assistant_user',
      url: audioUrl
    });

    res.json({
      success: true,
      text: result.text,
      duration: result.duration
    });

  } catch (error) {
    console.error('ASR URL error:', error);
    res.status(500).json({ 
      success: false, 
      error: '语音识别失败，请稍后重试' 
    });
  }
});

export default router;
