import request from '@/config/axios'

// ========================= 类型定义 =========================

/** 导入模板分页查询参数 */
export interface ImportTemplatePageReqVO {
  pageNo: number
  pageSize: number
  templateName?: string
  templateCode?: string
  tableType?: string
  status?: boolean
  isDefault?: boolean
  createTime?: string[]
}

/** 导入模板保存参数 */
export interface ImportTemplateSaveReqVO {
  id?: number
  templateName: string
  templateCode: string
  tableType: string
  titleText: string
  descriptionText: string
  status: boolean
  isDefault: boolean
  remark?: string
  fields?: TemplateFieldSaveReqVO[]
}

/** 导入模板响应VO */
export interface ImportTemplateRespVO {
  id: number
  templateName: string
  templateCode: string
  tableType: string
  tableTypeName: string
  titleText: string
  descriptionText: string
  status: boolean
  statusText: string
  isDefault: boolean
  fieldCount: number
  downloadCount: number
  remark?: string
  createTime: string
  updateTime: string
  creator: string
  updater: string
}

/** 导入模板配置 VO（保持兼容） */
export interface ImportTemplateVO {
  id: number
  templateCode: string
  templateName: string
  tableType: string
  titleText: string
  descriptionText: string
  isDefault: boolean
  isActive: boolean
  downloadCount: number
  fieldCount: number
}

/** 模板字段保存参数 */
export interface TemplateFieldSaveReqVO {
  id?: number
  templateId?: number
  fieldName: string
  fieldCode: string
  fieldType: string
  isRequired: boolean
  exampleValue?: string
  sortOrder: number
  helpText?: string
}

/** 模板字段响应VO */
export interface TemplateFieldRespVO {
  id: number
  templateId: number
  fieldName: string
  fieldCode: string
  fieldType: string
  fieldTypeName: string
  isRequired: boolean
  exampleValue?: string
  sortOrder: number
  remark?: string
  createTime: string
}

/** 模板预览数据 */
export interface TemplatePreviewVO {
  templateInfo: ImportTemplateRespVO
  previewData: {
    titleRow: string
    descriptionRow: string
    headerRow: string[]
    exampleRows: string[][]
  }
  fieldList: TemplateFieldRespVO[]
}

/** 模板统计信息 */
export interface TemplateStatisticsVO {
  totalCount: number
  activeCount: number
  defaultCount: number
  customCount: number
  totalDownloads: number
  mostUsedTemplate: {
    templateName: string
    downloadCount: number
  }
}

/** 字段库信息 */
export interface FieldLibraryVO {
  fieldCode: string
  fieldName: string
  fieldType: string
  fieldTypeName: string
  tableType?: string
  isCommon: boolean
  isRequired: boolean
  isUsed: boolean
  exampleValue?: string
  description?: string
  usageCount?: number
  category?: string
}

/** 字段库查询参数 */
export interface FieldLibraryPageReqVO {
  pageNo: number
  pageSize: number
  fieldName?: string
  fieldCode?: string
  fieldType?: string
  tableType?: string
  scope?: 'ALL' | 'COMMON' | 'TABLE_TYPE'
  isCommon?: boolean
  isRequired?: boolean
  category?: string
  templateId?: number
}

// ========================= API方法 =========================

/** 导入模板管理API */
export const ImportTemplateApi = {
  /**
   * 分页查询导入模板列表
   */
  getImportTemplatePage: async (params: ImportTemplatePageReqVO) => {
    return await request.get({
      url: '/drug/import-template/page',
      params
    })
  },

  /**
   * 获取导入模板详情
   */
  getImportTemplate: async (id: number): Promise<ImportTemplateRespVO> => {
    return await request.get({
      url: '/drug/import-template/get',
      params: { id }
    })
  },

  /**
   * 创建导入模板
   */
  createImportTemplate: async (data: ImportTemplateSaveReqVO): Promise<number> => {
    return await request.post({
      url: '/drug/import-template/create',
      data
    })
  },

  /**
   * 更新导入模板
   */
  updateImportTemplate: async (data: ImportTemplateSaveReqVO): Promise<boolean> => {
    return await request.put({
      url: '/drug/import-template/update',
      data
    })
  },

  /**
   * 删除导入模板
   */
  deleteImportTemplate: async (id: number): Promise<boolean> => {
    return await request.delete({
      url: '/drug/import-template/delete',
      params: { id }
    })
  },

  /**
   * 批量删除导入模板
   */
  deleteImportTemplateList: async (ids: number[]): Promise<boolean> => {
    return await request.delete({
      url: '/drug/import-template/delete-list',
      params: { ids: ids.join(',') }
    })
  },

  /**
   * 复制导入模板
   */
  copyImportTemplate: async (id: number): Promise<number> => {
    return await request.post({
      url: '/drug/import-template/copy',
      params: { id }
    })
  },

  /**
   * 切换模板启用状态
   */
  toggleImportTemplateStatus: async (id: number): Promise<boolean> => {
    return await request.put({
      url: '/drug/import-template/toggle-status',
      params: { id }
    })
  },

  /**
   * 根据表类型获取模板列表
   */
  getImportTemplateListByTableType: async (): Promise<ImportTemplateRespVO[]> => {
    return await request.get({
      url: '/drug/import-template/list-by-table-type',
    })
  },

  /**
   * 获取模板统计信息
   */
  getImportTemplateStatistics: async (): Promise<TemplateStatisticsVO> => {
    return await request.get({
      url: '/drug/import-template/statistics'
    })
  },

  /**
   * 获取模板配置详情
   */
  getImportTemplateConfig: async (id: number) => {
    return await request.get({
      url: `/drug/import-template/config/${id}`
    })
  },

  /**
   * 保存模板配置
   */
  saveImportTemplateConfig: async (data: ImportTemplateSaveReqVO): Promise<boolean> => {
    return await request.put({
      url: '/drug/import-template/config',
      data
    })
  },

  /**
   * 验证模板配置
   */
  validateImportTemplateConfig: async (data: ImportTemplateSaveReqVO) => {
    return await request.post({
      url: '/drug/import-template/validate-config',
      data
    })
  },

  /**
   * 预览模板
   */
  previewImportTemplate: async (id: number): Promise<TemplatePreviewVO> => {
    return await request.get({
      url: `/drug/import-template/preview/${id}`
    })
  },

  /**
   * 预览模板（通过Code）
   */
  previewImportTemplateByCode: async (code: string): Promise<TemplatePreviewVO> => {
    return await request.get({
      url: `/drug/import-template/preview/by-code/${code}`
    })
  },

  /**
   * 下载模板文件（通过ID）
   */
  downloadImportTemplateBlob: async (
    id: number,
    includeExampleData: boolean,
    exampleRows: number,
    fileFormat: string,
    includeValidation?: boolean,
    freezeHeader?: boolean,
    autoColumnWidth?: boolean,
    includeDropdown?: boolean
  ) => {
    return await request.download({
      url: `/drug/import-template/download/${id}`,
      params: {
        includeExampleData,
        exampleRows,
        fileFormat,
        includeValidation: includeValidation || false,
        freezeHeader: freezeHeader || false,
        autoColumnWidth: autoColumnWidth || false,
        includeDropdown: includeDropdown || false
      }
    })
  },

  /**
   * 下载模板文件（通过Code）
   */
  downloadImportTemplateBlobByCode: async (
    code: string,
    includeExampleData: boolean = true,
    exampleRows: number = 3,
    fileFormat: string = 'xlsx',
    includeValidation?: boolean,
    freezeHeader?: boolean,
    autoColumnWidth?: boolean,
    includeDropdown?: boolean
  ) => {
    return await request.download({
      url: `/drug/import-template/download/by-code/${code}`,
      params: {
        includeExampleData,
        exampleRows,
        fileFormat,
        includeValidation: includeValidation || false,
        freezeHeader: freezeHeader || false,
        autoColumnWidth: autoColumnWidth || false,
        includeDropdown: includeDropdown || false
      }
    })
  },

  /**
   * 增加模板下载次数
   */
  incrementDownloadCount: async (id: number): Promise<boolean> => {
    return await request.post({
      url: '/drug/import-template/download-increment',
      params: { id }
    })
  },

  /**
   * 下载标准模板压缩包
   */
  downloadStandardTemplatesZip: async () => {
    return await request.download({
      url: '/drug/import-template/download-standard-templates'
    })
  },

  /**
   * 导出模板列表Excel
   */
  exportImportTemplateExcel: async (params: ImportTemplatePageReqVO) => {
    return await request.download({
      url: '/drug/import-template/export-excel',
      params
    })
  },

  // 保持兼容性的方法
  exportImportTemplate: async (params: any) => {
    return await request.download({ url: `/drug/import-template/export-excel`, params })
  }
}

/** 模板字段管理API */
export const TemplateFieldApi = {
  /**
   * 根据模板ID获取字段列表
   */
  getTemplateFieldListByTemplateId: async (templateId: number): Promise<TemplateFieldRespVO[]> => {
    return await request.get({
      url: '/drug/template-field/list-by-template',
      params: { templateId }
    })
  },

  /**
   * 批量创建模板字段
   */
  batchCreateTemplateField: async (data: TemplateFieldSaveReqVO[]): Promise<number[]> => {
    return await request.post({
      url: '/drug/template-field/batch-create',
      data
    })
  },

  /**
   * 批量更新模板字段
   */
  batchUpdateTemplateField: async (data: TemplateFieldSaveReqVO[]): Promise<boolean> => {
    return await request.put({
      url: '/drug/template-field/batch-update',
      data
    })
  },

  /**
   * 更新字段排序
   */
  updateTemplateFieldSortOrder: async (
    sortOrderList: { id: number; sortOrder: number }[]
  ): Promise<boolean> => {
    return await request.put({
      url: '/drug/template-field/update-sort-order',
      data: sortOrderList
    })
  },

  /**
   * 从其他模板复制字段
   */
  copyTemplateFieldsFromTemplate: async (
    sourceTemplateId: number,
    targetTemplateId: number
  ): Promise<number[]> => {
    return await request.post({
      url: '/drug/template-field/copy-from-template',
      params: { sourceTemplateId, targetTemplateId }
    })
  },

  /**
   * 获取字段库列表
   */
  getFieldLibrary: async (tableType?: string): Promise<FieldLibraryVO[]> => {
    return await request.get({
      url: '/drug/template-field/field-library',
      params: { tableType }
    })
  },

  /**
   * 从字段库添加字段
   */
  addTemplateFieldsFromLibrary: async (
    templateId: number,
    fieldCodes: string[]
  ): Promise<number[]> => {
    return await request.post({
      url: '/drug/template-field/add-from-library',
      params: { templateId },
      data: fieldCodes
    })
  },

  /**
   * 批量设置必填字段
   */
  batchSetTemplateFieldRequired: async (
    fieldIds: number[],
    required: boolean
  ): Promise<boolean> => {
    return await request.put({
      url: '/drug/template-field/batch-set-required',
      data: { fieldIds, required }
    })
  },

  /**
   * 验证字段配置
   */
  validateTemplateFieldConfig: async (templateId: number) => {
    return await request.get({
      url: '/drug/template-field/validate-config',
      params: { templateId }
    })
  },

  /**
   * 创建模板字段
   */
  createTemplateField: async (data: TemplateFieldSaveReqVO): Promise<number> => {
    return await request.post({
      url: '/drug/template-field/create',
      data
    })
  },

  /**
   * 更新模板字段
   */
  updateTemplateField: async (data: TemplateFieldSaveReqVO): Promise<boolean> => {
    return await request.put({
      url: '/drug/template-field/update',
      data
    })
  },

  /**
   * 删除模板字段
   */
  deleteTemplateField: async (id: number): Promise<boolean> => {
    return await request.delete({
      url: '/drug/template-field/delete',
      params: { id }
    })
  }
}

/** 字段库管理API */
export const FieldLibraryApi = {
  /**
   * 分页查询字段库
   */
  getFieldLibraryPage: async (params: FieldLibraryPageReqVO) => {
    return await request.get({
      url: '/drug/field-library/page',
      params
    })
  },

  /**
   * 根据适用范围搜索字段
   */
  searchFieldsByScope: async (params: {
    scope: 'ALL' | 'COMMON' | 'TABLE_TYPE'
    tableType?: string
    templateId?: number
    keyword?: string
    fieldType?: string
  }): Promise<FieldLibraryVO[]> => {
    return await request.get({
      url: '/drug/template-field/search-fields-by-scope',
      params
    })
  },

  /**
   * 获取常用字段列表
   */
  getCommonFields: async (tableType?: string): Promise<FieldLibraryVO[]> => {
    return await request.get({
      url: '/drug/template-field/common-fields',
      params: { tableType }
    })
  },

  /**
   * 获取字段使用统计
   */
  getFieldUsageStats: async (
    templateId: number
  ): Promise<
    {
      fieldCode: string
      fieldName: string
      usageCount: number
      isUsed: boolean
    }[]
  > => {
    return await request.get({
      url: '/drug/template-field/usage-stats',
      params: { templateId }
    })
  }
}

// ========================= 常量定义 =========================

/** 表类型枚举（业务类型） */
export const TABLE_TYPE = {
  PRE_QC: 1, // 前置质控
  YPID_COMPARISON: 2 // YPID比对
} as const

/** 表类型名称映射（业务类型） */
export const TABLE_TYPE_NAMES = {
  [TABLE_TYPE.PRE_QC]: '前置质控',
  [TABLE_TYPE.YPID_COMPARISON]: 'YPID比对'
} as const

/** 字段类型枚举 */
export const FIELD_TYPE = {
  TEXT: 'STRING', // 文本
  NUMBER: 'INTEGER', // 数字
  DATE: 'DATE', // 日期
  DECIMAL: 'DECIMAL', // 小数
  BOOLEAN: 'BOOLEAN' // 布尔
} as const

/** 字段类型名称映射 */
export const FIELD_TYPE_NAMES = {
  [FIELD_TYPE.TEXT]: '文本',
  [FIELD_TYPE.NUMBER]: '数字',
  [FIELD_TYPE.DATE]: '日期',
  [FIELD_TYPE.DECIMAL]: '小数',
  [FIELD_TYPE.BOOLEAN]: '布尔'
} as const

/** 模板状态枚举 */
export const TEMPLATE_STATUS = {
  DISABLED: 0, // 禁用
  ENABLED: 1 // 启用
} as const

/** 模板状态名称映射 */
export const TEMPLATE_STATUS_NAMES = {
  [TEMPLATE_STATUS.DISABLED]: '禁用',
  [TEMPLATE_STATUS.ENABLED]: '启用'
} as const
