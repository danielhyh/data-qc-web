/**
 * 数据字典工具类
 */
import { useDictStoreWithOut } from '@/store/modules/dict'
import { ElementPlusInfoType } from '@/types/elementPlus'

const dictStore = useDictStoreWithOut()

/**
 * 获取 dictType 对应的数据字典数组
 *
 * @param dictType 数据类型
 * @returns {*|Array} 数据字典数组
 */
export interface DictDataType {
  dictType: string
  label: string
  value: string | number | boolean
  colorType: ElementPlusInfoType | ''
  cssClass: string
}

export interface NumberDictDataType extends DictDataType {
  value: number
}

export interface StringDictDataType extends DictDataType {
  value: string
}

export const getDictOptions = (dictType: string) => {
  return dictStore.getDictByType(dictType) || []
}

export const getIntDictOptions = (dictType: string): NumberDictDataType[] => {
  // 获得通用的 DictDataType 列表
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  // 转换成 number 类型的 NumberDictDataType 类型
  // why 需要特殊转换：避免 IDEA 在 v-for="dict in getIntDictOptions(...)" 时，el-option 的 key 会告警
  const dictOption: NumberDictDataType[] = []
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: parseInt(dict.value + '')
    })
  })
  return dictOption
}

export const getStrDictOptions = (dictType: string) => {
  // 获得通用的 DictDataType 列表
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  // 转换成 string 类型的 StringDictDataType 类型
  // why 需要特殊转换：避免 IDEA 在 v-for="dict in getStrDictOptions(...)" 时，el-option 的 key 会告警
  const dictOption: StringDictDataType[] = []
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: dict.value + ''
    })
  })
  return dictOption
}

export const getBoolDictOptions = (dictType: string) => {
  const dictOption: DictDataType[] = []
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: dict.value + '' === 'true'
    })
  })
  return dictOption
}

/**
 * 获取指定字典类型的指定值对应的字典对象
 * @param dictType 字典类型
 * @param value 字典值
 * @return DictDataType 字典对象
 */
export const getDictObj = (dictType: string, value: any): DictDataType | undefined => {
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  for (const dict of dictOptions) {
    if (dict.value === value + '') {
      return dict
    }
  }
}

/**
 * 获得字典数据的文本展示
 *
 * @param dictType 字典类型
 * @param value 字典数据的值
 * @return 字典名称
 */
export const getDictLabel = (dictType: string, value: any): string => {
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  const dictLabel = ref('')
  dictOptions.forEach((dict: DictDataType) => {
    if (dict.value === value + '') {
      dictLabel.value = dict.label
    }
  })
  return dictLabel.value
}

/**
 * 获取字典项的标签类型（用于Element Plus的tag组件）
 * @param dictType 字典类型
 * @param value 字典值
 * @return 标签类型
 */
export const getDictColorType = (dictType: string, value: any): ElementPlusInfoType | '' => {
  const dictObj = getDictObj(dictType, value)
  return dictObj?.colorType || ''
}

/**
 * 批量获取字典标签
 * @param dictType 字典类型
 * @param values 字典值数组
 * @return 标签数组
 */
export const getDictLabels = (dictType: string, values: any[]): string[] => {
  return values.map((value) => getDictLabel(dictType, value)).filter(Boolean)
}

export enum DICT_TYPE {
  USER_TYPE = 'user_type',
  COMMON_STATUS = 'common_status',
  TERMINAL = 'terminal', // 终端
  DATE_INTERVAL = 'date_interval', // 数据间隔

  // ========== SYSTEM 模块 ==========
  SYSTEM_USER_SEX = 'system_user_sex',
  SYSTEM_MENU_TYPE = 'system_menu_type',
  SYSTEM_ROLE_TYPE = 'system_role_type',
  SYSTEM_DATA_SCOPE = 'system_data_scope',
  SYSTEM_NOTICE_TYPE = 'system_notice_type',
  SYSTEM_LOGIN_TYPE = 'system_login_type',
  SYSTEM_LOGIN_RESULT = 'system_login_result',
  SYSTEM_SMS_CHANNEL_CODE = 'system_sms_channel_code',
  SYSTEM_SMS_TEMPLATE_TYPE = 'system_sms_template_type',
  SYSTEM_SMS_SEND_STATUS = 'system_sms_send_status',
  SYSTEM_SMS_RECEIVE_STATUS = 'system_sms_receive_status',
  SYSTEM_OAUTH2_GRANT_TYPE = 'system_oauth2_grant_type',

  // ========== 地区相关 ==========
  REGION_LEVEL = 'region_level', // 地区等级
  SYSTEM_MAIL_SEND_STATUS = 'system_mail_send_status',
  SYSTEM_NOTIFY_TEMPLATE_TYPE = 'system_notify_template_type',
  SYSTEM_SOCIAL_TYPE = 'system_social_type',

  // ========== INFRA 模块 ==========
  INFRA_BOOLEAN_STRING = 'infra_boolean_string',
  INFRA_JOB_STATUS = 'infra_job_status',
  INFRA_JOB_LOG_STATUS = 'infra_job_log_status',
  INFRA_API_ERROR_LOG_PROCESS_STATUS = 'infra_api_error_log_process_status',
  INFRA_CONFIG_TYPE = 'infra_config_type',
  INFRA_CODEGEN_TEMPLATE_TYPE = 'infra_codegen_template_type',
  INFRA_CODEGEN_FRONT_TYPE = 'infra_codegen_front_type',
  INFRA_CODEGEN_SCENE = 'infra_codegen_scene',
  INFRA_FILE_STORAGE = 'infra_file_storage',
  INFRA_OPERATE_TYPE = 'infra_operate_type',

  // ========== MP 模块 ==========
  MP_AUTO_REPLY_REQUEST_MATCH = 'mp_auto_reply_request_match', // 自动回复请求匹配类型
  MP_MESSAGE_TYPE = 'mp_message_type', // 消息类型

  // ========== AI - 人工智能模块  ==========
  AI_PLATFORM = 'ai_platform', // AI 平台
  AI_MODEL_TYPE = 'ai_model_type', // AI 模型类型
  AI_IMAGE_STATUS = 'ai_image_status', // AI 图片状态
  AI_MUSIC_STATUS = 'ai_music_status', // AI 音乐状态
  AI_GENERATE_MODE = 'ai_generate_mode', // AI 生成模式
  AI_WRITE_TYPE = 'ai_write_type', // AI 写作类型
  AI_WRITE_LENGTH = 'ai_write_length', // AI 写作长度
  AI_WRITE_FORMAT = 'ai_write_format', // AI 写作格式
  AI_WRITE_TONE = 'ai_write_tone', // AI 写作语气
  AI_WRITE_LANGUAGE = 'ai_write_language', // AI 写作语言

  // ========== DRUG - 药品质控模块 ==========
  DRUG_IMPORT_TYPE = 'drug_import_type', // 导入类型
  DRUG_ROLE_TYPE = 'drug_role_type', // 用户角色类型
  DRUG_TASK_STATUS = 'drug_task_status', // 任务处理状态
  DRUG_DETAIL_STATUS = 'drug_detail_status', // 明细处理状态
  DRUG_TABLE_TYPE = 'drug_table_type', // 药品数据表类型
  DRUG_QC_STATUS = 'drug_qc_status', // 质控处理状态
  DRUG_RULE_TYPE = 'drug_rule_type', // 质控规则类型
  DRUG_YPID_MATCH_STATUS = 'drug_ypid_match_status', // YPID编码匹配状态
  DRUG_PRICE_STATUS = 'drug_price_status', // 价格状态标记
  DRUG_FIX_STATUS = 'drug_fix_status', // 数据修复状态
  DRUG_RESULT_STATUS = 'drug_result_status', // 质控结果状态
  DRUG_RETRY_TYPE = 'drug_retry_type', // 重试类型
  DRUG_DATA_SOURCE = 'drug_data_source',
  DRUG_EXTRACT_STATUS = 'drug_extract_status',
  DRUG_IMPORT_STATUS = 'drug_import_status',
  // 质控规则类型
  DRUG_QC_RULE_TYPE = 'drug_qc_rule_type',
  // 质控规则分类
  DRUG_QC_RULE_CATEGORY = 'drug_qc_rule_category',
  // 质控表类型
  DRUG_QC_TABLE_TYPE = 'drug_qc_table_type',
  // 质控执行状态
  DRUG_QC_EXECUTION_STATUS = 'drug_qc_execution_status',
  // 质控错误级别
  DRUG_QC_ERROR_LEVEL = 'drug_qc_error_level',

  // ========== 机构标准库字典 ==========
  INSTITUTION_CATEGORY = 'institution_category', // 机构类别
  INSTITUTION_LEVEL = 'institution_level', // 机构等级(级)
  HOSPITAL_GRADE = 'YYDJ_D', // 医院等级(等次)

  // ========== 短缺药品模块 ==========
  SUPPLY_STATUS = 'supply_status', // 供应状态

  // ========== 监测无法上报模块 ==========
  UNABLE_REPORT_REASON = 'unable_report_reason', // 无法上报原因

  // ========== 填报模块 ==========
  REPORT_STATUS_TYPE = 'report_status_type', // 填报任务状态
  REPORT_PROGRESS = 'report_progress', // 上报进度

  // ========== 导入模板模块 ==========
  IMPORT_TABLE_TYPE = 'import_table_type', // 导入表类型

  REPORT_STATUS = 'report_status', // 填报任务状态
  DRUG_REPORT_STATUS = 'drug_report_status', // 填报状态
  SHORTAGE_PERIOD_STATUS = 'shortage_period_status', // 短缺药品周期状态
  UPLOAD_STATUS = 'upload_status', // 文件上传状态
  REPORT_OPERATION_STATUS = 'report_operation_status', // 上报操作状态
  QC_STATUS = 'qc_status', // 质控处理状态
  // ========== 同步模块 ==========
  SYNC_TYPE = 'sync_type', // 同步类型
  PROCESS_STATUS = 'process_status', // 处理状态
  OPERATION_TYPE = 'operation_type', // 操作类型

  ADMINISTRATIVE_AFFILIATION = 'administrative_affiliation', // 行政归属
  BUSINESS_MODULE = 'business_module', // 业务模块编码
  MENU_CATEGORY = 'menu_category', // 菜单分类
  MANAGEMENT_LEVEL = 'management_level', // 管理级别
  DATA_UPLOAD_STATUS = 'data_upload_status'
}
