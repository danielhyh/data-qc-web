<template>
  <div class="role-dashboard">
    <!-- 页面标题 -->
<!--
    <PageHeader :title="dashboardConfig.title" :content="dashboardConfig.description" />
-->

    <!-- 系统入口卡片 -->
    <div class="systems-section" v-if="!selectedSystem">
      <h3 class="section-title">系统入口</h3>
      <el-row :gutter="20">
        <el-col
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="6"
          v-for="system in menuSystems"
          :key="system.id"
        >
          <SystemCard :system="system" @click="handleSystemClick(system)" />
        </el-col>
      </el-row>
    </div>

    <!-- 功能菜单卡片 -->
    <div class="function-section" v-if="selectedSystem">
      <div class="section-header">
        <el-button link type="primary" @click="handleBackToSystems" class="back-button">
          <el-icon>
            <ArrowLeft />
          </el-icon>
          返回系统列表
        </el-button>
        <h3 class="section-title">{{ selectedSystem.name }} - 功能菜单</h3>
      </div>
      <el-row :gutter="16">
        <el-col :xs="12" :sm="8" :md="6" :lg="4" :xl="3" v-for="func in functions" :key="func.id">
          <FunctionCard :func="func" @click="handleFunctionClick(func)" />
        </el-col>
      </el-row>
    </div>
    <!-- 功能快捷入口 -->
<!--    <div class="quick-actions-section">
      <h3 class="section-title">常用功能</h3>
      <el-row :gutter="16">
        <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="action in quickActions" :key="action.id">
          <QuickActionCard :action="action" @click="handleQuickActionClick(action)" />
        </el-col>
      </el-row>
    </div>-->

    <!-- 待处理任务和消息提醒 -->
<!--    <el-row :gutter="20" class="bottom-section">
      <el-col :xs="24" :lg="16">
        <PendingTasksCard :tasks="recentTasks" @view-all="handleViewAllTasks" />
      </el-col>
      <el-col :xs="24" :lg="8">
        <MessageCenterCard :messages="recentMessages" @view-all="handleViewAllMessages" />
      </el-col>
    </el-row>-->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import SystemCard from './SystemCard.vue'
import FunctionCard from './FunctionCard.vue'
import QuickActionCard from './QuickActionCard.vue'
import PendingTasksCard from './PendingTasksCard.vue'
import MessageCenterCard from './MessageCenterCard.vue'
import { DashboardApi } from '@/api/system/dashboard'

const { wsCache } = useCache()

defineOptions({ name: 'RoleBasedDashboard' })

// 菜单数据类型定义
interface MenuData {
  id: number
  parentId: number
  name: string
  path: string
  component: string
  componentName: string
  icon: string
  visible: boolean
  keepAlive: boolean
  alwaysShow: boolean
  type: number // 0=目录 1=菜单 2=按钮
  children?: MenuData[] | null
}

// 系统数据类型
interface SystemData {
  id: number
  name: string
  description: string
  icon: string
  color: string
  path: string
  type?: number
  children: MenuData[]
}

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const statisticsData = ref({
  drugMonitoringPendingTasks: 0,
  drugMonitoringYearData: 0,
  weeklyReportPendingTasks: 0,
  weeklyReportYearData: 0
})
const recentTasks = ref([])
const recentMessages = ref([])
const menuSystems = ref<SystemData[]>([])

// 选中的系统
const selectedSystem = ref<SystemData | null>(null)

// 当前显示的功能菜单列表
const functions = ref<Array<MenuData & { fullPath: string }>>([])

// 常用功能列表
const quickActions = ref<any[]>([])

// 获取主系统菜单（顶级菜单）
const getSystemMenus = (): SystemData[] => {
  const roleRouters = wsCache.get(CACHE_KEY.ROLE_ROUTERS) as MenuData[]
  if (!roleRouters) return []

  // 获取顶级菜单作为系统入口
  const systems = roleRouters
    .filter((menu) => menu.parentId === 0 && menu.visible)
    .map((menu) => ({
      id: menu.id,
      name: menu.name,
      description: `${menu.name}数据管理和质量控制`,
      icon: menu.icon,
      color: getSystemColor(menu.id),
      path: menu.path,
      type: menu.type,
      children: menu.children || []
    }))

  return systems
}

// 根据系统ID分配颜色
const getSystemColor = (systemId: number): string => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  return colors[systemId % colors.length]
}

// 页面配置
const dashboardConfig = computed(() => ({
  title: '陕西省药品使用监测管理系统',
  description: '实时监控药品数据导入、质控状态和数据质量,确保医疗机构药品使用数据的准确性和完整性'
}))

// 生命周期
onMounted(() => {
  loadDashboardData()
  loadMenuSystems()
})

// 加载菜单系统
const loadMenuSystems = () => {
  menuSystems.value = getSystemMenus()

  // 加载快捷操作（从菜单中提取常用功能）
  loadQuickActions()
}
// 从菜单中提取快捷操作（只提取type=2的菜单）
const loadQuickActions = () => {
  const actions = []

  // 遍历系统菜单，提取常用功能作为快捷操作
  menuSystems.value.forEach((system) => {
    if (system.children) {
      // 递归获取所有type=2的菜单作为快捷操作
      const getAllType2Menus = (
        menus: MenuData[],
        parentPath: string = ''
      ): Array<
        MenuData & {
          fullPath: string
        }
      > => {
        const result: Array<MenuData & { fullPath: string }> = []
        menus.forEach((menu) => {
          if (menu.visible) {
            // 构建完整路径
            const currentPath = parentPath ? `${parentPath}/${menu.path}` : menu.path

            if (menu.type === 2) {
              result.push({ ...menu, fullPath: currentPath })
            }
            if (menu.children && menu.children.length > 0) {
              result.push(...getAllType2Menus(menu.children, currentPath))
            }
          }
        })
        return result
      }

      const systemMenus = getAllType2Menus(system.children, system.path).slice(0, 3)
      const systemActions = systemMenus.map((child) => ({
        id: child.id,
        name: child.name,
        description: `快速访问${child.name}`,
        icon: child.icon,
        color: system.color,
        path: child.fullPath // 使用完整路径
      }))

      actions.push(...systemActions)
    }
  })

  quickActions.value = actions.slice(0, 8) // 最多显示8个快捷操作
}

// 递归获取系统下所有type=2的菜单
const getFunctionsFromSystem = (system: SystemData): Array<MenuData & { fullPath: string }> => {
  const getAllMenuItems = (
    menus: MenuData[],
    parentPath: string = ''
  ): Array<
    MenuData & {
      fullPath: string
    }
  > => {
    const result: Array<MenuData & { fullPath: string }> = []
    menus.forEach((menu) => {
      if (menu.visible) {
        // 构建完整路径
        const currentPath = parentPath ? `${parentPath}/${menu.path}` : menu.path

        // 如果是菜单类型，直接添加
        if (menu.type === 2) {
          result.push({ ...menu, fullPath: currentPath })
        }
        // 如果有子菜单，继续递归查找
        if (menu.children && menu.children.length > 0) {
          result.push(...getAllMenuItems(menu.children, currentPath))
        }
      }
    })
    return result
  }

  return getAllMenuItems(system.children, system.path)
}

// 加载仪表板数据
const loadDashboardData = async () => {
  try {
    const taskData = await DashboardApi.getPendingTasks()
    const yearlyData = await DashboardApi.getYearlyData()

    // 假设系统ID: 5117=药品监测, 5118=季节性周报
    statisticsData.value = {
      drugMonitoringPendingTasks: taskData[5117] || 0,
      drugMonitoringYearData: yearlyData[5117] || 0,
      weeklyReportPendingTasks: taskData[5118] || 0,
      weeklyReportYearData: yearlyData[5118] || 0
    }

    // 模拟待处理任务
    recentTasks.value = [
      {
        id: 1,
        title: '某某医院数据导入',
        type: 'import',
        status: 'pending',
        createTime: new Date()
      },
      { id: 2, title: '质控规则检查失败', type: 'qc', status: 'error', createTime: new Date() }
    ]

    // 模拟消息
    recentMessages.value = [
      { id: 1, title: '系统维护通知', type: 'system', read: false, createTime: new Date() },
      { id: 2, title: '数据质控报告', type: 'report', read: false, createTime: new Date() }
    ]
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

// 事件处理
const handleSystemClick = (system: SystemData) => {
  // 如果系统本身是菜单类型，直接跳转
  if (system.type === 2) {
    router.push(system.path)
    return
  }

  // 否则显示该系统下所有的功能菜单
  selectedSystem.value = system
  functions.value = getFunctionsFromSystem(system)
}

const handleBackToSystems = () => {
  selectedSystem.value = null
  functions.value = []
}

const handleFunctionClick = (func: MenuData & { fullPath?: string }) => {
  // 使用完整路径进行跳转
  const targetPath = func.fullPath || func.path
  router.push(targetPath)
}

const handleViewAllTasks = () => {
  router.push('/task/list')
}

const handleViewAllMessages = () => {
  router.push('/message/center')
}

const handleQuickActionClick = (action: any) => {
  router.push(action.path)
}
</script>

<style scoped>
.role-dashboard {
  padding: 20px;
  min-height: calc(100vh - 50px);
}

.stats-section {
  margin-bottom: 24px;
}

.systems-section,
.directory-section,
.function-section,
.quick-actions-section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.back-button {
  font-size: 14px;
}

.bottom-section {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .role-dashboard {
    padding: 16px;
  }

  .section-title {
    font-size: 16px;
  }
}
</style>
