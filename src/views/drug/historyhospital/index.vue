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
      <el-form-item label="导入任务ID" prop="taskId">
        <el-input
          v-model="queryParams.taskId"
          placeholder="请输入导入任务ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="数据上报日期" prop="uploadDate">
        <el-date-picker
          v-model="queryParams.uploadDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="省级行政区划代码（2位）" prop="domainCode">
        <el-input
          v-model="queryParams.domainCode"
          placeholder="请输入省级行政区划代码（2位）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="组织机构代码（9位）" prop="organizationCode">
        <el-input
          v-model="queryParams.organizationCode"
          placeholder="请输入组织机构代码（9位）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="医疗机构代码（22位）" prop="hospitalCode">
        <el-input
          v-model="queryParams.hospitalCode"
          placeholder="请输入医疗机构代码（22位）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="组织机构名称" prop="organizationName">
        <el-input
          v-model="queryParams.organizationName"
          placeholder="请输入组织机构名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="单位负责人" prop="unitManager">
        <el-input
          v-model="queryParams.unitManager"
          placeholder="请输入单位负责人"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="统计负责人" prop="statisticsManager">
        <el-input
          v-model="queryParams.statisticsManager"
          placeholder="请输入统计负责人"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="实有床位数" prop="bedCount">
        <el-input
          v-model="queryParams.bedCount"
          placeholder="请输入实有床位数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="执业医师数" prop="doctorCount">
        <el-input
          v-model="queryParams.doctorCount"
          placeholder="请输入执业医师数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="执业助理医师数" prop="assistantDoctorCount">
        <el-input
          v-model="queryParams.assistantDoctorCount"
          placeholder="请输入执业助理医师数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="总诊疗人次数" prop="visitCount">
        <el-input
          v-model="queryParams.visitCount"
          placeholder="请输入总诊疗人次数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="出院人数" prop="dischargeCount">
        <el-input
          v-model="queryParams.dischargeCount"
          placeholder="请输入出院人数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="年度药品总收入-导入" prop="annualDrugIncomeImport">
        <el-input
          v-model="queryParams.annualDrugIncomeImport"
          placeholder="请输入年度药品总收入-导入"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="年度药品总收入-直报系统同步" prop="annualDrugIncomeSync">
        <el-input
          v-model="queryParams.annualDrugIncomeSync"
          placeholder="请输入年度药品总收入-直报系统同步"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="中药饮片总采购额" prop="ypPurchaseAmount">
        <el-input
          v-model="queryParams.ypPurchaseAmount"
          placeholder="请输入中药饮片总采购额"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="中药饮片总销售额" prop="ypSellAmount">
        <el-input
          v-model="queryParams.ypSellAmount"
          placeholder="请输入中药饮片总销售额"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="中药颗粒剂总采购额" prop="klPurchaseAmount">
        <el-input
          v-model="queryParams.klPurchaseAmount"
          placeholder="请输入中药颗粒剂总采购额"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="中药颗粒剂总销售额" prop="klSellAmount">
        <el-input
          v-model="queryParams.klSellAmount"
          placeholder="请输入中药颗粒剂总销售额"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="质控状态:0-未质控,1-质控通过,2-质控失败" prop="qcStatus">
        <el-select
          v-model="queryParams.qcStatus"
          placeholder="请选择质控状态:0-未质控,1-质控通过,2-质控失败"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="质控结果详情(JSON格式)" prop="qcResult">
        <el-input
          v-model="queryParams.qcResult"
          placeholder="请输入质控结果详情(JSON格式)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input
          v-model="queryParams.errorMessage"
          placeholder="请输入错误信息"
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
      <el-form-item label="部门id" prop="deptId">
        <el-input
          v-model="queryParams.deptId"
          placeholder="请输入部门id"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报告机构等级" prop="reportOrgLevel">
        <el-input
          v-model="queryParams.reportOrgLevel"
          placeholder="请输入报告机构等级"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报告机构名称" prop="reportOrgName">
        <el-input
          v-model="queryParams.reportOrgName"
          placeholder="请输入报告机构名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报告年份" prop="reportYear">
        <el-input
          v-model="queryParams.reportYear"
          placeholder="请输入报告年份"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报告省份" prop="reportProvince">
        <el-input
          v-model="queryParams.reportProvince"
          placeholder="请输入报告省份"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报告市" prop="reportCity">
        <el-input
          v-model="queryParams.reportCity"
          placeholder="请输入报告市"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报告区县" prop="reportDistrict">
        <el-input
          v-model="queryParams.reportDistrict"
          placeholder="请输入报告区县"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['drug:history-hospital:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:history-hospital:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="主键ID" align="center" prop="id" />
      <el-table-column label="导入任务ID" align="center" prop="taskId" />
      <el-table-column label="数据上报日期" align="center" prop="uploadDate" />
      <el-table-column label="省级行政区划代码（2位）" align="center" prop="domainCode" />
      <el-table-column label="组织机构代码（9位）" align="center" prop="organizationCode" />
      <el-table-column label="医疗机构代码（22位）" align="center" prop="hospitalCode" />
      <el-table-column label="组织机构名称" align="center" prop="organizationName" />
      <el-table-column label="单位负责人" align="center" prop="unitManager" />
      <el-table-column label="统计负责人" align="center" prop="statisticsManager" />
      <el-table-column label="实有床位数" align="center" prop="bedCount" />
      <el-table-column label="执业医师数" align="center" prop="doctorCount" />
      <el-table-column label="执业助理医师数" align="center" prop="assistantDoctorCount" />
      <el-table-column label="总诊疗人次数" align="center" prop="visitCount" />
      <el-table-column label="出院人数" align="center" prop="dischargeCount" />
      <el-table-column label="年度药品总收入-导入" align="center" prop="annualDrugIncomeImport" />
      <el-table-column label="年度药品总收入-直报系统同步" align="center" prop="annualDrugIncomeSync" />
      <el-table-column label="中药饮片总采购额" align="center" prop="ypPurchaseAmount" />
      <el-table-column label="中药饮片总销售额" align="center" prop="ypSellAmount" />
      <el-table-column label="中药颗粒剂总采购额" align="center" prop="klPurchaseAmount" />
      <el-table-column label="中药颗粒剂总销售额" align="center" prop="klSellAmount" />
      <el-table-column label="质控状态:0-未质控,1-质控通过,2-质控失败" align="center" prop="qcStatus" />
      <el-table-column label="质控结果详情(JSON格式)" align="center" prop="qcResult" />
      <el-table-column label="错误信息" align="center" prop="errorMessage" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="部门id" align="center" prop="deptId" />
      <el-table-column label="报告机构等级" align="center" prop="reportOrgLevel" />
      <el-table-column label="报告机构名称" align="center" prop="reportOrgName" />
      <el-table-column label="报告年份" align="center" prop="reportYear" />
      <el-table-column label="报告省份" align="center" prop="reportProvince" />
      <el-table-column label="报告市" align="center" prop="reportCity" />
      <el-table-column label="报告区县" align="center" prop="reportDistrict" />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['drug:history-hospital:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['drug:history-hospital:delete']"
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
  <HistoryHospitalForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { HistoryHospitalApi, HistoryHospitalVO } from '@/api/drug/historyhospital'
import HistoryHospitalForm from './HistoryHospitalForm.vue'

/** 医疗机构基本情况--历史 列表 */
defineOptions({ name: 'HistoryHospital' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<HistoryHospitalVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined,
  uploadDate: [],
  domainCode: undefined,
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
  unitManager: undefined,
  statisticsManager: undefined,
  bedCount: undefined,
  doctorCount: undefined,
  assistantDoctorCount: undefined,
  visitCount: undefined,
  dischargeCount: undefined,
  annualDrugIncomeImport: undefined,
  annualDrugIncomeSync: undefined,
  ypPurchaseAmount: undefined,
  ypSellAmount: undefined,
  klPurchaseAmount: undefined,
  klSellAmount: undefined,
  qcStatus: undefined,
  qcResult: undefined,
  errorMessage: undefined,
  createTime: [],
  deptId: undefined,
  reportOrgLevel: undefined,
  reportOrgName: undefined,
  reportYear: undefined,
  reportProvince: undefined,
  reportCity: undefined,
  reportDistrict: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await HistoryHospitalApi.getHistoryHospitalPage(queryParams)
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
    await HistoryHospitalApi.deleteHistoryHospital(id)
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
    const data = await HistoryHospitalApi.exportHistoryHospital(queryParams)
    download.excel(data, '医疗机构基本情况--历史.xls')
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