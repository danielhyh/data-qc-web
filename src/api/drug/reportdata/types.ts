/**
 * 数据上报相关的类型定义
 */

// ==================== 文件上传进度相关 ====================

/** 文件处理阶段 */
export type FileProcessPhase = 'uploading' | 'extracting' | 'identifying' | 'parsing' | 'validating' | 'completed' | 'failed'

/** 文件处理状态 */
export interface FileProcessStatus {
  phase: FileProcessPhase
  progress: number // 0-100
  currentMessage: string // 当前阶段的详细信息
  
  // 细分阶段完成情况
  phaseStatus: {
    uploaded: boolean    // 上传完成
    extracted: boolean   // 解压完成（如果是压缩包）
    identified: boolean  // 文件类型识别完成
    parsed: boolean      // Excel解析完成
    validated: boolean   // 数据验证完成
  }
}

/** 批次上传进度 */
export interface BatchUploadProgress {
  totalFiles: number
  processedFiles: number
  currentPhase: string // 当前批次的总体阶段描述
  
  // 每个文件类型的进度
  fileProgress: Record<string, FileProcessStatus>
  
  // 基础错误（文件级）
  basicErrors: FileBasicError[]
  
  // 是否全部完成
  allCompleted: boolean
}

// ==================== 错误数据结构 ====================

/** 基础错误类型（文件级） */
export type BasicErrorType = 
  | 'extract_failed'        // 压缩包解压失败
  | 'type_not_recognized'   // 文件类型无法识别
  | 'format_error'          // Excel文件格式错误
  | 'parse_failed'          // Excel解析失败

/** 文件级基础错误 */
export interface FileBasicError {
  fileName: string
  errorType: BasicErrorType
  message: string
  timestamp?: number
}

/** 数据验证错误类型（字段级） */
export type ValidationErrorType = 'required' | 'type_error'

/** 字段级数据验证错误 */
export interface DataValidationError {
  rowIndex: number        // 行号（Excel中的实际行号）
  fieldName: string       // 字段名称（中文）
  fieldCode: string       // 字段编码
  currentValue: string    // 当前值
  errorType: ValidationErrorType
  errorMessage: string    // 错误信息
}

/** 文件数据验证错误汇总 */
export interface FileValidationErrors {
  requiredErrors: DataValidationError[]   // 必填字段为空
  typeErrors: DataValidationError[]       // 字段类型错误
}

// ==================== 文件处理结果 ====================

/** 单个文件的处理结果 */
export interface FileProcessResult {
  fileType: string        // 文件类型编码
  fileName: string        // 文件名
  standardFileName: string // 标准文件名
  originalFileName: string // 原始文件名
  
  status: 'success' | 'failed' | 'validating'
  uploadStatus: number    // 上传状态（1:上传中, 2:已上传, 3:失败）
  
  totalRows: number       // 总行数
  validRows: number       // 有效行数
  errorCount: number      // 错误数
  
  fileSize?: number       // 文件大小
  fileFormat?: string     // 文件格式
  recordCount?: number    // 数据条数
  
  // 基础错误（文件级）
  basicError?: FileBasicError
  
  // 数据验证错误（字段级）
  validationErrors?: FileValidationErrors
}

/** 批次上传结果 */
export interface BatchUploadResult {
  taskId: number
  totalFiles: number
  successCount: number
  failedCount: number
  
  // 基础错误汇总（在总览中显示）
  basicErrors: FileBasicError[]
  
  // 各文件处理结果
  fileResults: FileProcessResult[]
}

// ==================== API响应类型 ====================

/** 获取上传进度的响应 */
export interface GetUploadProgressResponse {
  progress: BatchUploadProgress
}

/** 获取上传结果的响应 */
export interface GetUploadResultResponse {
  result: BatchUploadResult
}

