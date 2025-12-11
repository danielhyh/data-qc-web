<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
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
            <el-form-item label="出库日期" prop="outboundDate">
              <el-date-picker
                v-model="formData.outboundDate"
                type="date"
                placeholder="选择出库日期"
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

      <!-- 出库数量信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><TakeawayBox /></el-icon>
          出库数量信息
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="包装单位数量" prop="outboundPackQuantity">
              <el-input-number
                v-model="formData.outboundPackQuantity"
                placeholder="最小销售包装单位数量"
                :min="1"
                :precision="0"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #append>盒/瓶/袋</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制剂单位数量" prop="outboundDosageQuantity">
              <el-input-number
                v-model="formData.outboundDosageQuantity"
                placeholder="最小制剂单位数量"
                :min="1"
                :precision="0"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #append>片/粒/支</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="出库备注">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入出库备注信息（选填）"
                maxlength="500"
                show-word-limit
              />
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
        <el-button @click="submitForm" type="primary" :loading="formLoading">
          {{ formLoading ? '提交中...' : '确 定' }}
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { OutboundApi, OutboundVO } from '@/api/drug/data/outbound'
import { Document, Memo, TakeawayBox, CircleCheck, QuestionFilled } from '@element-plus/icons-vue'

/** 药品出库表单 */
defineOptions({ name: 'OutboundForm' })

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
  outboundDate: undefined,
  outboundPackQuantity: undefined,
  outboundDosageQuantity: undefined,
  qcStatus: 0,
  qcResult: undefined,
  errorMessage: undefined,
  remark: undefined
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
  outboundDate: [{ required: true, message: '出库日期不能为空', trigger: 'change' }],
  outboundPackQuantity: [
    { required: true, message: '出库数量（包装单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 1, message: '出库数量必须大于0', trigger: 'blur' }
  ],
  outboundDosageQuantity: [
    { required: true, message: '出库数量（制剂单位）不能为空', trigger: 'blur' },
    { type: 'number', min: 1, message: '出库数量必须大于0', trigger: 'blur' }
  ],
  taskId: [{ required: true, message: '导入任务ID不能为空', trigger: 'blur' }]
})

const formRef = ref()

// ==================== 方法定义 ====================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增出库记录' : '编辑出库记录'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await OutboundApi.getOutbound(id)
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
    const data = formData.value as unknown as OutboundVO

    if (formType.value === 'create') {
      await OutboundApi.createOutbound(data)
      message.success('创建成功')
    } else {
      await OutboundApi.updateOutbound(data)
      message.success('更新成功')
    }

    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
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
    outboundDate: undefined,
    outboundPackQuantity: undefined,
    outboundDosageQuantity: undefined,
    qcStatus: 0,
    qcResult: undefined,
    errorMessage: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

// ==================== 监听器 ====================

// 监听包装单位数量变化，提供数量换算建议
watch(
  () => formData.value.outboundPackQuantity,
  (newVal) => {
    if (newVal && newVal > 100) {
      message.warning('出库数量较大，请确认是否正确')
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
