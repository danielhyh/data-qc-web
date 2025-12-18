<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <!-- 创建和编辑模式下的可编辑字段 -->
      <template v-if="formType === 'create' || formType === 'update'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="机构名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入机构名称" :disabled="formType === 'update'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构代码" prop="orgCode">
              <el-input v-model="formData.orgCode" placeholder="请输入机构代码" :disabled="formType === 'update'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属区域" prop="regionId">
              <el-tree-select
                v-model="formData.regionId"
                :data="regionTree"
                :props="{ value: 'id', label: 'name', children: 'children' }"
                node-key="id"
                placeholder="请选择所属区域"
                check-strictly
                class="w-full"
                :disabled="formType === 'update'"
                @change="handleRegionChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域代码" prop="regionCode">
              <el-input v-model="formData.regionCode" placeholder="请输入区域代码" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="区域路径" prop="regionPath">
              <el-input v-model="formData.regionPath" placeholder="请输入区域路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示顺序" prop="sort">
              <el-input-number v-model="formData.sort" :min="0" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" class="w-full">
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="parseInt(dict.value)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父级机构" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="deptTree"
                :props="{ value: 'id', label: 'name', children: 'children' }"
                node-key="id"
                placeholder="请选择父级机构"
                check-strictly
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <!-- 机构类别 :C：乡镇卫生院 ；B1：社区卫生服务中心(站)；A:医院 -->
          <!-- deptClass -->
          <el-col :span="12">
            <el-form-item label="机构类别" prop="deptClass">
              <el-select v-model="formData.deptClass" placeholder="请选择机构类别" clearable class="w-full">
                <el-option label="县区卫生局" value="X111" />
                <el-option label="地市卫生局" value="X11" />
                <el-option label="乡卫生院" value="C220" />
                <el-option label="中心卫生院" value="C210" />
                <el-option label="街道卫生院" value="C100" />
                <el-option label="社区卫生服务中心" value="B100" />
                <el-option label="骨伤医院" value="A222" />
                <el-option label="中医（综合）医院" value="A210" />
                <el-option label="综合医院" value="A100" />
                <el-option label="省卫生厅" value="X1" />
                <el-option label="乡镇卫生院" value="C2" />
                <el-option label="街道卫生院" value="C1" />
                <el-option label="社区卫生服务中心" value="B1" />
                <el-option label="中医医院" value="A2" />
                <el-option label="综合医院" value="A1" />
                <el-option label="卫生行政部门" value="X" />
                <el-option label="卫生院" value="C" />
                <el-option label="社区卫生服务中心（站）" value="B" />
                <el-option label="医院" value="A" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联络员" prop="contactPerson">
              <el-input v-model="formData.contactPerson" placeholder="请输入联络员" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联络员电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联络员电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leaderUser">
              <el-input v-model="formData.leaderUser" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮政编码" prop="postalCode">
              <el-input v-model="formData.postalCode" placeholder="请输入邮政编码" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="联系地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入联系地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="机构描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                maxlength="4000"
                show-word-limit
                placeholder="请输入机构描述"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
      
      <!-- 编辑模式下的只读信息 -->
      <template v-else>
        <el-descriptions :column="2" border class="mb-20px">
          <el-descriptions-item label="机构名称" :span="2">
            <span class="font-bold">{{ formData.name }}</span>
            <el-tag
              v-if="formData.adminLevel > 0"
              :type="formData.adminLevel === 1 ? 'danger' : formData.adminLevel === 2 ? 'warning' : 'success'"
              size="small"
              class="ml-8px"
            >
              {{ formData.adminLevel === 1 ? '省级管理' : formData.adminLevel === 2 ? '市级管理' : '区县级管理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="机构代码">
            {{ formData.orgCode || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="行政区划">
            {{ formData.regionPathName || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <el-divider content-position="left">可编辑信息</el-divider>
      
      <!-- 参与系统配置 - 仅医疗机构显示 -->
      <el-form-item v-if="formData.adminLevel === 0 && formType === 'oldUpdate'" label="参与系统" prop="businessType">
        <el-radio-group v-model="formData.businessType">
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
      </el-form-item>
      <el-form-item v-else-if="formType === 'oldUpdate'" label="参与系统">
        <el-tag type="info">管理机构不受业务模块限制</el-tag>
      </el-form-item>

      <!-- 联络人信息提示 -->
      <el-alert
        v-if="formType === 'oldUpdate'"
        title="联络员信息请通过「管理账号」功能编辑"
        type="info"
        :closable="false"
        show-icon
        class="mt-10px"
      />
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as DeptApi from '@/api/system/dept'
import { RegionsApi } from '@/api/system/regions'
import { FormRules } from 'element-plus'
import { useMessage } from '@/hooks/web/useMessage'
import { useI18n } from '@/hooks/web/useI18n'
import { handleTree } from '@/utils/tree'

defineOptions({ name: 'SystemDeptForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update' | 'oldUpdate'>('oldUpdate') // 表单类型：创建/更新/旧版更新
const regionTree = ref<any[]>([]) // 区域树
const deptTree = ref<any[]>([]) // 部门树
const regionMap = ref<Map<number, any>>(new Map()) // 区域映射，用于快速查找

const formData = ref({
  id: undefined as number | undefined,
  name: '' as string | undefined,
  orgCode: '' as string | undefined,
  regionPathName: '' as string | undefined,
  regionId: undefined as number | undefined, // 创建时需要选择区域
  regionCode: '' as string | undefined, // 区域代码
  regionPath: '' as string | undefined, // 区域路径
  adminLevel: 0 as number,
  sort: 0, // 显示顺序
  status: 0, // 状态
  parentId: undefined as number | undefined, // 父级机构
  contactPerson: '' as string | undefined, // 联络员
  contactPhone: '' as string | undefined, // 联络员电话
  leaderUser: '' as string | undefined, // 负责人
  phone: '' as string | undefined, // 联系电话
  email: '' as string | undefined, // 邮箱
  postalCode: '' as string | undefined, // 邮政编码
  address: '' as string | undefined, // 联系地址
  description: '' as string | undefined, // 机构描述
  deptClass: '' as string | undefined, // 机构类别
  // 可编辑字段
  businessType: '' as string | undefined
})

const formRules = reactive<FormRules>({
  name: [{ required: true, message: '机构名称不能为空', trigger: 'blur' }],
  orgCode: [{ required: true, message: '机构代码不能为空', trigger: 'blur' }],
  regionId: [{ required: true, message: '所属区域不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^[0-9-]{0,20}$/, message: '联系电话格式不正确', trigger: 'blur' }],
  contactPhone: [{ pattern: /^[0-9-]{0,20}$/, message: '联络员电话格式不正确', trigger: 'blur' }]
})
const formRef = ref()

/** 获取区域树 */
const getRegionTree = async () => {
  const data = await RegionsApi.getSimpleRegionsList()
  regionTree.value = handleTree(data, 'id', 'parentId')
  
  // 构建区域映射
  const map = new Map<number, any>()
  const buildMap = (nodes: any[]) => {
    nodes.forEach(node => {
      map.set(node.id, node)
      if (node.children && node.children.length > 0) {
        buildMap(node.children)
      }
    })
  }
  buildMap(regionTree.value)
  regionMap.value = map
}

/** 获取部门树 */
const getDeptTree = async () => {
  const data = await DeptApi.getDeptList({})
  deptTree.value = handleTree(data, 'id', 'parentId')
}

/** 处理区域选择变化 */
const handleRegionChange = (regionId: number) => {
  if (!regionId) {
    formData.value.regionCode = ''
    formData.value.regionPath = ''
    return
  }
  
  const region = regionMap.value.get(regionId)
  if (region) {
    // 设置区域代码
    formData.value.regionCode = region.code
    
    // 构建区域路径
    const pathIds: number[] = []
    let currentNode = region
    while (currentNode) {
      pathIds.unshift(currentNode.id)
      currentNode = currentNode.parentId ? regionMap.value.get(currentNode.parentId) : null
    }
    
    // 构建路径字符串
    const pathCodes = pathIds.map(id => {
      const node = regionMap.value.get(id)
      return node ? node.code : ''
    }).filter(code => code)
    
    formData.value.regionPath = '/' + pathCodes.join('/') + '/'
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type as 'create' | 'update' | 'oldUpdate'
  dialogTitle.value = type === 'create' ? '新增机构' : 
                     type === 'update' ? '编辑机构' : '编辑机构'
  resetForm()
  
  // 如果是创建或编辑模式，获取区域树和部门树
  if (type === 'create' || type === 'update') {
    formLoading.value = true
    try {
      await Promise.all([getRegionTree(), getDeptTree()])
      
      // 如果是编辑模式且传入了ID，则获取机构信息
      if (type === 'update' && id) {
        const deptData = await DeptApi.getDept(id)
        formData.value = {
          id: deptData.id,
          name: deptData.name,
          orgCode: deptData.orgCode,
          regionPathName: deptData.regionPathName,
          regionId: deptData.regionId,
          regionCode: deptData.regionCode || '',
          regionPath: deptData.regionPath || '',
          adminLevel: deptData.adminLevel || 0,
          businessType: deptData.businessType || '',
          phone: deptData.phone || '',
          email: deptData.email || '',
          address: deptData.address || '',
          postalCode: deptData.postalCode || '',
          description: deptData.description || '',
          sort: deptData.sort || 0,
          status: deptData.status !== undefined ? deptData.status : 0,
          parentId: deptData.parentId,
          contactPerson: deptData.contactPerson || '',
          contactPhone: deptData.contactPhone || '',
          leaderUser: deptData.leaderUser || '',
          deptClass: deptData.deptClass || '' // 添加机构类别字段
        }
      }
    } finally {
      formLoading.value = false
    }
    return
  }
  
  // 旧版编辑模式
  if (id) {
    formLoading.value = true
    try {
      const deptData = await DeptApi.getDept(id)
      formData.value = {
        id: deptData.id,
        name: deptData.name,
        orgCode: deptData.orgCode,
        regionPathName: deptData.regionPathName,
        regionId: deptData.regionId,
        regionCode: deptData.regionCode || '',
        regionPath: deptData.regionPath || '',
        adminLevel: deptData.adminLevel || 0,
        businessType: deptData.businessType || '',
        phone: deptData.phone || '',
        email: deptData.email || '',
        address: deptData.address || '',
        postalCode: deptData.postalCode || '',
        description: deptData.description || '',
        sort: deptData.sort || 0,
        status: deptData.status !== undefined ? deptData.status : 0,
        parentId: deptData.parentId,
        contactPerson: deptData.contactPerson || '',
        contactPhone: deptData.contactPhone || '',
        leaderUser: deptData.leaderUser || '',
        deptClass: deptData.deptClass || '' // 添加机构类别字段
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  
  formLoading.value = true
  try {
    if (formType.value === 'create' || formType.value === 'update') {
      // 创建或更新机构
      const data = {
        ...formData.value,
        regionId: formData.value.regionId,
        parentId: formData.value.parentId || undefined,
        status: formData.value.status
      } as DeptApi.DeptVO
      if (formType.value === 'create') {
        await DeptApi.createDept(data)
        message.success(t('common.createSuccess'))
      } else {
        await DeptApi.updateDept(data)
        message.success(t('common.updateSuccess'))
      }
    } else {
      // 旧版更新机构信息
      await DeptApi.updateDept({
        id: formData.value.id,
        businessType: formData.value.businessType || undefined,
        phone: formData.value.phone || undefined,
        email: formData.value.email || undefined,
        address: formData.value.address || undefined,
        postalCode: formData.value.postalCode || undefined,
        description: formData.value.description || undefined,
        deptClass: formData.value.deptClass || undefined
      } as any)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    orgCode: '',
    regionPathName: '',
    regionId: undefined,
    regionCode: '',
    regionPath: '',
    adminLevel: 0,
    sort: 0,
    status: 0,
    parentId: undefined,
    contactPerson: '',
    contactPhone: '',
    leaderUser: '',
    phone: '',
    email: '',
    postalCode: '',
    address: '',
    description: '',
    deptClass: '', // 机构类别
    businessType: ''
  }
  formRef.value?.resetFields()
}
</script>
