import { NoteService } from "@/db/service/NoteService.js";
import { BaseController } from "@/db/controller/BaseController.js";

export class NoteController extends BaseController {
  constructor() {
    super(new NoteService()); // 注入NoteService
  }
  
  // 扩展：根据标题查询笔记
  async getNoteByTitle(title) {
    return await this.service.getNoteByTitle(title);
  }
  
  // 扩展：根据任务ID查询笔记
  async getNotesByTodoId(todoId) {
    return await this.service.getNotesByTodoId(todoId);
  }
  
  // 扩展：根据集合ID查询笔记
  async getNotesByCollectionId(collectionId) {
    return await this.service.getNotesByCollectionId(collectionId);
  }
  
  // 覆写添加方法（确保标题唯一校验）
  async add(noteData) {
    // 先检查标题是否已存在
    const existingNote = await this.getNoteByTitle(noteData.title);
    if (existingNote) {
      throw new Error(`笔记标题"${noteData.title}"已存在`);
    }
    // 调用父类添加方法（自动处理createTime）
    return await super.add(noteData);
  }
}