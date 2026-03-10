/**
 * 对话 API
 */
import { BaseApi } from './BaseApi';
import { ConversationController } from '@/core/controller/ConversationController';

export class ConversationApi extends BaseApi {
  constructor() {
    super(new ConversationController());
  }
}

export const conversationApi = new ConversationApi();
