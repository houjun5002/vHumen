import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import RNSSE from 'react-native-sse';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
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

type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

// 预定义波形高度（避免随机）
const WAVEFORM_HEIGHTS = [25, 35, 45, 30, 50, 40, 28, 38, 32];

// 波形条组件
const WaveformBar: React.FC<{ delay: number; isActive: boolean; targetHeight: number }> = ({
  delay,
  isActive,
  targetHeight,
}) => {
  const animatedHeight = useMemo(() => new Animated.Value(8), []);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedHeight, {
            toValue: targetHeight,
            duration: 200 + delay * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animatedHeight, {
            toValue: 8,
            duration: 200 + delay * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      animatedHeight.setValue(8);
    }
  }, [isActive, delay, targetHeight, animatedHeight]);

  return (
    <Animated.View
      style={{
        width: 3,
        height: animatedHeight,
        backgroundColor: isActive ? '#6366F1' : 'rgba(99, 102, 241, 0.3)',
        marginHorizontal: 2,
        borderRadius: 2,
      }}
    />
  );
};

// 波形组件
const Waveform: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const bars = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => ({
      delay: i,
      height: WAVEFORM_HEIGHTS[i],
    }));
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60 }}>
      {bars.map((bar, index) => (
        <WaveformBar key={index} delay={bar.delay} isActive={isActive} targetHeight={bar.height} />
      ))}
    </View>
  );
};

export default function VoiceChatScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 状态
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // 引用
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const sseRef = useRef<RNSSE | null>(null);
  const messageIdCounterRef = useRef(0);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 状态提示文本
  const getStatusText = useCallback(() => {
    switch (conversationState) {
      case 'listening':
        return '正在聆听...';
      case 'thinking':
        return '思考中...';
      case 'speaking':
        return '正在回答...';
      default:
        return '点击下方按钮开始对话';
    }
  }, [conversationState]);

  const getStatusSubtext = useCallback(() => {
    switch (conversationState) {
      case 'listening':
        return '说完后松开按钮或等待自动识别';
      case 'thinking':
        return '正在为您查询警务信息';
      case 'speaking':
        return '点击可打断回答';
      default:
        return '您可以询问户籍办理、身份证补办等问题';
    }
  }, [conversationState]);

  // 脉冲动画
  useEffect(() => {
    if (conversationState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [conversationState]);

  // 清理资源函数（放在useEffect之前）
  const cleanupResources = useCallback(async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
    if (sseRef.current) {
      sseRef.current.close();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  // 开始录音
  const startListening = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('需要麦克风权限');
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
      setConversationState('listening');
      setCurrentText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('录音启动失败');
    }
  };

  // 停止录音并发送
  const stopListeningAndSend = async () => {
    if (!recordingRef.current || conversationState !== 'listening') return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setConversationState('thinking');
        await recognizeAndChat(uri);
      } else {
        setConversationState('idle');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setConversationState('idle');
    }
  };

  // 语音识别并对话
  const recognizeAndChat = async (audioUri: string) => {
    try {
      // 语音识别
      const formData = new FormData();
      const audioFile = await createFormDataFile(audioUri, 'recording.m4a', 'audio/m4a');
      formData.append('audio', audioFile as any);

      const asrResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/asr/recognize`, {
        method: 'POST',
        body: formData,
      });

      const asrData = await asrResponse.json();

      if (!asrData.success || !asrData.text) {
        setConversationState('idle');
        alert('语音识别失败，请重试');
        return;
      }

      const userText = asrData.text;
      setCurrentText(userText);

      // 添加用户消息
      messageIdCounterRef.current += 1;
      const userMessage: Message = {
        id: `msg-${messageIdCounterRef.current}`,
        role: 'user',
        content: userText,
      };
      setMessages((prev) => [...prev, userMessage]);

      // 流式对话
      await streamChat(userText);
    } catch (error) {
      console.error('Recognize and chat error:', error);
      setConversationState('idle');
    }
  };

  // 流式对话
  const streamChat = async (message: string) => {
    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat/stream`;

      sseRef.current = new RNSSE(url, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
        method: 'POST',
      });

      messageIdCounterRef.current += 1;
      const assistantMessageId = `msg-${messageIdCounterRef.current}`;
      let fullResponse = '';

      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);

      sseRef.current.addEventListener('message', (event) => {
        if (event.data === '[DONE]') {
          sseRef.current?.close();
          // 对话完成，合成语音
          if (fullResponse && !isMuted) {
            synthesizeAndPlay(fullResponse, assistantMessageId);
          } else {
            setConversationState('idle');
          }
          return;
        }

        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          if (data.content) {
            fullResponse += data.content;
            setCurrentText(fullResponse);
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = fullResponse;
              }
              return newMessages;
            });
          }
        } catch (e) {
          console.error('Parse SSE error:', e);
        }
      });

      sseRef.current.addEventListener('error', (error) => {
        console.error('SSE error:', error);
        setConversationState('idle');
      });
    } catch (error) {
      console.error('Chat error:', error);
      setConversationState('idle');
    }
  };

  // 合成语音并播放
  const synthesizeAndPlay = async (text: string, messageId: string) => {
    try {
      setConversationState('speaking');

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success && data.audioUri) {
        // 更新消息的音频URI
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, audioUri: data.audioUri } : m))
        );

        // 播放音频
        await playAudio(data.audioUri);
      } else {
        setConversationState('idle');
      }
    } catch (error) {
      console.error('TTS error:', error);
      setConversationState('idle');
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

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setConversationState('idle');
        }
      });
    } catch (error) {
      console.error('Play audio error:', error);
      setConversationState('idle');
    }
  };

  // 打断播放
  const interruptPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (sseRef.current) {
      sseRef.current.close();
    }
    setConversationState('idle');
    setCurrentText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 关闭页面
  const handleClose = async () => {
    await cleanupResources();
    router.back();
  };

  // 主按钮点击
  const handleMainButtonPress = () => {
    switch (conversationState) {
      case 'idle':
        startListening();
        break;
      case 'listening':
        stopListeningAndSend();
        break;
      case 'speaking':
        interruptPlayback();
        break;
      default:
        break;
    }
  };

  // 获取主按钮图标
  const getMainButtonIcon = () => {
    switch (conversationState) {
      case 'listening':
        return 'stop';
      case 'thinking':
        return 'spinner';
      case 'speaking':
        return 'stop';
      default:
        return 'microphone';
    }
  };

  // 渲染消息
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    return (
      <View
        key={message.id}
        style={[
          styles.historyItem,
          isUser ? styles.historyItemUser : styles.historyItemAI,
        ]}
      >
        <ThemedText style={styles.historyText}>{message.content}</ThemedText>
      </View>
    );
  };

  return (
    <Screen backgroundColor="#0A0F1A" statusBarStyle="light">
      {/* 顶部导航 */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <ThemedText style={styles.headerTitle}>语音对话</ThemedText>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <FontAwesome6 name="xmark" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* 对话历史 */}
        {messages.length > 0 && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.historyList}
            contentContainerStyle={{ paddingBottom: 20 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(renderMessage)}
          </ScrollView>
        )}

        {/* 当前对话显示 */}
        <View style={styles.messagesContainer}>
          {/* AI头像和波形 */}
          <View style={styles.aiMessageWrapper}>
            <Animated.View
              style={[
                styles.avatarContainer,
                (conversationState === 'speaking' || conversationState === 'thinking') &&
                  styles.avatarContainerActive,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <FontAwesome6 name="user-tie" size={36} color="#A5B4FC" />
            </Animated.View>

            {/* 波形动画 */}
            <View style={styles.waveformContainer}>
              <Waveform
                isActive={conversationState === 'listening' || conversationState === 'speaking'}
              />
            </View>

            {/* 当前文字显示 */}
            {currentText ? (
              <ThemedText style={styles.messageText}>{currentText}</ThemedText>
            ) : messages.length === 0 ? (
              <View style={styles.welcomeHint}>
                <ThemedText style={styles.welcomeHintTitle}>您好，我是小警</ThemedText>
                <ThemedText style={styles.welcomeHintSubtitle}>
                  我可以帮您解答户籍办理、身份证补办、{'\n'}交通法规、反诈宣传等问题
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        {/* 状态提示 */}
        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
          <ThemedText style={styles.statusSubtext}>{getStatusSubtext()}</ThemedText>
        </View>

        {/* 底部控制 */}
        <View style={styles.controlsContainer}>
          {/* 主按钮 */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.mainButton,
                conversationState === 'listening' && styles.mainButtonActive,
                conversationState === 'thinking' && styles.mainButtonDisabled,
              ]}
              onPress={handleMainButtonPress}
              disabled={conversationState === 'thinking'}
              onPressIn={conversationState === 'idle' ? startListening : undefined}
              onPressOut={conversationState === 'listening' ? stopListeningAndSend : undefined}
            >
              {conversationState === 'thinking' ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <FontAwesome6 name={getMainButtonIcon()} size={28} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* 次要按钮 */}
          <View style={styles.secondaryButtons}>
            {/* 静音按钮 */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setIsMuted(!isMuted);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <FontAwesome6
                name={isMuted ? 'volume-xmark' : 'volume-high'}
                size={20}
                color={isMuted ? '#EF4444' : '#FFFFFF'}
              />
            </TouchableOpacity>

            {/* 清空对话 */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setMessages([]);
                setCurrentText('');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <FontAwesome6 name="trash" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 合规提示 */}
        <View style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerText}>
            AI数字人警务助手，仅供咨询参考，不具备执法效力
          </ThemedText>
        </View>
      </View>
    </Screen>
  );
}
