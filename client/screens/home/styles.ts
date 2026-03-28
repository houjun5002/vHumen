import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      flexGrow: 1,
    },
    // 视频区域
    videoContainer: {
      flex: 1,
      backgroundColor: '#0A1628', // 深蓝色背景
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 300,
      position: 'relative',
    },
    videoPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0A1628',
    },
    avatarContainer: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(30, 58, 138, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#1E3A8A',
    },
    avatarIcon: {
      // 数字人图标样式
    },
    statusIndicator: {
      position: 'absolute',
      bottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(10, 22, 40, 0.8)',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10B981',
      marginRight: Spacing.sm,
    },
    statusDotRecording: {
      backgroundColor: '#EF4444',
    },
    statusText: {
      color: '#E5E7EB',
      fontSize: 12,
      fontWeight: '500',
    },
    // 合规提示
    disclaimer: {
      backgroundColor: 'rgba(30, 58, 138, 0.15)',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(30, 58, 138, 0.2)',
    },
    disclaimerText: {
      color: '#93C5FD',
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 16,
    },
    // 对话区域
    chatContainer: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      marginTop: -20,
      paddingTop: Spacing.lg,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    messageBubble: {
      maxWidth: '85%',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    userMessage: {
      backgroundColor: '#1E3A8A',
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    assistantMessage: {
      backgroundColor: theme.backgroundTertiary,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    assistantMessageText: {
      color: theme.textPrimary,
    },
    // 输入区域
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundDefault,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    voiceButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#1E3A8A',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    voiceButtonActive: {
      backgroundColor: '#DC2626',
      shadowColor: '#DC2626',
    },
    textInputContainer: {
      flex: 1,
      marginLeft: Spacing.md,
      marginRight: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: 48,
      justifyContent: 'center',
    },
    textInput: {
      fontSize: 15,
      color: theme.textPrimary,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#1E3A8A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.border,
    },
    // 欢迎消息
    welcomeContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    welcomeTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    welcomeSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xl,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    quickActionButton: {
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    quickActionText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    // 标题栏
    header: {
      backgroundColor: '#0A1628',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      fontSize: 12,
      color: '#93C5FD',
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(147, 197, 253, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 打字指示器
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.textMuted,
      marginHorizontal: 2,
    },
    // 音频播放器
    audioPlayer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(30, 58, 138, 0.1)',
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.sm,
    },
    audioPlayerText: {
      fontSize: 12,
      color: '#1E3A8A',
      marginLeft: Spacing.sm,
    },
  });
};
