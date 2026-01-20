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
      <el-form-item label="医疗机构名称" prop="hospitalName">
        <el-input v-model="formData.hospitalName" placeholder="请输入医疗机构名称" />
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
      <el-form-item label="批准文号" prop="approvalNumber">
        <el-input v-model="formData.approvalNumber" placeholder="请输入批准文号" />
      </el-form-item>
      <el-form-item label="品种通用名（不含剂型）" prop="drugName">
        <el-input v-model="formData.drugName" placeholder="请输入品种通用名（不含剂型）" />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="formData.productName" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="商品名" prop="tradeName">
        <el-input v-model="formData.tradeName" placeholder="请输入商品名" />
      </el-form-item>
      <el-form-item label="商品名（英文）" prop="tradeNameEn">
        <el-input v-model="formData.tradeNameEn" placeholder="请输入商品名（英文）" />
      </el-form-item>
      <el-form-item label="生产企业" prop="manufacturer">
        <el-input v-model="formData.manufacturer" placeholder="请输入生产企业" />
      </el-form-item>
      <el-form-item label="剂型名称" prop="drugForm">
        <el-input v-model="formData.drugForm" placeholder="请输入剂型名称" />
      </el-form-item>
      <el-form-item label="制剂规格" prop="drugSpec">
        <el-input v-model="formData.drugSpec" placeholder="请输入制剂规格" />
      </el-form-item>
      <el-form-item label="制剂单位" prop="dosageUnit">
        <el-input v-model="formData.dosageUnit" placeholder="请输入制剂单位" />
      </el-form-item>
      <el-form-item label="最小销售包装单位" prop="packUnit">
        <el-input v-model="formData.packUnit" placeholder="请输入最小销售包装单位" />
      </el-form-item>
      <el-form-item label="转换系数" prop="conversionFactor">
        <el-input v-model="formData.conversionFactor" placeholder="请输入转换系数" />
      </el-form-item>
      <el-form-item label="是否网上集中采购药品:1-是,2-否" prop="isCentralizedPurchase">
        <el-input v-model="formData.isCentralizedPurchase" placeholder="请输入是否网上集中采购药品:1-是,2-否" />
      </el-form-item>
      <el-form-item label="是否基本药物:1-是,2-否" prop="isBasicDrug">
        <el-input v-model="formData.isBasicDrug" placeholder="请输入是否基本药物:1-是,2-否" />
      </el-form-item>
      <el-form-item label="是否通过一致性评价:1-是,2-否" prop="isConsistencyEvaluation">
        <el-input v-model="formData.isConsistencyEvaluation" placeholder="请输入是否通过一致性评价:1-是,2-否" />
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
      <el-form-item label="YPID匹配状态:0-未匹配,1-自动匹配,2-手动匹配,3-匹配失败" prop="ypidMatchStatus">
        <el-radio-group v-model="formData.ypidMatchStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="部门id" prop="deptId">
        <el-input v-model="formData.deptId" placeholder="请输入部门id" />
      </el-form-item>
      <el-form-item label="报告年份" prop="reportYear">
        <el-input v-model="formData.reportYear" placeholder="请输入报告年份" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { HistoryCatalogApi, HistoryCatalogVO } from '@/api/drug/historycatalog'

/** 药品目录--历史 表单 */
defineOptions({ name: 'HistoryCatalogForm' })

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
  hospitalName: undefined,
  ypid: undefined,
  hospitalDrugId: undefined,
  provinceDrugId: undefined,
  approvalNumber: undefined,
  drugName: undefined,
  productName: undefined,
  tradeName: undefined,
  tradeNameEn: undefined,
  manufacturer: undefined,
  drugForm: undefined,
  drugSpec: undefined,
  dosageUnit: undefined,
  packUnit: undefined,
  conversionFactor: undefined,
  isCentralizedPurchase: undefined,
  isBasicDrug: undefined,
  isConsistencyEvaluation: undefined,
  qcStatus: undefined,
  qcResult: undefined,
  errorMessage: undefined,
  ypidMatchStatus: undefined,
  deptId: undefined,
  reportYear: undefined,
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
      formData.value = await HistoryCatalogApi.getHistoryCatalog(id)
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
    const data = formData.value as unknown as HistoryCatalogVO
    if (formType.value === 'create') {
      await HistoryCatalogApi.createHistoryCatalog(data)
      message.success(t('common.createSuccess'))
    } else {
      await HistoryCatalogApi.updateHistoryCatalog(data)
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
    hospitalName: undefined,
    ypid: undefined,
    hospitalDrugId: undefined,
    provinceDrugId: undefined,
    approvalNumber: undefined,
    drugName: undefined,
    productName: undefined,
    tradeName: undefined,
    tradeNameEn: undefined,
    manufacturer: undefined,
    drugForm: undefined,
    drugSpec: undefined,
    dosageUnit: undefined,
    packUnit: undefined,
    conversionFactor: undefined,
    isCentralizedPurchase: undefined,
    isBasicDrug: undefined,
    isConsistencyEvaluation: undefined,
    qcStatus: undefined,
    qcResult: undefined,
    errorMessage: undefined,
    ypidMatchStatus: undefined,
    deptId: undefined,
    reportYear: undefined,
  }
  formRef.value?.resetFields()
}
</script>