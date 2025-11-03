<template>
  <div>
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
      <div v-loading="formLoading" class="report-zone-form-container">
        <!-- 基本信息卡片 -->
        <ContentWrap
          title="基本信息"
          header-icon="ep:info-filled"
          :collapsible="true"
          :default-collapsed="false"
          shadow="hover"
          class="config-section"
        >
          <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
            <el-form-item label="专区编码" prop="zoneCode">
              <el-input v-model="formData.zoneCode" placeholder="自动生成" :disabled="true" />
            </el-form-item>
            <el-form-item label="专区名称" prop="zoneName">
              <el-input v-model="formData.zoneName" placeholder="请输入专区名称" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio
                  v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                  :key="dict.value"
                  :value="dict.value"
                >
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item prop="noticeContent">
              <template #label>
                <Tooltip
                  title="填报通知"
                  message="向用户发布的填报说明和注意事项，支持富文本格式"
                  icon="ep:info-filled"
                />
              </template>
              <Editor
                v-model="formData.noticeContent"
                height="300px"
                placeholder="请输入填报通知内容，支持富文本格式..."
              />
            </el-form-item>
            <el-form-item label="备注说明" prop="remark">
              <el-input
                v-model="formData.remark"
                type="textarea"
                placeholder="请输入备注说明"
                :rows="3"
              />
            </el-form-item>
          </el-form>
        </ContentWrap>

        <!-- 时间配置卡片 -->
        <ContentWrap
          title="填报时间配置"
          header-icon="ep:clock"
          :collapsible="true"
          :default-collapsed="false"
          shadow="hover"
          class="config-section"
        >
          <el-form ref="timeFormRef" :model="formData" :rules="timeFormRules" label-width="120px">
            <el-form-item prop="isTimeRestricted">
              <template #label>
                <Tooltip
                  title="时间限制"
                  message="启用后，用户只能在指定的时间段内进行数据填报"
                  icon="ep:info-filled"
                />
              </template>
              <el-switch
                v-model="formData.isTimeRestricted"
                active-text="启用时间限制"
                inactive-text="不限制时间"
                active-color="#13ce66"
                inactive-color="#ff4949"
              />
            </el-form-item>

            <div v-if="formData.isTimeRestricted" class="time-config-section">
              <el-form-item label="填报日期" prop="reportTimeConfig.dayOfWeek">
                <el-select
                  v-model="formData.reportTimeConfig.dayOfWeek"
                  style="width: 100%"
                  placeholder="请选择填报日期"
                  :teleported="true"
                >
                  <el-option
                    v-for="day in dayOptions"
                    :key="day.value"
                    :label="day.label"
                    :value="day.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item>
                <template #label>
                  <Tooltip
                    title="填报时间段"
                    message="设置当天允许填报的具体时间范围（最少30分钟）"
                    icon="ep:info-filled"
                  />
                </template>
                <el-row :gutter="12">
                  <el-col :span="11">
                    <el-form-item prop="reportTimeConfig.startTime">
                      <el-time-picker
                        ref="startTimePickerRef"
                        v-model="startTimeValue"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="开始时间"
                        style="width: 100%"
                        teleported
                        popper-class="time-picker-fixed-popper"
                        :disabled-hours="getStartDisabledHours"
                        :disabled-minutes="getStartDisabledMinutes"
                        @visible-change="handleTimePickerVisibleChange('start', $event)"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="2" class="time-separator">
                    <span class="text-gray-500">至</span>
                  </el-col>
                  <el-col :span="11">
                    <el-form-item prop="reportTimeConfig.endTime">
                      <el-time-picker
                        ref="endTimePickerRef"
                        v-model="endTimeValue"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="结束时间"
                        style="width: 100%"
                        teleported
                        popper-class="time-picker-fixed-popper"
                        :disabled-hours="getEndDisabledHours"
                        :disabled-minutes="getEndDisabledMinutes"
                        @visible-change="handleTimePickerVisibleChange('end', $event)"
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
        </ContentWrap>

        <!-- 可填报机构选择器 -->
        <ContentWrap
          :title="`可填报机构（已选机构 ${selectedOrgCount} 个）`"
          header-icon="ep:office-building"
          :collapsible="true"
          :default-collapsed="false"
          shadow="hover"
          class="config-section"
        >
          <template #header>
            <div class="org-header-actions">
              <el-button size="small" type="primary" @click.stop="openOrgSelector">
                <Icon icon="ep:setting" class="mr-1" />
                配置机构
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click.stop="clearAllOrgs"
                :disabled="selectedOrgCount === 0"
              >
                <Icon icon="ep:delete" class="mr-1" />
                清空选择
              </el-button>
            </div>
          </template>

          <div class="org-summary">
            <!-- 搜索栏 -->
            <div v-if="selectedOrgCount > 0" class="org-search-bar">
              <el-input
                v-model="orgSearchKeyword"
                placeholder="搜索机构名称、地区..."
                clearable
                prefix-icon="ep:search"
                size="default"
                class="org-search-input"
              />
            </div>

            <div class="selected-orgs-table-wrapper">
              <el-table
                :data="filteredOrgDetails"
                border
                size="small"
                row-key="id"
                class="selected-orgs-table"
                height="320"
              >
                <el-table-column
                  prop="name"
                  label="机构名称"
                  min-width="220"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span class="org-name-bold">{{ row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="所属地区" min-width="200">
                  <template #default="{ row }">
                    {{ row.regionPathName || row.regionName || row.areaName || '—' }}
                  </template>
                </el-table-column>
                <el-table-column label="等级" min-width="120" align="center">
                  <template #default="{ row }">
                    <dict-tag
                      :type="DICT_TYPE.INSTITUTION_LEVEL"
                      :value="row.hospitalLevel"
                      size="small"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center" fixed="right">
                  <template #default="{ row }">
                    <el-button type="danger" size="small" @click="handleRemoveOrg(row.id)">
                      <Icon icon="ep:delete" class="mr-1" />
                      移除
                    </el-button>
                  </template>
                </el-table-column>
                <template #empty>
                  <div class="empty-org-state">
                    <Icon icon="ep:office-building" class="empty-icon" />
                    <p v-if="orgSearchKeyword">未找到匹配的机构</p>
                    <p v-else>暂未选择任何机构</p>
                    <p v-if="!orgSearchKeyword" class="hint">
                      点击「配置机构」按钮选择可填报的医疗机构
                    </p>
                  </div>
                </template>
              </el-table>
            </div>

            <!-- 统计信息 -->
            <div v-if="selectedOrgCount > 0 && orgSearchKeyword" class="org-search-result">
              <el-tag size="small" type="info">
                显示 {{ filteredOrgDetails.length }} / {{ selectedOrgCount }} 个机构
              </el-tag>
            </div>
          </div>
        </ContentWrap>
      </div>

      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>

    <ReportZoneOrgSelector
      v-model="orgSelectorVisible"
      :selected-ids="selectedOrgIds"
      :selected-details="selectedOrgDetails"
      @confirm="handleOrgSelectorConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, reactive, ref } from 'vue'
import { useMessage } from '../../../hooks/web/useMessage'
import { DICT_TYPE, getIntDictOptions } from '../../../utils/dict'
import { ReportZoneApi, type ReportZoneVO, type ReportTimeConfigVO } from '../../../api/shortage'
import { Editor } from '../../../components/Editor'
import { Icon } from '../../../components/Icon'
import { ContentWrap } from '../../../components/ContentWrap'
import { Tooltip } from '../../../components/Tooltip'
import * as DeptApi from '../../../api/system/dept'

const ReportZoneOrgSelector = defineAsyncComponent(
  () => import('./components/ReportZoneOrgSelector.vue') as Promise<any>
)

/** 短缺药品填报专区 表单 */
defineOptions({ name: 'ReportZoneForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
type ReportZoneFormState = {
  id?: number
  zoneName: string
  zoneCode: string
  noticeContent: string
  status: number
  remark: string
  reportableOrgs: string
  isTimeRestricted: boolean
  reportTimeConfig: ReportTimeConfigVO
}

const getDefaultNoticeContent = (): string => {
  return `<div>
    <h3>📢 填报通知</h3>
    <p>各医疗机构请注意：</p>
    <ol>
      <li><strong>填报时间</strong>：每周五12:00-18:00</li>
      <li><strong>填报范围</strong>：本周六至本周五中午12:00的数据</li>
      <li><strong>数据要求</strong>：按最小剂量单位填写，数据真实准确</li>
      <li><strong>联系方式</strong>：如有疑问请联系质控中心</li>
    </ol>
    <p style="color: #E74C3C;">请务必在规定时间内完成填报，逾期系统将自动关闭。</p>
  </div>`
}

const createDefaultTimeConfig = (): ReportTimeConfigVO => ({
  dayOfWeek: 5,
  startTime: '12:00',
  endTime: '18:00'
})

const createDefaultFormState = (): ReportZoneFormState => ({
  id: undefined,
  zoneName: '',
  zoneCode: '',
  noticeContent: getDefaultNoticeContent(),
  status: 0,
  remark: '',
  reportableOrgs: '',
  isTimeRestricted: true,
  reportTimeConfig: createDefaultTimeConfig()
})

const formData = ref<ReportZoneFormState>(createDefaultFormState())

// 日期选项常量
const dayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
]

// 最小时间间隔（分钟）
const MIN_INTERVAL_MINUTES = 30

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

// 时间选择器禁用逻辑 - 开始时间
const getStartDisabledHours = () => {
  const endTime = formData.value.reportTimeConfig.endTime
  if (!endTime) return []
  
  const [endHour, endMinute] = endTime.split(':').map(Number)
  const disabledHours: number[] = []
  
  // 如果结束时间的分钟数小于30，那么开始时间的小时数不能等于结束时间的小时数
  // 例如：结束时间 12:20，开始时间最晚只能是 11:50，所以小时12要禁用
  const minStartHour = endMinute < MIN_INTERVAL_MINUTES ? endHour - 1 : endHour
  
  for (let i = minStartHour + 1; i < 24; i++) {
    disabledHours.push(i)
  }
  
  return disabledHours
}

const getStartDisabledMinutes = (hour: number) => {
  const endTime = formData.value.reportTimeConfig.endTime
  if (!endTime) return []
  
  const [endHour, endMinute] = endTime.split(':').map(Number)
  const disabledMinutes: number[] = []
  
  if (hour === endHour) {
    // 同一小时内，开始分钟必须比结束分钟小至少30分钟
    for (let i = endMinute - MIN_INTERVAL_MINUTES + 1; i < 60; i++) {
      disabledMinutes.push(i)
    }
  } else if (hour === endHour - 1) {
    // 前一小时，需要保证间隔至少30分钟
    // 例如：结束时间 13:20，开始时间如果是 12:xx，那么 xx 必须 <= 50 (60 - 30 + 20)
    const maxMinute = 60 - MIN_INTERVAL_MINUTES + endMinute
    for (let i = maxMinute + 1; i < 60; i++) {
      disabledMinutes.push(i)
    }
  }
  
  return disabledMinutes
}

// 时间选择器禁用逻辑 - 结束时间
const getEndDisabledHours = () => {
  const startTime = formData.value.reportTimeConfig.startTime
  if (!startTime) return []
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const disabledHours: number[] = []
  
  // 如果开始时间的分钟数大于30，那么结束时间的小时数不能等于开始时间的小时数
  // 例如：开始时间 12:40，结束时间最早只能是 13:10，所以小时12要禁用
  const minEndHour = startMinute > 60 - MIN_INTERVAL_MINUTES ? startHour + 1 : startHour
  
  for (let i = 0; i < minEndHour; i++) {
    disabledHours.push(i)
  }
  
  return disabledHours
}

const getEndDisabledMinutes = (hour: number) => {
  const startTime = formData.value.reportTimeConfig.startTime
  if (!startTime) return []
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const disabledMinutes: number[] = []
  
  if (hour === startHour) {
    // 同一小时内，结束分钟必须比开始分钟大至少30分钟
    for (let i = 0; i < startMinute + MIN_INTERVAL_MINUTES; i++) {
      disabledMinutes.push(i)
    }
  } else if (hour === startHour + 1) {
    // 后一小时，需要保证间隔至少30分钟
    // 例如：开始时间 12:40，结束时间如果是 13:xx，那么 xx 必须 >= 10 (40 + 30 - 60)
    const minMinute = startMinute + MIN_INTERVAL_MINUTES - 60
    for (let i = 0; i < minMinute; i++) {
      disabledMinutes.push(i)
    }
  }
  
  return disabledMinutes
}

// 获取时间配置显示文本
const getTimeConfigDisplay = () => {
  if (!formData.value.isTimeRestricted) return ''

  const dayLabel =
    dayOptions.find((d) => d.value === formData.value.reportTimeConfig.dayOfWeek)?.label || ''
  const { startTime, endTime } = formData.value.reportTimeConfig
  
  // 计算时间间隔
  let intervalText = ''
  if (startTime && endTime) {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0 && mins > 0) {
      intervalText = `，时长 ${hours} 小时 ${mins} 分钟`
    } else if (hours > 0) {
      intervalText = `，时长 ${hours} 小时`
    } else {
      intervalText = `，时长 ${mins} 分钟`
    }
  }

  return `填报时间设置：每${dayLabel} ${startTime} - ${endTime}${intervalText}`
}

// 机构选择器弹窗相关
const orgSelectorVisible = ref(false) // 机构选择器是否显示
const selectedOrgIds = ref<number[]>([]) // 当前选中的机构ID列表
const selectedOrgDetails = ref<any[]>([]) // 当前选中的机构详情
const orgSearchKeyword = ref('') // 机构搜索关键字

// 计算属性：已选择机构数量
const selectedOrgCount = computed(() => selectedOrgIds.value.length)

// 计算属性：根据搜索关键字过滤机构列表
const filteredOrgDetails = computed(() => {
  if (!orgSearchKeyword.value) {
    return selectedOrgDetails.value
  }
  const keyword = orgSearchKeyword.value.toLowerCase()
  return selectedOrgDetails.value.filter((org) => {
    const name = org.name?.toLowerCase() || ''
    const regionName = org.regionName?.toLowerCase() || ''
    const areaName = org.areaName?.toLowerCase() || ''
    const regionPath = org.regionPath?.toLowerCase() || ''
    const regionPathName = org.regionPathName?.toLowerCase() || ''
    return (
      name.includes(keyword) ||
      regionName.includes(keyword) ||
      areaName.includes(keyword) ||
      regionPath.includes(keyword) ||
      regionPathName.includes(keyword)
    )
  })
})

const mergeOrgDetails = (ids: number[], details: any[] = []) => {
  const detailMap = new Map<number, any>()
  // 1. 先放入新的详情
  details.forEach((item) => {
    if (item && typeof item.id === 'number') {
      detailMap.set(item.id, item)
    }
  })
  // 2. 再补充旧的详情，避免丢失
  selectedOrgDetails.value.forEach((item) => {
    if (item && typeof item.id === 'number' && !detailMap.has(item.id)) {
      detailMap.set(item.id, item)
    }
  })

  return ids.map((id) => detailMap.get(id)).filter(Boolean)
}

const handleRemoveOrg = (orgId: number) => {
  selectedOrgIds.value = selectedOrgIds.value.filter((id) => id !== orgId)
  selectedOrgDetails.value = selectedOrgDetails.value.filter((item) => item.id !== orgId)
}

const clearAllOrgs = () => {
  if (selectedOrgIds.value.length === 0) {
    return
  }
  selectedOrgIds.value = []
  selectedOrgDetails.value = []
  message.success('已清空所有选定机构')
}

const openOrgSelector = () => {
  orgSelectorVisible.value = true
}

type OrgSelectorConfirmPayload = {
  ids: number[]
  details: any[]
}

const handleOrgSelectorConfirm = (payload: OrgSelectorConfirmPayload) => {
  const { ids, details } = payload
  selectedOrgIds.value = [...ids]
  selectedOrgDetails.value = mergeOrgDetails(ids, details)
  orgSelectorVisible.value = false
  if (ids.length > 0) {
    message.success(`成功选择 ${ids.length} 个机构`)
  }
}

const formRules = reactive({
  zoneName: [{ required: true, message: '专区名称不能为空', trigger: 'blur' }],
  zoneCode: [{ required: true, message: '专区编码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

// 时间配置验证规则
const timeFormRules = reactive({
  'reportTimeConfig.dayOfWeek': [{ required: true, message: '请选择填报日期', trigger: 'change' }],
  'reportTimeConfig.startTime': [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  'reportTimeConfig.endTime': [{ required: true, message: '请选择结束时间', trigger: 'change' }]
})

const formRef = ref() // 表单 Ref
const timeFormRef = ref() // 时间配置表单 Ref
const startTimePickerRef = ref() // 开始时间选择器 Ref
const endTimePickerRef = ref() // 结束时间选择器 Ref

// 根据机构 ID 列表获取机构详情（用于编辑状态下的回显）
const loadOrgDetailsByIds = async (orgIds: number[]) => {
  if (!orgIds || orgIds.length === 0) {
    selectedOrgDetails.value = []
    return
  }

  try {
    const tasks = orgIds.map(async (id) => {
      try {
        const orgDetail = await DeptApi.getDept(id)
        return {
          id: orgDetail.id,
          name: orgDetail.name,
          hospitalLevel: orgDetail.hospitalLevel,
          regionName: orgDetail.regionName,
          areaName: orgDetail.areaName,
          regionPath: orgDetail.regionPath,
          regionPathName: orgDetail.regionPathName || '', // 区域路径中文名称
          address: orgDetail.address || '',
          contactPerson: orgDetail.contactPerson || '',
          contactPhone: orgDetail.contactPhone || ''
        }
      } catch (error) {
        console.warn(`获取机构 ${id} 详情失败:`, error)
        return {
          id,
          name: `机构ID: ${id}`,
          hospitalLevel: '',
          regionName: '',
          areaName: '',
          regionPath: '',
          regionPathName: '',
          address: '',
          contactPerson: '',
          contactPhone: ''
        }
      }
    })

    const details = await Promise.all(tasks)
    selectedOrgDetails.value = mergeOrgDetails(orgIds, details)
  } catch (error) {
    console.error('批量获取机构详情失败:', error)
    selectedOrgDetails.value = mergeOrgDetails(orgIds)
  }
}
const generateZoneCode = async () => {
  const maxRetries = 5
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      // 获取当前时间信息
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')

      // 生成随机数（3位）
      const randomNum = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')

      // 组合编码：ZONE_年月日时分_随机数
      const baseCode = `ZONE_${year}${month}${day}${hour}${minute}_${randomNum}`

      // 检查编码是否已存在
      const existingData = await ReportZoneApi.getPage({
        pageNo: 1,
        pageSize: 1,
        zoneCode: baseCode
      })

      // 如果不存在，返回此编码
      if (!existingData.list || existingData.list.length === 0) {
        return baseCode
      }

      // 如果存在，增加尝试次数继续生成
      attempt++

      // 添加短暂延时避免连续生成相同时间戳
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.warn(`生成专区编码失败，尝试次数：${attempt + 1}`, error)
      attempt++

      // 最后一次尝试失败时，使用纯时间戳 + UUID 后4位
      if (attempt === maxRetries) {
        const timestamp = Date.now().toString()
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(-4).toUpperCase()
        return `ZONE_${timestamp}_${uuid}`
      }
    }
  }

  // 兜底方案：使用完整时间戳
  return `ZONE_${Date.now()}_${Math.random().toString(36).slice(-4).toUpperCase()}`
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增专区' : '编辑专区'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ReportZoneApi.get(id)
      Object.assign(formData.value, data)

      // 回显时间配置数据
      if (data.reportTimeConfig) {
        formData.value.reportTimeConfig = {
          dayOfWeek: data.reportTimeConfig.dayOfWeek,
          startTime: data.reportTimeConfig.startTime,
          endTime: data.reportTimeConfig.endTime
        }
      } else {
        // 使用默认配置
        formData.value.reportTimeConfig = {
          dayOfWeek: 5,
          startTime: '12:00',
          endTime: '18:00'
        }
      }

      // 如果有时间限制字段则回显，否则使用默认值
      formData.value.isTimeRestricted = data.isTimeRestricted ?? true

      // 如果有选择的机构，设置到selectedOrgIds中并加载详情
      if (data.reportableOrgs) {
        const deptIds = data.reportableOrgs
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id))
        selectedOrgIds.value = [...deptIds]
        // 加载选中机构的详细信息用于回显
        await loadOrgDetailsByIds(deptIds)
      }
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增时自动生成专区编码
    formData.value.zoneCode = await generateZoneCode()
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

const submitForm = async () => {
  // 校验主表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return

  // 如果启用时间限制，需要验证时间配置
  if (formData.value.isTimeRestricted) {
    if (!timeFormRef.value) return
    const timeValid = await timeFormRef.value.validate().catch(() => {})
    if (!timeValid) return
  }

  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value } as ReportZoneVO

    // 处理可填报机构ID列表 - 使用selectedOrgIds而不是从树组件获取
    data.reportableOrgs = selectedOrgIds.value.join(',')

    if (formType.value === 'create') {
      await ReportZoneApi.create(data)
      message.success('创建成功')
    } else {
      await ReportZoneApi.update(data)
      message.success('更新成功')
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
  formData.value = createDefaultFormState()

  // 重置地区和机构相关状态
  selectedOrgIds.value = []
  selectedOrgDetails.value = []
  orgSearchKeyword.value = '' // 重置搜索关键字

  // 重置机构选择器弹窗状态
  orgSelectorVisible.value = false

  formRef.value?.resetFields()
  timeFormRef.value?.resetFields() // 重置时间配置表单验证状态
}

/** 时间选择器显示/隐藏事件 - 防止滚动冲突 */
const handleTimePickerVisibleChange = (type: string, visible: boolean) => {
  const container = document.querySelector('.report-zone-form-container') as HTMLElement

  if (visible) {
    // 打开时临时禁用表单容器滚动，避免滚动冲突
    if (container) {
      container.style.overflow = 'hidden'
    }

    nextTick(() => {
      const timePanel =
        document.querySelector('.time-picker-fixed-popper .el-time-panel') ||
        document.querySelector('.el-time-panel')
      if (!timePanel) {
        console.warn(`[time-picker][${type}] 未找到时间面板 DOM`)
        return
      }

      const spinnerItems = timePanel.querySelectorAll('.el-time-spinner__list li')
      console.log(`[time-picker][${type}] Spinner 项数量:`, spinnerItems.length)

      const sampleItem = timePanel.querySelector('.el-time-spinner__item') as HTMLElement | null
      if (sampleItem) {
        const styles = getComputedStyle(sampleItem)
        console.log(`[time-picker][${type}] Spinner 项样式:`, {
          height: styles.height,
          lineHeight: styles.lineHeight,
          marginTop: styles.marginTop,
          marginBottom: styles.marginBottom,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom
        })
      }
    })
  } else {
    // 关闭时恢复表单容器滚动
    if (container) {
      container.style.overflow = 'auto'
    }
  }
}
</script>

<style scoped lang="scss">
// 表单容器
.report-zone-form-container {
  max-height: 75vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 4px;
  // 预留滚动条空间，避免内容挤压
  scrollbar-gutter: stable;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

// 配置区块样式 - ContentWrap 组件
.config-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

// 标题栏操作按钮区域
.section-actions {
  display: flex;
  gap: 8px;
}

.time-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
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

.org-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.org-summary {
  min-height: 160px;

  // 搜索栏样式
  .org-search-bar {
    margin-bottom: 12px;

    .org-search-input {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover,
        &.is-focus {
          box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.3) inset;
        }
      }
    }
  }

  // 搜索结果统计
  .org-search-result {
    margin-top: 8px;
    text-align: right;
  }

  .empty-org-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--el-text-color-secondary);
    padding: 48px 0;

    .empty-icon {
      font-size: 52px;
      margin-bottom: 16px;
      color: var(--el-border-color-darker);
    }

    .hint {
      font-size: 14px;
      color: var(--el-text-color-placeholder);
    }
  }

  .selected-orgs-table-wrapper {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    background: var(--el-bg-color);

    :deep(.el-table__inner-wrapper) {
      border-radius: 0;
    }

    :deep(.el-table__header) {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.08), rgba(99, 102, 241, 0.08));
    }

    // 表格主体区域 - 固定高度，自动滚动
    :deep(.el-table__body-wrapper) {
      overflow-y: auto !important;
      
      // 自定义滚动条样式
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        
        &:hover {
          background: rgba(0, 0, 0, 0.25);
        }
      }
    }

    :deep(.el-table__row) {
      transition: background 0.2s ease;

      &:hover > td.el-table__cell {
        background: rgba(59, 130, 246, 0.08) !important;
      }
    }

    :deep(.el-table__cell) {
      padding: 12px 16px;
    }

    :deep(.el-table__empty-block) {
      min-height: 160px;
    }
  }
}

// ContentWrap 组件无需额外卡片样式

// 表单样式优化
:deep(.el-input__wrapper) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

// 按钮样式
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

// 标签样式
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

// 加载遮罩
:deep(.el-loading-mask) {
  border-radius: 8px;
  backdrop-filter: blur(2px);
}

// 时间配置内部样式
.time-config-section {
  border-left: 3px solid #409eff;
  padding-left: 16px;
  margin-left: 8px;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

// 机构名称加粗
.org-name-bold {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
