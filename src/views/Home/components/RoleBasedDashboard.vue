<template>
  <div class="role-dashboard">
    <!-- 页面标题 -->
<!--
    <PageHeader :title="dashboardConfig.title" :content="dashboardConfig.description" />
-->

    <!-- 手机号绑定提醒 -->
    <transition name="slide-fade">
      <div v-if="showMobileAlert" class="mobile-alert-card">
        <div class="alert-icon-wrapper">
          <el-icon class="alert-icon">
            <Warning />
          </el-icon>
        </div>
        <div class="alert-content">
          <div class="alert-text">
            <h4 class="alert-title">完善账户信息</h4>
            <p class="alert-description">请完善实名信息并绑定手机号，以保障您的账户安全和实名制合规</p>
          </div>
          <div class="alert-actions">
            <el-button type="primary" @click="goToProfile" class="bind-button">
              <el-icon class="mr-1"><Phone /></el-icon>
              立即完善
            </el-button>
            <el-button text class="later-button" @click="handleCloseMobileAlert">
              稍后再说
            </el-button>
          </div>
        </div>
        <el-icon class="close-icon" @click="handleCloseMobileAlert">
          <Close />
        </el-icon>
      </div>
    </transition>

    <!-- 统计概览 - 4个统计卡片 -->
<!--
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="药品监测待处理任务"
            :value="statisticsData.drugMonitoringPendingTasks || 0"
            suffix="个"
            icon="FolderAdd"
            color="#409EFF"
            description="待处理的任务数量"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="药品监测本年上报数据"
            :value="statisticsData.drugMonitoringYearData || 0"
            suffix="条"
            icon="DataLine"
            color="#67C23A"
            description="本年度上报数据量"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="周报待处理任务"
            :value="statisticsData.weeklyReportPendingTasks || 0"
            suffix="个"
            icon="Calendar"
            color="#E6A23C"
            description="季节性周报待处理"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="周报本年上报数据"
            :value="statisticsData.weeklyReportYearData || 0"
            suffix="条"
            icon="Document"
            color="#909399"
            description="本年度周报上报数据量"
          />
        </el-col>
      </el-row>
    </div>
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
import { ArrowLeft, Warning, Phone, Close } from '@element-plus/icons-vue'
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
import { getUserProfile } from '@/api/system/user/profile'

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

// 手机号绑定提醒相关
const MOBILE_ALERT_KEY = 'mobile-alert-closed'
const showMobileAlert = ref(false)

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
  checkMobileBinding()
})

// 检查手机号绑定状态
const checkMobileBinding = async () => {
  try {
    // 检查用户是否已经关闭过提醒
    const alertClosed = localStorage.getItem(MOBILE_ALERT_KEY)
    if (alertClosed) {
      return
    }

    // 获取用户信息
    const profile = await getUserProfile()

    // 如果没有绑定手机号或没有填写实名，显示提醒
    if (!profile.mobile || profile.mobile.trim() === '' || !profile.realName || profile.realName.trim() === '') {
      showMobileAlert.value = true
    }
  } catch (error) {
    console.error('Failed to check mobile binding:', error)
  }
}

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

// 关闭手机号提醒
const handleCloseMobileAlert = () => {
  showMobileAlert.value = false
  localStorage.setItem(MOBILE_ALERT_KEY, 'true')
}

// 跳转到个人中心
const goToProfile = () => {
  router.push('/user/profile')
}
</script>

<style scoped>
.role-dashboard {
  padding: 20px;
  min-height: calc(100vh - 50px);
}

/* 现代化通知卡片 */
.mobile-alert-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.25);
  overflow: hidden;
}

/* 背景装饰 */
.mobile-alert-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  pointer-events: none;
}

.mobile-alert-card::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -5%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  pointer-events: none;
}

/* 图标容器 */
.alert-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  z-index: 1;
}

.alert-icon {
  font-size: 24px;
  color: #fff;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 内容区域 */
.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 1;
}

.alert-text {
  color: #fff;
}

.alert-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
}

.alert-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
}

/* 操作按钮 */
.alert-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.bind-button {
  background: #fff !important;
  color: #667eea !important;
  border: none !important;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.bind-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #fff !important;
}

.bind-button .mr-1 {
  margin-right: 4px;
}

.later-button {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
  padding: 10px 16px;
  transition: all 0.3s ease;
}

.later-button:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* 关闭按钮 */
.close-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
  padding: 4px;
  border-radius: 4px;
}

.close-icon:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

/* 动画效果 */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mobile-alert-card {
    flex-direction: column;
    padding: 16px;
  }

  .alert-content {
    gap: 12px;
  }

  .alert-actions {
    flex-direction: column;
    width: 100%;
  }

  .bind-button,
  .later-button {
    width: 100%;
    justify-content: center;
  }

  .alert-description {
    font-size: 13px;
  }
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
