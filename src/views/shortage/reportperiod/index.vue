<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="所属专区ID" prop="zoneId">
        <el-input
          v-model="queryParams.zoneId"
          placeholder="请输入所属专区ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="周期标识(如:2025-W47)" prop="periodCode">
        <el-input
          v-model="queryParams.periodCode"
          placeholder="请输入周期标识(如:2025-W47)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="年份" prop="year">
        <el-input
          v-model="queryParams.year"
          placeholder="请输入年份"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="周数" prop="weekNum">
        <el-input
          v-model="queryParams.weekNum"
          placeholder="请输入周数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="数据开始时间(上周六00:00)" prop="dataStartTime">
        <el-date-picker
          v-model="queryParams.dataStartTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="数据截止时间(本周五12:00)" prop="dataEndTime">
        <el-date-picker
          v-model="queryParams.dataEndTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="填报开始时间(周五12:00)" prop="reportStartTime">
        <el-date-picker
          v-model="queryParams.reportStartTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="正常截止时间(周五18:00)" prop="reportEndTime">
        <el-date-picker
          v-model="queryParams.reportEndTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="补报截止时间(周六23:59)" prop="supplementEndTime">
        <el-date-picker
          v-model="queryParams.supplementEndTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="周期状态: 0-未开始 1-填报中 2-已截止(补报中) 3-已结束" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择周期状态: 0-未开始 1-填报中 2-已截止(补报中) 3-已结束"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="应报机构总数" prop="totalOrgCount">
        <el-input
          v-model="queryParams.totalOrgCount"
          placeholder="请输入应报机构总数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="已提交机构数(含补报)" prop="submittedCount">
        <el-input
          v-model="queryParams.submittedCount"
          placeholder="请输入已提交机构数(含补报)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="补报机构数" prop="supplementCount">
        <el-input
          v-model="queryParams.supplementCount"
          placeholder="请输入补报机构数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['shortage:report-period:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['shortage:report-period:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编码" align="center" prop="id" />
      <el-table-column label="所属专区ID" align="center" prop="zoneId" />
      <el-table-column label="周期标识(如:2025-W47)" align="center" prop="periodCode" />
      <el-table-column label="年份" align="center" prop="year" />
      <el-table-column label="周数" align="center" prop="weekNum" />
      <el-table-column
        label="数据开始时间(上周六00:00)"
        align="center"
        prop="dataStartTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="数据截止时间(本周五12:00)"
        align="center"
        prop="dataEndTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="填报开始时间(周五12:00)"
        align="center"
        prop="reportStartTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="正常截止时间(周五18:00)"
        align="center"
        prop="reportEndTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="补报截止时间(周六23:59)"
        align="center"
        prop="supplementEndTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="周期状态: 0-未开始 1-填报中 2-已截止(补报中) 3-已结束" align="center" prop="status" />
      <el-table-column label="应报机构总数" align="center" prop="totalOrgCount" />
      <el-table-column label="已提交机构数(含补报)" align="center" prop="submittedCount" />
      <el-table-column label="补报机构数" align="center" prop="supplementCount" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['shortage:report-period:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['shortage:report-period:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ReportPeriodForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ReportPeriodApi, ReportPeriodVO } from '@/api/shortage/reportperiod'
import ReportPeriodForm from './ReportPeriodForm.vue'

/** 采集周期 列表 */
defineOptions({ name: 'ReportPeriod' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ReportPeriodVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  zoneId: undefined,
  periodCode: undefined,
  year: undefined,
  weekNum: undefined,
  dataStartTime: [],
  dataEndTime: [],
  reportStartTime: [],
  reportEndTime: [],
  supplementEndTime: [],
  status: undefined,
  totalOrgCount: undefined,
  submittedCount: undefined,
  supplementCount: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportPeriodApi.getReportPeriodPage(queryParams)
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ReportPeriodApi.deleteReportPeriod(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ReportPeriodApi.exportReportPeriod(queryParams)
    download.excel(data, '采集周期.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
