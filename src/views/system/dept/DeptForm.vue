<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="上级机构" prop="parentId">
            <el-tree-select
              v-model="formData.parentId"
              :data="deptTree"
              :props="defaultProps"
              check-strictly
              default-expand-all
              placeholder="请选择上级机构"
              value-key="deptId"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机构名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入机构名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="外部机构代码" prop="externalId">
            <el-input v-model="formData.externalId" placeholder="请输入外部机构代码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示排序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" clearable placeholder="请选择状态">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="leaderUser">
            <el-select v-model="formData.leaderUser" clearable placeholder="请选择负责人">
              <el-option
                v-for="item in userList"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="formData.phone" maxlength="20" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" maxlength="50" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">分类属性</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="医疗机构ID">
            <el-input v-model="formData.institutionId" placeholder="请输入医疗机构ID" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机构类别">
            <el-select v-model="formData.institutionCategory" clearable placeholder="请选择机构类别">
              <el-option
                v-for="dict in institutionCategoryOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="医院等级">
            <el-select v-model="formData.hospitalLevel" clearable placeholder="请选择医院等级">
              <el-option
                v-for="dict in institutionLevelOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="行政归属">
            <el-input v-model="formData.adminCategory" placeholder="请输入行政管理归属" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="基层机构">
            <el-switch
              v-model="formData.grassrootsInstitution"
              :active-value="0"
              :inactive-value="1"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="监测对象">
            <el-switch
              v-model="formData.isMonitoringRequired"
              :active-value="0"
              :inactive-value="1"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">区域信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="区域ID">
            <el-input-number v-model="formData.regionId" :min="0" placeholder="请输入区域ID" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="区域编码">
            <el-input v-model="formData.regionCode" placeholder="请输入区域编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="区域路径">
            <el-input v-model="formData.regionPath" placeholder="请输入区域路径" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="行政区划代码">
            <el-input v-model="formData.deptAddressCode" placeholder="请输入行政区划代码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">资质编码</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="组织机构代码">
            <el-input v-model="formData.orgCode" placeholder="请输入组织机构代码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="社会信用代码">
            <el-input v-model="formData.socialCreditCode" placeholder="请输入统一社会信用代码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="执业许可证号">
            <el-input v-model="formData.practiceLicenseNo" placeholder="请输入执业许可证登记号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="批准文号">
            <el-input v-model="formData.approvalRegistrationNo" placeholder="请输入批准文号或注册号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">联系信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="联络员">
            <el-input v-model="formData.contactPerson" placeholder="请输入联络员姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联络员手机">
            <el-input v-model="formData.contactPhone" maxlength="20" placeholder="请输入联络员手机号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮政编码">
            <el-input v-model="formData.postalCode" placeholder="请输入邮政编码" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="联系地址">
            <el-input v-model="formData.address" placeholder="请输入详细联系地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">其他信息</el-divider>
      <el-form-item label="机构描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          maxlength="4000"
          show-word-limit
          placeholder="请输入机构描述"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getDictOptions, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { CommonStatusEnum } from '@/utils/constants'
import { FormRules } from 'element-plus'
import { useMessage } from '@/hooks/web/useMessage'
import { useI18n } from '@/hooks/web/useI18n'

type DeptTreeNode = {
  id: number
  name: string
  children?: DeptTreeNode[]
}

defineOptions({ name: 'SystemDeptForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  title: '',
  parentId: undefined,
  name: undefined,
  sort: undefined,
  leaderUser: undefined,
  phone: undefined,
  email: undefined,
  status: CommonStatusEnum.ENABLE,
  externalId: undefined,
  regionId: undefined,
  regionCode: undefined,
  regionPath: undefined,
  institutionId: undefined,
  institutionCategory: undefined,
  hospitalLevel: undefined,
  contactPerson: undefined,
  contactPhone: undefined,
  adminCategory: undefined,
  grassrootsInstitution: 1,
  isMonitoringRequired: 1,
  deptAddressCode: undefined,
  orgCode: undefined,
  socialCreditCode: undefined,
  practiceLicenseNo: undefined,
  approvalRegistrationNo: undefined,
  address: undefined,
  postalCode: undefined,
  description: undefined
})
const formRules = reactive<FormRules>({
  parentId: [{ required: true, message: '上级机构不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '机构名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^[0-9-]{0,20}$/, message: '联系电话格式不正确', trigger: 'blur' }],
  contactPhone: [{ pattern: /^[0-9-]{0,20}$/, message: '联络员联系方式格式不正确', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const deptTree = ref<DeptTreeNode[]>([]) // 树形结构
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const institutionCategoryOptions = computed(() => getDictOptions(DICT_TYPE.INSTITUTION_CATEGORY))
const institutionLevelOptions = computed(() => getDictOptions(DICT_TYPE.INSTITUTION_LEVEL))

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
      // 获取部门基本信息
      const deptData = await DeptApi.getDept(id)
      formData.value = {
        ...formData.value,
        ...deptData,
        grassrootsInstitution: deptData.grassrootsInstitution ?? 1,
        isMonitoringRequired: deptData.isMonitoringRequired ?? 1
      }
    } finally {
      formLoading.value = false
    }
  }
  // 获得用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 获得部门树
  await getTree()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DeptApi.DeptVO
    let deptId: number
    
    if (formType.value === 'create') {
      deptId = await DeptApi.createDept(data)
      message.success(t('common.createSuccess'))
    } else {
      await DeptApi.updateDept(data)
      deptId = data.id!
      message.success(t('common.updateSuccess'))
    }
    
    // 处理扩展数据 - 现在直接使用部门主表数据

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
    title: '',
    parentId: undefined,
    name: undefined,
    sort: undefined,
    leaderUser: undefined,
    phone: undefined,
    email: undefined,
    status: CommonStatusEnum.ENABLE,
    externalId: undefined,
    regionId: undefined,
    regionCode: undefined,
    regionPath: undefined,
    institutionId: undefined,
    institutionCategory: undefined,
    hospitalLevel: undefined,
    contactPerson: undefined,
    contactPhone: undefined,
    adminCategory: undefined,
    grassrootsInstitution: 1,
    isMonitoringRequired: 1,
    deptAddressCode: undefined,
    orgCode: undefined,
    socialCreditCode: undefined,
    practiceLicenseNo: undefined,
    approvalRegistrationNo: undefined,
    address: undefined,
    postalCode: undefined,
    description: undefined
  }
  formRef.value?.resetFields()
}

/** 获得机构树 */
const getTree = async () => {
  deptTree.value = []
  const data = await DeptApi.getSimpleDeptList()
  const rootNode: DeptTreeNode = { id: 0, name: '顶级机构', children: [] }
  rootNode.children = handleTree(data) as DeptTreeNode[]
  deptTree.value.push(rootNode)
}
</script>
