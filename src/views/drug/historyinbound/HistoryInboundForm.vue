<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="导入任务ID" prop="taskId">
        <el-input v-model="formData.taskId" placeholder="请输入导入任务ID" />
      </el-form-item>
      <el-form-item label="数据上报日期" prop="uploadDate">
        <el-date-picker
          v-model="formData.uploadDate"
          type="date"
          value-format="x"
          placeholder="选择数据上报日期"
        />
      </el-form-item>
      <el-form-item label="省级行政区划代码" prop="domainCode">
        <el-input v-model="formData.domainCode" placeholder="请输入省级行政区划代码" />
      </el-form-item>
      <el-form-item label="组织机构代码" prop="organizationCode">
        <el-input v-model="formData.organizationCode" placeholder="请输入组织机构代码" />
      </el-form-item>
      <el-form-item label="医疗机构代码" prop="hospitalCode">
        <el-input v-model="formData.hospitalCode" placeholder="请输入医疗机构代码" />
      </el-form-item>
      <el-form-item label="组织机构名称" prop="organizationName">
        <el-input v-model="formData.organizationName" placeholder="请输入组织机构名称" />
      </el-form-item>
      <el-form-item label="国家药管平台药品编码(YPID)" prop="ypid">
        <el-input v-model="formData.ypid" placeholder="请输入国家药管平台药品编码(YPID)" />
      </el-form-item>
      <el-form-item label="院内药品唯一码" prop="hospitalDrugId">
        <el-input v-model="formData.hospitalDrugId" placeholder="请输入院内药品唯一码" />
      </el-form-item>
      <el-form-item label="省级药品集中采购平台药品编码" prop="provinceDrugId">
        <el-input v-model="formData.provinceDrugId" placeholder="请输入省级药品集中采购平台药品编码" />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="formData.productName" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="入库日期" prop="inboundDate">
        <el-date-picker
          v-model="formData.inboundDate"
          type="date"
          value-format="x"
          placeholder="选择入库日期"
        />
      </el-form-item>
      <el-form-item label="入库数量（最小销售包装单位）" prop="inboundPackQuantity">
        <el-input v-model="formData.inboundPackQuantity" placeholder="请输入入库数量（最小销售包装单位）" />
      </el-form-item>
      <el-form-item label="入库数量（最小制剂单位）" prop="inboundDosageQuantity">
        <el-input v-model="formData.inboundDosageQuantity" placeholder="请输入入库数量（最小制剂单位）" />
      </el-form-item>
      <el-form-item label="入库总金额（元）" prop="inboundTotalAmount">
        <el-input v-model="formData.inboundTotalAmount" placeholder="请输入入库总金额（元）" />
      </el-form-item>
      <el-form-item label="入库价格（最小销售包装单位）" prop="inboundPackPrice">
        <el-input v-model="formData.inboundPackPrice" placeholder="请输入入库价格（最小销售包装单位）" />
      </el-form-item>
      <el-form-item label="入库价格（最小制剂单位）" prop="inboundDosagePrice">
        <el-input v-model="formData.inboundDosagePrice" placeholder="请输入入库价格（最小制剂单位）" />
      </el-form-item>
      <el-form-item label="质控状态:0-未质控,1-质控通过,2-质控失败" prop="qcStatus">
        <el-radio-group v-model="formData.qcStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="质控结果详情(JSON格式)" prop="qcResult">
        <el-input v-model="formData.qcResult" placeholder="请输入质控结果详情(JSON格式)" />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input v-model="formData.errorMessage" placeholder="请输入错误信息" />
      </el-form-item>
      <el-form-item label="价格状态:0-正常,1-价格过高,2-价格过低" prop="priceStatus">
        <el-radio-group v-model="formData.priceStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="年份" prop="reportYear">
        <el-input v-model="formData.reportYear" placeholder="请输入年份" />
      </el-form-item>
      <el-form-item label="部门id" prop="deptId">
        <el-input v-model="formData.deptId" placeholder="请输入部门id" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { HistoryInboundApi, HistoryInboundVO } from '@/api/drug/historyinbound'

/** 药品入库情况-历史 表单 */
defineOptions({ name: 'HistoryInboundForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskId: undefined,
  uploadDate: undefined,
  domainCode: undefined,
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
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
  qcStatus: undefined,
  qcResult: undefined,
  errorMessage: undefined,
  priceStatus: undefined,
  reportYear: undefined,
  deptId: undefined,
})
const formRules = reactive({
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await HistoryInboundApi.getHistoryInbound(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as HistoryInboundVO
    if (formType.value === 'create') {
      await HistoryInboundApi.createHistoryInbound(data)
      message.success(t('common.createSuccess'))
    } else {
      await HistoryInboundApi.updateHistoryInbound(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
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
    uploadDate: undefined,
    domainCode: undefined,
    organizationCode: undefined,
    hospitalCode: undefined,
    organizationName: undefined,
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
    qcStatus: undefined,
    qcResult: undefined,
    errorMessage: undefined,
    priceStatus: undefined,
    reportYear: undefined,
    deptId: undefined,
  }
  formRef.value?.resetFields()
}
</script>