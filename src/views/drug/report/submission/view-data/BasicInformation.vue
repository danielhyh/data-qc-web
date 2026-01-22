<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="85px"
    >
      <el-form-item label="机构代码" prop="hospitalCode">
        <el-input
          v-model="queryParams.hospitalCode"
          placeholder="请输入医疗机构代码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="机构名称" prop="organizationName">
        <el-input
          v-model="queryParams.organizationName"
          placeholder="请输入组织机构名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="ID" align="center" prop="id" />
      <el-table-column label="数据上报日期" align="center" prop="uploadDate" width="100">
        <template #default="{ row }">
          {{ formatDate(row.uploadDate) }}
        </template>
      </el-table-column>
      <el-table-column label="省级行政区划代码" align="center" prop="domainCode" width="130" />
      <el-table-column label="组织机构代码" align="center" prop="organizationCode" width="120" />
      <el-table-column label="医疗机构代码" align="center" prop="hospitalCode" width="150" />
      <el-table-column
        label="组织机构名称"
        align="center"
        prop="organizationName"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column
        label="单位负责人"
        align="center"
        prop="unitManager"
        width="120"
        show-overflow-tooltip
      />
      <el-table-column
        label="统计负责人"
        align="center"
        prop="statisticsManager"
        width="120"
        show-overflow-tooltip
      />
      <el-table-column label="年度药品总收入（元）" align="center" width="160">
        <template #default="{ row }">
          <div class="income-comparison">
            <div>导入: {{ formatAmount(row.annualDrugIncomeImport) }}元</div>
            <div>直报: {{ formatAmount(row.annualDrugIncomeSync) }}元</div>
            <div class="difference"
              >差异: {{
                formatAmount((row.annualDrugIncomeImport || 0) - (row.annualDrugIncomeSync || 0))
              }}元</div
            >
          </div>
        </template>
      </el-table-column>
      <el-table-column label="实有床位数" align="center" prop="bedCount">
        <template #default="{ row }">
          <div class="income-comparison">
          <div>导入：{{ row.bedCount || 0 }}</div>
          <div>直报：{{ row.bedCountSync || 0 }}</div>
            <div class="difference"
            >差异:{{
                 ((row.bedCount || 0) - (row.bedCountSync || 0))
              }}</div
            >
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ReportDataApi } from '@/api/drug/reportdata'
import { dateFormatter } from '@/utils/formatTime'

// 定义组件名称
defineOptions({ name: 'BasicInformation' })

const props = defineProps({
  taskId: Number
})

const queryFormRef = ref()
const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: props.taskId,
  hospitalCode: undefined,
  organizationName: undefined,
})
const total = ref(0) // 列表的总页数

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportDataApi.getHospitalList(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}

/** 格式化金额 */
const formatAmount = (amount: number | undefined): string => {
  if (!amount) return '0'
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style>
.income-comparison {
  font-size: 12px;
  line-height: 1.4;
}

.income-comparison .difference {
  color: #e6a23c;
  font-weight: 600;
}
</style>
