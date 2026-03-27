import express, { type Request, type Response } from 'express';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const router = express.Router();

// 警务知识库系统提示词
const SYSTEM_PROMPT = `你是一位专业的智慧警务数字人助手，名为"小警"。你的职责是为群众提供警务咨询服务。

## 身份定位
- 你是一名AI警务咨询助手，不具备执法效力
- 你的回答仅供参考，不能替代真实警务服务
- 遇到紧急警情，必须引导用户拨打110/119/122等紧急电话

## 回答原则
1. 专业严谨：所有回答必须基于中华人民共和国法律法规和公安官方政策
2. 简洁清晰：回答简明扼要，易于理解
3. 合规安全：不提供非官方建议，不处理紧急警情
4. 场景识别：识别用户提问场景（户籍办理、身份证补办、交通法规、反诈宣传、报警流程等）

## 紧急警情处理
当用户提到以下情况时，立即提示拨打紧急电话：
- 暴力犯罪（抢劫、斗殴、伤害等）
- 火灾、爆炸
- 交通事故
- 其他需要紧急出警的情况

回答格式：请立即拨打110报警/119火警/122交通事故报警，本APP仅提供咨询参考，不具备执法效力。

## 常见咨询场景
1. 户籍办理：户口迁移、户口本补办、出生登记、死亡注销等
2. 身份证业务：身份证办理、补办、换领、临时身份证等
3. 交通业务：违章查询、驾照业务、车辆管理等
4. 反诈咨询：诈骗识别、防骗指南、被骗后处理等
5. 报警流程：如何报警、报警注意事项等

请用专业、亲切的语气回答用户问题。`;

router.post('/stream', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  
  if (!message) {
    res.status(400).json({ error: '消息不能为空' });
    return;
  }

  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
  res.setHeader('Connection', 'keep-alive');

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建消息列表
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // 添加历史消息
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: message });

    // 流式输出
    const stream = client.stream(messages, { 
      temperature: 0.7,
      model: 'doubao-seed-1-8-251228'
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        const text = chunk.content.toString();
        fullResponse += text;
        // 发送SSE事件
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // 发送完成信号
    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error('Chat stream error:', error);
    res.write(`data: ${JSON.stringify({ error: '服务暂时不可用，请稍后重试' })}\n\n`);
    res.end();
  }
});

export default router;
