<template>
  <Dialog v-model="dialogVisible" title="药品使用数据导入" width="600px">
    <!-- 导入说明 -->
    <el-alert title="导入说明" type="info" :closable="false" class="mb-4">
      <template #default>
        <div class="import-tips">
          <p>1. 请下载并使用标准模板进行数据录入</p>
          <p>2. Excel文件大小不超过10MB，数据行数不超过5000行</p>
          <p>3. 必填字段：药品编码、销售数量、销售单价、科室代码、医生代码、患者类型、销售日期</p>
          <p>4. 日期格式：YYYYMMDD（如：20240301）</p>
          <p>5. 患者类型：1-门诊，2-急诊，3-住院</p>
        </div>
      </template>
    </el-alert>

    <!-- 模板下载 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>模板下载</span>
          <el-button
            type="primary"
            size="small"
            @click="downloadTemplate"
            :loading="templateLoading"
          >
            <Icon icon="ep:download" />
            下载导入模板
          </el-button>
        </div>
      </template>
      <div class="template-info">
        <Icon icon="ep:document" class="template-icon" />
        <span>药品使用数据导入模板.xlsx</span>
      </div>
    </el-card>

    <!-- 文件上传 -->
    <el-card class="mb-4">
      <template #header>
        <span>文件上传</span>
      </template>
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :on-exceed="handleExceed"
        drag
      >
        <div class="upload-content">
          <Icon icon="ep:upload-filled" size="40" class="upload-icon" />
          <div class="upload-text">
            <p>将文件拖到此处，或<em>点击上传</em></p>
            <p class="upload-tip">支持 .xlsx .xls 格式文件</p>
          </div>
        </div>
      </el-upload>
    </el-card>

    <!-- 导入预览 -->
    <el-card v-if="previewData.length > 0" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>数据预览（前5条）</span>
          <el-tag :type="hasErrors ? 'danger' : 'success'" size="small">
            {{ hasErrors ? '存在错误数据' : '数据校验通过' }}
          </el-tag>
        </div>
      </template>
      <el-table :data="previewData.slice(0, 5)" size="small" max-height="300">
        <el-table-column label="行号" width="60" align="center">
          <template #default="scope">
            {{ scope.$index + 2 }}
          </template>
        </el-table-column>
        <el-table-column label="药品编码" prop="hosDrugId" width="120" />
        <el-table-column label="产品名称" prop="productName" min-width="150" />
        <el-table-column label="销售数量" prop="sellPackQuantity" width="100" />
        <el-table-column label="销售单价" prop="sellPackPrice" width="100" />
        <el-table-column label="科室" prop="departmentName" width="120" />
        <el-table-column label="医生" prop="doctorName" width="100" />
        <el-table-column label="患者类型" width="90">
          <template #default="scope">
            {{ getPatientTypeName(scope.row.patientType) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row._hasError ? 'danger' : 'success'" size="small">
              {{ scope.row._hasError ? '错误' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 错误信息 -->
    <el-card v-if="errorMessages.length > 0" class="mb-4">
      <template #header>
        <span class="error-header">
          <Icon icon="ep:warning" />
          错误信息（{{ errorMessages.length }}条）
        </span>
      </template>
      <div class="error-list">
        <div v-for="(error, index) in errorMessages.slice(0, 10)" :key="index" class="error-item">
          <el-tag type="danger" size="small">第{{ error.row }}行</el-tag>
          <span class="error-msg">{{ error.message }}</span>
        </div>
        <div v-if="errorMessages.length > 10" class="error-more">
          还有 {{ errorMessages.length - 10 }} 条错误...
        </div>
      </div>
    </el-card>

    <!-- 导入进度 -->
    <el-card v-if="importing" class="mb-4">
      <template #header>
        <span>导入进度</span>
      </template>
      <el-progress :percentage="importProgress" :status="importStatus" class="import-progress" />
      <p class="progress-text">{{ progressText }}</p>
    </el-card>

    <template #footer>
      <el-button @click="dialogVisible = false" :disabled="importing"> 取 消 </el-button>
      <el-button
        type="primary"
        @click="handleImport"
        :loading="importing"
        :disabled="previewData.length === 0 || hasErrors"
      >
        {{ importing ? '导入中...' : '确认导入' }}
      </el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import * as XLSX from 'xlsx'
import * as DrugUseApi from '@/api/dataqc/drugUse'
import download from '@/utils/download'

defineOptions({ name: 'DrugUseImportForm' })

const message = useMessage()

// 响应式数据
const dialogVisible = ref(false)
const templateLoading = ref(false)
const importing = ref(false)
const importProgress = ref(0)
const importStatus = ref<'success' | 'exception' | undefined>(undefined)
const progressText = ref('')

const uploadRef = ref()
const currentFile = ref<File | null>(null)
const previewData = ref<any[]>([])
const errorMessages = ref<{ row: number; message: string }[]>([])

// 计算属性
const hasErrors = computed(() => {
  return previewData.value.some((item) => item._hasError) || errorMessages.value.length > 0
})

/** 打开对话框 */
const open = () => {
  dialogVisible.value = true
  resetForm()
}

/** 重置表单 */
const resetForm = () => {
  previewData.value = []
  errorMessages.value = []
  currentFile.value = null
  importing.value = false
  importProgress.value = 0
  importStatus.value = undefined
  progressText.value = ''
  uploadRef.value?.clearFiles()
}

/** 下载模板 */
const downloadTemplate = async () => {
  templateLoading.value = true
  try {
    // 创建模板数据
    const templateData = [
      {
        '药品编码*': 'YP001',
        产品名称: '示例药品名称',
        '销售数量*': 10,
        '销售单价*': 25.5,
        '科室代码*': 'KS001',
        科室名称: '内科',
        '医生代码*': 'DOC001',
        医生姓名: '张医生',
        '患者类型*': 1,
        '销售日期*': '20240301',
        处方编号: 'CF20240301001',
        处方类型: 'NORMAL',
        用法用量: '口服，一次1片',
        给药频次: 'TID',
        患者编号: 'HZ001',
        患者姓名: '张三',
        患者年龄: 35,
        患者性别: 'M',
        支付方式: 'INSURANCE',
        备注: '示例备注信息'
      }
    ]

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(templateData)

    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 药品编码
      { wch: 25 }, // 产品名称
      { wch: 12 }, // 销售数量
      { wch: 12 }, // 销售单价
      { wch: 12 }, // 科室代码
      { wch: 15 }, // 科室名称
      { wch: 12 }, // 医生代码
      { wch: 15 }, // 医生姓名
      { wch: 12 }, // 患者类型
      { wch: 12 }, // 销售日期
      { wch: 18 }, // 处方编号
      { wch: 15 }, // 处方类型
      { wch: 20 }, // 用法用量
      { wch: 12 }, // 给药频次
      { wch: 15 }, // 患者编号
      { wch: 15 }, // 患者姓名
      { wch: 10 }, // 患者年龄
      { wch: 10 }, // 患者性别
      { wch: 12 }, // 支付方式
      { wch: 20 } // 备注
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, '使用数据')

    // 导出文件
    const fileName = `药品使用数据导入模板.xlsx`
    XLSX.writeFile(wb, fileName)

    message.success('模板开始下载')
  } catch (error) {
    console.error('下载模板失败', error)
    message.error('下载模板失败')
  } finally {
    templateLoading.value = false
  }
}

/** 文件变化处理 */
const handleFileChange = (file: UploadFile, fileList: UploadFiles) => {
  if (file.raw) {
    currentFile.value = file.raw
    parseExcelFile(file.raw)
  }
}

/** 文件移除处理 */
const handleFileRemove = () => {
  currentFile.value = null
  previewData.value = []
  errorMessages.value = []
}

/** 文件超限处理 */
const handleExceed = () => {
  message.warning('只能上传一个文件')
}

/** 解析Excel文件 */
const parseExcelFile = async (file: File) => {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 转换为JSON数据
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length < 2) {
      message.error('文件数据为空或格式不正确')
      return
    }

    // 处理数据
    const headers = jsonData[0] as string[]
    const rows = jsonData.slice(1) as any[]

    const processedData = rows
      .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ''))
      .map((row, index) => {
        const rowData: any = {}
        headers.forEach((header, headerIndex) => {
          const key = mapHeaderToField(header)
          if (key) {
            rowData[key] = row[headerIndex]
          }
        })
        rowData._rowIndex = index + 2 // Excel行号（从2开始）
        return rowData
      })

    // 数据校验
    const { validData, errors } = validateImportData(processedData)

    previewData.value = validData
    errorMessages.value = errors

    message.success(`解析成功，共${validData.length}条数据`)
  } catch (error) {
    console.error('解析文件失败', error)
    message.error('解析文件失败，请检查文件格式')
  }
}

/** 映射表头到字段 */
const mapHeaderToField = (header: string): string | null => {
  const fieldMap: Record<string, string> = {
    药品编码: 'hosDrugId',
    产品名称: 'productName',
    销售数量: 'sellPackQuantity',
    销售单价: 'sellPackPrice',
    科室代码: 'departmentCode',
    科室名称: 'departmentName',
    医生代码: 'doctorCode',
    医生姓名: 'doctorName',
    患者类型: 'patientType',
    销售日期: 'sellDate',
    处方编号: 'prescriptionNo',
    处方类型: 'prescriptionType',
    用法用量: 'usage',
    给药频次: 'frequency',
    患者编号: 'patientId',
    患者姓名: 'patientName',
    患者年龄: 'patientAge',
    患者性别: 'patientGender',
    支付方式: 'paymentMethod',
    备注: 'remark'
  }

  // 移除*号和空格
  const cleanHeader = header.replace(/\*/g, '').trim()
  return fieldMap[cleanHeader] || null
}

/** 校验导入数据 */
const validateImportData = (data: any[]) => {
  const errors: { row: number; message: string }[] = []
  const validData = data.map((item) => {
    const errors_for_item: string[] = []

    // 必填字段校验
    if (!item.hosDrugId) {
      errors_for_item.push('药品编码不能为空')
    }

    if (!item.sellPackQuantity || item.sellPackQuantity <= 0) {
      errors_for_item.push('销售数量必须大于0')
    }

    if (!item.sellPackPrice || item.sellPackPrice <= 0) {
      errors_for_item.push('销售单价必须大于0')
    }

    if (!item.departmentCode) {
      errors_for_item.push('科室代码不能为空')
    }

    if (!item.doctorCode) {
      errors_for_item.push('医生代码不能为空')
    }

    if (!item.patientType) {
      errors_for_item.push('患者类型不能为空')
    } else if (!['1', '2', '3'].includes(item.patientType.toString())) {
      errors_for_item.push('患者类型必须是1、2或3')
    }

    if (!item.sellDate) {
      errors_for_item.push('销售日期不能为空')
    } else if (!/^\d{8}$/.test(item.sellDate.toString())) {
      errors_for_item.push('销售日期格式错误，应为YYYYMMDD')
    }

    // 性别校验
    if (item.patientGender && !['M', 'F', 'U'].includes(item.patientGender)) {
      errors_for_item.push('患者性别必须是M、F或U')
    }

    // 年龄校验
    if (item.patientAge && (item.patientAge < 0 || item.patientAge > 150)) {
      errors_for_item.push('患者年龄必须在0-150之间')
    }

    if (errors_for_item.length > 0) {
      errors.push({
        row: item._rowIndex,
        message: errors_for_item.join('；')
      })
      item._hasError = true
    } else {
      item._hasError = false
    }

    return item
  })

  return { validData, errors }
}

/** 执行导入 */
const handleImport = async () => {
  if (!currentFile.value || previewData.value.length === 0) {
    message.error('请先上传文件')
    return
  }

  if (hasErrors.value) {
    message.error('存在错误数据，请修正后重新上传')
    return
  }

  try {
    await ElMessageBox.confirm(`确认导入 ${previewData.value.length} 条使用记录？`, '导入确认', {
      confirmButtonText: '确认导入',
      cancelButtonText: '取消',
      type: 'warning'
    })

    importing.value = true
    importProgress.value = 0
    importStatus.value = undefined
    progressText.value = '开始导入...'

    // 分批导入数据
    const batchSize = 100
    const batches = []
    for (let i = 0; i < previewData.value.length; i += batchSize) {
      batches.push(previewData.value.slice(i, i + batchSize))
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      progressText.value = `正在导入第 ${i + 1}/${batches.length} 批数据...`

      try {
        await DrugUseApi.batchCreateDrugUseInfo(batch)
        successCount += batch.length
      } catch (error) {
        console.error(`第${i + 1}批数据导入失败`, error)
        failCount += batch.length
      }

      importProgress.value = Math.round(((i + 1) / batches.length) * 100)
    }

    // 导入完成
    if (failCount === 0) {
      importStatus.value = 'success'
      progressText.value = `导入完成！成功导入 ${successCount} 条记录`
      message.success(`导入成功！共导入 ${successCount} 条记录`)
    } else {
      importStatus.value = 'exception'
      progressText.value = `导入完成！成功 ${successCount} 条，失败 ${failCount} 条`
      message.warning(`部分导入失败！成功 ${successCount} 条，失败 ${failCount} 条`)
    }

    // 延迟关闭对话框
    setTimeout(() => {
      dialogVisible.value = false
      emit('success')
    }, 2000)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导入失败', error)
      message.error('导入失败')
      importStatus.value = 'exception'
      progressText.value = '导入失败'
    }
  } finally {
    importing.value = false
  }
}

/** 获取患者类型名称 */
const getPatientTypeName = (type: string | number) => {
  const nameMap = {
    '1': '门诊',
    '2': '急诊',
    '3': '住院',
    1: '门诊',
    2: '急诊',
    3: '住院'
  }
  return nameMap[type] || '未知'
}

// 暴露方法
defineExpose({ open })

// 定义事件
const emit = defineEmits(['success'])
</script>

<style scoped>
.import-tips p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-info {
  display: flex;
  align-items: center;
  color: #606266;
}

.template-icon {
  margin-right: 8px;
  color: #409eff;
}

.upload-content {
  padding: 40px 0;
  text-align: center;
}

.upload-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
}

.error-header {
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-list {
  max-height: 200px;
  overflow-y: auto;
}

.error-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.error-msg {
  color: #606266;
  font-size: 14px;
}

.error-more {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.import-progress {
  margin-bottom: 16px;
}

.progress-text {
  text-align: center;
  color: #606266;
  margin: 0;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  width: 100%;
  height: 180px;
  text-align: center;
  position: relative;
  overflow: hidden;
  background-color: #fafafa;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>
