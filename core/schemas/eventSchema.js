/**
 * 事件 API Schema 定义
 */

// 日期范围查询参数
export const dateRangeParamsSchema = {
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

// 事件状态更新参数
export const eventStatusUpdateSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1,
      description: '事件ID'
    },
    status: {
      type: 'string',
      description: '新状态'
    }
  },
  required: ['id', 'status']
};

// 事件搜索参数
export const eventSearchSchema = {
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

// 常用标题查询参数
export const commonTitlesSchema = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      description: '事件分类'
    },
    limit: {
      type: 'number',
      minimum: 1,
      maximum: 50,
      default: 5,
      description: '最多返回数量'
    }
  },
  required: []
};

// 事件筛选查询参数
export const eventFilterParamsSchema = {
  type: 'object',
  properties: {
    keyword: {
      type: 'string',
      description: '搜索关键词'
    },
    searchType: {
      type: 'string',
      enum: ['title', 'description', 'both'],
      default: 'both',
      description: '搜索类型：title（标题）、description（描述）、both（全部）'
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
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
      description: '排序方式：asc（升序）或 desc（降序）'
    }
  },
  required: []
};

// 事件创建参数
export const eventCreateSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      maxLength: 100,
      description: '事件标题'
    },
    content: {
      type: 'string',
      description: '事件内容'
    },
    category: {
      type: 'string',
      description: '事件分类'
    },
    status: {
      type: 'string',
      description: '事件状态'
    },
    date: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '事件日期，格式：YYYY-MM-DD'
    },
    startTime: {
      type: 'string',
      pattern: '^\\d{2}:\\d{2}$',
      description: '开始时间，格式：HH:MM'
    },
    endTime: {
      type: 'string',
      pattern: '^\\d{2}:\\d{2}$',
      description: '结束时间，格式：HH:MM'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: '创建时间'
    }
  },
  required: []
};

// 事件更新参数
export const eventUpdateSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: '事件标题'
    },
    content: {
      type: 'string',
      description: '事件内容'
    },
    category: {
      type: 'string',
      description: '事件分类'
    },
    status: {
      type: 'string',
      description: '事件状态'
    },
    date: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '事件日期，格式：YYYY-MM-DD'
    },
    startTime: {
      type: 'string',
      pattern: '^\\d{2}:\\d{2}$',
      description: '开始时间，格式：HH:MM'
    },
    endTime: {
      type: 'string',
      pattern: '^\\d{2}:\\d{2}$',
      description: '结束时间，格式：HH:MM'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: '更新时间'
    }
  }
};

// 事件响应
export const eventResponseSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      description: '事件ID'
    },
    title: {
      type: 'string',
      description: '事件标题'
    },
    content: {
      type: 'string',
      description: '事件内容'
    },
    category: {
      type: 'string',
      description: '事件分类'
    },
    status: {
      type: 'string',
      description: '事件状态'
    },
    date: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '事件日期，格式：YYYY-MM-DD'
    },
    startTime: {
      type: 'string',
      pattern: '^\\d{2}:\\d{2}$',
      description: '开始时间，格式：HH:MM'
    },
    endTime: {
      type: 'string',
      pattern: '^\\d{2}:\\d{2}$',
      description: '结束时间，格式：HH:MM'
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

// 事件列表响应
export const eventListResponseSchema = {
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
      items: eventResponseSchema
    }
  },
  required: ['code', 'message', 'data']
};

// 事件状态更新响应
export const eventStatusUpdateResponseSchema = {
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
      type: 'boolean',
      description: '是否更新成功'
    }
  },
  required: ['code', 'message', 'data']
};

// 事件搜索响应
export const eventSearchResponseSchema = {
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
      items: eventResponseSchema
    }
  },
  required: ['code', 'message', 'data']
};

// 常用标题响应
export const commonTitlesResponseSchema = {
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
      items: {
        type: 'string',
        description: '常用标题'
      }
    }
  },
  required: ['code', 'message', 'data']
};

// 事件统计响应
export const eventStatsResponseSchema = {
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
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: '总事件数'
        },
        byCategory: {
          type: 'object',
          additionalProperties: {
            type: 'number',
            description: '分类事件数'
          }
        },
        byStatus: {
          type: 'object',
          additionalProperties: {
            type: 'number',
            description: '状态事件数'
          }
        }
      },
      required: ['total']
    }
  },
  required: ['code', 'message', 'data']
};