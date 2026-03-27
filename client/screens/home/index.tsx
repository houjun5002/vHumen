import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome6 } from '@expo/vector-icons';
import RNSSE from 'react-native-sse';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createFormDataFile } from '@/utils';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUri?: string;
}

// 预置的快速问题
const QUICK_QUESTIONS = [
  '身份证丢了怎么补办？',
  '户口迁移怎么办理？',
  '如何识别电信诈骗？',
  '报警流程是什么？',
];

// 创建动画值（在组件外部创建以避免ref问题）
const createPulseAnim = () => new Animated.Value(1);

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('待机中');

  // 引用
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const sseRef = useRef<RNSSE | null>(null);
  const pulseAnim = useMemo(() => createPulseAnim(), []);
  const messageIdCounterRef = useRef(0);

  // 脉冲动画
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('需要麦克风权限才能使用语音功能');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setCurrentStatus('正在录音...');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('录音启动失败，请重试');
    }
  };

  // 停止录音并识别
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setCurrentStatus('识别中...');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        await recognizeSpeech(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setCurrentStatus('待机中');
    }
  };

  // 语音识别
  const recognizeSpeech = async (audioUri: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/asr.ts
       * 接口：POST /api/v1/asr/recognize
       * Body 参数：audio (FormData file)
       */
      const formData = new FormData();
      const audioFile = await createFormDataFile(audioUri, 'recording.m4a', 'audio/m4a');
      formData.append('audio', audioFile as any);

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/asr/recognize`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.text) {
        setInputText(data.text);
        // 自动发送消息
        sendMessage(data.text);
      } else {
        alert('语音识别失败，请重试');
        setCurrentStatus('待机中');
      }
    } catch (error) {
      console.error('ASR error:', error);
      alert('语音识别失败，请重试');
      setCurrentStatus('待机中');
    }
  };

  // 发送消息
  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isThinking) return;

    messageIdCounterRef.current += 1;
    const userMessage: Message = {
      id: `msg-${messageIdCounterRef.current}`,
      role: 'user',
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);
    setCurrentStatus('思考中...');
    scrollToBottom();

    // 流式获取回答
    await streamChat(messageText);
  };

  // 流式对话
  const streamChat = async (message: string) => {
    try {
      // 构建历史消息
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      /**
       * 服务端文件：server/src/routes/chat.ts
       * 接口：POST /api/v1/chat/stream
       * Body 参数：message: string, history?: Array<{role: string, content: string}>
       */
      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat/stream`;

      sseRef.current = new RNSSE(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, history }),
        method: 'POST',
      });

      messageIdCounterRef.current += 1;
      const assistantMessageId = `msg-${messageIdCounterRef.current}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      sseRef.current.addEventListener('message', (event) => {
        if (event.data === '[DONE]') {
          setIsThinking(false);
          setCurrentStatus('待机中');
          sseRef.current?.close();

          // 对话完成后合成语音
          const lastMessage = messages[messages.length - 1];
          if (assistantMessage.content) {
            synthesizeSpeech(assistantMessage.content);
          }
          return;
        }

        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          if (data.content) {
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content += data.content;
              }
              return newMessages;
            });
            scrollToBottom();
          }
        } catch (e) {
          console.error('Parse SSE error:', e);
        }
      });

      sseRef.current.addEventListener('error', (error) => {
        console.error('SSE error:', error);
        setIsThinking(false);
        setCurrentStatus('待机中');
      });

    } catch (error) {
      console.error('Chat error:', error);
      setIsThinking(false);
      setCurrentStatus('待机中');
    }
  };

  // 语音合成
  const synthesizeSpeech = async (text: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/tts.ts
       * 接口：POST /api/v1/tts/synthesize
       * Body 参数：text: string, speaker?: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success && data.audioUri) {
        // 更新消息的音频URI
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.audioUri = data.audioUri;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  // 播放音频
  const playAudio = async (audioUri: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;
      setIsPlaying(true);
      setCurrentStatus('播放中...');

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentStatus('待机中');
        }
      });
    } catch (error) {
      console.error('Play audio error:', error);
      setIsPlaying(false);
      setCurrentStatus('待机中');
    }
  };

  // 渲染消息
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <ThemedText
          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText,
          ]}
        >
          {message.content}
        </ThemedText>

        {/* 音频播放按钮 */}
        {!isUser && message.audioUri && (
          <TouchableOpacity
            style={styles.audioPlayer}
            onPress={() => playAudio(message.audioUri!)}
          >
            <FontAwesome6
              name={isPlaying ? 'pause' : 'play'}
              size={12}
              color="#1E3A8A"
            />
            <ThemedText style={styles.audioPlayerText}>
              点击播放语音
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Screen backgroundColor="#0A1628" statusBarStyle="light">
      {/* 标题栏 */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerTitle}>智慧警务助手</ThemedText>
          <ThemedText style={styles.headerSubtitle}>AI数字人警务咨询</ThemedText>
        </View>
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(30, 58, 138, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => router.push('/voice-chat')}
        >
          <FontAwesome6 name="microphone" size={20} color="#93C5FD" />
        </TouchableOpacity>
      </View>

      {/* 合规提示 */}
      <View style={styles.disclaimer}>
        <ThemedText style={styles.disclaimerText}>
          AI数字人警务助手，仅供咨询参考，不具备执法效力
        </ThemedText>
      </View>

      {/* 视频区域 */}
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          {/* 数字人头像 */}
          <View style={styles.avatarContainer}>
            <FontAwesome6
              name="user-tie"
              size={60}
              color="#93C5FD"
            />
          </View>
        </View>

        {/* 状态指示器 */}
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, isRecording && styles.statusDotRecording]} />
          <ThemedText style={styles.statusText}>{currentStatus}</ThemedText>
        </View>
      </View>

      {/* 对话区域 */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            // 欢迎界面
            <View style={styles.welcomeContainer}>
              <ThemedText style={styles.welcomeTitle}>您好，我是小警</ThemedText>
              <ThemedText style={styles.welcomeSubtitle}>
                我可以帮您解答户籍办理、身份证补办、交通法规、反诈宣传等警务咨询问题
              </ThemedText>
              <View style={styles.quickActions}>
                {QUICK_QUESTIONS.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionButton}
                    onPress={() => sendMessage(question)}
                  >
                    <ThemedText style={styles.quickActionText}>{question}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            // 消息列表
            messages.map(renderMessage)
          )}

          {/* 思考指示器 */}
          {isThinking && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={theme.textMuted} />
              <ThemedText style={{ marginLeft: 8, color: theme.textMuted }}>
                正在思考...
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* 输入区域 */}
        <View style={styles.inputContainer}>
          {/* 语音按钮 */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isThinking}
            >
              <FontAwesome6
                name={isRecording ? 'stop' : 'microphone'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* 文本输入 */}
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="输入您的问题..."
              placeholderTextColor={theme.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isThinking}
            />
          </View>

          {/* 发送按钮 */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isThinking) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isThinking}
          >
            <FontAwesome6
              name="paper-plane"
              size={18}
              color={inputText.trim() && !isThinking ? '#FFFFFF' : theme.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}
