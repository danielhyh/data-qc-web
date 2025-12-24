<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="牵头单位" prop="masterId" v-if="formType === 'update'">
        <el-input 
          v-model="formData.masterId" 
          placeholder="请输入牵头单位" 
          @blur="onMasterIdChange"
        />
      </el-form-item>

      <el-form-item label="成员单位" prop="memberIds">
        <el-checkbox-group v-model="selectedMemberIds" class="member-checkbox-group">
          <el-checkbox
            v-for="member in availableMemberList"
            :key="member.id"
            :label="member.id"
            :value="member.id"
          >
            {{ member.name }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="排序" prop="sortNum" v-if="false">
        <el-input v-model="formData.sortNum" placeholder="请输入排序" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DeptCommunityApi, DeptCommunityVO, DeptRespVO } from '@/api/drug/deptcommunity'

/** 紧密医疗共同体 表单 */
defineOptions({ name: 'DeptCommunityForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  masterId: undefined,
  memberId: undefined,
  sortNum: undefined,
})
const formRules = reactive({
})
const formRef = ref() // 表单 Ref

// 新增字段：可选的成员单位列表和已选中的成员单位
const availableMemberList = ref<DeptRespVO[]>([]) // 可选的成员单位列表（根据牵头单位ID获取）
const selectedMemberIds = ref<number[]>([]) // 已选中的成员单位ID

// 根据牵头单位ID获取所有可加入紧密医疗共同体的部门列表
const loadAvailableMemberList = async (masterId?: number) => {
  const idToUse = masterId || formData.value.masterId
  if (!idToUse) {
    availableMemberList.value = []
    return
  }
  
  console.log('Loading available members for masterId:', idToUse) // 调试日志
  
  try {
    // 调用后端API获取可选的成员单位列表
    console.log('Calling API with masterId:', idToUse) // 调试日志
    const data: DeptRespVO[] = await DeptCommunityApi.getAvailableDepts(idToUse)
    console.log('API response received:', data) // 调试日志
    availableMemberList.value = data
  } catch (error) {
    console.error('加载成员单位列表失败:', error)
    console.error('Error details:', error) // 详细错误信息
    availableMemberList.value = []
    message.error('加载成员单位列表失败')
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number, masterId?: number) => {
  console.log('Form open method called with type:', type, 'id:', id, 'masterId:', masterId) // 添加日志
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  
  // 如果传入了牵头单位ID，直接设置并加载可选成员单位列表
  if (masterId) {
    console.log('Setting masterId from parameter:', masterId) // 添加日志
    formData.value.masterId = masterId
    await loadAvailableMemberList(masterId)
  }
  
  // 修改时，设置数据
  if (id) {
    console.log('Loading data for update mode, id:', id) // 添加日志
    formLoading.value = true
    try {
      const data = await DeptCommunityApi.getDeptCommunity(id)
      console.log('Received data from API:', data) // 添加日志
      formData.value = data
      // 在修改模式下，加载可选的成员单位列表
      await loadAvailableMemberList(data.masterId)
      // 设置当前的成员单位为已选中
      if (data.memberId) {
        selectedMemberIds.value = [data.memberId]
      }
    } finally {
      formLoading.value = false
    }
  } else {
    console.log('Opening in create mode') // 添加日志
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  
  if (selectedMemberIds.value.length === 0) {
    message.warning('请选择至少一个成员单位')
    return
  }
  
  if (!formData.value.masterId) {
    message.warning('请填写牵头单位')
    return
  }
  
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      // 使用批量保存接口
      const saveData = {
        masterId: formData.value.masterId,
        memberIdList: selectedMemberIds.value,
        sortNum: formData.value.sortNum
      }
      await DeptCommunityApi.createDeptCommunityMultiple(saveData)
      message.success(`成功创建 ${selectedMemberIds.value.length} 个紧密医疗共同体关系`)
    } else {
      // 修改模式：更新当前关系
      // 由于紧密医疗共同体关系是独立的，修改时需要考虑是更新单个关系还是处理多选
      // 这里假设修改模式下用户只修改当前关系的成员单位
      if (selectedMemberIds.value.length === 1) {
        // 只修改当前关系的成员单位
        const updateData: DeptCommunityVO = {
          ...formData.value,
          memberId: selectedMemberIds.value[0]
        }
        await DeptCommunityApi.updateDeptCommunity(updateData)
        message.success(t('common.updateSuccess'))
      } else {
        // 如果用户选择了多个成员单位，需要删除当前关系并为每个新选择的成员单位创建新关系
        // 删除当前关系
        await DeptCommunityApi.deleteDeptCommunity(formData.value.id)
        // 使用批量保存接口
        const saveData = {
          masterId: formData.value.masterId,
          memberIdList: selectedMemberIds.value,
          sortNum: formData.value.sortNum
        }
        await DeptCommunityApi.createDeptCommunityMultiple(saveData)
        message.success(`成功更新为 ${selectedMemberIds.value.length} 个紧密医疗共同体关系`)
      }
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
    masterId: undefined,
    memberId: undefined,
    sortNum: undefined,
  }
  selectedMemberIds.value = []
  availableMemberList.value = []
  formRef.value?.resetFields()
}

/** 牵头单位ID变化时的处理 */
const onMasterIdChange = async (value: any) => {
  console.log('onMasterIdChange called with:', value)
  console.log('Value type:', typeof value)
  if (value) {
    const numValue = Number(value)
    console.log('Converted to number:', numValue)
    if (!isNaN(numValue)) {
      await loadAvailableMemberList(numValue)
    } else {
      console.log('Invalid number, clearing list')
      availableMemberList.value = []
    }
  } else {
    console.log('Value is falsy, clearing list')
    availableMemberList.value = []
  }
}



</script>

<style scoped>
.member-checkbox-group {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}
</style>
