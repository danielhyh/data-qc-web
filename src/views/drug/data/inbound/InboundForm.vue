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
            <el-form-item label="数据上报日期" prop="inboundDate">
              <el-date-picker
                v-model="formData.inboundDate"
                type="date"
                placeholder="选择数据上报日期"
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

      <!-- 入库数量信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Box /></el-icon>
          入库数量信息
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="包装单位数量" prop="inboundPackQuantity">
              <el-input-number
                v-model="formData.inboundPackQuantity"
                placeholder="最小销售包装单位数量"
                :min="0"
                :precision="0"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #append>盒/瓶/袋</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制剂单位数量" prop="inboundDosageQuantity">
              <el-input-number
                v-model="formData.inboundDosageQuantity"
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

      <!-- 入库价格信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Money /></el-icon>
          入库价格信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="包装单位价格" prop="inboundPackPrice">
              <el-input-number
                v-model="formData.inboundPackPrice"
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
            <el-form-item label="制剂单位价格" prop="inboundDosagePrice">
              <el-input-number
                v-model="formData.inboundDosagePrice"
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
            <el-form-item label="入库总金额" prop="inboundTotalAmount">
              <el-input-number
                v-model="formData.inboundTotalAmount"
                placeholder="入库总金额"
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
          <el-col :span="24">
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
              </el-radio-group>
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
import { InboundApi, InboundVO } from '@/api/drug/data/inbound'
import { Document, Memo, Box, Money, CircleCheck, QuestionFilled } from '@element-plus/icons-vue'

/** 药品入库表单 */
defineOptions({ name: 'InboundForm' })

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
  inboundDate: undefined,
  inboundPackQuantity: undefined,
  inboundDosageQuantity: undefined,
  inboundTotalAmount: undefined,
  inboundPackPrice: undefined,
  inboundDosagePrice: undefined,
  qcStatus: 0,
  qcResult: undefined,
  errorMessage: undefined,
  priceStatus: 0
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
  inboundDate: [{ required: true, message: '入库日期不能为空', trigger: 'change' }],
  inboundPackQuantity: [
    { required: true, message: '入库数量（包装单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 1, message: '入库数量必须大于0', trigger: 'blur' }
  ],
  inboundDosageQuantity: [
    { required: true, message: '入库数量（制剂单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 1, message: '入库数量必须大于0', trigger: 'blur' }
  ],
  inboundTotalAmount: [
    { required: true, message: '入库总金额不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '入库总金额必须大于0', trigger: 'blur' }
  ],
  inboundPackPrice: [
    { required: true, message: '入库价格（包装单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' }
  ],
  inboundDosagePrice: [
    { required: true, message: '入库价格（制剂单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 0.0001, message: '价格必须大于0', trigger: 'blur' }
  ],
  priceStatus: [{ required: true, message: '价格状态不能为空', trigger: 'change' }],
  taskId: [{ required: true, message: '导入任务ID不能为空', trigger: 'blur' }]
})

const formRef = ref()

// ==================== 方法定义 ====================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增入库记录' : '编辑入库记录'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await InboundApi.getInbound(id)
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
    const data = formData.value as unknown as InboundVO

    if (formType.value === 'create') {
      await InboundApi.createInbound(data)
      message.success('创建成功')
    } else {
      await InboundApi.updateInbound(data)
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
  if (formData.value.inboundPackQuantity && formData.value.inboundPackPrice) {
    formData.value.inboundTotalAmount = Number(
      (formData.value.inboundPackQuantity * formData.value.inboundPackPrice).toFixed(2)
    )
    message.success('总额计算完成')
  } else {
    message.warning('请先填写包装单位数量和价格')
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
    inboundDate: undefined,
    inboundPackQuantity: undefined,
    inboundDosageQuantity: undefined,
    inboundTotalAmount: undefined,
    inboundPackPrice: undefined,
    inboundDosagePrice: undefined,
    qcStatus: 0,
    qcResult: undefined,
    errorMessage: undefined,
    priceStatus: 0
  }
  formRef.value?.resetFields()
}

// ==================== 监听器 ====================

// 监听包装单位数量变化，自动计算制剂单位价格
watch(
  () => formData.value.inboundPackPrice,
  (newVal) => {
    if (newVal && formData.value.inboundPackQuantity && formData.value.inboundDosageQuantity) {
      const ratio = formData.value.inboundDosageQuantity / formData.value.inboundPackQuantity
      formData.value.inboundDosagePrice = Number((newVal / ratio).toFixed(4))
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
  gap: 20px;
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
}
</style>
