import { StyleSheet, Dimensions } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0A0F1A', // 深色背景
    },
    // 顶部导航栏
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 主内容区域
    contentContainer: {
      flex: 1,
      justifyContent: 'space-between',
    },
    // 对话消息区域
    messagesContainer: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    messageWrapper: {
      marginBottom: Spacing.xl,
    },
    aiMessageWrapper: {
      alignItems: 'center',
    },
    userMessageWrapper: {
      alignItems: 'center',
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
      borderWidth: 2,
      borderColor: 'rgba(99, 102, 241, 0.4)',
    },
    avatarContainerActive: {
      borderColor: '#6366F1',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 10,
    },
    messageText: {
      fontSize: 18,
      lineHeight: 28,
      color: '#FFFFFF',
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
    },
    messageTextSub: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: Spacing.sm,
    },
    // 波形动画区域
    waveformContainer: {
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    waveformRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 60,
    },
    waveformBar: {
      width: 3,
      backgroundColor: '#6366F1',
      marginHorizontal: 2,
      borderRadius: 2,
    },
    waveformBarInactive: {
      backgroundColor: 'rgba(99, 102, 241, 0.3)',
    },
    // 状态提示
    statusContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    statusText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    statusSubtext: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    // 底部控制区域
    controlsContainer: {
      alignItems: 'center',
      paddingBottom: Spacing['4xl'],
      paddingHorizontal: Spacing.lg,
    },
    // 主按钮
    mainButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#6366F1',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    mainButtonActive: {
      backgroundColor: '#EF4444',
      shadowColor: '#EF4444',
    },
    mainButtonDisabled: {
      backgroundColor: 'rgba(99, 102, 241, 0.3)',
    },
    // 次要按钮
    secondaryButtons: {
      flexDirection: 'row',
      marginTop: Spacing.xl,
      gap: Spacing['2xl'],
    },
    secondaryButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 对话历史列表
    historyList: {
      maxHeight: height * 0.4,
      paddingHorizontal: Spacing.lg,
    },
    historyItem: {
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.sm,
    },
    historyItemUser: {
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      alignSelf: 'flex-end',
      maxWidth: '80%',
    },
    historyItemAI: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignSelf: 'flex-start',
      maxWidth: '80%',
    },
    historyText: {
      fontSize: 15,
      color: '#FFFFFF',
      lineHeight: 22,
    },
    // 合规提示
    disclaimer: {
      position: 'absolute',
      bottom: Spacing['5xl'],
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    disclaimerText: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.4)',
      textAlign: 'center',
    },
    // 加载指示器
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 15, 26, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: '#FFFFFF',
      marginTop: Spacing.md,
    },
    // 欢迎提示
    welcomeHint: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
    welcomeHintTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: Spacing.sm,
    },
    welcomeHintSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
      lineHeight: 22,
    },
  });
};
