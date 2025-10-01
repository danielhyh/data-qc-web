
<template>
  <el-card class="filter-card" shadow="never">
    <el-row :gutter="20">
      <el-col :span="16">

        <el-button type="success" @click="createFromTemplate2">
          <Icon icon="ep:upload" />
          导入result
        </el-button>
      </el-col>

      <el-col :span="2">
        <el-button @click="getList">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
      </el-col>
    </el-row>
  </el-card>

  <el-table v-loading="loading" :data="list" >
    <el-table-column prop="taskNo" label="任务编号"  />
    <el-table-column prop="name" label="任务名称"/>
    <el-table-column prop="result" label="结果"/>
  </el-table>

  <!-- 从模板导入创建对话框 -->
  <el-dialog v-model="templateCreateVisible2" title="从result导入创建YPID匹配任务" width="600px">
    <el-form  label-width="120px">
      <el-form-item label="任务名称">
        <el-input v-model="templateCreateForm.name" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="上传文件">
        <el-upload
          ref="uploadRef"
          v-model:file-list="uploadedFile2"
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls"
          action="none"
        >
          <el-button type="primary">
            <Icon icon="ep:upload" />
            选择Excel文件
          </el-button>
          <template #tip>
            <div class="el-upload__tip">只支持xlsx/xls格式文件</div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="templateCreateVisible2 = false">取消</el-button>
      <el-button type="primary" @click="handlerTemplateCreate2" :loading="templateCreateLoading2">
        创建任务
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import type {UploadUserFile} from "element-plus";
import {YpidMatchTaskApi} from "@/api/drug/ypid/task";
const loading = ref(false);
const list = ref([]);
const templateCreateVisible2 = ref(false)
const templateCreateLoading2 = ref(false)
const uploadRef = ref()
const uploadedFile2 = ref<UploadUserFile[]>([])
const createFromTemplate2 = () => {
  templateCreateVisible2.value = true
}
const templateCreateForm = reactive({
  name: undefined,
  taskNo: undefined,
})

const getCurrentDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}
const handlerTemplateCreate2 = async () => {
  const form = new FormData()
  form.append('file', uploadedFile2.value[0].raw as Blob)
  const taskNo = 'YPID_' + getCurrentDateString() + '_' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const params = {
    ...templateCreateForm,

  } as any
  params.taskNo = taskNo
  form.append('params', JSON.stringify(params))
  await YpidMatchTaskApi.reVerify(form)
  templateCreateVisible2.value = false
}
const getList = async () => {
  loading.value = true
  try {
    const data = await YpidMatchTaskApi.list();
    list.value = data
  } finally {
    loading.value = false
  }

}
onMounted(() => {
  getList()
})
</script>


<style scoped lang="scss">

</style>
