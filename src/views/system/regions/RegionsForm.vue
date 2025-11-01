<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="父级地区" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="regionsList"
          :props="defaultProps"
          check-strictly
          node-key="id"
          placeholder="请选择父级地区"
        />
      </el-form-item>
      <el-form-item label="区划代码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入区划代码" />
      </el-form-item>
      <el-form-item label="地区名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入地区名称" />
      </el-form-item>
      <el-form-item label="地区等级" prop="level">
        <el-select v-model="formData.level" placeholder="请选择地区等级" clearable>
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.REGION_LEVEL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="节点类型" prop="nodeType">
        <el-radio-group v-model="formData.nodeType">
          <el-radio v-for="item in nodeTypeOptions" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="排序号" prop="sortOrder">
        <el-input-number v-model="formData.sortOrder" :min="0" :max="9999" controls-position="right" />
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
import { defaultProps, handleTree } from '@/utils/tree'
import { RegionsApi, RegionsVO } from '@/api/system/regions'

/** 地区 表单 */
defineOptions({ name: 'RegionsForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const regionsList = ref<Tree[]>([]) // 地区树形结构
const formData = ref({
  id: undefined,
  parentId: undefined,
  code: undefined,
  name: undefined,
  level: undefined,
  nodeType: 'NORMAL',
  sortOrder: 0,
})
const formRules = reactive({
  code: [{ required: true, message: '区划代码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '地区名称不能为空', trigger: 'blur' }],
  level: [{ required: true, message: '地区等级不能为空', trigger: 'blur' }],
  nodeType: [{ required: true, message: '节点类型不能为空', trigger: 'change' }],
  sortOrder: [{ required: true, message: '排序号不能为空', trigger: 'change' }],
})
const formRef = ref() // 表单 Ref

// 节点类型枚举，用于保持前后端一致语义
const nodeTypeOptions = [
  { label: '行政区划', value: 'NORMAL' },
  { label: '特殊节点', value: 'SPECIAL' }
]

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
      formData.value = await RegionsApi.getRegions(id)
      // 老数据没有节点类型与排序号时，补齐默认值以避免校验失败
      formData.value.nodeType = formData.value.nodeType || 'NORMAL'
      const parsedSort = Number(formData.value.sortOrder)
      formData.value.sortOrder = Number.isFinite(parsedSort) ? parsedSort : 0
    } finally {
      formLoading.value = false
    }
  }
  // 加载地区树
  regionsList.value = handleTree(await RegionsApi.getSimpleRegionsList())
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as RegionsVO
    if (formType.value === 'create') {
      await RegionsApi.createRegions(data)
      message.success(t('common.createSuccess'))
    } else {
      await RegionsApi.updateRegions(data)
      message.success(t('common.updateSuccess'))
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
    parentId: undefined,
    code: undefined,
    name: undefined,
    level: undefined,
    nodeType: 'NORMAL',
    sortOrder: 0,
  }
  formRef.value?.resetFields()
}
</script>