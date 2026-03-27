import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0A0F1E', // 深色背景，类似豆包
    },
    // 顶部栏
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    headerRight: {
      width: 40,
    },
    // 主内容区
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
    },
    // 对话区域
    conversationArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    // 当前说话内容
    currentText: {
      fontSize: 24,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 36,
      paddingHorizontal: Spacing['2xl'],
    },
    // 状态提示
    statusText: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.5)',
      marginTop: Spacing.lg,
      textAlign: 'center',
    },
    // 历史消息
    historyContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 200,
    },
    historyScroll: {
      flex: 1,
    },
    historyContent: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
    },
    historyItem: {
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
    },
    historyLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.4)',
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    historyText: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.9)',
      lineHeight: 24,
    },
    historyTextUser: {
      color: '#60A5FA', // 蓝色表示用户
    },
    // 底部控制区
    controlArea: {
      paddingBottom: Spacing['4xl'],
      paddingTop: Spacing.xl,
      alignItems: 'center',
    },
    // 波形动画区域
    waveContainer: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    waveBar: {
      width: 3,
      backgroundColor: '#60A5FA',
      marginHorizontal: 2,
      borderRadius: 2,
    },
    // 主按钮
    mainButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#3B82F6',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    mainButtonActive: {
      backgroundColor: '#EF4444',
      shadowColor: '#EF4444',
    },
    mainButtonDisabled: {
      backgroundColor: '#6B7280',
      shadowColor: '#6B7280',
      shadowOpacity: 0.2,
    },
    // 提示文字
    hintText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
      marginTop: Spacing.lg,
      textAlign: 'center',
    },
    // 动画圆环
    pulseRing: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    // AI 头像
    aiAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      borderWidth: 2,
      borderColor: 'rgba(59, 130, 246, 0.5)',
    },
    // 打字指示器
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#60A5FA',
      marginHorizontal: 4,
    },
    // 功能按钮区
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: Spacing.lg,
    },
    actionButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginHorizontal: Spacing.sm,
    },
    actionButtonText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
    },
  });
};
