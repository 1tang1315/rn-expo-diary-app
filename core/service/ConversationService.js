/**
 * 对话服务层
 */
import { BaseService } from './BaseService';
import { ConversationMapper } from '@/core/mapper/ConversationMapper';

export class ConversationService extends BaseService {
  constructor() {
    super(new ConversationMapper());
  }
}
