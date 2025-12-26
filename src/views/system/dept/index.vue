<!--机构管理页面-->
<template>
  <div class="system-dept-page">
    <div class="flex dept-container">
      <!-- 左侧地区树选择器 -->
      <RegionTree
        ref="regionTreeRef"
        :style="{ width: selectorWidth + 'px', flexShrink: 0, height: '100%' }"
        :auto-select-first="false"
        :show-org-count="true"
        :show-collapse-button="true"
        :selected-region-data="selectedRegion"
        @node-click="handleRegionNodeClick"
        @clear="handleClearRegion"
      />

      <!-- 拖拽分隔条 -->
      <div class="resize-handle" @mousedown="startResize"></div>

      <!-- 右侧机构管理内容区域 -->
      <div class="flex-1 ml-5 main-content">
        <!-- Tab 标签页 -->
        <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
          <!-- 机构管理 Tab -->
          <el-tab-pane name="dept">
            <template #label>
              <span class="tab-label-wrapper">
                <Icon icon="ep:office-building" class="tab-icon" />
                <span>机构管理</span>
                <el-badge
                  v-if="total > 0"
                  :value="total"
                  :max="99999"
                  class="tab-badge tab-badge-primary"
                />
              </span>
            </template>
            <!-- 搜索工作栏 -->
            <ContentWrap>
              <el-form
                class="-mb-15px"
                :model="queryParams"
                ref="queryFormRef"
                :inline="true"
                label-width="68px"
              >
                <el-form-item label="关键字" prop="keyword">
                  <el-input
                    v-model="queryParams.keyword"
                    placeholder="机构名称/代码/联络员/电话"
                    clearable
                    @keyup.enter="handleQuery"
                    class="!w-280px"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleQuery">
                    <Icon icon="ep:search" class="mr-5px" /> 搜索
                  </el-button>
                  <el-button @click="resetQuery">
                    <Icon icon="ep:refresh" class="mr-5px" /> 重置筛选
                  </el-button>
                  <el-button
                    :type="showFilter ? 'info' : 'default'"
                    :plain="showFilter"
                    @click="showFilter = !showFilter"
                  >
                    <Icon icon="ep:filter" class="mr-5px" />
                    筛选
                    <Icon :icon="showFilter ? 'ep:arrow-up' : 'ep:arrow-down'" class="ml-5px" />
                  </el-button>
                  <el-button type="warning" plain @click="handleImport">
                    <Icon icon="ep:upload" class="mr-5px" /> 导入
                  </el-button>
                  <el-button type="success" plain @click="handleExport" :loading="exportLoading">
                    <Icon icon="ep:download" class="mr-5px" /> 导出
                  </el-button>
                </el-form-item>
              </el-form>

              <!-- 筛选区域 -->
              <el-collapse-transition>
                <div v-show="showFilter" class="filter-section">
                  <el-form :model="queryParams" :inline="true" label-width="80px">
                    <el-form-item label="管理级别" prop="adminLevel">
                      <el-select
                        v-model="queryParams.adminLevel"
                        placeholder="请选择"
                        clearable
                        class="!w-160px"
                      >
                        <el-option
                          v-for="dict in getIntDictOptions(DICT_TYPE.MANAGEMENT_LEVEL)"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="参与系统" prop="businessType">
                      <el-select
                        v-model="queryParams.businessType"
                        placeholder="请选择"
                        clearable
                        class="!w-160px"
                      >
                        <el-option
                          v-for="dict in getStrDictOptions(DICT_TYPE.BUSINESS_MODULE)"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="机构等级" prop="hospitalLevel">
                      <el-select
                        v-model="queryParams.hospitalLevel"
                        placeholder="请选择"
                        clearable
                        class="!w-160px"
                      >
                        <el-option
                          v-for="dict in getStrDictOptions(DICT_TYPE.INSTITUTION_LEVEL)"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                      <el-select
                        v-model="queryParams.status"
                        placeholder="请选择"
                        clearable
                        class="!w-160px"
                      >
                        <el-option
                          v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="机构分类" prop="deptClass">
                      <el-tree-select
                        v-model="queryParams.deptClass"
                        :data="deptCategoryTree"
                        :props="{ label: 'name', value: 'code', children: 'children' }"
                        check-strictly
                        filterable
                        clearable
                        placeholder="请选择"
                        class="!w-180px"
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-transition>
            </ContentWrap>

            <!-- 机构列表 -->
            <ContentWrap>
              <el-table v-loading="loading" :data="list" row-key="id">
                <!-- 机构名称 + 管理级别标签 -->
                <el-table-column prop="name" label="机构名称" min-width="260" fixed="left">
                  <template #default="scope">
                    <div class="dept-name-cell">
                      <span class="institution-name-text">{{ scope.row.name }}</span>
                      <el-tag
                        v-if="scope.row.adminLevel > 0"
                        :type="getAdminLevelTagType(scope.row.adminLevel)"
                        size="small"
                        class="ml-8px"
                      >
                        {{ getAdminLevelLabel(scope.row.adminLevel) }}
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>
                <!-- 机构代码 -->
                <el-table-column
                  prop="orgCode"
                  label="机构代码"
                  width="140"
                  show-overflow-tooltip
                />
                <!-- 行政区划 -->
                <el-table-column
                  prop="regionPathName"
                  label="行政区划"
                  width="100"
                  show-overflow-tooltip
                />
                <!-- 机构类别 -->
                <el-table-column
                  prop="deptClassName"
                  label="机构类别"
                  width="120"
                  show-overflow-tooltip
                />
                <!-- 等级(级) -->
                <el-table-column prop="hospitalLevelJ" label="等级" width="80">
                  <template #default="scope">
                    <dict-tag
                      v-if="scope.row.hospitalLevelJ"
                      :type="DICT_TYPE.INSTITUTION_LEVEL"
                      :value="scope.row.hospitalLevelJ"
                    />
                    <span v-else class="text-gray-400">-</span>
                  </template>
                </el-table-column>
                <!-- 等次(等) -->
                <el-table-column prop="hospitalGrade" label="等次" width="80">
                  <template #default="scope">
                    <dict-tag
                      v-if="scope.row.hospitalGrade"
                      :type="DICT_TYPE.HOSPITAL_GRADE"
                      :value="scope.row.hospitalGrade"
                    />
                    <span v-else class="text-gray-400">-</span>
                  </template>
                </el-table-column>
                <!-- 参与系统 -->
                <el-table-column prop="businessType" label="参与系统" width="100">
                  <template #default="scope">
                    <dict-tag
                      :type="DICT_TYPE.BUSINESS_MODULE"
                      :value="scope.row.businessType ?? ''"
                    />
                  </template>
                </el-table-column>
                <!-- 联络员 -->
                <el-table-column prop="contactPerson" label="联络员" width="100" />
                <!-- 联络电话 -->
                <el-table-column prop="contactPhone" label="联络电话" width="120" />
                <!-- 账号信息 -->
                <el-table-column label="账号信息" min-width="160">
                  <template #default="scope">
                    <div v-if="scope.row.username" class="account-info-cell">
                      <div class="account-row">
                        <el-tag
                          :type="scope.row.userStatus === 0 ? 'success' : 'danger'"
                          size="small"
                          class="status-tag"
                        >
                          {{ scope.row.userStatus === 0 ? '正常' : '停用' }}
                        </el-tag>
                        <span class="account-username" :title="scope.row.username">{{
                            scope.row.username
                          }}</span>
                      </div>
                      <div v-if="scope.row.loginDate" class="login-time">
                        最后 {{ formatDate(scope.row.loginDate) }}
                      </div>
                      <div v-else class="login-time text-gray-400">未登录</div>
                    </div>
                    <span v-else class="text-gray-400">-</span>
                  </template>
                </el-table-column>
                <!-- 状态 -->
                <el-table-column prop="status" label="状态" width="80" align="center">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 0 ? 'success' : 'info'" size="small">
                      {{ scope.row.status === 0 ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="260px" fixed="right">
                  <template #default="scope">
                    <el-button
                      type="success"
                      size="small"
                      @click="openDetail(scope.row)"
                      v-hasPermi="['system:dept:query']"
                    >
                      <Icon icon="ep:view" />
                      详情
                    </el-button>
                    <el-button
                      v-if="scope.row.username"
                      type="warning"
                      size="small"
                      plain
                      @click="handleResetPassword(scope.row)"
                      v-hasPermi="['system:user:update-password']"
                    >
                      <Icon icon="ep:key" />
                      重置密码
                    </el-button>
                    <el-dropdown
                      trigger="click"
                      @command="(cmd) => handleCommand(cmd, scope.row)"
                      @visible-change="
                        (visible) => handleDropdownVisibleChange(scope.row.id, visible)
                      "
                    >
                      <el-button type="info" size="small" class="more-btn">
                        <Icon
                          :icon="dropdownStates[scope.row.id] ? 'ep:arrow-up' : 'ep:arrow-down'"
                        />
                        更多
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <!-- 编辑机构 -->
                          <el-dropdown-item command="edit" v-if="checkPermi(['system:dept:update'])">
                            <Icon icon="ep:edit" class="mr-5px" />编辑机构
                          </el-dropdown-item>
                          <!-- 维护无法上报机构 - 仅医疗机构显示 -->
                          <el-dropdown-item
                            v-if="scope.row.adminLevel === 0 && checkPermi(['system:monitoring-unable-report:create'])"
                            command="unableReport"
                          >
                            <Icon icon="ep:warning" class="mr-5px" />维护无法上报机构
                          </el-dropdown-item>
                          <!-- 管理账号 -->
                          <el-dropdown-item command="account" v-if="checkPermi(['system:user:query'])">
                            <Icon icon="ep:user" class="mr-5px" />管理账号
                          </el-dropdown-item>
                          <!-- 停用/启用机构 - 仅省级管理员可操作 -->
                          <el-dropdown-item
                            :command="scope.row.status === 0 ? 'disable' : 'enable'"
                            v-if="checkPermi(['system:dept:update-status'])"
                            :divided="true"
                          >
                            <Icon
                              :icon="scope.row.status === 0 ? 'ep:video-pause' : 'ep:video-play'"
                              class="mr-5px"
                            />
                            {{ scope.row.status === 0 ? '停用机构' : '启用机构' }}
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </template>
                </el-table-column>
              </el-table>
              <!-- 分页组件 -->
              <Pagination
                :total="total"
                v-model:page="queryParams.pageNo"
                v-model:limit="queryParams.pageSize"
                @pagination="getList"
              />
            </ContentWrap>
          </el-tab-pane>

          <!-- 无法上报机构 Tab -->
          <el-tab-pane name="monitoring">
            <template #label>
              <span class="tab-label-wrapper">
                <Icon icon="ep:warning" class="tab-icon" />
                <span>无法上报机构</span>
                <el-badge
                  v-if="unableReportCount > 0"
                  :value="unableReportCount"
                  :max="99999"
                  class="tab-badge tab-badge-warning"
                />
              </span>
            </template>
            <!-- 无法上报机构组件 - 始终渲染以便初始化加载数据 -->
            <MonitoringUnableReportTab
              :area-code="selectedRegionCode"
              :selected-region-id="selectedRegionIdForMonitor"
              @count-updated="handleUnableReportCountUpdate"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 业务类型配置弹窗 -->
    <el-dialog
      v-model="businessTypeDialog.visible"
      title="配置参与系统"
      width="500px"
      @close="handleBusinessTypeClose"
    >
      <el-form :model="businessTypeForm" label-width="100px">
        <el-form-item label="机构名称">
          <el-input :value="businessTypeForm.deptName" disabled />
        </el-form-item>
        <el-form-item label="管理级别">
          <dict-tag
            :type="DICT_TYPE.MANAGEMENT_LEVEL"
            :value="businessTypeForm.adminLevel ? businessTypeForm.adminLevel.toString() : '0'"
          />
          <el-tag v-if="businessTypeForm.adminLevel > 0" type="warning" class="ml-10px">
            <Icon icon="ep:warning" class="mr-5px" />
            管理机构不受业务模块限制
          </el-tag>
        </el-form-item>
        <el-form-item label="参与系统">
          <el-radio-group
            v-model="businessTypeForm.businessType"
            :disabled="businessTypeForm.adminLevel > 0"
          >
            <el-radio label="BOTH" border>
              <dict-tag :type="DICT_TYPE.BUSINESS_MODULE" value="BOTH" />
              <span class="text-gray-500 ml-5px">同时参与短缺和监测</span>
            </el-radio>
            <el-radio label="SHORTAGE" border class="mt-10px">
              <dict-tag :type="DICT_TYPE.BUSINESS_MODULE" value="SHORTAGE" />
              <span class="text-gray-500 ml-5px">仅参与短缺药品系统</span>
            </el-radio>
            <el-radio label="MONITOR" border class="mt-10px">
              <dict-tag :type="DICT_TYPE.BUSINESS_MODULE" value="MONITOR" />
              <span class="text-gray-500 ml-5px">仅参与监测系统</span>
            </el-radio>
          </el-radio-group>
          <div v-if="businessTypeForm.adminLevel === 0" class="mt-10px text-gray-500">
            <Icon icon="ep:info-filled" class="mr-5px" />
            提示：配置后将影响该机构用户登录时可见的菜单
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="businessTypeDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleBusinessTypeSave"
          :loading="businessTypeDialog.loading"
          :disabled="businessTypeForm.adminLevel > 0"
        >
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <!-- 表单弹窗：添加/修改 -->
    <DeptForm ref="formRef" @success="getList" />

    <!-- 同步弹窗：从标准库同步 -->
    <InstitutionSyncModal ref="syncModalRef" @success="getList" />

    <!-- 账号管理抽屉 -->
    <AccountDrawer ref="accountDrawerRef" @success="getList" />

    <!-- 机构详情抽屉 -->
    <DeptDetailDrawer ref="detailDrawerRef" />

    <!-- 无法上报机构表单 -->
    <MonitoringUnableReportForm ref="unableReportFormRef" @success="getList" />
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import * as DeptApi from '@/api/system/dept'
import DeptForm from './DeptForm.vue'
import InstitutionSyncModal from './InstitutionSyncModal.vue'
import AccountDrawer from './AccountDrawer.vue'
import DeptDetailDrawer from './DeptDetailDrawer.vue'
import MonitoringUnableReportForm from '../monitoringunablereport/MonitoringUnableReportForm.vue'
import * as UserApi from '@/api/system/user'
import RegionTree from '../user/RegionTree.vue'
import MonitoringUnableReportTab from './MonitoringUnableReportTab.vue'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'
import { useMessage } from '@/hooks/web/useMessage'
import { useI18n } from '@/hooks/web/useI18n'
import { DeptCategoryApi } from '@/api/system/deptcategory'
import { handleTree } from '@/utils/tree'

defineOptions({ name: 'SystemDept' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const exportLoading = ref(false) // 导出加载中
const list = ref<any[]>([]) // 列表的数据
const total = ref(0) // 列表的总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined, // 关键字搜索：机构名称/代码/联络员/电话
  status: undefined,
  adminLevel: undefined, // 管理级别
  businessType: undefined, // 参与系统
  hospitalLevel: undefined, // 机构等级
  deptClass: undefined, // 机构分类
  areaCode: undefined // 使用areaCode匹配后端接口
})
const showFilter = ref(false) // 是否显示筛选区域
const queryFormRef = ref() // 搜索的表单
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const selectedRegionId = ref<string | undefined>() // 选中的地区Code
const selectedRegionCode = ref<string | undefined>() // 选中的地区代码
const selectedRegion = ref<any>(null) // 选中的地区节点（用于显示标签）
const activeTab = ref('dept') // 当前激活的标签页
const unableReportCount = ref(0) // 无法上报机构数量（用于徽标显示）
const deptCategoryTree = ref<any[]>([]) // 机构分类树

// 排序功能已精简，保留以备后用
const editingSortCache = reactive(new Map<number, number>())
const updatingSortId = ref<number | null>(null)

// 下拉菜单展开状态
const dropdownStates = reactive<Record<number, boolean>>({})
const handleDropdownVisibleChange = (id: number, visible: boolean) => {
  dropdownStates[id] = visible
}

const selectedRegionIdForMonitor = computed(() => {
  if (!selectedRegionId.value) {
    return undefined
  }
  const parsed = Number(selectedRegionId.value)
  return Number.isNaN(parsed) ? undefined : parsed
})

// 已精简列表，以下函数保留以备后用
const getBooleanLabel = (value: number | undefined | null) => {
  if (value === 0) return '是'
  if (value === 1) return '否'
  return '-'
}

/** 获取管理级别标签类型 */
const getAdminLevelTagType = (level: number) => {
  const typeMap: Record<number, string> = {
    1: 'danger', // 省级管理
    2: 'warning', // 市级管理
    3: 'success' // 区县级管理
  }
  return typeMap[level] || 'info'
}

/** 获取管理级别标签文本 */
const getAdminLevelLabel = (level: number) => {
  const labelMap: Record<number, string> = {
    1: '省级管理',
    2: '市级管理',
    3: '区县级管理'
  }
  return labelMap[level] || ''
}

/** 获取等级等次合并文本 */
const getHospitalLevelText = (levelJ: string | undefined, grade: string | undefined) => {
  // 等级映射: 1=一级, 2=二级, 3=三级
  const levelMap: Record<string, string> = {
    '1': '一级',
    '2': '二级',
    '3': '三级'
  }
  // 等次映射: 1=甲等, 2=乙等, 3=丙等
  const gradeMap: Record<string, string> = {
    '1': '甲等',
    '2': '乙等',
    '3': '丙等'
  }
  const levelText = levelJ ? levelMap[levelJ] || levelJ : ''
  const gradeText = grade ? gradeMap[grade] || grade : ''
  return levelText + gradeText || '-'
}

/** 格式化日期时间 */
const formatDate = (date: string | Date | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const getBooleanTagType = (value: number | undefined | null) => {
  if (value === 0) return 'success'
  if (value === 1) return 'info'
  return 'info'
}

const getSortInputValue = (row: any) => {
  const cached = editingSortCache.get(row.id)
  return cached !== undefined ? cached : Number(row.sort ?? 0)
}

const handleSortInputChange = (row: any, value: number | undefined) => {
  const numericValue = Number(value ?? 0)
  editingSortCache.set(row.id, numericValue)
}

const handleSortCommit = async (row: any) => {
  if (updatingSortId.value === row.id) {
    return
  }
  const cached = editingSortCache.get(row.id)
  if (cached === undefined) {
    return
  }
  const original = Number(row.sort ?? 0)
  const sanitizedSource = typeof cached === 'number' && Number.isFinite(cached) ? cached : original
  const sanitized = Math.max(0, Math.floor(sanitizedSource))
  if (sanitized === original) {
    editingSortCache.delete(row.id)
    return
  }
  updatingSortId.value = row.id
  try {
    await DeptApi.updateDeptSort(row.id, sanitized)
    message.success('排序已更新')
    editingSortCache.delete(row.id)
    await getList()
  } catch (error: any) {
    console.error('更新排序失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '排序更新失败'
    message.error(errorMsg)
    editingSortCache.set(row.id, sanitized)
  } finally {
    updatingSortId.value = null
  }
}

// 面板拖拽相关
const regionTreeRef = ref<InstanceType<typeof RegionTree>>()
const selectorWidth = ref(250) // 默认宽度设为最小宽度
const isResizing = ref(false)

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
  // 如果地区树处于折叠状态，禁用拖拽
  if (regionTreeRef.value?.isCollapsed) {
    return
  }

  isResizing.value = true
  const startX = e.clientX
  const startWidth = selectorWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return
    const diff = moveEvent.clientX - startX
    const newWidth = Math.max(250, Math.min(600, startWidth + diff)) // 限制最小250px，最大600px
    selectorWidth.value = newWidth
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

/** 监听地区树折叠状态，自动调整宽度 */
watch(
  () => regionTreeRef.value?.isCollapsed,
  (collapsed) => {
    if (collapsed) {
      selectorWidth.value = 50 // 折叠状态宽度 - 只显示展开按钮
    } else if (selectorWidth.value === 50) {
      selectorWidth.value = 250 // 恢复默认宽度
    }
  }
)

/** 查询部门列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeptApi.getDeptPage(queryParams)
    list.value = data.list
    total.value = data.total
    editingSortCache.clear()
  } finally {
    loading.value = false
  }
}

/** 处理地区被点击 */
const handleRegionNodeClick = async (row) => {
  // 使用 code 作为 selectedRegionId，因为新的地区树API返回的是code
  selectedRegionId.value = row.code
  selectedRegionCode.value = row.code
  selectedRegion.value = row
  queryParams.areaCode = row.code
  queryParams.pageNo = 1 // 切换地区时重置为第一页

  // 重置无法上报机构数量（切换地区时清零，等待子组件重新加载）
  unableReportCount.value = 0

  // 刷新机构列表
  await getList()
}

/** 清除地区选择 */
const handleClearRegion = () => {
  selectedRegion.value = null
  selectedRegionId.value = undefined
  selectedRegionCode.value = undefined
  queryParams.areaCode = undefined
  queryParams.pageNo = 1
  // 清除树的选中状态
  regionTreeRef.value?.clearSelection()
  // 重置无法上报机构数量
  unableReportCount.value = 0
  // 刷新机构列表（查询所有机构）
  getList()
}

/** 处理无法上报机构数量更新 */
const handleUnableReportCountUpdate = (count: number) => {
  unableReportCount.value = count
}

/** Tab切换处理 */
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  // 重置所有筛选条件
  queryParams.keyword = undefined
  queryParams.status = undefined
  queryParams.adminLevel = undefined
  queryParams.businessType = undefined
  queryParams.hospitalLevel = undefined
  queryParams.deptClass = undefined
  queryParams.pageNo = 1
  // 重置不清除地区选择，保持地区筛选条件
  handleQuery()
}

/** 获取机构分类树 */
const getDeptCategoryTree = async () => {
  const data = await DeptCategoryApi.getDeptCategoryList({})
  deptCategoryTree.value = handleTree(data, 'id', 'parentId')
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 同步弹窗引用 */
const syncModalRef = ref()

/** 账号管理抽屉引用 */
const accountDrawerRef = ref<InstanceType<typeof AccountDrawer>>()
const openAccountDrawer = (row: any) => {
  accountDrawerRef.value?.open(row)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await DeptApi.deleteDept(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 状态开关操作 */
const handleStatusChange = async (row: any) => {
  try {
    const statusText = row.status === 0 ? '启用' : '禁用'
    await message.confirm(`确认要${statusText}"${row.name}"吗?`)
    await DeptApi.updateDeptStatus(row.id, row.status)
    message.success(`${statusText}成功`)
  } catch {
    // 操作失败或取消，恢复状态
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 导入按钮操作 */
const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx,.csv'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const isSupported =
      fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')
    if (!isSupported) {
      message.error('仅支持上传 xls、xlsx 或 csv 格式文件')
      return
    }

    // 添加 Loading 提示
    const loadingMsg = ElMessage({
      message: '正在导入数据，请稍候...',
      type: 'info',
      duration: 0 // 不自动关闭
    })

    try {
      // 调用后端接口
      await DeptApi.importDept(file)
      loadingMsg.close()
      message.success('数据导入成功！')
      // 刷新列表
      await getList()
    } catch (error: any) {
      loadingMsg.close()
      console.error('导入失败:', error)

      // 显示详细错误信息
      const errorMsg = error.data?.msg || error.message || '导入失败，请检查文件格式和内容'
      message.error(errorMsg)
    }
  }
  input.click()
}

/** 导出机构列表 */
const handleExport = async () => {
  try {
    exportLoading.value = true
    await DeptApi.exportDeptList(queryParams)
    message.success('导出成功')
  } catch (error: any) {
    console.error('导出失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '导出失败'
    message.error(errorMsg)
  } finally {
    exportLoading.value = false
  }
}

/** 重置密码 */
const handleResetPassword = async (row: any) => {
  if (!row.username) return
  try {
    const result = await message.prompt(
      `请输入"${row.username}"的新密码`,
      '重置密码'
    )
    const password = result.value
    if (!password) return
    // 需要先获取用户ID
    const userInfo = await UserApi.getUserByDeptId(row.id)
    if (!userInfo) {
      message.error('未找到该机构的账号信息')
      return
    }
    await UserApi.resetUserPassword(userInfo.id, password)
    message.success(`密码已重置为: ${password}`)
  } catch {}
}

/** 操作下拉菜单命令处理 */
const handleCommand = async (command: string, row: any) => {
  switch (command) {
    case 'edit':
      openForm('update', row.id)
      break
    case 'unableReport':
      openUnableReportConfig(row)
      break
    case 'account':
      openAccountDrawer(row)
      break
    case 'disable':
    case 'enable':
      const newStatus = command === 'disable' ? 1 : 0
      row.status = newStatus
      await handleStatusChange(row)
      break
  }
}

// ========== 详情抽屉相关 ==========
const detailDrawerRef = ref()
const openDetail = (row: any) => {
  detailDrawerRef.value?.open(row)
}

// ========== 维护无法上报机构相关 ==========
const unableReportFormRef = ref()
const openUnableReportConfig = (row: any) => {
  // 传递机构的businessType，用于限制可选模块
  unableReportFormRef.value?.open('create', undefined, row.id, selectedRegionCode.value, row.businessType)
}

// ========== 业务类型配置相关 ==========
/** 业务类型配置弹窗数据 */
const businessTypeDialog = reactive({
  visible: false,
  loading: false
})

/** 业务类型配置表单 */
const businessTypeForm = reactive({
  deptId: 0,
  deptName: '',
  adminLevel: 0,
  businessType: '' as string
})

/** 打开业务类型配置弹窗 */
const openBusinessTypeConfig = (row: any) => {
  // 设置表单数据
  businessTypeForm.deptId = row.id
  businessTypeForm.deptName = row.name
  businessTypeForm.adminLevel = row.adminLevel || 0
  businessTypeForm.businessType = row.businessType || ''

  // 打开弹窗
  businessTypeDialog.visible = true
}

/** 关闭业务类型配置弹窗 */
const handleBusinessTypeClose = () => {
  // 清空表单
  businessTypeForm.deptId = 0
  businessTypeForm.deptName = ''
  businessTypeForm.adminLevel = 0
  businessTypeForm.businessType = ''
}

/** 保存业务类型配置 */
const handleBusinessTypeSave = async () => {
  try {
    businessTypeDialog.loading = true

    // 如果没有选择，设置为undefined
    const businessType = businessTypeForm.businessType || undefined

    // 获取完整的部门信息
    const deptInfo = await DeptApi.getDept(businessTypeForm.deptId)

    // 调用更新接口
    await DeptApi.updateDept({
      ...deptInfo,
      id: businessTypeForm.deptId,
      businessType: businessType
    })

    message.success('参与系统配置已更新')
    businessTypeDialog.visible = false

    // 刷新列表
    await getList()
  } catch (error: any) {
    console.error('配置失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '配置更新失败'
    message.error(errorMsg)
  } finally {
    businessTypeDialog.loading = false
  }
}

/** 初始化 **/
onMounted(async () => {
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 获取机构分类树
  getDeptCategoryTree()
  // 默认加载所有机构
  getList()
})
</script>

<style scoped lang="scss">
/* 业务类型单元格样式 */
.business-type-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-tag {
    flex-shrink: 0;
  }

  .el-button {
    margin-left: auto;
  }
}

/* 业务类型弹窗单选框样式 */
.el-radio-group {
  display: flex;
  flex-direction: column;

  .el-radio {
    width: 100%;
    height: auto;
    padding: 12px;
    margin: 0;

    &.mt-10px {
      margin-top: 10px;
    }

    :deep(.el-radio__label) {
      display: flex;
      align-items: center;
      flex: 1;

      .el-tag {
        margin-right: 8px;
      }
    }
  }
}

/* 容器高度自适应 */
.dept-container {
  height: calc(100vh - 140px); /* 减去头部导航和边距 */
  min-height: 600px; /* 最小高度保证内容可见 */
  overflow: hidden;
}

/* Tab 标签图标优化 */
.tab-label-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .tab-icon {
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .tab-badge {
    margin-left: 4px;
  }

  /* 主色徽标 - 蓝色样式 */
  .tab-badge-primary {
    :deep(.el-badge__content) {
      background: linear-gradient(135deg, #5b8def, #409eff) !important;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4) !important;
      color: white;
      font-weight: 600;
    }
  }

  /* 警告徽标 - 黄色样式 */
  .tab-badge-warning {
    :deep(.el-badge__content) {
      background: linear-gradient(135deg, #f59e0b, #d97706) !important;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4) !important;
      color: white;
      font-weight: 600;
    }
  }
}

/* Tab 激活状态时图标动画 */
:deep(.el-tabs__item.is-active) {
  .tab-icon {
    color: #5b8def;
    transform: scale(1.1);
    filter: drop-shadow(0 2px 4px rgba(91, 141, 239, 0.3));
  }

  /* 激活状态时警告徽标脉动动画 */
  .tab-badge-warning :deep(.el-badge__content) {
    animation: badge-pulse-warning 1.5s ease-in-out infinite;
  }
}

/* Tab 悬停状态时图标动画 */
:deep(.el-tabs__item:hover:not(.is-active)) {
  .tab-icon {
    transform: translateY(-1px);
  }
}

/* 黄色徽标脉动动画 */
@keyframes badge-pulse-warning {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.6);
  }
}

.resize-handle {
  width: 5px;
  background: var(--el-border-color-light);
  cursor: ew-resize;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--el-color-primary);
    width: 6px;
  }

  // 折叠状态下禁用拖拽（通过父组件判断）
  &:has(~ .main-content) {
    &:hover {
      cursor: ew-resize;
    }
  }
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-secondary);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: var(--el-border-color-darker);
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

/* 筛选区域样式 */
.filter-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-lighter);

  .el-form {
    margin-bottom: 0;
  }

  .el-form-item {
    margin-bottom: 12px;
  }
}

.institution-name-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 机构名称单元格 */
.dept-name-cell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

/* 更多按钮样式 */
.more-btn {
  margin-left: 8px;
}

/* 账号信息单元格样式 */
.account-info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* 允许子元素收缩 */

  .account-row {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .status-tag {
    flex-shrink: 0; /* 标签不收缩 */
  }

  .account-username {
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-left: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .login-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
  }
}

.sort-input-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sort-input {
  width: 110px;
}

.sort-loading {
  color: var(--el-color-primary);
  font-size: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 右侧内容区域 - 关键：限制宽度避免被表格撑开
.main-content {
  min-width: 0; // flex子元素必须设置，否则默认min-width: auto会导致内容溢出
  overflow-x: auto; // 横向滚动
}
</style>
