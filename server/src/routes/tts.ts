import express, { type Request, type Response } from 'express';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const router = express.Router();

/**
 * 语音合成接口
 * 接收文字，返回音频URL
 */
router.post('/synthesize', async (req: Request, res: Response) => {
  const { text, speaker } = req.body;

  if (!text) {
    res.status(400).json({ error: '请输入要合成的文字' });
    return;
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    // 使用男性正式音色（警用风格）
    const speakerId = speaker || 'zh_male_m191_uranus_bigtts';

    const result = await client.synthesize({
      uid: 'police_assistant_user',
      text: text,
      speaker: speakerId,
      audioFormat: 'mp3',
      sampleRate: 24000,
      speechRate: 0,  // 正常语速
      loudnessRate: 0 // 正常音量
    });

    res.json({
      success: true,
      audioUri: result.audioUri,
      audioSize: result.audioSize
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      success: false, 
      error: '语音合成失败，请稍后重试' 
    });
  }
});

/**
 * 获取可用音色列表
 */
router.get('/voices', (req: Request, res: Response) => {
  const voices = [
    { id: 'zh_male_m191_uranus_bigtts', name: '云舟（男声，正式）', description: '适合警务咨询' },
    { id: 'zh_male_taocheng_uranus_bigtts', name: '小天（男声）', description: '亲和力强' },
    { id: 'zh_female_xiaohe_uranus_bigtts', name: '小何（女声，通用）', description: '标准女声' },
    { id: 'zh_female_vv_uranus_bigtts', name: 'Vivi（女声，双语）', description: '中英双语' },
    { id: 'zh_male_dayi_saturn_bigtts', name: '大义（男声，配音）', description: '视频配音专用' }
  ];

  res.json({
    success: true,
    voices: voices
  });
});

export default router;
