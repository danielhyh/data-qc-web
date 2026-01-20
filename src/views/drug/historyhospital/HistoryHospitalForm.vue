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
      <el-form-item label="省级行政区划代码（2位）" prop="domainCode">
        <el-input v-model="formData.domainCode" placeholder="请输入省级行政区划代码（2位）" />
      </el-form-item>
      <el-form-item label="组织机构代码（9位）" prop="organizationCode">
        <el-input v-model="formData.organizationCode" placeholder="请输入组织机构代码（9位）" />
      </el-form-item>
      <el-form-item label="医疗机构代码（22位）" prop="hospitalCode">
        <el-input v-model="formData.hospitalCode" placeholder="请输入医疗机构代码（22位）" />
      </el-form-item>
      <el-form-item label="组织机构名称" prop="organizationName">
        <el-input v-model="formData.organizationName" placeholder="请输入组织机构名称" />
      </el-form-item>
      <el-form-item label="单位负责人" prop="unitManager">
        <el-input v-model="formData.unitManager" placeholder="请输入单位负责人" />
      </el-form-item>
      <el-form-item label="统计负责人" prop="statisticsManager">
        <el-input v-model="formData.statisticsManager" placeholder="请输入统计负责人" />
      </el-form-item>
      <el-form-item label="实有床位数" prop="bedCount">
        <el-input v-model="formData.bedCount" placeholder="请输入实有床位数" />
      </el-form-item>
      <el-form-item label="执业医师数" prop="doctorCount">
        <el-input v-model="formData.doctorCount" placeholder="请输入执业医师数" />
      </el-form-item>
      <el-form-item label="执业助理医师数" prop="assistantDoctorCount">
        <el-input v-model="formData.assistantDoctorCount" placeholder="请输入执业助理医师数" />
      </el-form-item>
      <el-form-item label="总诊疗人次数" prop="visitCount">
        <el-input v-model="formData.visitCount" placeholder="请输入总诊疗人次数" />
      </el-form-item>
      <el-form-item label="出院人数" prop="dischargeCount">
        <el-input v-model="formData.dischargeCount" placeholder="请输入出院人数" />
      </el-form-item>
      <el-form-item label="年度药品总收入-导入" prop="annualDrugIncomeImport">
        <el-input v-model="formData.annualDrugIncomeImport" placeholder="请输入年度药品总收入-导入" />
      </el-form-item>
      <el-form-item label="年度药品总收入-直报系统同步" prop="annualDrugIncomeSync">
        <el-input v-model="formData.annualDrugIncomeSync" placeholder="请输入年度药品总收入-直报系统同步" />
      </el-form-item>
      <el-form-item label="中药饮片总采购额" prop="ypPurchaseAmount">
        <el-input v-model="formData.ypPurchaseAmount" placeholder="请输入中药饮片总采购额" />
      </el-form-item>
      <el-form-item label="中药饮片总销售额" prop="ypSellAmount">
        <el-input v-model="formData.ypSellAmount" placeholder="请输入中药饮片总销售额" />
      </el-form-item>
      <el-form-item label="中药颗粒剂总采购额" prop="klPurchaseAmount">
        <el-input v-model="formData.klPurchaseAmount" placeholder="请输入中药颗粒剂总采购额" />
      </el-form-item>
      <el-form-item label="中药颗粒剂总销售额" prop="klSellAmount">
        <el-input v-model="formData.klSellAmount" placeholder="请输入中药颗粒剂总销售额" />
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
      <el-form-item label="部门id" prop="deptId">
        <el-input v-model="formData.deptId" placeholder="请输入部门id" />
      </el-form-item>
      <el-form-item label="报告机构等级" prop="reportOrgLevel">
        <el-input v-model="formData.reportOrgLevel" placeholder="请输入报告机构等级" />
      </el-form-item>
      <el-form-item label="报告机构名称" prop="reportOrgName">
        <el-input v-model="formData.reportOrgName" placeholder="请输入报告机构名称" />
      </el-form-item>
      <el-form-item label="报告年份" prop="reportYear">
        <el-input v-model="formData.reportYear" placeholder="请输入报告年份" />
      </el-form-item>
      <el-form-item label="报告省份" prop="reportProvince">
        <el-input v-model="formData.reportProvince" placeholder="请输入报告省份" />
      </el-form-item>
      <el-form-item label="报告市" prop="reportCity">
        <el-input v-model="formData.reportCity" placeholder="请输入报告市" />
      </el-form-item>
      <el-form-item label="报告区县" prop="reportDistrict">
        <el-input v-model="formData.reportDistrict" placeholder="请输入报告区县" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { HistoryHospitalApi, HistoryHospitalVO } from '@/api/drug/historyhospital'

/** 医疗机构基本情况--历史 表单 */
defineOptions({ name: 'HistoryHospitalForm' })

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
  unitManager: undefined,
  statisticsManager: undefined,
  bedCount: undefined,
  doctorCount: undefined,
  assistantDoctorCount: undefined,
  visitCount: undefined,
  dischargeCount: undefined,
  annualDrugIncomeImport: undefined,
  annualDrugIncomeSync: undefined,
  ypPurchaseAmount: undefined,
  ypSellAmount: undefined,
  klPurchaseAmount: undefined,
  klSellAmount: undefined,
  qcStatus: undefined,
  qcResult: undefined,
  errorMessage: undefined,
  deptId: undefined,
  reportOrgLevel: undefined,
  reportOrgName: undefined,
  reportYear: undefined,
  reportProvince: undefined,
  reportCity: undefined,
  reportDistrict: undefined,
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
      formData.value = await HistoryHospitalApi.getHistoryHospital(id)
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
    const data = formData.value as unknown as HistoryHospitalVO
    if (formType.value === 'create') {
      await HistoryHospitalApi.createHistoryHospital(data)
      message.success(t('common.createSuccess'))
    } else {
      await HistoryHospitalApi.updateHistoryHospital(data)
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
    unitManager: undefined,
    statisticsManager: undefined,
    bedCount: undefined,
    doctorCount: undefined,
    assistantDoctorCount: undefined,
    visitCount: undefined,
    dischargeCount: undefined,
    annualDrugIncomeImport: undefined,
    annualDrugIncomeSync: undefined,
    ypPurchaseAmount: undefined,
    ypSellAmount: undefined,
    klPurchaseAmount: undefined,
    klSellAmount: undefined,
    qcStatus: undefined,
    qcResult: undefined,
    errorMessage: undefined,
    deptId: undefined,
    reportOrgLevel: undefined,
    reportOrgName: undefined,
    reportYear: undefined,
    reportProvince: undefined,
    reportCity: undefined,
    reportDistrict: undefined,
  }
  formRef.value?.resetFields()
}
</script>