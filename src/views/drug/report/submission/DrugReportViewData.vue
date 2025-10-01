<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-tabs type="border-card" v-model="activeTabName">
      <el-tab-pane label="医疗机构基本情况" name="basicInfo">
        <BasicInformation :taskId="taskId" />
      </el-tab-pane>
      <el-tab-pane label="医疗机构药品目录" name="drugList">
        <DrugList :taskId="taskId" />
      </el-tab-pane>
      <el-tab-pane label="医疗机构药品入库情况" name="storageStatus">
        <DrugStorageStatus :taskId="taskId" />
      </el-tab-pane>
      <el-tab-pane label="医疗机构药品出库情况" name="outboundSituation">
        <DrugOutboundSituation :taskId="taskId" />
      </el-tab-pane>
      <el-tab-pane label="医疗机构药品使用情况" name="usageSituation">
        <DrugUsageSituation :taskId="taskId" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import BasicInformation from './view-data/BasicInformation.vue'
import DrugList from './view-data/DrugList.vue'
import DrugOutboundSituation from './view-data/DrugOutboundSituation.vue'
import DrugStorageStatus from './view-data/DrugStorageStatus.vue'
import DrugUsageSituation from './view-data/DrugUsageSituation.vue'

// 定义组件名称
defineOptions({ name: 'DrugReportViewData' })

const route = useRoute()

const taskId = ref(Number(route.query.taskId))

const activeTabName = ref('basicInfo')
</script>
