<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <!-- 机构基本信息（只读展示） -->
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

      <el-divider content-position="left">可编辑信息</el-divider>
      
      <!-- 参与系统配置 - 仅医疗机构显示 -->
      <el-form-item v-if="formData.adminLevel === 0" label="参与系统" prop="businessType">
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
      <el-form-item v-else label="参与系统">
        <el-tag type="info">管理机构不受业务模块限制</el-tag>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="机构联系电话" prop="phone">
            <el-input v-model="formData.phone" maxlength="20" placeholder="请输入机构联系电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机构邮箱" prop="email">
            <el-input v-model="formData.email" maxlength="50" placeholder="请输入机构邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮政编码" prop="postalCode">
            <el-input v-model="formData.postalCode" placeholder="请输入邮政编码" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="机构地址" prop="address">
            <el-input v-model="formData.address" placeholder="请输入详细机构地址" />
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

      <!-- 联络人信息提示 -->
      <el-alert
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
import { DICT_TYPE } from '@/utils/dict'
import * as DeptApi from '@/api/system/dept'
import { FormRules } from 'element-plus'
import { useMessage } from '@/hooks/web/useMessage'
import { useI18n } from '@/hooks/web/useI18n'

defineOptions({ name: 'SystemDeptForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formData = ref({
  id: undefined as number | undefined,
  name: '' as string | undefined,
  orgCode: '' as string | undefined,
  regionPathName: '' as string | undefined,
  adminLevel: 0 as number,
  // 可编辑字段
  businessType: '' as string | undefined,
  phone: '' as string | undefined,
  email: '' as string | undefined,
  address: '' as string | undefined,
  postalCode: '' as string | undefined,
  description: '' as string | undefined
})

const formRules = reactive<FormRules>({
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^[0-9-]{0,20}$/, message: '联系电话格式不正确', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑机构'
  resetForm()
  
  if (id) {
    formLoading.value = true
    try {
      const deptData = await DeptApi.getDept(id)
      formData.value = {
        id: deptData.id,
        name: deptData.name,
        orgCode: deptData.orgCode,
        regionPathName: deptData.regionPathName,
        adminLevel: deptData.adminLevel || 0,
        businessType: deptData.businessType || '',
        phone: deptData.phone || '',
        email: deptData.email || '',
        address: deptData.address || '',
        postalCode: deptData.postalCode || '',
        description: deptData.description || ''
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
    // 只更新可编辑字段
    await DeptApi.updateDept({
      id: formData.value.id,
      businessType: formData.value.businessType || undefined,
      phone: formData.value.phone || undefined,
      email: formData.value.email || undefined,
      address: formData.value.address || undefined,
      postalCode: formData.value.postalCode || undefined,
      description: formData.value.description || undefined
    } as any)
    message.success(t('common.updateSuccess'))
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
    adminLevel: 0,
    businessType: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    description: ''
  }
  formRef.value?.resetFields()
}
</script>
