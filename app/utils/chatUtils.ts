/**
 * 聊天工具函数
 */

// 可用的聊天对话人类型
export type ChatPersonType =
  | 'ai-assistant'  // 一般AI助手
  | 'phd-mentor'    // PhD导师
  | 'resume-editor' // 简历编辑器
  | 'human-teacher' // 人类老师
;

/**
 * 创建跳转到特定对话人的URL
 * @param personId 对话人ID
 * @returns 完整的Chat URL
 */
export function createChatUrl(personId: ChatPersonType): string {
  return `/chat?person=${personId}`;
}

/**
 * 跳转到特定对话人的聊天页面
 * @param router Next.js的router对象
 * @param personId 对话人ID
 */
export function navigateToChat(router: any, personId: ChatPersonType): void {
  router.push(createChatUrl(personId));
}

/**
 * 获取聊天对话人的名称
 * @param personId 对话人ID
 * @returns 对话人名称
 */
export function getChatPersonName(personId: ChatPersonType): string {
  switch (personId) {
    case 'ai-assistant':
      return 'Magic Prep AI';
    case 'phd-mentor':
      return 'PhD Mentor';
    case 'resume-editor':
      return 'Resume Editor';
    case 'human-teacher':
      return '人类老师';
    default:
      return 'Magic Prep AI';
  }
}