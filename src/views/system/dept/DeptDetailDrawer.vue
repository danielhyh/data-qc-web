<!-- 机构详情抽屉 -->
<template>
  <el-drawer
    v-model="visible"
    title="机构详情"
    size="700px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 机构详情 Tab -->
      <el-tab-pane label="机构信息" name="dept">
        <el-descriptions :column="2" border>
          <!-- 基本信息 -->
          <el-descriptions-item label="机构名称" :span="2">
            <span class="font-bold">{{ deptInfo.name }}</span>
            <el-tag
              v-if="deptInfo.adminLevel > 0"
              :type="getAdminLevelTagType(deptInfo.adminLevel)"
              size="small"
              class="ml-8px"
            >
              {{ getAdminLevelLabel(deptInfo.adminLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="机构代码">
            {{ deptInfo.orgCode || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="行政区划">
            {{ deptInfo.regionPathName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="机构类别">
            {{ deptInfo.deptClassName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="等级等次">
            <template v-if="deptInfo.hospitalLevelJ || deptInfo.hospitalGrade">
              <dict-tag
                v-if="deptInfo.hospitalLevelJ"
                :type="DICT_TYPE.INSTITUTION_LEVEL"
                :value="deptInfo.hospitalLevelJ"
              />
              <dict-tag
                v-if="deptInfo.hospitalGrade"
                :type="DICT_TYPE.HOSPITAL_GRADE"
                :value="deptInfo.hospitalGrade"
                class="ml-5px"
              />
            </template>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="参与系统">
            <template v-if="deptInfo.adminLevel > 0">
              <el-tag type="info">管理机构-不受限</el-tag>
            </template>
            <template v-else-if="deptInfo.businessType">
              <dict-tag
                :type="DICT_TYPE.BUSINESS_MODULE"
                :value="deptInfo.businessType"
              />
            </template>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="机构状态">
            <el-tag :type="deptInfo.status === 0 ? 'success' : 'danger'">
              {{ deptInfo.status === 0 ? '启用' : '停用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 联系信息 -->
        <el-divider content-position="left">联系信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="联络员">
            {{ deptInfo.contactPerson || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联络电话">
            {{ deptInfo.contactPhone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="机构电话">
            {{ deptInfo.phone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="机构邮箱">
            {{ deptInfo.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="机构地址" :span="2">
            {{ deptInfo.address || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 同步信息（折叠） -->
        <el-divider content-position="left">同步信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="外部机构ID">
            {{ deptInfo.externalId || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="社会信用代码">
            {{ deptInfo.socialCreditCode || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="医疗机构ID">
            {{ deptInfo.institutionId || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="是否基层机构">
            {{ deptInfo.grassrootsInstitution === 0 ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="是否应监测">
            {{ deptInfo.isMonitoringRequired === 0 ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="有效期起">
            {{ deptInfo.fromDate || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="有效期止">
            {{ deptInfo.toDate || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后同步时间" :span="2">
            {{ formatDate(deptInfo.syncTime) || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 账号信息 Tab -->
      <el-tab-pane name="user">
        <template #label>
          <span>
            账号信息
            <el-tag v-if="userInfo.id" type="success" size="small" class="ml-5px">已创建</el-tag>
            <el-tag v-else type="info" size="small" class="ml-5px">未创建</el-tag>
          </span>
        </template>

        <!-- 有账号时显示 -->
        <template v-if="userInfo.id">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户账号">
              <span class="font-bold">{{ userInfo.username }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="userInfo.status === 0 ? 'success' : 'danger'">
                {{ userInfo.status === 0 ? '正常' : '停用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户身份">
              {{ userInfo.nickname || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="真实姓名">
              {{ userInfo.realName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号码">
              {{ userInfo.mobile || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ userInfo.email || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="性别">
              <dict-tag v-if="userInfo.sex !== undefined" :type="DICT_TYPE.SYSTEM_USER_SEX" :value="userInfo.sex" />
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="密码状态">
              <el-tag :type="userInfo.passwordChanged ? 'success' : 'warning'">
                {{ userInfo.passwordChanged ? '已修改' : '初始密码' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后登录时间">
              {{ formatDate(userInfo.loginDate) || '未登录' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录IP">
              {{ userInfo.loginIp || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">
              {{ formatDate(userInfo.createTime) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              {{ userInfo.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 无账号时显示 -->
        <template v-else>
          <el-empty description="该机构暂无账号">
            <el-button type="primary" @click="handleCreateUser">
              <Icon icon="ep:plus" class="mr-5px" />
              创建账号
            </el-button>
          </el-empty>
        </template>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { formatDate } from '@/utils/formatTime'

const message = useMessage()

const visible = ref(false)
const activeTab = ref('dept')
const deptInfo = ref<any>({})
const userInfo = ref<any>({})

/** 打开抽屉 */
const open = async (row: any) => {
  visible.value = true
  activeTab.value = 'dept'
  
  // 加载机构详情
  try {
    deptInfo.value = await DeptApi.getDept(row.id)
  } catch {
    deptInfo.value = row
  }
  
  // 加载用户信息
  if (row.userId) {
    try {
      userInfo.value = await UserApi.getUser(row.userId)
    } catch {
      userInfo.value = {}
    }
  } else {
    userInfo.value = {}
  }
}

/** 获取管理级别标签类型 */
const getAdminLevelTagType = (level: number) => {
  const map: Record<number, string> = {
    1: 'danger',
    2: 'warning',
    3: 'success'
  }
  return map[level] || 'info'
}

/** 获取管理级别标签文本 */
const getAdminLevelLabel = (level: number) => {
  const map: Record<number, string> = {
    1: '省级管理',
    2: '市级管理',
    3: '区县级管理'
  }
  return map[level] || ''
}

/** 创建账号 */
const handleCreateUser = () => {
  message.info('请通过"管理账号"功能创建账号')
  visible.value = false
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.el-divider {
  margin: 20px 0 15px;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>
