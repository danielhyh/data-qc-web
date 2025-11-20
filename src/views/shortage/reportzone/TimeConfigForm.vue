<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="专区名称">
        <el-input v-model="formData.zoneName" disabled />
      </el-form-item>
      
      <el-form-item label="时间限制" prop="isTimeRestricted">
        <el-switch 
          v-model="formData.isTimeRestricted"
          active-text="启用时间限制"
          inactive-text="不限制时间"
          active-color="#13ce66"
          inactive-color="#ff4949"
        />
        <div class="text-xs text-gray-500 mt-1">
          启用后，只有在指定时间段内才能进行填报操作
        </div>
      </el-form-item>

      <div v-if="formData.isTimeRestricted" class="time-config-section">
        <el-form-item label="填报日期" prop="reportTimeConfig.dayOfWeek">
          <el-select v-model="formData.reportTimeConfig.dayOfWeek" style="width: 100%" placeholder="请选择填报日期">
            <el-option
              v-for="day in dayOptions"
              :key="day.value"
              :label="day.label"
              :value="day.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="填报时间段">
          <el-row :gutter="12">
            <el-col :span="11">
              <el-form-item prop="reportTimeConfig.startTime">
                <el-time-picker
                  v-model="startTimeValue"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="开始时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="2" class="text-center">
              <span class="text-gray-500">至</span>
            </el-col>
            <el-col :span="11">
              <el-form-item prop="reportTimeConfig.endTime">
                <el-time-picker
                  v-model="endTimeValue"
                  format="HH:mm" 
                  value-format="HH:mm"
                  placeholder="结束时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>

        <el-alert
          :title="getTimeConfigDisplay()"
          type="info"
          :closable="false"
          class="mb-4"
          show-icon
        />
      </div>

      <el-alert
        v-else
        title="不限制填报时间，用户可在任何时间进行数据填报"
        type="warning"
        :closable="false"
        class="mb-4"
        show-icon
      />
    </el-form>
    
    <template #footer>
      <el-button @click="submitForm" type="primary" :loading="formLoading">
        <Icon icon="ep:check" class="mr-1" />
        保存配置
      </el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ReportZoneApi, type ReportZoneVO, type ReportTimeConfigVO } from '@/api/shortage'
import { useMessage } from '@/hooks/web/useMessage'

const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)

const dayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
]

const formData = ref({
  id: undefined as number | undefined,
  zoneName: '',
  isTimeRestricted: true,
  reportTimeConfig: {
    dayOfWeek: 5,
    startTime: '12:00',
    endTime: '18:00'
  } as ReportTimeConfigVO
})

// 时间选择器的双向绑定
const startTimeValue = computed({
  get: () => formData.value.reportTimeConfig.startTime,
  set: (val: string) => {
    if (val) {
      formData.value.reportTimeConfig.startTime = val
    }
  }
})

const endTimeValue = computed({
  get: () => formData.value.reportTimeConfig.endTime,
  set: (val: string) => {
    if (val) {
      formData.value.reportTimeConfig.endTime = val
    }
  }
})

const formRules = reactive({
  'reportTimeConfig.dayOfWeek': [
    { required: true, message: '请选择填报日期', trigger: 'change' }
  ],
  'reportTimeConfig.startTime': [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  'reportTimeConfig.endTime': [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
})

const formRef = ref()

const open = async (row: ReportZoneVO) => {
  dialogVisible.value = true
  dialogTitle.value = `时间配置 - ${row.zoneName}`
  resetForm()
  
  formData.value.id = row.id
  formData.value.zoneName = row.zoneName
  formData.value.isTimeRestricted = row.isTimeRestricted ?? true
  
  // 回显时间配置数据
  if (row.reportTimeConfig) {
    formData.value.reportTimeConfig = {
      dayOfWeek: row.reportTimeConfig.dayOfWeek,
      startTime: row.reportTimeConfig.startTime,
      endTime: row.reportTimeConfig.endTime
    }
  } else {
    // 使用默认配置
    formData.value.reportTimeConfig = {
      dayOfWeek: 5,
      startTime: '12:00',
      endTime: '18:00'
    }
  }
  
  // 等待下一个tick确保DOM更新后再重置验证状态
  await nextTick()
  formRef.value?.clearValidate()
}

const getTimeConfigDisplay = () => {
  if (!formData.value.isTimeRestricted) return ''
  
  const dayLabel = dayOptions.find(d => d.value === formData.value.reportTimeConfig.dayOfWeek)?.label || ''
  const { startTime, endTime } = formData.value.reportTimeConfig
  
  return `填报时间设置：每${dayLabel} ${startTime} - ${endTime}`
}

const emit = defineEmits(['success'])

const submitForm = async () => {
  if (!formRef.value) return
  
  // 如果启用时间限制，需要验证时间配置
  if (formData.value.isTimeRestricted) {
    const valid = await formRef.value.validate().catch(() => {})
    if (!valid) return
    
    // 验证时间范围
    const start = formData.value.reportTimeConfig.startTime
    const end = formData.value.reportTimeConfig.endTime
    if (start >= end) {
      message.error('开始时间不能晚于或等于结束时间')
      return
    }
  }
  
  formLoading.value = true
  try {
    await ReportZoneApi.updateTimeConfig(formData.value.id!, {
      reportTimeConfig: formData.value.reportTimeConfig,
      isTimeRestricted: formData.value.isTimeRestricted
    })
    message.success('时间配置保存成功')
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    console.error('保存时间配置失败:', error)
    message.error('保存失败，请重试')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    zoneName: '',
    isTimeRestricted: true,
    reportTimeConfig: {
      dayOfWeek: 5,
      startTime: '12:00',
      endTime: '18:00'
    }
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>

<style scoped>
.time-config-section {
  border-left: 3px solid #409eff;
  padding-left: 16px;
  margin-left: 8px;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.text-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #909399;
}

.mt-1 {
  margin-top: 4px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>