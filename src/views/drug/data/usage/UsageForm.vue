<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1000px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <!-- 基础信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          基础信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="医疗机构代码" prop="hospitalCode">
              <el-input
                v-model="formData.hospitalCode"
                placeholder="请输入22位医疗机构代码"
                maxlength="22"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="组织机构代码" prop="organizationCode">
              <el-input
                v-model="formData.organizationCode"
                placeholder="请输入9位组织机构代码"
                maxlength="9"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="机构名称" prop="organizationName">
              <el-input
                v-model="formData.organizationName"
                placeholder="请输入医疗机构名称"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="行政区划代码" prop="domainCode">
              <el-input v-model="formData.domainCode" placeholder="请输入6位省级代码" maxlength="6">
                <template #prepend>省级</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="导入任务ID" prop="taskId">
              <el-input-number
                v-model="formData.taskId"
                placeholder="请输入导入任务ID"
                :min="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="销售日期" prop="usageDate">
              <el-date-picker
                v-model="formData.usageDate"
                type="date"
                placeholder="选择药品销售日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 药品信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Memo /></el-icon>
          药品信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="药品编码(YPID)" prop="ypid">
              <el-input v-model="formData.ypid" placeholder="国家药管平台药品编码" maxlength="30">
                <template #append>
                  <el-tooltip content="国家药管平台统一编码" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="院内药品码" prop="hospitalDrugId">
              <el-input
                v-model="formData.hospitalDrugId"
                placeholder="请输入院内药品唯一码"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="省采购平台码" prop="provinceDrugId">
              <el-input
                v-model="formData.provinceDrugId"
                placeholder="省级集采平台编码"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="产品名称" prop="productName">
              <el-input
                v-model="formData.productName"
                placeholder="请输入产品名称"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 销售数量信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><ShoppingCart /></el-icon>
          销售数量信息
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="包装单位数量" prop="usagePackQuantity">
              <el-input-number
                v-model="formData.usagePackQuantity"
                placeholder="最小销售包装单位数量"
                :min="0"
                :precision="0"
                :controls-position="'right'"
                style="width: 100%"
                @change="calculateDosageQuantity"
              >
                <template #append>盒/瓶/袋</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制剂单位数量" prop="usageDosageQuantity">
              <el-input-number
                v-model="formData.usageDosageQuantity"
                placeholder="最小制剂单位数量"
                :min="0"
                :precision="0"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #append>片/粒/支</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 销售价格信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Money /></el-icon>
          销售价格信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="包装单位价格" prop="usagePackPrice">
              <el-input-number
                v-model="formData.usagePackPrice"
                placeholder="每盒/瓶/袋价格"
                :min="0"
                :precision="2"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #prepend>¥</template>
                <template #append>元</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="制剂单位价格" prop="usageDosagePrice">
              <el-input-number
                v-model="formData.usageDosagePrice"
                placeholder="每片/粒/支价格"
                :min="0"
                :precision="4"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #prepend>¥</template>
                <template #append>元</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="销售总金额" prop="usageTotalAmount">
              <el-input-number
                v-model="formData.usageTotalAmount"
                placeholder="销售总金额"
                :min="0"
                :precision="2"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #prepend>¥</template>
                <template #append>元</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格状态" prop="priceStatus">
              <el-radio-group v-model="formData.priceStatus">
                <el-radio :label="0">
                  <el-tag type="success" effect="plain">价格正常</el-tag>
                </el-radio>
                <el-radio :label="1">
                  <el-tag type="danger" effect="plain">价格过高</el-tag>
                </el-radio>
                <el-radio :label="2">
                  <el-tag type="warning" effect="plain">价格过低</el-tag>
                </el-radio>
                <el-radio :label="3">
                  <el-tag type="danger" effect="plain">价格异常</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="修复状态" prop="fixStatus">
              <el-select
                v-model="formData.fixStatus"
                placeholder="请选择修复状态"
                style="width: 100%"
              >
                <el-option label="未修复" :value="0">
                  <el-tag type="info">未修复</el-tag>
                </el-option>
                <el-option label="自动修复" :value="1">
                  <el-tag type="success">自动修复</el-tag>
                </el-option>
                <el-option label="手动修复" :value="2">
                  <el-tag type="primary">手动修复</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="修复规则标记" prop="fixRule">
              <el-input
                v-model="formData.fixRule"
                placeholder="如FIX0081，请参考修复规则文档"
                maxlength="20"
                :disabled="formData.fixStatus === 0"
              >
                <template #prepend>规则</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 质控信息 -->
      <div class="form-section" v-if="formType === 'update'">
        <div class="section-title">
          <el-icon><CircleCheck /></el-icon>
          质控信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="质控状态" prop="qcStatus">
              <el-select
                v-model="formData.qcStatus"
                placeholder="请选择质控状态"
                style="width: 100%"
              >
                <el-option label="未质控" :value="0">
                  <el-tag type="info">未质控</el-tag>
                </el-option>
                <el-option label="质控通过" :value="1">
                  <el-tag type="success">质控通过</el-tag>
                </el-option>
                <el-option label="质控失败" :value="2">
                  <el-tag type="danger">质控失败</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="错误信息" prop="errorMessage">
              <el-input
                v-model="formData.errorMessage"
                placeholder="质控失败时的错误信息"
                :disabled="formData.qcStatus !== 2"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="质控结果详情" prop="qcResult">
              <el-input
                v-model="formData.qcResult"
                type="textarea"
                :rows="3"
                placeholder="JSON格式的质控结果详情"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button @click="resetForm" v-if="formType === 'create'">重 置</el-button>
        <el-button @click="calculateTotal" type="info">计算总额</el-button>
        <el-button @click="submitForm" type="primary" :loading="formLoading">
          {{ formLoading ? '提交中...' : '确 定' }}
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { UsageApi, UsageVO } from '@/api/drug/data/usage'
import {
  Document,
  Memo,
  ShoppingCart,
  Money,
  CircleCheck,
  QuestionFilled
} from '@element-plus/icons-vue'

/** 药品使用情况表单 */
defineOptions({ name: 'UsageForm' })

const { t } = useI18n()
const message = useMessage()

// ==================== 响应式数据 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  taskId: undefined,
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
  domainCode: undefined,
  ypid: undefined,
  hospitalDrugId: undefined,
  provinceDrugId: undefined,
  productName: undefined,
  usageDate: undefined,
  usagePackQuantity: undefined,
  usageDosageQuantity: undefined,
  usageTotalAmount: undefined,
  usagePackPrice: undefined,
  usageDosagePrice: undefined,
  qcStatus: 0,
  qcResult: undefined,
  errorMessage: undefined,
  priceStatus: 0,
  fixStatus: 0,
  fixRule: undefined
})

// ==================== 表单验证规则 ====================
const formRules = reactive({
  hospitalCode: [
    { required: true, message: '医疗机构代码不能为空', trigger: 'blur' },
    { len: 22, message: '医疗机构代码必须为22位', trigger: 'blur' }
  ],
  organizationCode: [
    { required: true, message: '组织机构代码不能为空', trigger: 'blur' },
    { len: 9, message: '组织机构代码必须为9位', trigger: 'blur' }
  ],
  organizationName: [
    { required: true, message: '医疗机构名称不能为空', trigger: 'blur' },
    { max: 100, message: '医疗机构名称不能超过100个字符', trigger: 'blur' }
  ],
  domainCode: [
    { required: true, message: '省级行政区划代码不能为空', trigger: 'blur' },
    { len: 6, message: '行政区划代码必须为6位', trigger: 'blur' }
  ],
  ypid: [{ required: true, message: '国家药管平台药品编码不能为空', trigger: 'blur' }],
  hospitalDrugId: [{ required: true, message: '院内药品唯一码不能为空', trigger: 'blur' }],
  productName: [
    { required: true, message: '产品名称不能为空', trigger: 'blur' },
    { max: 200, message: '产品名称不能超过200个字符', trigger: 'blur' }
  ],
  usageDate: [{ required: true, message: '药品销售日期不能为空', trigger: 'change' }],
  usagePackQuantity: [
    { required: true, message: '销售数量（包装单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '销售数量不能为负数', trigger: 'blur' }
  ],
  usageDosageQuantity: [
    { required: true, message: '销售数量（制剂单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '销售数量不能为负数', trigger: 'blur' }
  ],
  usageTotalAmount: [
    { required: true, message: '销售总金额不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '销售总金额不能为负数', trigger: 'blur' }
  ],
  usagePackPrice: [
    { required: true, message: '销售价格（包装单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' }
  ],
  usageDosagePrice: [
    { required: true, message: '销售价格（制剂单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' }
  ],
  priceStatus: [{ required: true, message: '价格状态不能为空', trigger: 'change' }],
  fixStatus: [{ required: true, message: '修复状态不能为空', trigger: 'change' }],
  taskId: [{ required: true, message: '导入任务ID不能为空', trigger: 'blur' }]
})

const formRef = ref()

// ==================== 方法定义 ====================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增使用记录' : '编辑使用记录'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await UsageApi.getUsage(id)
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as UsageVO

    if (formType.value === 'create') {
      await UsageApi.createUsage(data)
      message.success('创建成功')
    } else {
      await UsageApi.updateUsage(data)
      message.success('更新成功')
    }

    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 计算总额 */
const calculateTotal = () => {
  if (formData.value.usagePackQuantity && formData.value.usagePackPrice) {
    formData.value.usageTotalAmount = Number(
      (formData.value.usagePackQuantity * formData.value.usagePackPrice).toFixed(2)
    )
    message.success('总额计算完成')
  } else {
    message.warning('请先填写包装单位数量和价格')
  }
}

/** 根据包装数量计算制剂数量（示例：假设转换系数为10） */
const calculateDosageQuantity = (value: number) => {
  if (value) {
    // 这里应该根据药品的实际转换系数计算
    // 暂时使用固定系数10作为示例
    formData.value.usageDosageQuantity = value * 10
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    taskId: undefined,
    organizationCode: undefined,
    hospitalCode: undefined,
    organizationName: undefined,
    domainCode: undefined,
    ypid: undefined,
    hospitalDrugId: undefined,
    provinceDrugId: undefined,
    productName: undefined,
    usageDate: undefined,
    usagePackQuantity: undefined,
    usageDosageQuantity: undefined,
    usageTotalAmount: undefined,
    usagePackPrice: undefined,
    usageDosagePrice: undefined,
    qcStatus: 0,
    qcResult: undefined,
    errorMessage: undefined,
    priceStatus: 0,
    fixStatus: 0,
    fixRule: undefined
  }
  formRef.value?.resetFields()
}

// ==================== 监听器 ====================

// 监听包装单位价格变化，自动计算制剂单位价格
watch(
  () => formData.value.usagePackPrice,
  (newVal) => {
    if (newVal && formData.value.usagePackQuantity && formData.value.usageDosageQuantity) {
      const ratio = formData.value.usageDosageQuantity / formData.value.usagePackQuantity
      formData.value.usageDosagePrice = Number((newVal / ratio).toFixed(4))
    }
  }
)

// 监听修复状态变化
watch(
  () => formData.value.fixStatus,
  (newVal) => {
    if (newVal === 0) {
      formData.value.fixRule = undefined
    }
  }
)
</script>

<style scoped>
.form-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-title .el-icon {
  font-size: 18px;
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 输入框样式优化 */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  padding-right: 50px;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

/* 表单项样式调整 */
:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

/* 单选按钮组样式 */
:deep(.el-radio-group) {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

:deep(.el-radio) {
  margin-right: 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
  }

  .el-row .el-col {
    margin-bottom: 10px;
  }

  :deep(.el-radio-group) {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
