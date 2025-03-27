# Chat Notification System

本文档介绍了魔法预备学院聊天通知系统的实现和使用方法。

## 功能概述

- 学生发消息给导师时，无论导师是否在线，导师都会收到通知
- 导师发消息给学生时，无论学生是否在线，学生都会收到通知
- 点击通知可以直接跳转到对应的聊天界面

## 技术实现

聊天通知系统基于 Firebase Cloud Messaging (FCM) 实现，主要组件包括：

1. **Firebase 配置**：`firebase.ts` 和 `firebase-messaging-sw.js` 配置了 Firebase 消息推送功能
2. **FCM Token 管理**：`useFcmToken` hook 用于获取和管理用户的 FCM token
3. **通知 API**：`/api/chat-notification` 处理通知的发送
4. **数据库存储**：在 `profiles` 和 `mentors` 表中存储用户的 FCM token

## 数据库字段

为了支持通知功能，数据库需要增加以下字段：

- `profiles` 表：添加 `fcm_token` 字段（TEXT 类型）
- `mentors` 表：添加 `fcm_token` 字段（TEXT 类型）

## 使用流程

### 学生发送消息给导师

1. 学生在聊天界面发送消息
2. 系统将消息保存到数据库
3. 系统获取导师的 FCM token
4. 系统调用 `/api/chat-notification` API 发送通知给导师
5. 导师收到通知，点击可跳转到对应聊天界面

### 导师发送消息给学生

1. 导师在聊天界面发送消息
2. 系统将消息保存到数据库
3. 系统获取学生的 FCM token
4. 系统调用 `/api/chat-notification` API 发送通知给学生
5. 学生收到通知，点击可跳转到对应聊天界面

## 测试方法

可以使用 `/test-notification` 页面测试通知系统是否正常工作：

1. 访问 `/test-notification` 页面
2. 点击 "Send Test Notification" 按钮
3. 如果配置正确，应该能收到测试通知

## 故障排除

如果通知不能正常工作，请检查：

1. 浏览器是否授权了通知权限
2. FCM token 是否正确保存到数据库
3. Firebase 配置是否正确
4. 网络连接是否正常

## 隐私说明

FCM token 仅用于发送通知，不会用于其他目的。用户可以随时在浏览器设置中撤销通知权限。