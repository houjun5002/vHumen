import { ExpoConfig, ConfigContext } from 'expo/config';

const appName = '智慧警务助手';
const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID || '7621764884178583552';
const slugAppName = `police-assistant-${projectId}`;

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    "name": appName,
    "slug": slugAppName,
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "police-assistant",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSMicrophoneUsageDescription": "智慧警务助手需要访问麦克风以进行语音对话"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0A1628"
      },
      "package": "com.police.assistant.app"
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#0A1628"
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": "智慧警务助手需要访问麦克风以进行语音对话"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "智慧警务助手需要访问相册以上传图片",
          "cameraPermission": "智慧警务助手需要访问相机以拍摄照片"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": projectId
      }
    }
  }
}
