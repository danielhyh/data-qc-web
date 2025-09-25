<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
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
      <el-form-item label="填报通知" prop="noticeContent">
        <Editor
          v-model="formData.noticeContent"
          height="200px"
          placeholder="请输入填报通知内容，支持富文本格式..."
        />
      </el-form-item>
      <el-form-item label="可填报机构" prop="reportableOrgs">
        <div class="org-selector-container">
          <el-row :gutter="12">
            <!-- 左侧：地区树 -->
            <el-col :span="10">
              <el-card shadow="never" class="selector-card">
                <template #header>
                  <div class="card-header">
                    <span>选择地区</span>
                  </div>
                </template>
                <el-tree
                  ref="areaTreeRef"
                  :data="areaTreeData"
                  :props="areaTreeProps"
                  node-key="code"
                  highlight-current
                  default-expand-all
                  @node-click="handleAreaNodeClick"
                >
                  <template #default="{ node, data }">
                    <span class="tree-node">
                      <Icon :icon="getAreaIcon(data.level)" class="node-icon" />
                      <span>{{ node.label }}</span>
                    </span>
                  </template>
                </el-tree>
              </el-card>
            </el-col>

            <!-- 右侧：机构树 -->
            <el-col :span="14">
              <el-card shadow="never" class="selector-card">
                <template #header>
                  <div class="card-header">
                    <span>选择机构</span>
                    <div class="header-actions">
                      全选/全不选:
                      <el-switch
                        v-model="treeNodeAll"
                        active-text="是"
                        inactive-text="否"
                        inline-prompt
                        @change="handleCheckedTreeNodeAll()"
                        :disabled="!selectedArea"
                      />
                      全部展开/折叠:
                      <el-switch
                        v-model="deptExpand"
                        active-text="展开"
                        inactive-text="折叠"
                        inline-prompt
                        @change="handleCheckedTreeExpand"
                        :disabled="!selectedArea"
                      />
                      父子联动:
                      <el-switch
                        v-model="checkStrictly"
                        active-text="是"
                        inactive-text="否"
                        inline-prompt
                        :disabled="!selectedArea"
                      />
                    </div>
                  </div>
                </template>

                <!-- 机构等级多选框 -->
                <div v-if="selectedArea" class="institution-level-filter">
                  <span class="filter-label">机构等级筛选：</span>
                  <el-select
                    v-model="selectedInstitutionLevels"
                    multiple
                    placeholder="选择机构等级"
                    collapse-tags
                    collapse-tags-tooltip
                    clearable
                    @change="handleInstitutionLevelChange"
                    class="level-selector"
                  >
                    <el-option
                      v-for="dict in getIntDictOptions(DICT_TYPE.INSTITUTION_LEVEL)"
                      :key="dict.value"
                      :label="dict.label"
                      :value="dict.value"
                    />
                  </el-select>
                </div>

                <div v-if="!selectedArea" class="empty-state">
                  <Icon icon="ep:pointer" class="empty-icon" />
                  <p>请先选择左侧地区</p>
                </div>

                <el-tree
                  v-else
                  ref="treeRef"
                  :check-strictly="!checkStrictly"
                  :data="filteredDeptOptions"
                  :props="defaultProps"
                  :default-expand-all="deptExpand"
                  empty-text="该地区暂无机构"
                  node-key="id"
                  show-checkbox
                >
                  <template #default="{ node, data }">
                    <div class="dept-node">
                      <span>{{ node.label }}</span>
                      <dict-tag
                        :type="DICT_TYPE.INSTITUTION_LEVEL"
                        :value="data.hospitalLevel"
                        class="ml-2"
                      />
                    </div>
                  </template>
                </el-tree>
              </el-card>
            </el-col>
          </el-row>
        </div>
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
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { ReportZoneApi, type ReportZoneVO } from '@/api/shortage'
import { Editor } from '@/components/Editor'
import { Icon } from '@/components/Icon'
import * as DeptApi from '@/api/system/dept'
import { defaultProps, handleTree } from '@/utils/tree'

/** 短缺药品填报专区 表单 */
defineOptions({ name: 'ReportZoneForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  zoneName: '',
  zoneCode: '',
  noticeContent: '',
  status: 0, // 默认开启（启用状态）
  remark: '',
  reportableOrgs: '',
})

// 部门树相关
const deptOptions = ref<any[]>([]) // 原始部门树形结构
const filteredDeptOptions = ref<any[]>([]) // 过滤后的部门树形结构
const deptExpand = ref(true) // 展开/折叠
const treeRef = ref() // 部门树组件 Ref
const treeNodeAll = ref(false) // 全选/全不选
const checkStrictly = ref(true) // 是否严格模式，即父子不关联

// 地区树相关
const areaTreeRef = ref() // 地区树组件 Ref
const areaTreeData = ref<any[]>([]) // 地区树形结构
const selectedArea = ref<any>(null) // 选中的地区

const areaTreeProps = {
  label: 'name',
  children: 'children'
}

// 机构等级筛选相关
const selectedInstitutionLevels = ref<number[]>([]) // 选中的机构等级

const formRules = reactive({
  zoneName: [{ required: true, message: '专区名称不能为空', trigger: 'blur' }],
  zoneCode: [{ required: true, message: '专区编码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

const formRef = ref() // 表单 Ref

// 获取区域图标
const getAreaIcon = (level: number) => {
  const icons = {
    1: 'ep:location',     // 省
    2: 'ep:map-location', // 市
    3: 'ep:place'         // 区
  }
  return icons[level] || 'ep:location'
}

// 处理地区节点点击
const handleAreaNodeClick = async (data: any) => {
  selectedArea.value = data

  // 切换地区时，重置相关状态
  selectedInstitutionLevels.value = []
  treeNodeAll.value = false

  // 加载该地区的机构数据
  await loadDeptData(data.code)
}

// 加载机构数据
const loadDeptData = async (areaCode: string) => {
  try {
    // 这里需要根据实际的API调用地区下的机构数据
    const data = await DeptApi.getDeptPage({ areaCode, pageSize: 1000 })
    deptOptions.value = handleTree(data)

    // 应用机构等级筛选
    applyInstitutionLevelFilter()
  } catch (error) {
    console.error('加载机构数据失败:', error)
    deptOptions.value = []
    filteredDeptOptions.value = []
  }
}

// 处理机构等级变化
const handleInstitutionLevelChange = () => {
  applyInstitutionLevelFilter()
}

// 应用机构等级筛选
const applyInstitutionLevelFilter = () => {
  if (selectedInstitutionLevels.value.length === 0) {
    // 如果没有选择等级，显示所有机构
    filteredDeptOptions.value = deptOptions.value
  } else {
    // 筛选指定等级的机构
    filteredDeptOptions.value = filterTreeByLevel(deptOptions.value, selectedInstitutionLevels.value)
  }
}

// 递归筛选树节点
const filterTreeByLevel = (nodes: any[], levels: number[]): any[] => {
  return nodes.filter(node => {
    // 如果当前节点匹配等级条件，保留
    if (levels.includes(node.hospitalLevel)) {
      return true
    }

    // 如果有子节点，递归筛选子节点
    if (node.children && node.children.length > 0) {
      const filteredChildren = filterTreeByLevel(node.children, levels)
      if (filteredChildren.length > 0) {
        // 如果有符合条件的子节点，保留当前节点但更新子节点
        return { ...node, children: filteredChildren }
      }
    }

    return false
  }).map(node => {
    if (node.children && node.children.length > 0) {
      return { ...node, children: filterTreeByLevel(node.children, levels) }
    }
    return node
  })
}

// 初始化地区树数据
const initAreaTree = async () => {
  try {
    // 这里应该调用获取地区树的API
    // 为了演示，先使用一个简单的数据结构
    areaTreeData.value = await getAreaTreeData()
  } catch (error) {
    console.error('初始化地区树失败:', error)
  }
}

// 获取地区树数据（这里需要根据实际API实现）
const getAreaTreeData = async () => {
  // 示例数据结构，实际应该从API获取
  return [
    {
      code: '610000',
      name: '陕西省',
      level: 1,
      children: [
        { code: '610100', name: '西安市', level: 2 },
        { code: '610200', name: '铜川市', level: 2 },
        { code: '610300', name: '宝鸡市', level: 2 },
        // 更多城市...
      ]
    }
    // 更多省份...
  ]
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
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      
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
      await new Promise(resolve => setTimeout(resolve, 100))
      
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

  // 初始化地区树数据
  await initAreaTree()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ReportZoneApi.get(id)
      Object.assign(formData.value, data)

      // 如果有选择的机构，需要处理回显
      if (data.reportableOrgs) {
        await nextTick()
        const deptIds = data.reportableOrgs.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

        // 这里可能需要根据已选择的机构找到对应的地区并加载机构树
        // 暂时简化处理，直接设置选中状态
        deptIds.forEach(deptId => {
          treeRef.value?.setChecked(deptId, true, false)
        })
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
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  
  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value } as ReportZoneVO
    
    // 处理可填报机构ID列表
    const checkedDeptIds = treeRef.value?.getCheckedKeys(false) || []
    data.reportableOrgs = checkedDeptIds.join(',')
    
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
  formData.value = {
    id: undefined,
    zoneName: '',
    zoneCode: '',
    noticeContent: getDefaultNoticeContent(),
    status: 0, // 默认开启（启用状态）
    remark: '',
    reportableOrgs: '',
  }

  // 重置地区和机构相关状态
  selectedArea.value = null
  selectedInstitutionLevels.value = []
  deptOptions.value = []
  filteredDeptOptions.value = []

  // 重置部门树状态
  treeNodeAll.value = false
  deptExpand.value = true
  checkStrictly.value = true
  treeRef.value?.setCheckedNodes([])

  formRef.value?.resetFields()
}

// 获取默认通知内容模板
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

/** 全选/全不选 */
const handleCheckedTreeNodeAll = () => {
  if (!selectedArea.value) return
  treeRef.value.setCheckedNodes(treeNodeAll.value ? filteredDeptOptions.value : [])
}

/** 展开/折叠全部 */
const handleCheckedTreeExpand = () => {
  const nodes = treeRef.value?.store.nodesMap
  for (let node in nodes) {
    if (nodes[node].expanded === deptExpand.value) {
      continue
    }
    nodes[node].expanded = deptExpand.value
  }
}
</script>

<style scoped lang="scss">
.org-selector-container {
  .selector-card {
    height: 400px;
    display: flex;
    flex-direction: column;

    :deep(.el-card__header) {
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-card__body) {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      font-size: 14px;
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;

    .node-icon {
      margin-right: 6px;
      color: var(--el-color-primary);
    }
  }

  .institution-level-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .filter-label {
      font-size: 14px;
      color: var(--el-text-color-regular);
      white-space: nowrap;
    }

    .level-selector {
      flex: 1;
      max-width: 300px;
    }
  }

  .dept-node {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
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
}
</style>
