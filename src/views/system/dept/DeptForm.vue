<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
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
      <el-form-item label="机构名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入机构名称" />
      </el-form-item>
      <el-form-item label="显示排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
      </el-form-item>
      <el-form-item label="负责人" prop="leaderUser">
        <el-select v-model="formData.leaderUser" clearable placeholder="请输入负责人">
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="formData.phone" maxlength="11" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" maxlength="50" placeholder="请输入邮箱" />
      </el-form-item>
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
      
      <!-- 区域信息 -->
      <el-form-item label="区域ID">
        <el-input-number v-model="formData.regionId" placeholder="请输入区域ID" />
      </el-form-item>
      <el-form-item label="区域编码">
        <el-input v-model="formData.regionCode" placeholder="请输入区域编码" />
      </el-form-item>
      <el-form-item label="区域路径">
        <el-input v-model="formData.regionPath" placeholder="请输入区域路径" />
      </el-form-item>

      <!-- 机构信息 -->
      <el-form-item label="医疗机构ID">
        <el-input v-model="formData.institutionId" placeholder="请输入医疗机构ID" />
      </el-form-item>
      <el-form-item label="机构类别">
        <el-select v-model="formData.institutionCategory" clearable placeholder="请选择机构类别">
          <el-option label="医院(A)" value="A" />
          <el-option label="社区卫生服务中心(B1)" value="B1" />
          <el-option label="乡镇卫生院(C)" value="C" />
        </el-select>
      </el-form-item>
      <el-form-item label="医院等级">
        <el-input v-model="formData.hospitalLevel" placeholder="请输入医院等级" />
      </el-form-item>

      <!-- 联络员信息 -->
      <el-form-item label="联络员">
        <el-input v-model="formData.contactPerson" placeholder="请输入联络员姓名" />
      </el-form-item>
      <el-form-item label="联络员手机">
        <el-input v-model="formData.contactPhone" maxlength="11" placeholder="请输入联络员手机号" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { CommonStatusEnum } from '@/utils/constants'
import { FormRules } from 'element-plus'

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
  // 新增字段
  regionId: undefined,
  regionCode: undefined,
  regionPath: undefined,
  institutionId: undefined,
  institutionCategory: undefined,
  hospitalLevel: undefined,
  contactPerson: undefined,
  contactPhone: undefined
})
const formRules = reactive<FormRules>({
  parentId: [{ required: true, message: '上级机构不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '机构名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [
    { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const deptTree = ref() // 树形结构
const userList = ref<UserApi.UserVO[]>([]) // 用户列表

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
        ...deptData
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
  if (!formRef) return
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
    regionId: undefined,
    regionCode: undefined,
    regionPath: undefined,
    institutionId: undefined,
    institutionCategory: undefined,
    hospitalLevel: undefined,
    contactPerson: undefined,
    contactPhone: undefined
  }
  formRef.value?.resetFields()
}

/** 获得机构树 */
const getTree = async () => {
  deptTree.value = []
  const data = await DeptApi.getSimpleDeptList()
  let dept: Tree = { id: 0, name: '顶级机构', children: [] }
  dept.children = handleTree(data)
  deptTree.value.push(dept)
}
</script>
