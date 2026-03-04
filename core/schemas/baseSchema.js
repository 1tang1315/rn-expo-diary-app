/**
 * 基础 API Schema 定义
 */

// 基础响应格式
export const baseResponseSchema = {
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
      type: 'any',
      description: '响应数据'
    }
  },
  required: ['code', 'message', 'data']
};

// 基础 ID 参数
export const idParamSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1,
      description: '记录ID'
    }
  },
  required: ['id']
};

// 基础创建数据
export const baseCreateSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      maxLength: 100,
      description: '标题'
    },
    content: {
      type: 'string',
      description: '内容'
    },
    category: {
      type: 'string',
      description: '分类'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: '创建时间'
    }
  },
  required: []
};

// 基础更新数据
export const baseUpdateSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: '标题'
    },
    content: {
      type: 'string',
      description: '内容'
    },
    category: {
      type: 'string',
      description: '分类'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: '更新时间'
    }
  }
};

// 基础单条记录响应
export const baseSingleResponseSchema = {
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
        id: {
          type: 'number',
          description: '记录ID'
        },
        title: {
          type: 'string',
          description: '标题'
        },
        content: {
          type: 'string',
          description: '内容'
        },
        category: {
          type: 'string',
          description: '分类'
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
    }
  },
  required: ['code', 'message', 'data']
};

// 基础列表响应
export const baseListResponseSchema = {
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
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: '记录ID'
          },
          title: {
            type: 'string',
            description: '标题'
          },
          content: {
            type: 'string',
            description: '内容'
          },
          category: {
            type: 'string',
            description: '分类'
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
      }
    }
  },
  required: ['code', 'message', 'data']
};

// 基础操作结果响应
export const baseResultResponseSchema = {
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
        success: {
          type: 'boolean',
          description: '操作是否成功'
        }
      },
      required: ['success']
    }
  },
  required: ['code', 'message', 'data']
};