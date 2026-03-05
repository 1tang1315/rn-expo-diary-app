/**
 * 储物 API Schema 定义
 */

// 储物项搜索参数
export const storageSearchSchema = {
  type: 'object',
  properties: {
    keyword: {
      type: 'string',
      minLength: 1,
      description: '搜索关键词'
    }
  },
  required: ['keyword']
};

// 储物项日期范围查询参数
export const storageDateRangeSchema = {
  type: 'object',
  properties: {
    startDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '开始日期，格式：YYYY-MM-DD'
    },
    endDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '结束日期，格式：YYYY-MM-DD'
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      description: '排序方式：asc（升序）或 desc（降序）'
    }
  },
  required: []
};

// 储物项排序参数
export const storageSortSchema = {
  type: 'object',
  properties: {
    sortField: {
      type: 'string',
      enum: ['name', 'category', 'price', 'start_date', 'end_date'],
      default: 'name',
      description: '排序字段'
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'asc',
      description: '排序方式：asc（升序）或 desc（降序）'
    }
  },
  required: []
};

// 储物项创建参数
export const storageCreateSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      maxLength: 100,
      description: '储物项名称'
    },
    category: {
      type: 'string',
      description: '物品分类'
    },
    icon: {
      type: 'string',
      description: '图标'
    },
    price: {
      type: 'number',
      minimum: 0,
      description: '价格'
    },
    detail: {
      type: 'string',
      description: '详细描述'
    },
    image: {
      type: 'string',
      description: '图片路径'
    },
    startDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '开始日期，格式：YYYY-MM-DD'
    },
    endDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '结束日期，格式：YYYY-MM-DD'
    }
  },
  required: []
};

// 储物项更新参数
export const storageUpdateSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: '储物项名称'
    },
    category: {
      type: 'string',
      description: '物品分类'
    },
    icon: {
      type: 'string',
      description: '图标'
    },
    price: {
      type: 'number',
      minimum: 0,
      description: '价格'
    },
    detail: {
      type: 'string',
      description: '详细描述'
    },
    image: {
      type: 'string',
      description: '图片路径'
    },
    startDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '开始日期，格式：YYYY-MM-DD'
    },
    endDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '结束日期，格式：YYYY-MM-DD'
    }
  }
};

// 储物项响应
export const storageResponseSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      description: '储物项 ID'
    },
    name: {
      type: 'string',
      description: '储物项名称'
    },
    category: {
      type: 'string',
      description: '物品分类'
    },
    icon: {
      type: 'string',
      description: '图标'
    },
    price: {
      type: 'number',
      description: '价格'
    },
    detail: {
      type: 'string',
      description: '详细描述'
    },
    image: {
      type: 'string',
      description: '图片路径'
    },
    startDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '开始日期'
    },
    endDate: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '结束日期'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: '创建时间'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: '更新时间'
    }
  },
  required: ['id']
};

// 储物项列表响应
export const storageListResponseSchema = {
  type: 'object',
  properties: {
    code: {
      type: 'number',
      description: '响应状态码'
    },
    message: {
      type: 'string',
      description: '响应消息'
    },
    data: {
      type: 'array',
      items: storageResponseSchema
    }
  },
  required: ['code', 'message', 'data']
};
