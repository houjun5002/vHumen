import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { createFormDataFile } from '@/utils';
import RNSSE from 'react-native-sse';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 创建动画值（在组件外部创建以避免ref问题）
const createPulseAnim = () => new Animated.Value(1);
const createWaveValues = () => 
  Array.from({ length: 12 }, () => new Animated.Value(8));

export default function VoiceChatScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 状态
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('点击麦克风开始对话');
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusText, setStatusText] = useState('');

  // 引用
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const sseRef = useRef<RNSSE | null>(null);
  const pulseAnim = useMemo(() => createPulseAnim(), []);
  const waveAnims = useMemo(() => createWaveValues(), []);
  const messageIdCounterRef = useRef(0);

  // 脉冲动画
  useEffect(() => {
    if (isRecording || isSpeaking) {
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
  }, [isRecording, isSpeaking]);

  // 波形动画
  useEffect(() => {
    if (isRecording) {
      waveAnims.forEach((anim: Animated.Value, index: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 8 + Math.random() * 32,
              duration: 200 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 8,
              duration: 200 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      waveAnims.forEach((anim: Animated.Value) => anim.setValue(8));
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
      setCurrentText('正在聆听...');
      setStatusText('说完后松开按钮');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('录音启动失败');
    }
  };

  // 停止录音并处理
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setCurrentText('识别中...');
      setStatusText('');
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        await recognizeAndChat(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setCurrentText('识别失败，请重试');
    }
  };

  // 语音识别并对话
  const recognizeAndChat = async (audioUri: string) => {
    try {
      // 1. 语音识别
      const formData = new FormData();
      const audioFile = await createFormDataFile(audioUri, 'recording.m4a', 'audio/m4a');
      formData.append('audio', audioFile as any);

      const asrResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/asr/recognize`, {
        method: 'POST',
        body: formData,
      });

      const asrData = await asrResponse.json();

      if (!asrData.success || !asrData.text) {
        setCurrentText('识别失败，请重试');
        return;
      }

      const userText = asrData.text;
      
      // 添加用户消息
      messageIdCounterRef.current += 1;
      const userMessage: Message = {
        id: `msg-${messageIdCounterRef.current}`,
        role: 'user',
        content: userText,
      };
      setMessages(prev => [...prev, userMessage]);
      
      // 2. 流式对话
      setCurrentText('');
      setIsThinking(true);
      setStatusText('思考中...');

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat/stream`;

      sseRef.current = new RNSSE(url, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history }),
        method: 'POST',
      });

      let fullResponse = '';
      
      messageIdCounterRef.current += 1;
      const assistantId = `msg-${messageIdCounterRef.current}`;

      sseRef.current.addEventListener('message', (event) => {
        if (event.data === '[DONE]') {
          setIsThinking(false);
          setStatusText('');
          sseRef.current?.close();
          
          // 保存助手消息
          if (fullResponse) {
            setMessages(prev => {
              const newMsgs = [...prev];
              const lastMsg = { id: assistantId, role: 'assistant' as const, content: fullResponse };
              if (newMsgs[newMsgs.length - 1]?.id === assistantId) {
                newMsgs[newMsgs.length - 1] = lastMsg;
              } else {
                newMsgs.push(lastMsg);
              }
              return newMsgs;
            });
            
            // 合成语音并播放
            synthesizeAndPlay(fullResponse);
          }
          return;
        }

        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          if (data.content) {
            fullResponse += data.content;
            setCurrentText(fullResponse);
          }
        } catch (e) {
          console.error('Parse SSE error:', e);
        }
      });

      sseRef.current.addEventListener('error', (error) => {
        console.error('SSE error:', error);
        setIsThinking(false);
        setCurrentText('服务连接失败');
      });

    } catch (error) {
      console.error('Recognize and chat error:', error);
      setCurrentText('处理失败，请重试');
      setIsThinking(false);
    }
  };

  // 合成并播放语音
  const synthesizeAndPlay = async (text: string) => {
    try {
      setCurrentText(text);
      setIsSpeaking(true);
      setStatusText('播放中...');

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success && data.audioUri) {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync({ uri: data.audioUri });
        soundRef.current = sound;
        await sound.playAsync();

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSpeaking(false);
            setStatusText('');
            setCurrentText('点击麦克风继续对话');
          }
        });
      } else {
        setIsSpeaking(false);
        setStatusText('');
        setCurrentText('点击麦克风继续对话');
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setCurrentText('语音合成失败');
    }
  };

  // 渲染波形
  const renderWaveform = () => {
    return (
      <View style={styles.waveContainer}>
        {waveAnims.map((anim: Animated.Value, index: number) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              { height: anim },
            ]}
          />
        ))}
      </View>
    );
  };

  // 渲染历史消息
  const renderHistory = () => {
    if (messages.length === 0) return null;

    return (
      <ScrollView 
        style={styles.historyScroll}
        contentContainerStyle={styles.historyContent}
      >
        {messages.slice(-6).map((msg) => (
          <View key={msg.id} style={styles.historyItem}>
            <ThemedText style={styles.historyLabel}>
              {msg.role === 'user' ? '您' : '小警'}
            </ThemedText>
            <ThemedText style={[
              styles.historyText,
              msg.role === 'user' && styles.historyTextUser
            ]}>
              {msg.content}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    );
  };

  const isDisabled = isThinking || isSpeaking;

  return (
    <Screen backgroundColor="#0A0F1E" statusBarStyle="light">
      <View style={styles.container}>
        {/* 顶部栏 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <FontAwesome6 name="chevron-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>语音对话</ThemedText>
          <View style={styles.headerRight} />
        </View>

        {/* 主内容 */}
        <View style={styles.content}>
          {/* 历史消息 */}
          <View style={styles.historyContainer}>
            {renderHistory()}
          </View>

          {/* 当前内容区域 */}
          <View style={styles.conversationArea}>
            {/* AI 头像或波形 */}
            {isRecording ? (
              renderWaveform()
            ) : (
              <View style={styles.aiAvatar}>
                <FontAwesome6 
                  name={isThinking ? "spinner" : isSpeaking ? "volume-high" : "robot"} 
                  size={32} 
                  color="#60A5FA"
                />
              </View>
            )}

            {/* 当前文字 */}
            <ThemedText style={styles.currentText}>
              {currentText || '...'}
            </ThemedText>

            {/* 状态提示 */}
            {statusText ? (
              <ThemedText style={styles.statusText}>{statusText}</ThemedText>
            ) : null}
          </View>

          {/* 底部控制区 */}
          <View style={styles.controlArea}>
            {/* 主按钮 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={isDisabled ? undefined : startRecording}
              onPressOut={isDisabled ? undefined : stopRecording}
              disabled={isDisabled}
              style={[
                styles.mainButton,
                isRecording && styles.mainButtonActive,
                isDisabled && styles.mainButtonDisabled,
              ]}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <FontAwesome6
                  name={isRecording ? 'stop' : isThinking ? 'spinner' : isSpeaking ? 'volume-high' : 'microphone'}
                  size={32}
                  color="#FFFFFF"
                />
              </Animated.View>
            </TouchableOpacity>

            {/* 提示文字 */}
            <ThemedText style={styles.hintText}>
              {isDisabled 
                ? (isThinking ? '思考中...' : '播放中...')
                : (isRecording ? '松开发送' : '按住说话')
              }
            </ThemedText>

            {/* 功能按钮 */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setMessages([]);
                  setCurrentText('点击麦克风开始对话');
                }}
              >
                <ThemedText style={styles.actionButtonText}>清空对话</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
