/**
 * 对话控制器
 */
import { BaseController } from './BaseController';
import { ConversationService } from '@/core/service/ConversationService';

export class ConversationController extends BaseController {
  constructor() {
    super(new ConversationService());
  }
}
