<template>
  <div class="statistics-container">
    <!-- 固定头部栏 -->
    <div class="fixed-header">
      <div class="header-content">
        <div class="header-title">
          <Icon icon="ep:data-analysis" class="title-icon" />
          <h1 class="title-text">短缺药品统计分析</h1>
        </div>
        
        <div class="header-actions">
          <el-form :model="queryParams" :inline="true" class="search-form">
            <el-form-item label="专区">
              <el-select
                v-model="queryParams.zoneId"
                placeholder="全部"
                clearable
                style="width: 160px"
                @change="loadAllData"
              >
                <el-option label="全部" :value="null" />
                <el-option
                  v-for="zone in zoneList"
                  :key="zone.id"
                  :label="zone.zoneName"
                  :value="zone.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="时间">
              <el-select
                v-model="queryParams.reportWeek"
                placeholder="选择周期"
                style="width: 160px"
                @change="loadAllData"
              >
                <el-option
                  v-for="week in weekOptions"
                  :key="week.value"
                  :label="week.label"
                  :value="week.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="地区/机构">
              <el-button
                type="primary"
                @click="showAreaOrgDialog = true"
              >
                <el-icon><Location /></el-icon>
                {{ areaOrgButtonText }}
              </el-button>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="loadAllData"
              >
                <el-icon v-if="!loading"><Refresh /></el-icon>
                <el-icon v-else><Loading /></el-icon>
                刷新
              </el-button>
              <el-tooltip
                :disabled="!!queryParams.zoneId"
                content="请先选择专区"
                placement="top"
              >
                <el-button
                  type="success"
                  @click="handleExportWeeklyReport"
                  :loading="exportLoading"
                  :disabled="!queryParams.zoneId"
                >
                  <el-icon><Download /></el-icon>
                  导出周报
                </el-button>
              </el-tooltip>
              <el-tooltip
                :disabled="!!queryParams.zoneId"
                content="请先选择专区"
                placement="top"
              >
                <el-button
                  type="warning"
                  @click="handleExportDrugs"
                  :loading="exportDrugsLoading"
                  :disabled="!queryParams.zoneId"
                >
                  <el-icon><Download /></el-icon>
                  导出药品
                </el-button>
              </el-tooltip>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 内容区域 - 添加顶部padding -->
    <div class="content-area">

    <!-- 核心指标卡片 - 包含趋势对比 -->
    <div class="core-stats-cards">
      <el-row :gutter="20">
        <!-- 填报机构数 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.05) 100%)">
              <Icon icon="ep:office-building" class="stat-icon" style="color: #409eff" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.reportOrgCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">
                  / {{ overview?.totalOrgCount || 0 }}家
                </span>
              </div>
              <div class="stat-label">
                填报机构数
                <el-tag
                  v-if="overview?.completionDegree !== undefined"
                  type="info"
                  size="small"
                  style="margin-left: 8px"
                >
                  完成度: {{ overview.completionDegree }}%
                </el-tag>
              </div>
            </div>
            <div class="stat-trend-side" v-if="overview?.orgTrend !== undefined">
              <Icon
                :icon="getTrendIcon(overview.orgTrend)"
                :style="{ color: getTrendColor(overview.orgTrend) }"
                class="trend-icon"
              />
              <span class="trend-value" :style="{ color: getTrendColor(overview.orgTrend) }">
                {{ Math.abs(overview.orgTrend).toFixed(1) }}%
              </span>
            </div>
          </div>
        </el-col>

        <!-- 填报药品数 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(103, 194, 58, 0.15) 0%, rgba(103, 194, 58, 0.05) 100%)">
              <Icon icon="ep:shopping-bag" class="stat-icon" style="color: #67c23a" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.reportDrugCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">种</span>
              </div>
              <div class="stat-label">填报药品数</div>
            </div>
            <div class="stat-trend-side" v-if="overview?.drugTrend !== undefined">
              <Icon
                :icon="getTrendIcon(overview.drugTrend)"
                :style="{ color: getTrendColor(overview.drugTrend) }"
                class="trend-icon"
              />
              <span class="trend-value" :style="{ color: getTrendColor(overview.drugTrend) }">
                {{ Math.abs(overview.drugTrend).toFixed(1) }}%
              </span>
            </div>
          </div>
        </el-col>

        <!-- 短缺药品数 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(245, 108, 108, 0.05) 100%)">
              <Icon icon="ep:warning-filled" class="stat-icon" style="color: #f56c6c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.shortageDrugCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">种</span>
              </div>
              <div class="stat-label">短缺药品数</div>
            </div>
            <div class="stat-trend-side" v-if="overview?.shortageTrend !== undefined">
              <Icon
                :icon="getTrendIcon(overview.shortageTrend)"
                :style="{ color: getTrendColor(overview.shortageTrend, true) }"
                class="trend-icon"
              />
              <span class="trend-value" :style="{ color: getTrendColor(overview.shortageTrend, true) }">
                {{ Math.abs(overview.shortageTrend).toFixed(1) }}%
              </span>
            </div>
          </div>
        </el-col>

        <!-- 填报完成率 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(230, 162, 60, 0.15) 0%, rgba(230, 162, 60, 0.05) 100%)">
              <Icon icon="ep:circle-check-filled" class="stat-icon" style="color: #e6a23c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.completionRate || 0"
                  :duration="1500"
                  :decimals="1"
                />
                <span class="stat-suffix">%</span>
              </div>
              <div class="stat-label">填报完成率</div>
              <el-progress
                :percentage="overview?.completionRate || 0"
                :stroke-width="3"
                :show-text="false"
                :color="getCompletionColor(overview?.completionRate || 0)"
                class="stat-progress"
              />
            </div>
            <div class="stat-trend-side" v-if="overview?.completionTrend !== undefined">
              <Icon
                :icon="getTrendIcon(overview.completionTrend)"
                :style="{ color: getTrendColor(overview.completionTrend) }"
                class="trend-icon"
              />
              <span class="trend-value" :style="{ color: getTrendColor(overview.completionTrend) }">
                {{ Math.abs(overview.completionTrend).toFixed(1) }}%
              </span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 其他指标 -->
    <div class="other-stats-cards" v-if="overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card other-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(230, 162, 60, 0.15) 0%, rgba(230, 162, 60, 0.05) 100%)">
              <Icon icon="ep:grid" class="stat-icon" style="color: #e6a23c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.drugCategoryCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">类</span>
              </div>
              <div class="stat-label">药品分类</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card other-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(144, 147, 153, 0.15) 0%, rgba(144, 147, 153, 0.05) 100%)">
              <Icon icon="ep:trend-charts" class="stat-icon" style="color: #909399" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.weeklyUsageTotal || 0"
                  :duration="1500"
                />
              </div>
              <div class="stat-label">周使用量</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card other-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.05) 100%)">
              <Icon icon="ep:goods" class="stat-icon" style="color: #409eff" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.currentStockTotal || 0"
                  :duration="1500"
                />
              </div>
              <div class="stat-label">实时库存</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card other-stat-card">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(245, 108, 108, 0.05) 100%)">
              <Icon icon="ep:bell" class="stat-icon" style="color: #f56c6c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.stockAlertCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">个</span>
              </div>
              <div class="stat-label">库存预警</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 - 优化布局 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 供应状况分布 - 紧凑版 -->
      <el-col :xs="24" :sm="12" :md="8">
        <ContentWrap
          title="供应状况分布"
          message="展示当前药品供应状况的分布情况，包括充足、较充足、短缺和严重短缺四个等级的占比，帮助快速了解整体供应态势"
          headerIcon="ep:pie-chart"
          headerIconColor="#409eff"
          Font.BOLD
          class="chart-card"
        >
          <div class="supply-distribution-compact">
            <div class="chart-section">
              <div ref="supplyPieChartRef" class="compact-pie-chart" v-loading="loading"></div>
            </div>
            <div class="legend-section">
              <div class="distribution-legend">
                <div
v-for="item in supplyDistribution" :key="item.supplyStatus"
                     class="legend-item-compact">
                  <div class="legend-dot" :style="{ backgroundColor: getStatusColor(item.supplyStatus) }"></div>
                  <span class="legend-label">{{ item.statusName }}</span>
                  <span class="legend-value">{{ item.percentage }}%</span>
                  <span class="legend-trend" v-if="item.monthOnMonth">
                    <Icon :icon="getTrendIcon(item.monthOnMonth)" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ContentWrap>
      </el-col>

      <!-- 药品分类图 -->
      <el-col :xs="24" :sm="12" :md="8">
        <ContentWrap
          title="药品分类统计"
          message="按药品类别统计各类药品的总数量和短缺数量对比，识别哪些类别的药品短缺问题较为严重"
          headerIcon="ep:grid"
          headerIconColor="#e6a23c"
          Font.BOLD
          class="chart-card"
        >
          <div ref="drugCategoryChartRef" class="chart-container-compact"></div>
        </ContentWrap>
      </el-col>

      <!-- 库存分析图 -->
      <el-col :xs="24" :sm="12" :md="8">
        <ContentWrap
          title="库存分布分析"
          message="分析药品库存可用天数的分布情况，评估库存风险等级，为库存管理和采购决策提供依据"
          headerIcon="ep:goods"
          headerIconColor="#67c23a"
          Font.BOLD
          class="chart-card"
        >
          <div ref="stockAnalysisChartRef" class="chart-container-compact"></div>
        </ContentWrap>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 周使用量趋势 -->
      <el-col :xs="24" :md="12">
        <ContentWrap
          title="周使用量趋势"
          message="展示药品周使用量的历史趋势和环比变化，帮助预测未来需求并优化采购计划"
          headerIcon="ep:trend-charts"
          headerIconColor="#909399"
          Font.BOLD
          class="chart-card"
        >
          <template #header>
            <el-tag size="small" class="trend-tag ml-auto">
              均值: {{ formatNumber(weeklyUsageTrend?.avgUsage) }}
            </el-tag>
          </template>
          <div ref="usageTrendChartRef" class="chart-container-medium"></div>
        </ContentWrap>
      </el-col>

      <!-- 短缺趋势预测 -->
      <el-col :xs="24" :md="12">
        <ContentWrap
          title="短缺趋势预测"
          message="基于历史数据分析药品短缺的发展趋势，并提供未来短缺情况的预测，支持提前预警和应对"
          headerIcon="ep:data-analysis"
          headerIconColor="#f56c6c"
          Font.BOLD
          class="chart-card"
        >
          <template #header>
            <el-tag size="small" type="warning" class="trend-tag ml-auto">
              含预测数据
            </el-tag>
          </template>
          <div ref="shortageTrendChartRef" class="chart-container-medium"></div>
        </ContentWrap>
      </el-col>
    </el-row>

    <!-- 新增：库存可用周数和使用量环比图表 -->
    <el-row :gutter="16" class="chart-row" v-if="queryParams.reportWeek">
      <el-col :xs="24" :md="12">
        <StockWeeksChart
          :zone-id="queryParams.zoneId"
          :report-week="queryParams.reportWeek"
          :area-code="queryParams.areaCode"
          :org-ids="queryParams.orgIds"
          @loaded="handleChartLoaded"
        />
      </el-col>
      <el-col :xs="24" :md="12">
        <UsageChangeChart
          :zone-id="queryParams.zoneId"
          :report-week="queryParams.reportWeek"
          :area-code="queryParams.areaCode"
          :org-ids="queryParams.orgIds"
          @loaded="handleChartLoaded"
        />
      </el-col>
    </el-row>

    <!-- 新增：时间趋势分析和地域分布图表 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :md="12">
        <TrendAnalysisChart
          :zone-id="queryParams.zoneId"
          :start-week="trendStartWeek"
          :end-week="queryParams.reportWeek"
          :area-code="queryParams.areaCode"
          :org-ids="queryParams.orgIds"
          @loaded="handleChartLoaded"
        />
      </el-col>
      <el-col :xs="24" :md="12">
        <RegionStatisticsChart
          :zone-id="queryParams.zoneId"
          :report-week="queryParams.reportWeek"
          :area-code="queryParams.areaCode"
          :org-ids="queryParams.orgIds"
          :drug-categories="drugCategories"
          @loaded="handleChartLoaded"
        />
      </el-col>
    </el-row>

    <!-- 短缺药品详情表格 -->
    <ContentWrap
      :title="`短缺药品详情 (${shortageDetails.length})`"
      headerIcon="ep:warning"
      headerIconColor="#f56c6c"
      :headerBackground="true"
      class="detail-table-wrap"
    >
      <template #header>
        <el-button
          type="success"
          @click="handleExportDrugs"
          :loading="exportDrugsLoading"
          :disabled="!queryParams.zoneId"
          class="ml-auto"
          size="small"
        >
          <el-icon><Download /></el-icon>
          导出药品
        </el-button>
      </template>

      <el-table :data="shortageDetails" border v-loading="loading" size="small">
        <el-table-column label="药品分类" prop="drugCategory" width="180" />
        <el-table-column label="药品名称" prop="drugName" min-width="200">
          <template #default="scope">
            <el-tooltip :content="scope.row.drugName + ' - ' + scope.row.dosageForm">
              <span class="drug-name">{{ scope.row.drugName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="剂型" prop="dosageForm" width="100" />
        <el-table-column label="短缺机构" prop="shortageOrgCount" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" type="warning">{{ scope.row.shortageOrgCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="严重短缺" prop="severeShortageOrgCount" width="110" align="center">
          <template #default="scope">
            <el-tag size="small" type="danger">{{ scope.row.severeShortageOrgCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="平均库存(天)" prop="avgStockDays" width="130" align="center">
          <template #default="scope">
            <el-progress
              :percentage="Math.min(scope.row.avgStockDays * 10, 100)"
              :color="getStockDaysColor(scope.row.avgStockDays)"
              :stroke-width="6"
              :show-text="false"
            />
            <span
class="stock-days-text"
                  :style="{ color: getStockDaysColor(scope.row.avgStockDays) }">
              {{ scope.row.avgStockDays.toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="120" align="center">
          <template #default="scope">
            <el-tag size="small" :type="getRiskLevelType(scope.row.riskLevel)">
              {{ scope.row.riskLevelName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewDetail(scope.row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="tablePageNo"
          :page-size="tablePageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="shortageTotal"
          layout="total, sizes, prev, pager, next, jumper"
          size="small"
          @size-change="(size) => { tablePageSize = size; loadShortageDetails(); }"
          @current-change="(page) => { tablePageNo = page; loadShortageDetails(); }"
        />
      </div>
    </ContentWrap>

    <!-- 机构排名 -->
    <ContentWrap
      title="机构填报排名"
      headerIcon="ep:trophy"
      headerIconColor="#ffd700"
      :headerBackground="true"
      class="ranking-table-wrap"
    >

      <el-table :data="orgRanking" size="small" max-height="300">
        <el-table-column label="排名" prop="rank" width="90" align="center">
          <template #default="scope">
            <div class="rank-badge" :class="'rank-' + scope.row.rank">
              {{ scope.row.rank }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="机构名称" prop="orgName" min-width="200" />
        <el-table-column label="完成率" prop="completionRate" width="120" align="center">
          <template #default="scope">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <el-progress
                :percentage="scope.row.completionRate"
                :color="getCompletionColor(scope.row.completionRate)"
                :stroke-width="6"
                :show-text="false"
                style="width: 80px;"
              />
              <span style="font-size: 12px; font-weight: 600; color: #303133;">
        {{ scope.row.completionRate }}%
      </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="填报药品" prop="reportDrugCount" width="120" align="center" />
        <el-table-column label="短缺药品" prop="shortageDrugCount" width="120" align="center">
          <template #default="scope">
            <el-tag size="small" v-if="scope.row.shortageDrugCount > 0" type="warning">
              {{ scope.row.shortageDrugCount }}
            </el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="及时率" prop="timelyRate" width="120" align="center">
          <template #default="scope">
            {{ scope.row.timelyRate }}%
          </template>
        </el-table-column>
      </el-table>
    </ContentWrap>
    </div>
    <!-- 结束 content-area -->

    <!-- 详情对话框 -->
    <DetailDialog ref="detailDialogRef" />

    <!-- 区域机构选择对话框 -->
    <StatisticsAreaOrgSelector
      v-model="showAreaOrgDialog"
      :default-mode="currentSelectMode"
      :default-area-code="queryParams.areaCode || '610000'"
      :default-org-ids="queryParams.orgIds || []"
      @confirm="handleAreaOrgConfirm"
    />
  </div>
  <!-- 结束 statistics-container -->
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {Refresh, Loading, Download, Location, View} from '@element-plus/icons-vue'
import { CountTo } from '@/components/CountTo'
import { Icon } from '@/components/Icon'
import { ContentWrap } from '@/components/ContentWrap'
import { useMessage } from '@/hooks/web/useMessage'
import download from '@/utils/download'
import {
  ReportZoneApi,
  type ReportZoneVO
} from '@/api/shortage'
import {
  ReportRecordApi
} from '@/api/shortage/reportrecord'
import {
  StatisticsApi,
  type StatisticsQueryVO,
  type StatisticsOverviewVO,
  type SupplyDistributionVO,
  type ShortageDetailVO,
  type DrugCategoryChartVO,
  type WeeklyUsageTrendVO,
  type StockAnalysisVO,
  type OrgRankingVO,
  type DrugShortageTrendVO,
  formatNumber,
  getTrendIcon,
  getTrendColor
} from '@/api/shortage/statistics'
import * as echarts from 'echarts'
import DetailDialog from './components/DetailDialog.vue'
// 导入新的图表组件
import StockWeeksChart from './components/StockWeeksChart.vue'
import UsageChangeChart from './components/UsageChangeChart.vue'
import TrendAnalysisChart from './components/TrendAnalysisChart.vue'
import RegionStatisticsChart from './components/RegionStatisticsChart.vue'
import StatisticsAreaOrgSelector from './components/StatisticsAreaOrgSelector.vue'

defineOptions({ name: 'ShortageStatisticsEnhanced' })

const message = useMessage()
const loading = ref(false)
const exportLoading = ref(false)
const exportDrugsLoading = ref(false)

// 查询参数
const queryParams = reactive<StatisticsQueryVO>({
  zoneId: null,
  reportWeek: '', // 初始化为空，等待后端数据
  areaCode: null,
  orgIds: []
})

// 区域机构选择相关
const showAreaOrgDialog = ref(false)
const currentSelectMode = ref<'area' | 'org'>('area') // 当前选择模式
const selectedAreaName = ref<string>('陕西省') // 存储区域名称

const areaOrgButtonText = computed(() => {
  if (currentSelectMode.value === 'org' && queryParams.orgIds && queryParams.orgIds.length > 0) {
    return `${queryParams.orgIds.length}个机构`
  }
  if (selectedAreaName.value) {
    return selectedAreaName.value
  }
  return '选择区域/机构'
})

// 数据状态
const overview = ref<StatisticsOverviewVO>()
const supplyDistribution = ref<SupplyDistributionVO[]>([])
const shortageDetails = ref<ShortageDetailVO[]>([])
const drugCategoryData = ref<DrugCategoryChartVO[]>([])
const weeklyUsageTrend = ref<WeeklyUsageTrendVO>()
const stockAnalysis = ref<StockAnalysisVO>()
const orgRanking = ref<OrgRankingVO[]>([])
const shortageTrend = ref<DrugShortageTrendVO>()
const zoneList = ref<ReportZoneVO[]>([])
const reportWeeks = ref<string[]>([]) // 从后端获取的填报周期列表

// 表格分页
const tablePageNo = ref(1)
const tablePageSize = ref(20)
const shortageTotal = ref(0)

// 图表实例
const supplyPieChartRef = ref()
const drugCategoryChartRef = ref()
const stockAnalysisChartRef = ref()
const usageTrendChartRef = ref()
const shortageTrendChartRef = ref()

let supplyPieChart: echarts.ECharts | null = null
let drugCategoryChart: echarts.ECharts | null = null
let stockAnalysisChart: echarts.ECharts | null = null
let usageTrendChart: echarts.ECharts | null = null
let shortageTrendChart: echarts.ECharts | null = null

// 周期选项
const weekOptions = computed(() => {
  if (reportWeeks.value.length === 0) {
    return []
  }

  return reportWeeks.value.map(week => ({
    value: week,
    label: `${week}周`
  }))
})

// 获取当前周期
function getCurrentWeek(): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}`
}

// 使用统一的周期工具函数
import { getWeekNumber } from '@/utils/reportWeek'

// 计算药品分类列表
const drugCategories = computed(() => {
  return drugCategoryData.value.map(item => item.drugCategory)
})

// 计算趋势分析的起始周
const trendStartWeek = computed(() => {
  if (!queryParams.reportWeek) return ''
  const [year, week] = queryParams.reportWeek.split('-')
  const weekNum = parseInt(week)
  const startWeek = Math.max(1, weekNum - 11) // 显示12周的数据
  return `${year}-${String(startWeek).padStart(2, '0')}`
})

// 处理图表加载完成
const handleChartLoaded = () => {
  // 可以在这里添加加载完成后的逻辑
}

// 导出周报
const handleExportWeeklyReport = async () => {
  if (!queryParams.reportWeek) {
    message.warning('请选择报告周期')
    return
  }

  exportLoading.value = true
  try {
    // 构建参数，根据选择情况传递不同的参数
    const params = {
      ...queryParams
    }

    // 如果有机构，只传机构；否则传区域
    if (queryParams.orgIds && queryParams.orgIds.length > 0) {
      params.areaCode = null
      params.orgIds = queryParams.orgIds
    } else {
      params.areaCode = queryParams.areaCode
      params.orgIds = []
    }

    const data = await StatisticsApi.exportWeeklyDocx(params)
    download.docx(data, `药品监测周报_${queryParams.reportWeek}.docx`)
    message.success('周报导出成功')
  } catch (error) {
    console.error('导出周报失败:', error)
    message.error('导出周报失败')
  } finally {
    exportLoading.value = false
  }
}
// 导出药品列表
const handleExportDrugs = async () => {
  if (!queryParams.zoneId) {
    message.warning('请选择专区')
    return
  }

  exportDrugsLoading.value = true
  try {
    const params = {
      ...queryParams
    }

    // 如果有机构，只传机构；否则传区域
    if (queryParams.orgIds && queryParams.orgIds.length > 0) {
      params.areaCode = null
      params.orgIds = queryParams.orgIds
    } else {
      params.areaCode = queryParams.areaCode
      params.orgIds = []
    }

    const data = await StatisticsApi.exportDrugsList(params)
    download.excel(data, `短缺药品清单_${queryParams.reportWeek}.xlsx`)
    message.success('药品清单导出成功')
  } catch (error) {
    console.error('导出药品清单失败:', error)
    message.error('导出药品清单失败')
  } finally {
    exportDrugsLoading.value = false
  }
}

// 格式化统计值
const formatStatValue = (value: number | undefined, suffix: string): string => {
  if (value == null) return '0' + suffix

  if (suffix === '类' || suffix === '个') {
    return value + suffix
  }

  return formatNumber(value)
}

// 获取供应状态颜色
const getStatusColor = (status: number): string => {
  const colors: Record<number, string> = {
    1: '#67c23a',
    2: '#e6a23c',
    3: '#f56c6c',
    4: '#ff3333'
  }
  return colors[status] || '#909399'
}

// 获取库存天数颜色
const getStockDaysColor = (days: number): string => {
  if (days <= 3) return '#ff3333'
  if (days <= 7) return '#e6a23c'
  return '#67c23a'
}

// 获取风险等级类型
const getRiskLevelType = (level: number | undefined): string => {
  const types: Record<number, string> = {
    1: 'info',
    2: 'warning',
    3: 'danger'
  }
  return types[level || 1] || 'info'
}

// 获取完成率颜色
const getCompletionColor = (rate: number): string => {
  if (rate >= 95) return '#67c23a'
  if (rate >= 80) return '#e6a23c'
  return '#f56c6c'
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    // 构建参数，根据选择情况传递不同的参数
    const params = {
      ...queryParams
    }

    // 如果有机构，只传机构；否则传区域
    if (queryParams.orgIds && queryParams.orgIds.length > 0) {
      params.areaCode = null
      params.orgIds = queryParams.orgIds
    } else {
      params.areaCode = queryParams.areaCode
      params.orgIds = []
    }

    await Promise.all([
      loadOverview(),
      loadSupplyDistribution(),
      loadShortageDetails(),
      loadDrugCategoryChart(),
      loadWeeklyUsageTrend(),
      loadStockAnalysis(),
      loadOrgRanking(),
      loadShortageTrend()
    ])

    // 更新图表 - 简化时机
    // await nextTick()
    // updateAllCharts()  // 不再需要这里调用，每个加载方法已经单独更新
  } catch (error) {
    console.error('加载数据失败:', error)
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载总体概况
const loadOverview = async () => {
  overview.value = await StatisticsApi.getOverview(queryParams)
}

// 加载供应分布
const loadSupplyDistribution = async () => {
  supplyDistribution.value = await StatisticsApi.getSupplyDistribution(queryParams)
  // 数据加载后立即更新图表
  await nextTick()
  updateSupplyPieChart()
}

// 加载短缺详情
const loadShortageDetails = async () => {
  const params = {
    ...queryParams,
    pageNo: tablePageNo.value,
    pageSize: tablePageSize.value
  }
  const data = await StatisticsApi.getShortageDetails(params)
  shortageDetails.value = data.list || data
  shortageTotal.value = data.total || data.length
}

// 加载药品分类统计
const loadDrugCategoryChart = async () => {
  drugCategoryData.value = await StatisticsApi.getDrugCategoryChart(queryParams)
  // 数据加载后立即更新图表
  await nextTick()
  updateDrugCategoryChart()
}

// 加载周使用量趋势
const loadWeeklyUsageTrend = async () => {
  weeklyUsageTrend.value = await StatisticsApi.getWeeklyUsageTrend(queryParams)
  // 数据加载后立即更新图表
  await nextTick()
  updateUsageTrendChart()
}

// 加载库存分析
const loadStockAnalysis = async () => {
  stockAnalysis.value = await StatisticsApi.getStockAnalysis(queryParams)
  // 数据加载后立即更新图表
  await nextTick()
  updateStockAnalysisChart()
}

// 加载机构排名
const loadOrgRanking = async () => {
  orgRanking.value = await StatisticsApi.getOrgRanking({ ...queryParams, pageSize: 10 })
}

// 加载短缺趋势
const loadShortageTrend = async () => {
  shortageTrend.value = await StatisticsApi.getDrugShortageTrend(queryParams)
  // 数据加载后立即更新图表
  await nextTick()
  updateShortageTrendChart()
}

// 加载专区列表
const loadZoneList = async () => {
  try {
    const data = await ReportZoneApi.getList({
      pageNo: 1,
      pageSize: -1,
      status: 0
    })
    zoneList.value = data
  } catch (error) {
    console.error('加载专区列表失败:', error)
  }
}

// 加载填报周期列表
const loadReportWeeks = async () => {
  try {
    const data = await ReportRecordApi.getReportWeeks()
    reportWeeks.value = data || []
    // 优先使用后端返回的第一个周期
    if (reportWeeks.value.length > 0) {
      queryParams.reportWeek = reportWeeks.value[0]
    } else {
      // 如果后端没有数据，使用当前周期作为备选
      queryParams.reportWeek = getCurrentWeek()
    }
  } catch (error) {
    console.error('加载填报周期失败:', error)
    // 失败时使用当前周期
    queryParams.reportWeek = getCurrentWeek()
  }
}

// 重置查询
const resetQuery = () => {
  queryParams.zoneId = null
  // 重置时使用第一个可用周期，如果没有则使用当前周期
  queryParams.reportWeek = reportWeeks.value.length > 0 ? reportWeeks.value[0] : getCurrentWeek()
  // 重置区域和机构选择为陕西省
  currentSelectMode.value = 'area'
  selectedAreaName.value = '陕西省'
  queryParams.areaCode = '610000'
  queryParams.orgIds = []
  loadAllData()
}

// 导出报告
const handleExport = async () => {
  exportLoading.value = true
  try {
    await StatisticsApi.exportReport(queryParams)
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 查看详情
const detailDialogRef = ref()
const viewDetail = (item: ShortageDetailVO) => {
  // 传递当前查询参数给详情对话框
  detailDialogRef.value?.open(item, {
    zoneId: queryParams.zoneId,
    reportWeek: queryParams.reportWeek,
    areaCode: queryParams.areaCode,
    orgIds: queryParams.orgIds
  })
}

// 更新所有图表
const updateAllCharts = () => {
  // 不再在这里统一更新，而是在各自的加载方法中更新
  // updateSupplyPieChart()
  // updateDrugCategoryChart()
  // updateStockAnalysisChart()
  // updateUsageTrendChart()
  // updateShortageTrendChart()
}

// 更新供应分布饼图
const updateSupplyPieChart = () => {
  if (!supplyPieChartRef.value) {
    return
  }

  if (!supplyPieChart) {
    supplyPieChart = echarts.init(supplyPieChartRef.value)
  }

  let chartData = []

  // 如果有数据，使用真实数据
  if (supplyDistribution.value && supplyDistribution.value.length > 0) {
    chartData = supplyDistribution.value.map(item => ({
      value: item.count,
      name: item.statusName,
      itemStyle: { color: getStatusColor(item.supplyStatus) }
    }))
  }
  // 如果没有数据，显示空的图表结构
  else {
    chartData = []
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: chartData.length > 0 ? '{b}: {c} ({d}%)' : '',
      position: 'right',
      confine: false
    },
    graphic: chartData.length === 0 ? {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: '',
        fontSize: 14,
        fill: '#999'
      }
    } : null,
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['55%', '50%'],
      avoidLabelOverlap: true,
      label: {
        show: chartData.length > 0,
        position: 'outside',
        formatter: '{d}%',
        fontSize: 11
      },
      labelLine: {
        show: chartData.length > 0,
        length: 10,
        length2: 5
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '13',
          fontWeight: 'bold'
        }
      },
      data: chartData
    }]
  }

  supplyPieChart.setOption(option, true)

  // 响应式调整
  window.addEventListener('resize', () => {
    supplyPieChart?.resize()
  })
}

// 更新药品分类图
const updateDrugCategoryChart = () => {
  if (!drugCategoryChartRef.value) return

  if (!drugCategoryChart) {
    drugCategoryChart = echarts.init(drugCategoryChartRef.value)
  }

  const hasData = drugCategoryData.value && drugCategoryData.value.length > 0

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: hasData ? (params: any) => {
        const index = params[0].dataIndex
        const item = drugCategoryData.value[index]
        return `${item.drugCategory}<br/>
                药品数: ${item.drugCount}<br/>
                短缺数: ${item.shortageCount}<br/>
                短缺率: ${item.shortageRate.toFixed(1)}%<br/>
                机构数: ${item.orgCount}`
      } : () => ''
    },
    graphic: !hasData ? {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: '',
        fontSize: 14,
        fill: '#999'
      }
    } : null,
    grid: {
      top: 30,
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hasData ? drugCategoryData.value.map(item => item.drugCategory) : [],
      axisTick: { alignWithLabel: true },
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        interval: 0,
        formatter: (value: string) => {
          return value.length > 6 ? value.slice(0, 6) + '...' : value
        }
      }
    },
    yAxis: { type: 'value', name: '数量' },
    series: [
      {
        name: '药品数',
        type: 'bar',
        data: hasData ? drugCategoryData.value.map(item => item.drugCount) : [],
        itemStyle: { color: '#409eff' },
        barWidth: '30%'
      },
      {
        name: '短缺数',
        type: 'bar',
        data: hasData ? drugCategoryData.value.map(item => item.shortageCount) : [],
        itemStyle: { color: '#f56c6c' },
        barWidth: '30%'
      }
    ]
  }

  drugCategoryChart.setOption(option, true)
}

// 更新库存分析图
const updateStockAnalysisChart = () => {
  if (!stockAnalysisChartRef.value || !stockAnalysis.value || !stockAnalysis.value.distributions) return

  if (!stockAnalysisChart) {
    stockAnalysisChart = echarts.init(stockAnalysisChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      data: stockAnalysis.value.distributions.map(item => item.range),
      textStyle: {
        fontSize: 11
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '14',
          fontWeight: 'bold',
          formatter: '{b}\n{d}%'
        }
      },
      labelLine: {
        show: false
      },
      data: stockAnalysis.value.distributions.map(item => ({
        value: item.count,
        name: item.range,
        itemStyle: {
          color: item.range.includes('0-3') ? '#f56c6c' :
            item.range.includes('4-7') ? '#e6a23c' :
              item.range.includes('8-14') ? '#409eff' : '#67c23a'
        }
      }))
    }]
  }

  stockAnalysisChart.setOption(option)
}

// 更新使用量趋势图
const updateUsageTrendChart = () => {
  if (!usageTrendChartRef.value) return

  if (!usageTrendChart) {
    usageTrendChart = echarts.init(usageTrendChartRef.value)
  }

  // 如果没有数据，清空图表
  if (!weeklyUsageTrend.value) {
    usageTrendChart.clear()
    return
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const weekIndex = params[0].dataIndex
        const usage = params[0].value
        const growth = weeklyUsageTrend.value!.growthRates[weekIndex]
        return `${params[0].name}<br/>
                使用量: ${formatNumber(usage)}<br/>
                环比: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`
      }
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: weeklyUsageTrend.value.weeks,
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      name: '使用量',
      axisLabel: {
        formatter: (value: number) => formatNumber(value)
      }
    },
    series: [{
      name: '使用量',
      type: 'line',
      smooth: true,
      data: weeklyUsageTrend.value.usageData,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      itemStyle: { color: '#409eff' },
      markLine: {
        data: [{
          type: 'average',
          name: '平均值',
          label: { formatter: '均值: {c}' }
        }],
        lineStyle: { color: '#e6a23c' }
      }
    }]
  }

  usageTrendChart.setOption(option)
}

// 更新短缺趋势图
const updateShortageTrendChart = () => {
  if (!shortageTrendChartRef.value) return

  if (!shortageTrendChart) {
    shortageTrendChart = echarts.init(shortageTrendChartRef.value)
  }

  // 如果没有数据，清空图表
  if (!shortageTrend.value) {
    shortageTrendChart.clear()
    return
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['短缺数', '严重短缺', '预测'],
      bottom: 0
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '4%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [...shortageTrend.value.timeAxis, ...['预测1', '预测2', '预测3', '预测4']],
      axisTick: { alignWithLabel: true }
    },
    yAxis: [
      { type: 'value', name: '数量' },
      { type: 'value', name: '短缺率(%)', position: 'right' }
    ],
    series: [
      {
        name: '短缺数',
        type: 'line',
        data: shortageTrend.value.shortageCountTrend,
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '严重短缺',
        type: 'line',
        data: shortageTrend.value.severeShortageCountTrend,
        itemStyle: { color: '#f56c6c' }
      },
      {
        name: '预测',
        type: 'line',
        data: [...new Array(shortageTrend.value.timeAxis.length).fill(null),
          ...(shortageTrend.value.forecastData || [])],
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#909399' }
      }
    ]
  }

  shortageTrendChart.setOption(option)
}

// 初始化时设置默认区域为陕西省
onMounted(() => {
  loadZoneList()
  loadReportWeeks().then(() => {
    // 设置默认区域为陕西省
    currentSelectMode.value = 'area'
    selectedAreaName.value = '陕西省'
    queryParams.areaCode = '610000'
    // 填报周期加载完成后再加载数据
    loadAllData()
  })

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    supplyPieChart?.resize()
    drugCategoryChart?.resize()
    stockAnalysisChart?.resize()
    usageTrendChart?.resize()
    shortageTrendChart?.resize()
  })
})

// 清理
onBeforeUnmount(() => {
  supplyPieChart?.dispose()
  drugCategoryChart?.dispose()
  stockAnalysisChart?.dispose()
  usageTrendChart?.dispose()
  shortageTrendChart?.dispose()
})

// 区域机构选择相关方法
const handleAreaOrgConfirm = (payload: {
  mode: 'area' | 'org'
  areaCode?: string
  areaName?: string
  orgIds?: number[]
}) => {
  currentSelectMode.value = payload.mode
  
  if (payload.mode === 'area') {
    // 地区模式：设置地区代码，清空机构
    queryParams.areaCode = payload.areaCode || null
    queryParams.orgIds = []
    selectedAreaName.value = payload.areaName || ''
  } else {
    // 机构模式：设置机构列表，清空地区
    queryParams.areaCode = null
    queryParams.orgIds = payload.orgIds || []
    selectedAreaName.value = ''
  }
  
  loadAllData()
}
</script>

<style scoped lang="scss">
.statistics-container {
  min-height: 100vh;
  background: #f5f7fa;
  position: relative;
}

// 固定头部栏样式
.fixed-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.header-content {
  padding: 20px 24px;
  max-width: 1920px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .title-icon {
    font-size: 24px;
    color: #409eff;
  }
  
  .title-text {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
}

.header-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  
  .search-form {
    margin: 0;
    
    .el-form-item {
      margin-bottom: 0;
      margin-right: 12px;
      
      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #606266;
      }
      
      &:last-child {
        margin-right: 0;
      }
    }
  }
}

// 内容区域
.content-area {
  padding: 0 24px 24px;
  max-width: 1920px;
  margin: 0 auto;
}

.search-form {
  margin: 0;

  .el-form-item {
    margin-bottom: 0;
  }
}

// 核心指标卡片样式
.core-stats-cards {
  margin: 0 0 20px;
}

.core-stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 140px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border-color: #d9ecff;
  }

  .stat-icon-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    flex-shrink: 0;

    .stat-icon {
      font-size: 28px;
    }
  }

  .stat-content {
    flex: 1;
    min-width: 0;

    .stat-value {
      font-size: 30px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;
      display: flex;
      align-items: baseline;
      margin-bottom: 8px;

      .stat-suffix {
        font-size: 16px;
        font-weight: 500;
        color: #909399;
        margin-left: 6px;
      }
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }

    .stat-progress {
      margin-top: 10px;
    }
  }

  .stat-trend-side {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    border-left: 1px solid #ebeef5;
    min-width: 80px;
    gap: 4px;

    .trend-icon {
      font-size: 20px;
    }

    .trend-value {
      font-size: 16px;
      font-weight: 600;
      text-align: center;
    }
  }
}

// 其他指标卡片 - 稍微小一点
.other-stat-card {
  height: 110px;
  padding: 20px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border-color: #d9ecff;
  }
  
  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    
    .stat-icon {
      font-size: 24px;
    }
  }
  
  .stat-content .stat-value {
    font-size: 26px;
  }
}

// 其他指标
.other-stats-cards {
  margin: 0 0 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
  overflow: visible !important;
  border-radius: 12px !important;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  }

  :deep(.el-card__body) {
    padding: 16px !important;
    overflow: visible !important;
  }
}

.trend-tag {
  font-size: 12px;
}

.trend-form {
  margin: 0;

  .el-form-item {
    margin-bottom: 0;
    margin-right: 12px;

    &:last-child {
      margin-right: 0;
    }
  }
}

.supply-distribution-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 220px;
  padding: 10px 0;
  overflow: visible;
  position: relative;
}

.chart-section {
  flex: 0 0 200px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  position: relative;
  z-index: 10;
}

.legend-section {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.compact-pie-chart {
  width: 200px;
  height: 180px;
  min-width: 280px;
  min-height: 180px;
}

.distribution-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.legend-item-compact {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 4px;
  transition: background-color 0.3s;
  min-height: 24px;
  width: 100%;

  &:hover {
    background-color: #f5f7fa;
  }
}

.legend-label {
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.legend-value {
  font-weight: 700;
  color: #303133;
  font-size: 14px;
  margin-left: auto;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-trend {
  font-size: 11px;
  color: #909399;
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.chart-container-compact {
  height: 240px;
}

.chart-container-medium {
  height: 320px;
}

.drug-name {
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #409eff;
    text-decoration: underline;
  }
}

.stock-days-text {
  font-size: 13px;
  font-weight: 700;
  margin-left: 6px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

// 增强动画效果
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.core-stat-card,
.chart-card {
  animation: fadeIn 0.5s ease-out;
}

// 响应式布局优化
@media (max-width: 768px) {
  .core-stat-card {
    height: auto;
    min-height: 100px;
    padding: 16px;

    .stat-main {
      flex: 1;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;

      .stat-icon {
        font-size: 24px;
      }
    }

    .stat-value {
      font-size: 24px;
    }

    .stat-trend-side {
      padding: 0 8px;
      min-width: 50px;

      .trend-value {
        font-size: 14px;
      }

      .trend-label {
        font-size: 10px;
      }
    }
  }

  .chart-container-compact {
    height: 160px;
  }

  .chart-container-medium {
    height: 240px;
  }

  .supply-distribution-compact {
    flex-direction: column;
    height: auto;
    gap: 12px;
  }

  .chart-section {
    flex: none;
    height: 160px;
    align-self: center;
  }

  .legend-section {
    height: auto;
  }

  .compact-pie-chart {
    width: 160px;
    height: 160px;
    min-width: 160px;
    min-height: 160px;
  }

  .distribution-legend {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
  }

  .legend-item-compact {
    flex: 1;
    min-width: calc(50% - 2px);
    justify-content: center;
    font-size: 11px;
  }
}

// 表格样式优化
.detail-table-wrap,
.ranking-table-wrap {
  border-radius: 12px !important;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-table) {
    th {
      background: #fafafa;
      font-weight: 600;
      color: #303133;
    }
    
    tr:hover > td {
      background: #f5f7fa !important;
    }
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  margin: 0 auto;

  &.rank-1 {
    background: #ffd700;
    color: #fff;
  }

  &.rank-2 {
    background: #c0c0c0;
    color: #fff;
  }

  &.rank-3 {
    background: #cd7f32;
    color: #fff;
  }
}
</style>
