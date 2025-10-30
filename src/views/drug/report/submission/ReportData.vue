<!--数据上报流程-->
<template>
  <div class="app-container">
    <!-- 上报进度步骤条卡片（含返回按钮） -->
    <ContentWrap class="progress-card">
      <div class="progress-card-header">
        <div class="header-left">
          <el-button class="back-button" @click="handleBackToList" text>
            <el-icon class="back-icon">
              <ArrowLeft />
            </el-icon>
            <span>返回列表</span>
          </el-button>
          <div class="header-divider"></div>
          <h2 class="page-title">数据上报流程</h2>
        </div>
        <div class="step-info">
          <span class="step-label">第 {{ currentStep + 1 }} 步</span>
          <span class="step-divider">/</span>
          <span class="step-total">共 5 步</span>
        </div>
      </div>
      
      <el-steps :active="currentStep" align-center :process-status="getProcessStatus()">
        <el-step 
          title="准备" 
          @click="changeSteps(0)"
          :class="{ 'step-clickable': 0 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(0, '准备阶段', '准备上报文件')" placement="top">
              <el-icon>
                <Document />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step 
          title="上传与校验" 
          @click="changeSteps(1)"
          :class="{ 'step-clickable': 1 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(1, '上传与校验阶段', '上传数据文件并进行基础校验')" placement="top">
              <el-icon>
                <Upload />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step 
          title="前置质控" 
          @click="changeSteps(2)"
          :class="{ 'step-clickable': 2 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(2, '前置质控阶段', '数据格式验证')" placement="top">
              <el-icon>
                <CircleCheck />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step 
          title="提交上报" 
          @click="changeSteps(3)"
          :class="{ 'step-clickable': 3 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(3, '提交上报阶段', '提交至管理端审核')" placement="top">
              <el-icon>
                <Promotion />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step 
          title="提交国家平台" 
          @click="changeSteps(4)"
          :class="{ 'step-clickable': 4 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(4, '提交国家平台阶段', '提交至国家平台')" placement="top">
              <el-icon>
                <Promotion />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
      </el-steps>
    </ContentWrap>

    <!-- 主要内容区域 -->
    <div class="content-card" v-loading="loading">
      <!-- 步骤0: 准备阶段 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="requirements-section">
          <div class="requirements-content">
            <div class="requirements-header">
              <h3 class="requirements-title">压缩包必须包含以下5个Excel文件</h3>
              <p class="requirements-subtitle">请确保文件名称和内容格式完全符合要求</p>
            </div>
            <div class="file-list-container">
              <div class="file-grid">
                <div
                  v-for="(table, key) in tableDefinitions"
                  :key="key"
                  class="file-card"
                  :style="{ '--file-color': table.color }"
                  @click="previewTemplate(table.id)"
                >
                  <div class="file-card-header">
                    <el-icon class="file-card-icon" :style="{ color: table.color }">
                      <Files />
                    </el-icon>
                    <div class="file-card-title">{{ table.fileName }}</div>
                  </div>
                  <div class="file-card-content">
                    <div class="file-card-name">
                      <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="table.type" />
                    </div>
                    <div class="file-card-stats">
                      <span class="field-count">{{ table.fieldCount }} 个字段</span>
                      <span class="required-fields">{{ table.requiredFieldsCount || 0 }} 个必填</span>
                      <span class="download-count">{{ table.downloadCount || 0 }} 次下载</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="requirements-tips">
              <div class="tip-item">
                <el-icon class="tip-icon success">
                  <CircleCheck />
                </el-icon>
                <span>文件格式：Excel (.xlsx) 文件，UTF-8编码，GBK编码</span>
              </div>
              <div class="tip-item">
                <el-icon class="tip-icon warning">
                  <Warning />
                </el-icon>
                <span>字段要求：必填字段不能为空，可选字段可为空；字段需符合类型、长度、正则表达式等高级校验规则</span>
              </div>
              <div class="tip-item">
                <el-icon class="tip-icon info">
                  <InfoFilled />
                </el-icon>
                <span>数据质量：建议数据完整性超过90%以获得最佳导入效果</span>
              </div>
            </div>

            <div class="prepare-actions">
              <el-button size="large" @click="downloadTemplate">
                <el-icon class="mr-5px">
                  <Download />
                </el-icon>
                下载标准模板压缩包
              </el-button>
              <el-button type="primary" size="large" @click="startUpload">
                <el-icon class="mr-5px">
                  <Upload />
                </el-icon>
                开始上传文件
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤1: 上传与校验 -->
      <div v-if="currentStep === 1" class="step-content">
        <h3 class="step-title">上传与校验</h3>
        
        <!-- 总览卡片（整合进度信息） -->
        <StepSummaryCard 
          :key="`step1-${stepSummaryKey}`"
          :step-type="1" 
          :task-id="currentTask.taskId"
          :is-processing="isUploading"
          :current-phase="currentBatchPhase"
          :uploaded-count="uploadedFileCount"
          :total-count="totalFileCount"
          :overall-progress="overallProgress"
          @refresh="loadStepSummary"
          @close="handleSummaryClose"
        />
        
        <div class="upload-section">

          <!-- 批量上传区域 -->
          <div class="batch-upload">
            <!-- 拖拽上传区域（上传中时置灰） -->
            <el-upload
              ref="uploadRef"
              class="upload-dragger"
              :class="{ 'upload-disabled': isUploading }"
              drag
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept=".zip,.rar,.xlsx"
              :disabled="isUploading || currentStep < currentTask.maxCurrentStep || uploadingFiles.length > 0"
              :show-file-list="false"
            >
              <el-icon class="el-icon--upload">
                <UploadFilled />
              </el-icon>
              <div class="el-upload__text">
                拖拽ZIP，RAR压缩包或所有Excel文件到此处，或<em>点击上传</em>
              </div>
            </el-upload>

            <!-- 上传进度由总览卡片显示，此处移除独立进度区域 -->

            <!-- 上传结果总览（处理完成后显示） -->
            <transition name="fade-slide">
              <div v-if="uploadResult && !isUploading" class="upload-progress-section">
                <el-alert
                  :type="uploadResult.failedCount > 0 ? 'warning' : 'success'"
                  :closable="true"
                  @close="closeResultSummary"
                >
                  <template #title>
                    <div class="result-title">
                      <el-icon><SuccessFilled v-if="uploadResult.failedCount === 0" /><WarningFilled v-else /></el-icon>
                      <span>上传结果总览</span>
                    </div>
                  </template>

                  <div class="result-content">
                    <!-- 统计数据 -->
                    <div class="result-stats">
                      <div class="stat-item">
                        <span class="stat-label">共处理</span>
                        <span class="stat-value total">{{ uploadResult.totalFiles }}</span>
                        <span class="stat-label">个文件</span>
                      </div>
                      <div class="stat-divider"></div>
                      <div class="stat-item success">
                        <el-icon><CircleCheckFilled /></el-icon>
                        <span class="stat-label">成功:</span>
                        <span class="stat-value">{{ uploadResult.successCount }}个</span>
                      </div>
                      <div class="stat-divider"></div>
                      <div class="stat-item failed" v-if="uploadResult.failedCount > 0">
                        <el-icon><CircleCloseFilled /></el-icon>
                        <span class="stat-label">失败:</span>
                        <span class="stat-value">{{ uploadResult.failedCount }}个</span>
                      </div>
                    </div>

                    <!-- 基础错误列表 -->
                    <div v-if="uploadResult.basicErrors && uploadResult.basicErrors.length > 0" class="basic-errors">
                      <div class="error-title">
                        <el-icon><Warning /></el-icon>
                        <span>基础错误提示</span>
                      </div>
                      <ul class="error-list">
                        <li v-for="(error, index) in uploadResult.basicErrors" :key="index" class="error-item">
                          <el-icon :class="['error-icon', getErrorIconClass(error.errorType)]">
                            <component :is="getBasicErrorIcon(error.errorType)" />
                          </el-icon>
                          <span class="error-message">{{ error.message }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="result-actions">
                      <el-button 
                        size="small" 
                        @click="downloadErrorSummary"
                        v-if="uploadResult.failedCount > 0"
                      >
                        <el-icon><Download /></el-icon>
                        下载错误汇总
                      </el-button>
                    </div>
                  </div>
                </el-alert>
              </div>
            </transition>
          </div>

          <!-- 文件列表（带总进度和刷新按钮） -->
          <div class="table-header">
            <span class="table-title">文件列表</span>
            
            <!-- 总进度条（上传中时显示） -->
            <div v-if="isUploading" class="header-progress">
              <span class="progress-label">总进度：</span>
              <el-progress 
                :percentage="overallProgress" 
                :color="getProgressColor(overallProgress)"
                :stroke-width="6"
                class="progress-bar"
              />
              <span class="progress-count">{{ uploadedFileCount }}/{{ totalFileCount }}</span>
            </div>
            
            <el-button
              type="primary"
              size="small"
              :icon="RefreshRight"
              :loading="refreshingFileList"
              @click="refreshFileList"
              circle
            />
          </div>
          <el-table
            :data="fileList"
            :show-overflow-tooltip="true"
          >
            <el-table-column label="序号" width="80" type="index" align="center" />
            <el-table-column prop="standardFileName" label="标准文件名称" min-width="180" align="center" />
            <el-table-column prop="originalFileName" label="实际文件名称" min-width="200" align="center" />
            <el-table-column prop="fileType" label="文件类型" width="150" align="center">
              <template #default="{ row }">
                <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="row.fileType" />
              </template>
            </el-table-column>
            <el-table-column prop="uploadStatus" label="状态" width="120" align="center">
              <template #default="{ row }">
                <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.uploadStatus" />
              </template>
            </el-table-column>
            <el-table-column label="上传进度" width="200" align="center">
              <template #default="{ row }">
                <div v-if="uploadProgress[row.fileType] && uploadingFiles.includes(row.fileType)" class="progress-wrapper">
                  <el-progress 
                    :percentage="uploadProgress[row.fileType]?.progress || 0"
                    :status="getProgressStatus(uploadProgress[row.fileType]?.status)"
                  />
                  <div class="progress-message">
                    {{ uploadProgress[row.fileType]?.currentStep || '处理中...' }}
                  </div>
                </div>
                <span v-else class="record-count">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="fileSize" label="文件大小" width="120" align="center">
              <template #default="{ row }">
                <span class="record-count">{{ formatFileSize(row.fileSize) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fileFormat" label="文件格式" width="120" align="center">
              <template #default="{ row }">
                <span class="record-count">{{ row.fileFormat || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="recordCount" label="数据条数" width="120" align="center">
              <template #default="{ row }">
                <span class="record-count">{{ row.recordCount || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="errorCount" label="错误数" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.errorCount > 0" type="danger" size="small">
                  {{ row.errorCount }}
                </el-tag>
                <span v-else class="text-success">0</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="250" align="center">
              <template #default="{ row }">
                <!-- 查看数据详情按钮 - 已上传状态 -->
                <el-button
                  v-if="row.uploadStatus === 2 && row.errorCount === 0"
                  type="primary"
                  size="small"
                  :disabled="currentStep < currentTask.maxCurrentStep"
                  @click="viewFileData(row)"
                >
                  <Icon icon="ep:view" class="mr-5px" />
                  查看数据
                </el-button>

                <!-- 查看错误详情按钮 - 有错误时 -->
                <el-button
                  v-if="row.uploadStatus === 2 && row.errorCount > 0"
                  type="danger"
                  size="small"
                  @click="viewErrorDetail(row)"
                >
                  <Icon icon="ep:warning-filled" class="mr-5px" />
                  查看详情
                </el-button>

                <!-- 上传/重新上传按钮 -->
                <el-upload
                  v-if="[0, 1, 2, 3].includes(row.uploadStatus)"
                  action="#"
                  :auto-upload="false"
                  :on-change="(file) => handleSingleFileUpload(file, row)"
                  accept=".xlsx"
                  :disabled="currentStep < currentTask.maxCurrentStep || uploadingFiles.includes(row.fileType)"
                  :show-file-list="false"
                  class="inline-upload"
                >
                  <el-button 
                    :type="row.uploadStatus === 0 ? 'primary' : 'warning'" 
                    size="small"
                    :loading="uploadingFiles.includes(row.fileType)"
                  >
                    <Icon icon="ep:upload" class="mr-5px" v-if="!uploadingFiles.includes(row.fileType)" />
                    {{ uploadingFiles.includes(row.fileType) ? '上传中...' : (row.uploadStatus === 0 ? '上传' : '修复重传') }}
                  </el-button>
                </el-upload>
              </template>
            </el-table-column>
          </el-table>

          <div class="upload-actions">
            <el-button @click="currentTask.currentStep = 0" :disabled="currentStep < currentTask.maxCurrentStep">
              <Icon icon="ep:back" class="mr-5px" />
              返回准备
            </el-button>
            <el-tooltip 
              :content="!allFilesUploaded ? '请先完成所有文件的上传与基础校验' : '开始前置质控'"
              placement="top"
              :disabled="allFilesUploaded"
            >
              <span>
                <el-button
                  type="primary"
                  @click="startPreQC"
                  :disabled="!allFilesUploaded || currentStep < currentTask.maxCurrentStep"
                >
                  <Icon icon="ep:circle-check" class="mr-5px" />
                  开始前置质控
                </el-button>
              </span>
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 步骤2: 前置质控 -->
      <div v-if="currentStep === 2" class="step-content">
        <h3 class="step-title">前置质控结果</h3>
        
        <!-- 总览卡片 -->
        <StepSummaryCard 
          :key="`step2-${stepSummaryKey}`"
          :step-type="2" 
          :task-id="currentTask.taskId"
          @refresh="loadStepSummary"
          @close="handleSummaryClose"
        />
        
        <div class="qc-section">
        <!-- 质控统计卡片 -->
        <div class="qc-summary">
          <div class="summary-card" :class="preQCResult.passed ? 'success' : 'warning'">
            <div class="summary-icon">
              <el-icon v-if="preQCResult.passed">
                <CircleCheck />
              </el-icon>
              <el-icon v-else>
                <Warning />
              </el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-title">{{ preQCResult.passed ? '质控通过' : '质控未通过' }}</div>
              <div class="summary-desc">
                {{ preQCResult.passed ? '所有文件已通过前置质控，可以提交上报' : '部分文件存在问题，请修复后重新上传' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 质控详情表格 -->
        <el-table
          :data="preQCResult.details"
          @selection-change="handleSelectionChange"
          :show-overflow-tooltip="true"
        >
          <el-table-column
            type="selection"
            width="55"
            align="center"
            :selectable="checkboxDisabled"
          />
          <el-table-column label="序号" width="80" type="index" align="center" />
          <el-table-column prop="fileType" label="文件类型" width="150" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="row.fileType" />
            </template>
          </el-table-column>
          <el-table-column prop="standardFileName" label="标准文件名称" min-width="180" align="center" />
          <el-table-column prop="originalFileName" label="实际文件名称" min-width="200" align="center" />
          <el-table-column prop="uploadStatus" label="上传状态" width="120" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.uploadStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="qcStatus" label="质检状态" width="120" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.QC_STATUS" :value="row.qcStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="文件大小" width="120" align="center">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column prop="fileFormat" label="文件格式" width="120" align="center" />
          <el-table-column prop="errorCount" label="错误数" width="100" align="center">
            <template #default="{ row }">
                  <span :class="row.errorCount > 0 ? 'error-count' : ''">
                    {{ row.errorCount || 0 }}
                  </span>
            </template>
          </el-table-column>
          <el-table-column label="质控进度" width="180" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="getQCProgress(row.qcStatus)"
                :color="getQCProgressColor(row.qcStatus)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :disabled="currentStep < currentTask.maxCurrentStep"
                @click="viewFileData(row)"
              >
                <Icon icon="ep:view" class="mr-5px" />
                查看详情
              </el-button>
              <el-button
                v-if="row.qcStatus === 4"
                type="danger"
                size="small"
                :disabled="currentStep < currentTask.maxCurrentStep"
                @click="viewQCErrors(row)"
              >
                <Icon icon="ep:warning" class="mr-5px" />
                查看错误
              </el-button>
              <el-button
                v-if="row.qcStatus === 4"
                type="warning"
                size="small"
                :disabled="currentStep < currentTask.maxCurrentStep"
                @click="fixAndReupload(row)"
              >
                <Icon icon="ep:refresh" class="mr-5px" />
                修复重传
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="qc-actions">
          <el-button @click="backToUpload" :disabled="currentStep < currentTask.maxCurrentStep">
            <Icon icon="ep:back" class="mr-5px" />
            返回上传
          </el-button>
          <el-button
            type="primary"
            :disabled="!preQCResult.passed || currentStep < currentTask.maxCurrentStep"
            @click="startSubmitReport"
          >
            <Icon icon="ep:promotion" class="mr-5px" />
            开始提交上报
          </el-button>
        </div>
        </div>
      </div>

      <!-- 步骤3: 提交上报 -->
      <div v-if="currentStep === 3" class="step-content">
        <h3 class="step-title">提交上报</h3>
        
        <!-- 总览卡片 -->
        <StepSummaryCard 
          :key="`step3-${stepSummaryKey}`"
          :step-type="3" 
          :task-id="currentTask.taskId"
          @refresh="loadStepSummary"
          @close="handleSummaryClose"
        />
        
        <div class="submit-section">
        <!-- 上报信息 -->
        <div class="submit-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">
              {{ submitInfo.taskName }}
            </el-descriptions-item>
            <el-descriptions-item label="开始日期">
              {{ formatDateTime(submitInfo.startDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="结束日期">
              {{ formatDateTime(submitInfo.endDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="上报时间">
              {{ formatDateTime(submitInfo.reportTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 文件列表 -->
        <el-table
          :data="preQCResult.details"
          :show-overflow-tooltip="true"
        >
            <el-table-column label="序号" width="80" type="index" align="center" />
            <el-table-column prop="fileType" label="文件类型" width="150" align="center">
              <template #default="{ row }">
                <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="row.fileType" />
              </template>
            </el-table-column>
            <el-table-column prop="standardFileName" label="标准文件名称" min-width="180" align="center" />
            <el-table-column prop="originalFileName" label="实际文件名称" min-width="200" align="center" />
          <el-table-column prop="uploadStatus" label="上传状态" width="120" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.uploadStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="qcStatus" label="质检状态" width="140" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.QC_STATUS" :value="row.qcStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="文件大小" width="120" align="center">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column prop="fileFormat" label="文件格式" width="120" align="center" />
<!--          <el-table-column label="完成度" width="180" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="100"
                :color="getProgressColor(100)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>-->
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewFileData(row)">
                <Icon icon="ep:view" class="mr-5px" />
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="qc-actions">
          <el-button @click="() => (currentTask.currentStep = 2)">
            <Icon icon="ep:back" class="mr-5px" />
            返回前置质控
          </el-button>
          <el-button
            type="success"
            size="large"
            :disabled="!preQCResult.passed"
            @click="submitReport"
          >
            <Icon icon="ep:promotion" class="mr-5px" />
            确认提交上报
          </el-button>
        </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 错误详情对话框 -->
  <Dialog v-model="errorDialog.visible" title="质检提示" width="600px">
    <div class="quality-details">
      <div class="detail-header">
        <el-icon class="detail-icon">
          <Warning />
        </el-icon>
        <h4>质检初审不通过</h4>
      </div>
      <div class="quality-details-content">
        <div class="detail-item">
          <span class="detail-label">文件名称:</span>
          <span>{{ errorDialog.fileName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">未通过原因：</span>
          <div class="error-messages">{{ errorDialog.errors }}</div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="errorDialog.visible = false">关闭</el-button>
    </template>
  </Dialog>

  <!-- 数据查看对话框 -->
  <Dialog
    v-model="dataViewDialog.visible"
    :title="`查看数据 - ${dataViewDialog.fileName}`"
    width="80%"
    top="5vh"
  >
    <component :is="excelDetailTarget" :dataViewDialog="dataViewDialog" ref="excelDetail" />
    <div class="dialog-page">
      <Pagination
        :total="excelDetailTotal"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getExcelDetailData"
      />
    </div>
  </Dialog>

  <!-- 错误详情弹窗（参考FieldEditDialog样式） -->
  <Dialog
    v-model="errorDetailDialog.visible"
    :title="`${errorDetailDialog.fileName} - 验证详情`"
    width="900px"
    class="error-detail-dialog"
  >
    <div class="error-detail-content">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">总行数</span>
            <span class="stat-value">{{ errorDetailDialog.totalRows }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">错误</span>
            <span class="stat-value error">{{ errorDetailDialog.errorCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">通过</span>
            <span class="stat-value success">{{ errorDetailDialog.totalRows - errorDetailDialog.errorCount }}</span>
          </div>
        </div>
        
        <div class="pass-rate">
          <span class="rate-label">通过率:</span>
          <el-progress
            :percentage="errorDetailDialog.passRate"
            :color="getProgressColor(errorDetailDialog.passRate)"
            :stroke-width="12"
          />
        </div>
      </div>

      <!-- 错误详情 -->
      <div class="error-details-section">
        <div class="detail-header">
          <el-icon class="header-icon"><WarningFilled /></el-icon>
          <span class="header-title">错误详情</span>
          <el-tag size="small" type="danger">共{{ errorDetailDialog.errorCount }}条</el-tag>
        </div>

        <!-- 必填字段为空 -->
        <div
          v-if="errorDetailDialog.requiredErrors && errorDetailDialog.requiredErrors.length > 0"
          class="error-group"
        >
          <div class="group-header" @click="toggleErrorGroup('required')">
            <div class="header-left">
              <el-icon :class="['toggle-icon', { 'expanded': errorDetailDialog.expandedGroups.includes('required') }]">
                <ArrowRight v-if="!errorDetailDialog.expandedGroups.includes('required')" />
                <ArrowDown v-else />
              </el-icon>
              <el-icon class="error-type-icon required"><CircleCloseFilled /></el-icon>
              <span class="group-title">必填字段为空</span>
              <el-tag size="small" type="danger" effect="plain">{{ errorDetailDialog.requiredErrors.length }}条</el-tag>
            </div>
          </div>

          <el-collapse-transition>
            <div v-show="errorDetailDialog.expandedGroups.includes('required')" class="group-content">
              <el-table :data="displayedRequiredErrors" border stripe size="small" max-height="400">
                <el-table-column prop="rowIndex" label="行号" width="100" align="center">
                  <template #default="{ row }">
                    第{{ row.rowIndex }}行
                  </template>
                </el-table-column>
                <el-table-column prop="fieldName" label="字段名" width="180" />
                <el-table-column label="当前值" width="120" align="center">
                  <template #default>
                    <span class="empty-value">(空)</span>
                  </template>
                </el-table-column>
                <el-table-column prop="errorMessage" label="修改建议" min-width="250">
                  <template #default="{ row }">
                    <span class="error-suggestion">
                      <el-icon class="suggestion-icon"><InfoFilled /></el-icon>
                      {{ row.errorMessage || `请填写${row.fieldName}` }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 展开/收起按钮 -->
              <div v-if="errorDetailDialog.requiredErrors.length > 5" class="expand-toggle">
                <el-button
                  type="primary"
                  link
                  @click="toggleExpandType('required')"
                >
                  {{ errorDetailDialog.expandedTypes.includes('required') ? '收起' : `还有${errorDetailDialog.requiredErrors.length - 5}条` }}
                  <el-icon>
                    <ArrowUp v-if="errorDetailDialog.expandedTypes.includes('required')" />
                    <ArrowDown v-else />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 字段类型错误 -->
        <div
          v-if="errorDetailDialog.typeErrors && errorDetailDialog.typeErrors.length > 0"
          class="error-group"
        >
          <div class="group-header" @click="toggleErrorGroup('type')">
            <div class="header-left">
              <el-icon :class="['toggle-icon', { 'expanded': errorDetailDialog.expandedGroups.includes('type') }]">
                <ArrowRight v-if="!errorDetailDialog.expandedGroups.includes('type')" />
                <ArrowDown v-else />
              </el-icon>
              <el-icon class="error-type-icon type"><WarningFilled /></el-icon>
              <span class="group-title">字段类型错误</span>
              <el-tag size="small" type="warning" effect="plain">{{ errorDetailDialog.typeErrors.length }}条</el-tag>
            </div>
          </div>

          <el-collapse-transition>
            <div v-show="errorDetailDialog.expandedGroups.includes('type')" class="group-content">
              <el-table :data="displayedTypeErrors" border stripe size="small" max-height="400">
                <el-table-column prop="rowIndex" label="行号" width="100" align="center">
                  <template #default="{ row }">
                    第{{ row.rowIndex }}行
                  </template>
                </el-table-column>
                <el-table-column prop="fieldName" label="字段名" width="180" />
                <el-table-column prop="currentValue" label="当前值" width="180">
                  <template #default="{ row }">
                    <span class="invalid-value">{{ row.currentValue }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="errorMessage" label="错误原因" min-width="300">
                  <template #default="{ row }">
                    <span class="error-reason">
                      <el-icon class="reason-icon"><Warning /></el-icon>
                      {{ row.errorMessage }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 展开/收起按钮 -->
              <div v-if="errorDetailDialog.typeErrors.length > 5" class="expand-toggle">
                <el-button
                  type="primary"
                  link
                  @click="toggleExpandType('type')"
                >
                  {{ errorDetailDialog.expandedTypes.includes('type') ? '收起' : `还有${errorDetailDialog.typeErrors.length - 5}条` }}
                  <el-icon>
                    <ArrowUp v-if="errorDetailDialog.expandedTypes.includes('type')" />
                    <ArrowDown v-else />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="errorDetailDialog.visible = false">关闭</el-button>
        <el-button type="warning" @click="downloadErrorExcel(errorDetailDialog.fileType)">
          <el-icon><Download /></el-icon>
          下载错误Excel
        </el-button>
        <el-button type="primary" @click="retryUploadFile(errorDetailDialog.fileType)">
          <el-icon><RefreshRight /></el-icon>
          修复重传
        </el-button>
      </div>
    </template>
  </Dialog>

  <!-- Excel预览弹窗 -->
  <ExcelPreviewDialog ref="excelPreviewRef" />
</template>

<script setup lang="ts">
import request from '@/config/axios'
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from '@/hooks/web/useMessage'
import {
  Download,
  Upload,
  UploadFilled,
  CircleCheck,
  Warning,
  InfoFilled,
  Document,
  Promotion,
  Files,
  ArrowLeft,
  RefreshRight,
  Loading,
  SuccessFilled,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  ArrowDown,
  ArrowRight,
  ArrowUp
} from '@element-plus/icons-vue'
import { ContentWrap } from '@/components/ContentWrap'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import ExcelPreviewDialog from '@/views/drug/import/batch/components/ExcelPreviewDialog.vue'
import StepSummaryCard from './components/StepSummaryCard.vue'
import {
  ReportDataApi
} from '@/api/drug/reportdata'
import { ImportTemplateApi } from '@/api/drug/task/template'
import { TemplateFieldApi } from '@/api/drug/task/template'
import { ReportStepSummaryApi } from '@/api/drug/reportstepsummary'
import download from '@/utils/download'
import { DICT_TYPE } from '@/utils/dict'
import { getProgressColor } from '@/utils/progressColor'
import hospitalDetails from './excel-detail/hospital.vue'
import inboundDetails from './excel-detail/inbound.vue'
import outboundDetails from './excel-detail/outbound.vue'
import usageDetails from './excel-detail/usage.vue'
import catalogDetails from './excel-detail/catalog.vue'

defineOptions({ name: 'DrugReportData' })

const message = useMessage()

// ==================== 数据定义 ====================
const tableDefinitions = ref<any>({})
const loadingTemplates = ref(false)
const excelPreviewRef = ref()
const currentStep = computed(() => currentTask.value.currentStep || 0)
const loading = ref(false)
const refreshingFileList = ref(false)
const route = useRoute()
const router = useRouter()
const queryData = route.query

const currentTask = ref<any>({
  id: null,
  taskName: '',
  status: 1,
  startDate: '',
  endDate: '',
  hospitalId: null,
  hospitalName: '',
  description: '',
  taskId: queryData.taskId ? Number(queryData.taskId) : null,
  reportStatus: 0,
  currentStep: 0,
  maxCurrentStep: 0
})

// 文件列表完全从后端获取
const fileList = ref<any[]>([])

const selectedFileIds = ref([])

const preQCResult = ref({
  passed: false,
  details: []
})

const submitInfo = ref({
  taskName: '',
  startDate: '',
  endDate: '',
  reportTime: ''
})

const excelDetailTotal = ref(0)
const queryParams = ref({
  pageNo: 1,
  pageSize: 100
})

const dataViewDialog = ref({
  visible: false,
  loading: false,
  fileName: '',
  data: []
})
const activeFile = ref()

const errorDialog = ref({
  visible: false,
  fileName: '',
  errors: []
})

// ==================== 上传进度跟踪 ====================
const isUploading = ref(false)
const uploadingFiles = ref<string[]>([])
const uploadProgress = ref<Record<string, any>>({})
let progressPollingInterval: ReturnType<typeof setInterval> | null = null

// 上传结果
const uploadResult = ref<any>(null)

// 当前批次阶段描述
const currentBatchPhase = ref('正在处理文件...')
const processedFilesCount = ref(0)
const totalFilesCount = ref(0)

// 进度消息列表（动态显示有价值的信息）
const progressMessages = ref<Array<{
  id: string
  text: string
  type: 'info' | 'success' | 'warning' | 'error'
  tag?: string
  tagType?: 'success' | 'warning' | 'danger' | 'info'
}>>([])

let messageIdCounter = 0

// 错误详情弹窗数据
const errorDetailDialog = ref({
  visible: false,
  fileName: '',
  fileType: '',
  totalRows: 0,
  errorCount: 0,
  passRate: 0,
  requiredErrors: [] as any[],
  typeErrors: [] as any[],
  expandedGroups: ['required', 'type'], // 默认展开的错误组
  expandedTypes: [] as string[] // 控制是否展开全部
})

// ==================== 计算属性 ====================
const excelDetailTarget = computed(() => {
  if (!activeFile.value) return null
  const typeMap = {
    hospital: hospitalDetails,
    catalog: catalogDetails,
    inbound: inboundDetails,
    outbound: outboundDetails,
    usage: usageDetails
  }
  return typeMap[activeFile.value.fileType] || null
})

const handleBackToList = () => {
  // 返回列表页，不修改任何状态，保持数据库中的值
  router.push({ name: 'DrugReportSubmission' })
}

const allFilesUploaded = computed(() => {
  return fileList.value.length > 0 && fileList.value.every((file) => file.uploadStatus === 2)
})

// 计算总文件数
const totalFileCount = computed(() => {
  return fileList.value.length
})

// 计算已上传文件数
const uploadedFileCount = computed(() => {
  return fileList.value.filter(file => file.uploadStatus === 2).length
})

// 计算整体上传进度（考虑实时进度）
const overallProgress = computed(() => {
  if (uploadingFiles.value.length === 0) {
    // 没有正在上传的文件，使用已完成数量计算
    const total = totalFileCount.value
    return total > 0 ? Math.round((uploadedFileCount.value / total) * 100) : 0
  }
  
  // 有正在上传的文件，计算平均进度
  let totalProgress = 0
  let count = 0
  
  fileList.value.forEach(file => {
    if (uploadProgress.value[file.fileType]) {
      totalProgress += uploadProgress.value[file.fileType].progress || 0
      count++
    } else if (file.uploadStatus === 2) {
      totalProgress += 100
      count++
    }
  })
  
  return count > 0 ? Math.round(totalProgress / count) : 0
})

// 当前正在上传的文件列表详情
const uploadingFilesList = computed(() => {
  return uploadingFiles.value.map(fileType => {
    const file = fileList.value.find(f => f.fileType === fileType)
    const progress = uploadProgress.value[fileType]
    return {
      type: fileType,
      name: file?.standardFileName || file?.fileName || fileType,
      progress: progress?.progress || 0,
      status: progress?.status || 'idle',
      currentStep: progress?.currentStep || '',
      errors: progress?.errors || []
    }
  }).filter(f => f)
})

// 计算整体上传完成度
const overallUploadProgress = computed(() => {
  if (totalFileCount.value === 0) return 0
  return Math.round((uploadedFileCount.value / totalFileCount.value) * 100)
})

// 显示的必填错误（默认显示前5条）
const displayedRequiredErrors = computed(() => {
  return errorDetailDialog.value.expandedTypes.includes('required')
    ? errorDetailDialog.value.requiredErrors
    : errorDetailDialog.value.requiredErrors.slice(0, 5)
})

// 显示的类型错误（默认显示前5条）
const displayedTypeErrors = computed(() => {
  return errorDetailDialog.value.expandedTypes.includes('type')
    ? errorDetailDialog.value.typeErrors
    : errorDetailDialog.value.typeErrors.slice(0, 5)
})

// ==================== 方法定义 ====================
function checkboxDisabled(row) {
  return [2, 3].includes(row.qcStatus)
}

function handleSelectionChange(val) {
  selectedFileIds.value = val.map((item) => item.id)
}

function changeSteps(step: number) {
  if (step <= currentTask.value.maxCurrentStep) {
    currentTask.value.currentStep = step
  }
}

// 获取步骤提示文字
function getStepTooltip(targetStep: number, stageName: string, description: string): string {
  const current = currentStep.value
  const maxStep = currentTask.value.maxCurrentStep || 0
  
  // 如果步骤不可点击
  if (targetStep > maxStep) {
    return description
  }
  
  // 如果是当前步骤
  if (targetStep === current) {
    return `当前所在：${stageName}`
  }
  
  // 如果目标步骤在当前步骤之前
  if (targetStep < current) {
    return `点击返回${stageName}`
  }
  
  // 如果目标步骤在当前步骤之后
  return `点击前往${stageName}`
}

const getProcessStatus = () => {
  if (currentTask.value.currentStep === 3) return 'success'
  return 'process'
}

// 获取质控进度
const getQCProgress = (qcStatus: number) => {
  const progressMap = {
    0: 0,
    1: 50,
    2: 100,
    3: 100,
    4: 100
  }
  return progressMap[qcStatus] || 0
}

// 获取质控进度颜色
const getQCProgressColor = (qcStatus: number) => {
  const colorMap = {
    0: '#909399',
    1: '#409eff',
    2: '#67c23a',
    3: '#e6a23c',
    4: '#f56c6c'
  }
  return colorMap[qcStatus] || '#909399'
}

const formatDateTime = (date: Date | string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ==================== 错误详情弹窗相关方法 ====================

/** 打开错误详情弹窗 */
const viewErrorDetail = async (row: any) => {
  try {
    // 从后端获取错误详情
    const result = await ReportDataApi.getFileValidationErrors(currentTask.value.taskId, row.fileType)
    
    errorDetailDialog.value = {
      visible: true,
      fileName: row.standardFileName || row.originalFileName,
      fileType: row.fileType,
      totalRows: result.totalRows || 0,
      errorCount: result.errorCount || 0,
      passRate: result.totalRows > 0 
        ? Math.round(((result.totalRows - result.errorCount) / result.totalRows) * 100)
        : 0,
      requiredErrors: result.requiredErrors || [],
      typeErrors: result.typeErrors || [],
      expandedGroups: ['required', 'type'],
      expandedTypes: []
    }
  } catch (error) {
    console.error('获取错误详情失败:', error)
    message.error('获取错误详情失败')
  }
}

/** 切换错误组展开/折叠 */
const toggleErrorGroup = (type: string) => {
  const index = errorDetailDialog.value.expandedGroups.indexOf(type)
  if (index > -1) {
    errorDetailDialog.value.expandedGroups.splice(index, 1)
  } else {
    errorDetailDialog.value.expandedGroups.push(type)
  }
}

/** 切换显示全部/部分 */
const toggleExpandType = (type: string) => {
  const index = errorDetailDialog.value.expandedTypes.indexOf(type)
  if (index > -1) {
    errorDetailDialog.value.expandedTypes.splice(index, 1)
  } else {
    errorDetailDialog.value.expandedTypes.push(type)
  }
}

/** 下载错误Excel */
const downloadErrorExcel = async (fileType: string) => {
  try {
    await download.excel(
      await ReportDataApi.downloadErrorExcel(currentTask.value.taskId, fileType),
      `${errorDetailDialog.value.fileName}_错误清单.xlsx`
    )
    message.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败')
  }
}

/** 修复重传 */
const retryUploadFile = (fileType: string) => {
  errorDetailDialog.value.visible = false
  // 触发文件上传
  const file = fileList.value.find(f => f.fileType === fileType)
  if (file) {
    // 这里可以触发单个文件重新上传的逻辑
    message.info('请重新选择文件上传')
  }
}

/** 关闭结果总览 */
const closeResultSummary = () => {
  uploadResult.value = null
}

/** 下载错误汇总 */
const downloadErrorSummary = async () => {
  try {
    await download.excel(
      await ReportDataApi.downloadErrorSummary(currentTask.value.taskId),
      `错误汇总_${currentTask.value.taskName}.xlsx`
    )
    message.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败')
  }
}

// ==================== 进度消息相关方法 ====================

/** 添加进度消息 */
const addProgressMessage = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', tag?: string, tagType?: 'success' | 'warning' | 'danger' | 'info') => {
  const message = {
    id: `msg_${messageIdCounter++}`,
    text,
    type,
    tag,
    tagType
  }
  
  progressMessages.value.push(message)
  
  // 保持最多显示10条消息
  if (progressMessages.value.length > 10) {
    progressMessages.value.shift()
  }
}

/** 清空进度消息 */
const clearProgressMessages = () => {
  progressMessages.value = []
  messageIdCounter = 0
}

/** 获取消息图标 */
const getMessageIcon = (type: string) => {
  const icons = {
    info: Document,
    success: CircleCheckFilled,
    warning: Warning,
    error: CircleCloseFilled
  }
  return icons[type] || Document
}

/** 获取基础错误图标 */
const getBasicErrorIcon = (errorType: string) => {
  const icons = {
    extract_failed: WarningFilled,
    type_not_recognized: InfoFilled,
    format_error: CircleCloseFilled,
    parse_failed: WarningFilled
  }
  return icons[errorType] || Warning
}

/** 获取错误图标样式类 */
const getErrorIconClass = (errorType: string): string => {
  const classes = {
    extract_failed: 'error-icon-danger',
    type_not_recognized: 'error-icon-warning',
    format_error: 'error-icon-danger',
    parse_failed: 'error-icon-danger'
  }
  return classes[errorType] || 'error-icon-warning'
}

const downloadTemplate = async () => {
  try {
    message.info('正在生成标准模板压缩包...')
    const data = await ImportTemplateApi.downloadStandardTemplatesZip()
    download.zip(data, '标准导入模板.zip')
    message.success('标准模板压缩包下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败，请重试')
  }
}

const previewTemplate = (templateId: number) => {
  // 预览模板应该在任何阶段都可用，不需要限制
  excelPreviewRef.value?.open(templateId)
}

const loadTemplateDefinitions = async () => {
  try {
    loadingTemplates.value = true
    const templates = await ImportTemplateApi.getImportTemplateListByTableType()
    const templatePromises = templates.map(async (template: any) => {
      try {
        const fields = await TemplateFieldApi.getTemplateFieldListByTemplateId(template.id)
        const requiredFields = fields.filter((field: any) => field.isRequired)
        return {
          id: template.id,
          fileName: template.templateName + '.xlsx',
          type: template.tableType,
          fieldCount: template.fieldCount || fields.length,
          downloadCount: template.downloadCount || 0,
          requiredFieldsCount: requiredFields.length,
          requiredFields: requiredFields.map((field: any) => field.fieldName),
          color: getTemplateColor(template.tableType)
        }
      } catch (error) {
        console.warn(`获取模板 ${template.id} 字段信息失败:`, error)
        return {
          id: template.id,
          name: template.templateName,
          fileName: template.templateCode + '.xlsx',
          description: template.titleText || '数据导入模板',
          fieldCount: template.fieldCount || 0,
          downloadCount: template.downloadCount || 0,
          requiredFieldsCount: 0,
          requiredFields: [],
          color: getTemplateColor(template.tableType)
        }
      }
    })
    const templateData = await Promise.all(templatePromises)
    const definitions: any = {}
    templateData.forEach((template) => {
      definitions[template.id] = template
    })
    tableDefinitions.value = definitions
  } catch (error) {
    console.error('加载模板定义失败:', error)
    message.error('加载模板信息失败，将使用默认配置')
  } finally {
    loadingTemplates.value = false
  }
}

const getTemplateColor = (tableType: string): string => {
  const colorMap: Record<string, string> = {
    hospital: '#409eff',
    catalog: '#67c23a',
    inbound: '#e6a23c',
    outbound: '#f56c6c',
    usage: '#909399'
  }
  return colorMap[tableType] || '#409eff'
}

const startUpload = async () => {
  try {
    loading.value = true
    await updateCurrentStep(1)
    currentTask.value.currentStep = 1
    currentTask.value.maxCurrentStep = 1
  } finally {
    loading.value = false
  }
}

/**
 * 开始轮询上传进度
 */
const startProgressPolling = (taskId: number) => {
  // 清除已有的轮询
  if (progressPollingInterval) {
    clearInterval(progressPollingInterval)
  }

  progressPollingInterval = setInterval(async () => {
    try {
      const result = await request.get({
        url: '/drug/report-data/upload-progress',
        params: { taskId }
      })

      // 更新进度
      uploadProgress.value = result || {}

      // 检查是否全部完成
      const hasUploading = Object.values(uploadProgress.value).some(
        (p: any) => p.status === 'uploading' || p.status === 'validating' || p.status === 'importing'
      )

      if (!hasUploading && Object.keys(uploadProgress.value).length > 0) {
        // 全部完成，停止轮询
        if (progressPollingInterval !== null) {
          clearInterval(progressPollingInterval)
          progressPollingInterval = null
        }
        isUploading.value = false
        uploadingFiles.value = []

        // 刷新文件列表
        await loadFileList(currentTask.value.taskId)
        
        // 检查是否有错误
        const hasError = Object.values(uploadProgress.value).some((p: any) => p.status === 'error')
        
        // 完成步骤1的总览
        try {
          // 计算总览数据
          const successFiles = Object.values(uploadProgress.value).filter((p: any) => p.status === 'success').length
          const totalFiles = Object.keys(uploadProgress.value).length
          const totalRows = Object.values(uploadProgress.value).reduce((sum: number, p: any) => sum + (p.totalRows || 0), 0)
          
          // 先更新总览数据
          await ReportStepSummaryApi.createOrUpdateStepSummary({
            taskId: currentTask.value.taskId,
            stepType: 1,
            status: hasError ? 2 : 1, // 1=成功, 2=部分失败
            totalFiles,
            successFiles,
            failedFiles: totalFiles - successFiles,
            totalRecords: totalRows,
            summaryData: JSON.stringify({
              totalFiles,
              successFiles,
              errorFiles: totalFiles - successFiles,
              totalRows,
              hasError
            })
          })
          
          // 重新加载总览
          await loadStepSummary()
        } catch (error) {
          console.error('完成上传总览失败:', error)
        }
        
        if (hasError) {
          message.warning('部分文件处理失败，请查看详情')
        } else {
          message.success('文件处理完成')
        }
      }
    } catch (error) {
      console.error('轮询进度失败:', error)
    }
  }, 1000) // 每秒轮询一次
}

/**
 * 停止轮询
 */
const stopProgressPolling = () => {
  if (progressPollingInterval !== null) {
    clearInterval(progressPollingInterval)
    progressPollingInterval = null
  }
}

/**
 * 获取进度条状态
 */
const getProgressStatus = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'error') return 'exception'
  return undefined // 处理中
}

/**
 * 获取进度标签类型
 */
const getProgressTagType = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'error') return 'danger'
  if (status === 'validating') return 'warning'
  if (status === 'importing') return 'primary'
  return 'info'
}

/**
 * 拖拽上传文件
 */
const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw
  if (!file) return

  try {
    isUploading.value = true
    const fileName = file.name
    const isZip = fileName.toLowerCase().endsWith('.zip')

    message.info('正在上传文件，请稍候...')

    // 提交文件（异步处理，不等待完成）
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', currentTask.value.taskId)

    await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    message.success(isZip ? '压缩包已提交，正在处理...' : '文件已提交，正在处理...')

    // 立即开始轮询进度
    startProgressPolling(currentTask.value.taskId)
  } catch (error) {
    console.error('文件上传失败:', error)
    message.error('文件上传失败，请重试')
    isUploading.value = false
  }
}

/**
 * 操作列单文件上传
 */
const handleSingleFileUpload = async (uploadFile: any, row: any) => {
  const file = uploadFile.raw
  if (!file) return

  const fileType = row.fileType
  const displayName = row.standardFileName || row.fileName
  
  try {
    // 添加到上传中列表
    if (!uploadingFiles.value.includes(fileType)) {
      uploadingFiles.value.push(fileType)
    }

    message.info(`正在上传${displayName}...`)

    // 提交文件（异步处理，不等待完成）
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', currentTask.value.taskId)
    formData.append('fileType', fileType)

    await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    message.success(`${displayName}已提交，正在处理...`)

    // 如果还没有轮询，开始轮询
    if (!progressPollingInterval) {
      startProgressPolling(currentTask.value.taskId)
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    message.error(`${displayName}上传失败，请重试`)
    
    // 从上传中列表移除
    const index = uploadingFiles.value.indexOf(fileType)
    if (index > -1) {
      uploadingFiles.value.splice(index, 1)
    }
  }
}

const viewFileData = async (file: any) => {
  excelDetailTotal.value = 0
  queryParams.value.pageNo = 1
  activeFile.value = file
  getExcelDetailData()
}

const getExcelDetailData = async () => {
  const file = activeFile.value
  dataViewDialog.value.loading = true
  dataViewDialog.value.fileName = file.originalFileName || file.standardFileName || file.fileName
  dataViewDialog.value.visible = true
  try {
    const result = await ReportDataApi.getFileData(
      file.fileType,
      file.taskId,
      file.id,
      queryParams.value.pageNo,
      queryParams.value.pageSize
    )
    if (result?.total) {
      excelDetailTotal.value = result.total
      const list = result.list
      list.forEach((item, index) => {
        item.orderNo = (queryParams.value.pageNo - 1) * queryParams.value.pageSize + index + 1
      })
      dataViewDialog.value.data = list
    } else {
      dataViewDialog.value.data = []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    message.error('加载数据失败')
  } finally {
    dataViewDialog.value.loading = false
  }
}

const removeFile = (file: any) => {
  message.confirm(`确定删除文件 ${file.name}？`).then(async () => {
    try {
      await ReportDataApi.deleteFile(file.id)
      message.success('文件已删除')
      file.status = 0
      file.size = 0
      file.recordCount = 0
    } catch (error) {
      console.error('删除文件失败:', error)
      message.error('删除文件失败')
    }
  })
}

const updateReportProgress = async (progress: number) => {
  if (!currentTask.value.taskId) {
    console.warn('任务ID不存在，无法更新上报进度')
    return
  }
  try {
    await ReportDataApi.updateReportProgress(currentTask.value.taskId, progress)
  } catch (error) {
    console.error('更新上报进度失败:', error)
  }
}

const updateCurrentStep = async (step: number) => {
  if (!currentTask.value.taskId) {
    console.warn('任务ID不存在，无法更新当前步骤')
    return
  }
  try {
    await ReportDataApi.updateCurrentStep(currentTask.value.taskId, step)
  } catch (error) {
    console.error('更新当前步骤失败:', error)
  }
}

const startPreQC = async () => {
  message.info('正在进行前置质控...')
  if (currentTask.value.maxCurrentStep === 1) {
    loading.value = true
    try {
      await updateCurrentStep(2)
      currentTask.value.currentStep = 2
      currentTask.value.maxCurrentStep = 2
      await operateQCResults(currentTask.value.taskId)
      await loadQCResults(currentTask.value.taskId)
    } catch (error) {
      console.error('前置质控失败:', error)
      message.error('前置质控失败，请重试')
    } finally {
      loading.value = false
    }
  } else {
    loading.value = true
    try {
      await operateQCResults(currentTask.value.taskId)
      currentTask.value.currentStep = 2
      await loadQCResults(currentTask.value.taskId)
    } catch (error) {
      console.error('前置质控失败:', error)
      message.error('前置质控失败，请重试')
    } finally {
      loading.value = false
    }
  }
}

const viewQCErrors = async (row: any) => {
  if (row.qcStatus !== 4 || currentStep.value < currentTask.value.maxCurrentStep) {
    return
  }
  try {
    const data = await ReportDataApi.getQCErrors(currentTask.value.taskId, row.fileType)
    errorDialog.value.errors = data.errors
      ?.map((item) => `第${item.excelRowNum}行: ${item.errorMessage}`)
      ?.join('\n')
    errorDialog.value.fileName = row.originalFileName || row.standardFileName || row.fileName
    errorDialog.value.visible = true
  } catch (error) {
    console.error('获取错误详情失败:', error)
    message.error('获取错误详情失败')
    errorDialog.value.errors = []
  }
}

const fixAndReupload = (row: any) => {
  message.info(`请修正 ${row.originalFileName || row.standardFileName || row.fileName} 的错误后重新上传`)
  currentTask.value.currentStep = 1
}

const backToUpload = async () => {
  currentTask.value.currentStep = 1
}

const startSubmitReport = async () => {
  currentTask.value.currentStep = 3
  currentTask.value.maxCurrentStep = 3
  await updateCurrentStep(3)

  // 填充提交信息
  submitInfo.value = {
    taskName: currentTask.value.taskName,
    startDate: currentTask.value.startDate,
    endDate: currentTask.value.endDate,
    reportTime: new Date().toISOString()
  }
}

const submitReport = async () => {
  let fileIds = selectedFileIds.value
  if (preQCResult.value.passed) {
    fileIds = preQCResult.value.details.map((item) => item.id)
  }
  if (!fileIds.length) {
    message.warning('请选择需要提交的文件')
    return
  }
  try {
    await message.confirm(
      '数据上报提交后将无法修改，请确认所有信息无误后再提交。提交后系统将自动进行最终审核！'
    )
    loading.value = true
    await ReportDataApi.submitReport(currentTask.value.taskId, fileIds)
    message.success('数据已成功提交上报')
    // 提交成功后自动跳转到列表页并刷新
    setTimeout(() => {
      router.push({
        name: 'DrugReportSubmission',
        params: { refresh: Date.now() }
      })
    }, 1500)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交上报失败:', error)
      message.error('提交上报失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadTemplateDefinitions()
  loadCurrentTask()
})

onActivated(() => {
  // 当页面从 keep-alive 缓存中激活时重新加载任务数据
  // 这样从列表页返回再进入时会刷新数据
  loadCurrentTask()
})

onUnmounted(() => {
  // 组件销毁时停止轮询
  stopProgressPolling()
})

// ==================== 数据加载方法 ====================
const loadCurrentTask = async () => {
  try {
    loading.value = true
    if (!currentTask.value.taskId) {
      message.warning('任务ID不存在')
      return
    }
    const task = await ReportDataApi.getCurrentActiveTask(currentTask.value.taskId)
    if (task) {
      // 确保 maxCurrentStep 和 currentStep 都有值
      task.maxCurrentStep = task.maxCurrentStep ?? task.currentStep ?? 0
      task.currentStep = task.currentStep ?? 0
      currentTask.value = task
      if (task.taskId || currentTask.value.taskId) {
        const taskId = task.taskId || currentTask.value.taskId
        // 始终加载文件列表
        await loadFileList(taskId)
        if (currentStep.value >= 2) {
          await loadQCResults(taskId)
        }
        if (currentStep.value >= 3) {
          submitInfo.value = {
            taskName: task.taskName,
            startDate: task.startDate,
            endDate: task.endDate,
            reportTime: task.reportTime
          }
        }
      }
    } else {
      message.warning('当前没有激活的上报任务，请联系管理员')
    }
  } catch (error) {
    console.error('加载任务信息失败:', error)
    message.error('加载任务信息失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

const loadFileList = async (taskId: number) => {
  try {
    const files = await ReportDataApi.getFileList(taskId)
    // 完全使用后端返回的数据
    fileList.value = files.map((file: any) => ({
      id: file.id,
      taskId: taskId,
      fileName: file.fileName,
      standardFileName: file.standardFileName,
      originalFileName: file.originalFileName,
      fileType: file.fileType,
      uploadStatus: file.uploadStatus,
      qcStatus: file.qcStatus,
      fileSize: file.fileSize,
      fileFormat: file.fileFormat,
      recordCount: file.recordCount,
      errorCount: file.errorCount,
      warningCount: file.warningCount
    }))
  } catch (error) {
    console.error('加载文件列表失败:', error)
  }
}

// 刷新文件列表
const refreshFileList = async () => {
  if (!currentTask.value.taskId) {
    message.warning('任务ID不存在')
    return
  }
  try {
    refreshingFileList.value = true
    await loadFileList(currentTask.value.taskId)
    message.success('文件列表已刷新')
  } catch (error) {
    console.error('刷新文件列表失败:', error)
    message.error('刷新文件列表失败')
  } finally {
    refreshingFileList.value = false
  }
}

async function operateQCResults(taskId: number) {
  try {
    await ReportDataApi.executePreQC(taskId)
  } catch (error) {
    console.error('执行前置质控失败:', error)
  }
}

const loadQCResults = async (taskId: number) => {
  try {
    if (currentStep.value >= 2) {
      const files = await ReportDataApi.getFileList(taskId)
      preQCResult.value.passed = !files.find((item) => [0, 1, 4, null].includes(item.qcStatus))
      // 完全使用后端返回的数据
      preQCResult.value.details = files.map((file: any) => ({
        id: file.id,
        taskId: taskId,
        fileName: file.fileName,
        standardFileName: file.standardFileName,
        originalFileName: file.originalFileName,
        fileType: file.fileType,
        uploadStatus: file.uploadStatus,
        qcStatus: file.qcStatus,
        fileSize: file.fileSize,
        fileFormat: file.fileFormat,
        recordCount: file.recordCount,
        errorCount: file.errorCount,
        warningCount: file.warningCount
      }))
    }
  } catch (error) {
    console.error('加载质控结果失败:', error)
  }
}

// ==================== 步骤总览相关方法 ====================

const stepSummaryKey = ref(0)

const loadStepSummary = async () => {
  // 通过改变key强制刷新组件
  stepSummaryKey.value++
}

const handleSummaryClose = async () => {
  try {
    await ReportStepSummaryApi.closeStepSummary(
      currentTask.value.taskId,
      currentTask.value.currentStep
    )
    message.success('总览已关闭')
    stepSummaryKey.value++ // 刷新组件以隐藏总览
  } catch (error) {
    console.error('关闭总览失败:', error)
    message.error('关闭总览失败')
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  min-height: 100vh;
}

/* 步骤条卡片样式优化 */
.progress-card {
  margin-bottom: 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 0;
  overflow: hidden;
  position: sticky;
  top: 20px;
  z-index: 1;
  transition: all 0.3s ease;
  /* backdrop-filter 会创建新的层叠上下文，移除以避免覆盖抽屉 */
}

/* 增加滚动时的阴影效果 */
.progress-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.progress-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.back-button {
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-button:hover {
  color: #667eea;
  background: #f3f4f6;
  border-color: #667eea;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.back-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.back-button:hover .back-icon {
  transform: translateX(-2px);
}

.header-divider {
  width: 1px;
  height: 24px;
  background: linear-gradient(to bottom, transparent, #d1d5db, transparent);
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  line-height: 1;
}

.step-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.step-label {
  font-size: 15px;
  font-weight: 700;
  color: #667eea;
}

.step-divider {
  font-size: 14px;
  color: #d1d5db;
  font-weight: 400;
}

.step-total {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

:deep(.progress-card .el-card__body) {
  padding: 32px 24px;
}

/* 步骤条图标和文本样式优化 */
:deep(.el-step__icon) {
  border-radius: 50% !important;
  width: 48px;
  height: 48px;
  font-size: 18px;
  border-width: 3px;
}

:deep(.el-step__title) {
  font-size: 15px;
  font-weight: 600;
}

:deep(.el-step__line) {
  background: #e5e7eb;
}

/* 可点击的步骤样式 */
:deep(.step-clickable) {
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

:deep(.step-clickable .el-step__icon) {
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50% !important;
}

:deep(.step-clickable .el-step__title) {
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 可点击步骤的 hover 效果 - 增强版 */
:deep(.step-clickable:hover .el-step__icon) {
  transform: scale(1.2) translateY(-3px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4), 0 2px 6px rgba(64, 158, 255, 0.2);
  filter: brightness(1.1);
}

:deep(.step-clickable:hover .el-step__title) {
  color: #409eff !important;
  font-weight: 600;
  transform: translateY(-2px);
}

:deep(.step-clickable:hover .el-step__description) {
  color: #409eff !important;
}

/* 已完成的可点击步骤 hover 效果 - 增强版 */
:deep(.step-clickable.is-finish:hover .el-step__icon) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border-color: #667eea !important;
  border-radius: 50% !important;
  animation: pulse 0.6s ease-in-out;
}

:deep(.step-clickable.is-finish:hover .el-step__icon .el-icon) {
  color: #ffffff !important;
  transform: scale(1.1);
}

/* 已完成步骤的默认样式 */
:deep(.el-step.is-finish .el-step__icon) {
  background: #10b981;
  border-color: #10b981;
}

:deep(.el-step.is-finish .el-step__icon .el-icon) {
  color: #ffffff !important;
}

:deep(.el-step.is-finish .el-step__title) {
  color: #047857;
}

:deep(.el-step.is-finish .el-step__line) {
  background: #10b981;
}

/* 可点击步骤在非hover状态下添加微妙提示 */
:deep(.step-clickable .el-step__icon) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  border-radius: 50% !important;
}

:deep(.step-clickable.is-finish .el-step__icon) {
  position: relative;
  border-radius: 50% !important;
}

:deep(.step-clickable.is-finish .el-step__icon::after) {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  border: 2px solid #ffffff;
  animation: blink 2s ease-in-out infinite;
}

/* 当前激活的步骤样式增强 */
:deep(.el-step.is-process .el-step__icon) {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50% !important;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  animation: breathe 2s ease-in-out infinite;
}

:deep(.el-step.is-process .el-step__icon .el-icon) {
  color: #ffffff !important;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1.2) translateY(-3px);
  }
  50% {
    transform: scale(1.25) translateY(-4px);
  }
}

@keyframes breathe {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.15);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.content-card {
  min-height: 400px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;
  transition: all 0.3s ease;
}

.step-content {
  padding: 20px 0;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header-with-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
  gap: 20px;
}

.step-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  flex-shrink: 0;
  position: relative;
  padding-left: 16px;
}

.step-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.upload-progress-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 550px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.progress-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.progress-percent {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  min-width: 50px;
  text-align: right;
}

.progress-percent.complete {
  color: #67c23a;
}

/* 准备阶段样式 */
.prepare-section {
  max-width: 800px;
  margin: 0 auto;
}

.prepare-actions {
  margin-top: 32px;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.prepare-actions .el-button {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.prepare-actions .el-button:not(.el-button--primary) {
  border: 2px solid #e4e7ed;
  background: #ffffff;
}

.prepare-actions .el-button:not(.el-button--primary):hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.prepare-actions .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.prepare-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 文件要求区域优化样式 */
.requirements-section {
  width: 100%;
}

.requirements-content {
  text-align: center;
  padding: 20px;
  width: 100%;
  margin: 0 auto;
}

.requirements-header {
  margin-bottom: 32px;
  text-align: center;
}

.requirements-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 12px 0;
}

.requirements-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  margin-top: 8px;
}

.file-list-container {
  margin: 24px -20px;
  padding: 0 20px 8px 20px;
  overflow-x: auto;
  overflow-y: hidden;
}

.file-list-container::-webkit-scrollbar {
  height: 8px;
}

.file-list-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.file-grid {
  display: flex;
  gap: 16px;
  width: max-content;
  min-width: 100%;
  padding: 0 16px;
}

.file-card {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
  width: 240px;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.file-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--file-color, #409eff) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-card:hover::before {
  opacity: 1;
}

.file-card:hover {
  border-color: var(--file-color, #409eff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.file-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.file-card-icon {
  font-size: 24px;
  margin-right: 12px;
}

.file-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.file-card-content {
  text-align: left;
}

.file-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 8px;
}

.file-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.field-count,
.required-fields,
.download-count {
  font-size: 11px;
  color: #666;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.required-fields {
  background: #fef0f0;
  color: #f56c6c;
}

.download-count {
  background: #e6f7ff;
  color: #1890ff;
}

.requirements-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  width: 100%;
  margin-top: 32px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #4b5563;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.tip-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateX(4px);
}

.tip-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.tip-icon.success {
  color: #10b981;
}

.tip-icon.warning {
  color: #f59e0b;
}

.tip-icon.info {
  color: #667eea;
}

/* 上传区域样式 */
.upload-section {
  max-width: 100%;
}

/* 表格标题栏样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 20px 0 16px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.header-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 500px;
}

.header-progress .progress-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.header-progress .progress-bar {
  flex: 1;
  min-width: 200px;
}

.header-progress .progress-count {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
  white-space: nowrap;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.batch-upload {
  margin-bottom: 24px;
}

:deep(.upload-dragger) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 48px;
  border-radius: 16px;
  border: 3px dashed #d1d5db;
  background: linear-gradient(135deg, #fafbfc 0%, #f3f4f6 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  transform: translateY(-2px);
}

:deep(.el-icon--upload) {
  font-size: 56px;
  color: #667eea;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

:deep(.el-upload-dragger:hover .el-icon--upload) {
  transform: scale(1.1);
}

:deep(.el-upload__text) {
  font-size: 16px;
  color: #4b5563;
  font-weight: 500;
}

:deep(.el-upload__text em) {
  color: #667eea;
  font-weight: 600;
  font-style: normal;
}

.upload-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.upload-actions .el-button,
.qc-actions .el-button {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.upload-actions .el-button:not(.el-button--primary),
.qc-actions .el-button:not(.el-button--primary):not(.el-button--success) {
  border: 2px solid #e4e7ed;
  background: #ffffff;
}

.upload-actions .el-button:not(.el-button--primary):hover,
.qc-actions .el-button:not(.el-button--primary):not(.el-button--success):hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.upload-actions .el-button--primary,
.qc-actions .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.upload-actions .el-button--primary:hover,
.qc-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.qc-actions .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.qc-actions .el-button--success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.record-count {
  font-weight: 700;
  color: #667eea;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.error-count {
  color: #dc2626;
  font-weight: 700;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.text-info {
  color: #6b7280;
}

.inline-upload {
  display: inline-block;
}

/* 质控区域样式 */
.qc-section {
  max-width: 100%;
}

.qc-summary {
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 32px;
  border-radius: 16px;
  border: 2px solid;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%);
  z-index: 0;
}

.summary-card > * {
  position: relative;
  z-index: 1;
}

.summary-card.success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
}

.summary-card.warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
}

.summary-icon {
  font-size: 56px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.summary-card.success .summary-icon {
  color: #10b981;
}

.summary-card.warning .summary-icon {
  color: #f59e0b;
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.summary-card.success .summary-title {
  color: #047857;
}

.summary-card.warning .summary-title {
  color: #d97706;
}

.summary-desc {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
}

.qc-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 提交区域样式 */
.submit-section {
  max-width: 100%;
  padding: 0;
}

.submit-info {
  margin: 20px 0;
}

.dialog-page {
  overflow: hidden;
  padding-top: 0;
}

/* 质检详情样式优化 */
.quality-details {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fca5a5;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.quality-details::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-icon {
  font-size: 40px;
  color: #ef4444;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.detail-header h4 {
  color: #991b1b;
  font-size: 18px;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.quality-details-content {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.8;
}

.detail-item {
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.6);
  padding: 12px 16px;
  border-radius: 10px;
}

.detail-label {
  font-weight: 700;
  color: #1f2937;
  display: inline-block;
  min-width: 100px;
}

.error-messages {
  display: inline-block;
  color: #dc2626;
  white-space: pre-wrap;
  word-break: break-all;
  font-weight: 500;
  line-height: 1.8;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.el-table th.el-table__cell) {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  color: #1a202c;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.el-table .el-table__row) {
  transition: all 0.3s ease;
}

:deep(.el-table .el-table__row:hover) {
  background: #f9fafb !important;
  transform: scale(1.001);
}

:deep(.el-table .el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-table .el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.el-table .el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.el-table .el-button--danger) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
}

:deep(.el-table .el-button--danger:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

:deep(.el-table .el-button--warning) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
}

:deep(.el-table .el-button--warning:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* 进度条样式优化 */
:deep(.el-progress) {
  line-height: 1;
}

:deep(.el-progress__text) {
  font-weight: 700;
  font-size: 14px !important;
}

:deep(.el-progress-bar__outer) {
  background: #e5e7eb;
  border-radius: 10px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 10px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-progress.is-success .el-progress-bar__inner) {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%) !important;
}

/* Dialog 样式优化 */
:deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
}

:deep(.el-dialog__headerbtn .el-dialog__close:hover) {
  color: #ffffff;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 16px;
  }

  .progress-card {
    top: 16px;
  }

  .progress-card-header {
    padding: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left {
    width: 100%;
    gap: 12px;
  }

  .back-button {
    padding: 8px 12px;
    font-size: 13px;
  }

  .back-icon {
    font-size: 14px;
  }

  .header-divider {
    height: 20px;
  }

  .page-title {
    font-size: 16px;
  }

  .step-info {
    padding: 6px 12px;
    gap: 6px;
  }

  .step-label {
    font-size: 14px;
  }

  .step-divider {
    font-size: 13px;
  }

  .step-total {
    font-size: 13px;
  }

  :deep(.progress-card .el-card__body) {
    padding: 24px 16px;
  }

  .content-card {
    padding: 20px;
  }

  .step-header-with-progress {
    flex-direction: column;
    align-items: flex-start;
  }

  .upload-progress-inline {
    width: 100%;
    max-width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .progress-info {
    justify-content: space-between;
    width: 100%;
  }

  .upload-progress-inline .el-progress {
    width: 100% !important;
  }

  .prepare-actions,
  .upload-actions,
  .qc-actions {
    flex-direction: column;
  }

  .file-list-container {
    margin: 16px -16px;
    padding: 0 16px 8px 16px;
  }

  .file-grid {
    padding: 0;
  }

  .file-card {
    width: 220px;
  }

  :deep(.el-descriptions .el-descriptions__body) {
    display: block;
  }
  
  :deep(.el-descriptions .el-descriptions__item) {
    display: block;
    width: 100% !important;
  }
}

@media (min-width: 1200px) {
  .file-card {
    width: 260px;
  }
}

/* 轻量级禁用状态增强 - 配合全局样式 */
:deep(.el-button.is-disabled),
:deep(.el-button:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(50%);
}

/* 确保禁用按钮不响应 hover 动画 */
:deep(.el-button.is-disabled:hover),
:deep(.el-button:disabled:hover) {
  transform: none !important;
}

/* 表格中禁用按钮移除动画效果 */
:deep(.el-table .el-button.is-disabled:hover),
:deep(.el-table .el-button:disabled:hover) {
  box-shadow: none !important;
}

/* 确保 tooltip 包裹的 span 正确显示 */
.upload-actions .el-tooltip__trigger {
  display: inline-block;
}

/* 上传进度样式 */
.progress-wrapper {
  padding: 5px 0;
}

.progress-message {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  text-align: center;
}

/* 行内上传组件样式 */
.inline-upload {
  display: inline-block;
}

:deep(.inline-upload .el-upload) {
  display: inline-block;
}

/* 拖拽区上传进度显示 */
.upload-progress-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 30px;
  background-color: #fafafa;
}

.upload-progress-area .progress-header {
  margin-bottom: 24px;
}

.upload-progress-area .progress-header h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.upload-progress-area .progress-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.upload-progress-area .file-progress-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.upload-progress-area .file-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.upload-progress-area .file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.upload-progress-area .file-errors {
  margin-top: 12px;
}

.upload-progress-area .error-list {
  margin-top: 8px;
  font-size: 12px;
}

.upload-progress-area .error-item {
  padding: 4px 0;
  color: #f56c6c;
}

.upload-progress-area .more-errors {
  padding: 4px 0;
  color: #909399;
  font-style: italic;
}

/* 拖拽区禁用提示 */
.upload-tip {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #e6a23c;
  font-size: 14px;
}

:deep(.upload-dragger.is-disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 拖拽区域内的进度显示样式 */
.upload-progress-inline-area {
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.progress-header-inline .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-header-inline .processing-icon {
  font-size: 24px;
  color: #667eea;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-header-inline h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.progress-header-inline .header-right .file-count {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid #667eea;
}

.progress-bar-wrapper {
  width: 100%;
  padding: 0 10px;
}

.progress-bar-wrapper :deep(.el-progress__text) {
  font-size: 16px !important;
  font-weight: 700;
  color: #667eea;
}

.current-processing-tips {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 10px;
}

.latest-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 12px;
  border: 2px solid #d1d5db;
  min-width: 300px;
  max-width: 600px;
  transition: all 0.3s ease;
  animation: pulse-message 2s ease-in-out infinite;
}

@keyframes pulse-message {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  }
}

.latest-message .message-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.latest-message .message-icon.info {
  color: #409eff;
}

.latest-message .message-icon.success {
  color: #67c23a;
}

.latest-message .message-icon.warning {
  color: #e6a23c;
}

.latest-message .message-icon.error {
  color: #f56c6c;
}

.latest-message .message-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  flex: 1;
}

/* 上传中时拖拽区域的背景样式 */
.upload-disabled :deep(.el-upload-dragger) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-color: #adb5bd;
  cursor: not-allowed;
}

/* 拖拽区上传中提示 */
.upload-processing-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}

.upload-processing-hint .processing-icon-large {
  font-size: 64px;
  color: #909399;
  animation: spin 2s linear infinite;
}

.upload-processing-hint .processing-text {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 上传进度详情区域（拖拽区下方） */
.upload-progress-detail {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
}

.upload-progress-detail .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.2);
}

.upload-progress-detail .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-progress-detail .processing-icon {
  font-size: 20px;
  color: #0ea5e9;
  animation: spin 2s linear infinite;
}

.upload-progress-detail .phase-text {
  font-size: 16px;
  color: #0c4a6e;
  font-weight: 600;
}

.upload-progress-detail .header-right {
  display: flex;
  align-items: center;
}

.upload-progress-detail .file-count-text {
  font-size: 14px;
  color: #0284c7;
  font-weight: 600;
  background: rgba(14, 165, 233, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

/* 文件进度列表 */
.files-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-progress-item {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e0f2fe;
  transition: all 0.3s ease;
}

.file-progress-item:hover {
  border-color: #7dd3fc;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
}

.file-progress-item .file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-progress-item .file-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
