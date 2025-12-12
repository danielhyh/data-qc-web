<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="所属专区ID" prop="zoneId">
        <el-input v-model="formData.zoneId" placeholder="请输入所属专区ID" />
      </el-form-item>
      <el-form-item label="周期标识(如:2025-47)" prop="periodCode">
        <el-input v-model="formData.periodCode" placeholder="请输入周期标识(如:2025-47)" />
      </el-form-item>
      <el-form-item label="年份" prop="year">
        <el-input v-model="formData.year" placeholder="请输入年份" />
      </el-form-item>
      <el-form-item label="周数" prop="weekNum">
        <el-input v-model="formData.weekNum" placeholder="请输入周数" />
      </el-form-item>
      <el-form-item label="数据开始时间(上周六00:00)" prop="dataStartTime">
        <el-date-picker
          v-model="formData.dataStartTime"
          type="date"
          value-format="x"
          placeholder="选择数据开始时间(上周六00:00)"
        />
      </el-form-item>
      <el-form-item label="数据截止时间(本周五12:00)" prop="dataEndTime">
        <el-date-picker
          v-model="formData.dataEndTime"
          type="date"
          value-format="x"
          placeholder="选择数据截止时间(本周五12:00)"
        />
      </el-form-item>
      <el-form-item label="填报开始时间(周五12:00)" prop="reportStartTime">
        <el-date-picker
          v-model="formData.reportStartTime"
          type="date"
          value-format="x"
          placeholder="选择填报开始时间(周五12:00)"
        />
      </el-form-item>
      <el-form-item label="正常截止时间(周五18:00)" prop="reportEndTime">
        <el-date-picker
          v-model="formData.reportEndTime"
          type="date"
          value-format="x"
          placeholder="选择正常截止时间(周五18:00)"
        />
      </el-form-item>
      <el-form-item label="补报截止时间(周六23:59)" prop="supplementEndTime">
        <el-date-picker
          v-model="formData.supplementEndTime"
          type="date"
          value-format="x"
          placeholder="选择补报截止时间(周六23:59)"
        />
      </el-form-item>
      <el-form-item label="周期状态: 0-未开始 1-填报中 2-已截止(补报中) 3-已结束" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="应报机构总数" prop="totalOrgCount">
        <el-input v-model="formData.totalOrgCount" placeholder="请输入应报机构总数" />
      </el-form-item>
      <el-form-item label="已提交机构数(含补报)" prop="submittedCount">
        <el-input v-model="formData.submittedCount" placeholder="请输入已提交机构数(含补报)" />
      </el-form-item>
      <el-form-item label="补报机构数" prop="supplementCount">
        <el-input v-model="formData.supplementCount" placeholder="请输入补报机构数" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ReportPeriodApi, ReportPeriodVO } from '@/api/shortage/reportperiod'

/** 采集周期 表单 */
defineOptions({ name: 'ReportPeriodForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  zoneId: undefined,
  periodCode: undefined,
  year: undefined,
  weekNum: undefined,
  dataStartTime: undefined,
  dataEndTime: undefined,
  reportStartTime: undefined,
  reportEndTime: undefined,
  supplementEndTime: undefined,
  status: undefined,
  totalOrgCount: undefined,
  submittedCount: undefined,
  supplementCount: undefined,
})
const formRules = reactive({
  zoneId: [{ required: true, message: '所属专区ID不能为空', trigger: 'blur' }],
  periodCode: [{ required: true, message: '周期标识(如:2025-47)不能为空', trigger: 'blur' }],
  year: [{ required: true, message: '年份不能为空', trigger: 'blur' }],
  weekNum: [{ required: true, message: '周数不能为空', trigger: 'blur' }],
  dataStartTime: [{ required: true, message: '数据开始时间(上周六00:00)不能为空', trigger: 'blur' }],
  dataEndTime: [{ required: true, message: '数据截止时间(本周五12:00)不能为空', trigger: 'blur' }],
  reportStartTime: [{ required: true, message: '填报开始时间(周五12:00)不能为空', trigger: 'blur' }],
  reportEndTime: [{ required: true, message: '正常截止时间(周五18:00)不能为空', trigger: 'blur' }],
  supplementEndTime: [{ required: true, message: '补报截止时间(周六23:59)不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '周期状态: 0-未开始 1-填报中 2-已截止(补报中) 3-已结束不能为空', trigger: 'blur' }],
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
      formData.value = await ReportPeriodApi.getReportPeriod(id)
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
    const data = formData.value as unknown as ReportPeriodVO
    if (formType.value === 'create') {
      await ReportPeriodApi.createReportPeriod(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReportPeriodApi.updateReportPeriod(data)
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
    zoneId: undefined,
    periodCode: undefined,
    year: undefined,
    weekNum: undefined,
    dataStartTime: undefined,
    dataEndTime: undefined,
    reportStartTime: undefined,
    reportEndTime: undefined,
    supplementEndTime: undefined,
    status: undefined,
    totalOrgCount: undefined,
    submittedCount: undefined,
    supplementCount: undefined,
  }
  formRef.value?.resetFields()
}
</script>
