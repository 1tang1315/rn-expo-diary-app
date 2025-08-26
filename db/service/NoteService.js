import { BaseService } from "@/db/sevice/BaseService.js";
import { initDB } from "@/db/initDB.js";

export class NoteService extends BaseService {
  constructor() {
    super('note'); // 关联note存储
  }
  
  // 根据标题查询笔记（利用title唯一索引）
  async getNoteByTitle(title) {
    const db = await initDB();
    const tx = db.transaction('note', 'readonly');
    const store = tx.objectStore('note');
    const index = store.index('title'); // 使用标题索引
    const result = await index.get(title); // 通过索引查询
    await tx.done;
    return result;
  }
  
  // 根据任务ID查询关联笔记
  async getNotesByTodoId(todoId) {
    const db = await initDB();
    const tx = db.transaction('note', 'readonly');
    const store = tx.objectStore('note');
    const index = store.index('todoId'); // 使用任务ID索引
    const result = await index.getAll(todoId); // 获取所有关联笔记
    await tx.done;
    return result;
  }
  
  // 根据集合ID查询关联笔记
  async getNotesByCollectionId(collectionId) {
    const db = await initDB();
    const tx = db.transaction('note', 'readonly');
    const store = tx.objectStore('note');
    const index = store.index('collectionId'); // 使用集合ID索引
    const result = await index.getAll(collectionId); // 获取所有关联笔记
    await tx.done;
    return result;
  }
}