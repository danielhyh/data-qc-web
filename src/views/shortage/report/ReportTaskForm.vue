<template>
  <Dialog 
    :title="dialogTitle" 
    v-model="dialogVisible"
    :width="560"
    class="modern-dialog"
  >
    <!-- 骨架屏加载效果 -->
    <div v-if="formLoading && !formData.id" class="skeleton-container">
      <div class="skeleton-item" v-for="i in 5" :key="i">
        <div class="skeleton-label"></div>
        <div class="skeleton-input"></div>
      </div>
    </div>

    <!-- 表单内容 -->
    <div v-else class="form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
        class="modern-form"
        :class="{ 'form-loading': formLoading }"
      >
        <el-form-item label="填报状态" prop="reportStatus" class="form-item-modern">
          <el-radio-group 
            v-model="formData.reportStatus" 
            class="!w-full"
            :disabled="formLoading"
          >
            <el-radio-button value="0">待填报</el-radio-button>
            <el-radio-button value="1">草稿</el-radio-button>
            <el-radio-button value="2">已提交</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="填报完成度" prop="completionRate" class="form-item-modern">
          <el-input-number
            v-model="formData.completionRate"
            :min="0"
            :max="100"
            :precision="2"
            :step="1"
            controls-position="right"
            class="!w-full"
            :disabled="formLoading"
          >
            <template #suffix>
              <span class="text-gray-400">%</span>
            </template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="本周累计使用量" prop="weeklyUsage" class="form-item-modern">
          <el-input
            v-model="formData.weeklyUsage"
            placeholder="请输入本周累计使用量"
            class="!w-full"
            :disabled="formLoading"
            @input="formData.weeklyUsage = formData.weeklyUsage?.replace(/[^\d]/g, '')"
          >
            <template #suffix>
              <span class="text-gray-400">最小剂量单位</span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="当日实时库存量" prop="dailyStock" class="form-item-modern">
          <el-input
            v-model="formData.dailyStock"
            placeholder="请输入当日实时库存量"
            class="!w-full"
            :disabled="formLoading"
            @input="formData.dailyStock = formData.dailyStock?.replace(/[^\d]/g, '')"
          >
            <template #suffix>
              <span class="text-gray-400">最小剂量单位</span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="备注" prop="remark" class="form-item-modern">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息..."
            maxlength="500"
            show-word-limit
            :disabled="formLoading"
            class="modern-textarea"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button 
          @click="dialogVisible = false" 
          class="!min-w-90px"
          :disabled="formLoading"
        >
          取 消
        </el-button>
        <el-button 
          @click="submitForm" 
          type="primary" 
          :loading="formLoading"
          class="!min-w-90px"
        >
          {{ formLoading ? '提交中' : '确 定' }}
        </el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from '../../../hooks/web/useI18n'
import { useMessage } from '../../../hooks/web/useMessage'
import { ReportTaskApi, ReportTaskVO } from '../../../api/shortage/reporttask'

/** 机构填报任务 表单 */
defineOptions({ name: 'ReportTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<{
  id?: number
  reportStatus: string | undefined
  completionRate: number | undefined
  weeklyUsage: string | undefined
  dailyStock: string | undefined
  remark: string | undefined
}>({
  reportStatus: undefined,
  completionRate: undefined,
  weeklyUsage: undefined,
  dailyStock: undefined,
  remark: undefined,
})
const formRules = reactive({
  reportStatus: [{ required: true, message: '填报状态: 0-待填报 1-草稿 2-已提交不能为空', trigger: 'blur' }],
  weeklyUsage: [{ required: true, message: '请输入本周累计使用量', trigger: 'blur' }],
  dailyStock: [{ required: true, message: '请输入当日实时库存量', trigger: 'blur' }],
})
const formRef = ref() // 表单 Ref

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
      const data = await ReportTaskApi.getReportTask(id)
      formData.value = {
        ...data,
        weeklyUsage: data.weeklyUsage !== undefined ? String(data.weeklyUsage) : undefined,
        dailyStock: data.dailyStock !== undefined ? String(data.dailyStock) : undefined,
      }
    } finally {
      formLoading.value = false
    }
  }
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
    const data = {
      ...formData.value,
      weeklyUsage: formData.value.weeklyUsage ? Number(formData.value.weeklyUsage) : undefined,
      dailyStock: formData.value.dailyStock ? Number(formData.value.dailyStock) : undefined,
    } as unknown as ReportTaskVO
    if (formType.value === 'create') {
      await ReportTaskApi.createReportTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReportTaskApi.updateReportTask(data)
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
    reportStatus: undefined,
    completionRate: undefined,
    weeklyUsage: undefined,
    dailyStock: undefined,
    remark: undefined,
  }
  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
// 骨架屏容器
.skeleton-container {
  padding: 20px 0;
  animation: fadeIn 0.3s ease-in;
}

.skeleton-item {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 20px;

  .skeleton-label {
    width: 110px;
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s infinite;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .skeleton-input {
    flex: 1;
    height: 32px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s infinite;
  }

  &:nth-child(5) .skeleton-input {
    height: 80px;
  }
}

// 骨架屏动画
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 淡入动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 表单容器
.form-container {
  padding: 8px 0;
  animation: fadeIn 0.4s ease-out;
}

// 现代化表单样式
.modern-form {
  .form-item-modern {
    margin-bottom: 24px;
    transition: all 0.3s ease;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #303133;
      line-height: 32px;
    }

    :deep(.el-form-item__content) {
      line-height: 32px;
    }

    // Radio 按钮样式优化
    :deep(.el-radio-group) {
      display: flex;
      gap: 8px;

      .el-radio-button {
        flex: 1;
        
        .el-radio-button__inner {
          width: 100%;
          border-radius: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;

          &:hover {
            color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
          }
        }
      }

      .el-radio-button.is-active .el-radio-button__inner {
        background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
      }
    }

    // 输入框聚焦效果
    :deep(.el-input-number) {
      .el-input__wrapper {
        transition: all 0.3s ease;
        border-radius: 6px;

        &:hover {
          box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
        }

        &.is-focus {
          box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        }
      }
    }

    // 文本域样式
    :deep(.modern-textarea) {
      .el-textarea__inner {
        border-radius: 8px;
        transition: all 0.3s ease;
        line-height: 1.6;
        font-size: 14px;

        &:hover {
          border-color: var(--el-color-primary-light-5);
        }

        &:focus {
          box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        }
      }
    }
  }

  // 表单加载状态
  &.form-loading {
    opacity: 0.6;
    pointer-events: none;
  }
}

// 底部按钮区域
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0;
  border-top: 1px solid #f0f0f0;

  :deep(.el-button) {
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 8px 20px;
    height: 36px;

    &:not(.is-disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.el-button--primary {
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      border: none;

      &:hover {
        background: linear-gradient(135deg, var(--el-color-primary-dark-2) 0%, var(--el-color-primary) 100%);
      }
    }
  }
}

// 对话框全局样式优化
.modern-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);

    .el-dialog__header {
      padding: 20px 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-bottom: 1px solid #ebeef5;

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }

    .el-dialog__body {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;

      // 自定义滚动条
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;

        &:hover {
          background: #c0c4cc;
        }
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }

    .el-dialog__footer {
      padding: 16px 24px 20px;
      background: #fafafa;
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .modern-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto;
  }

  .modern-form {
    .form-item-modern {
      :deep(.el-form-item__label) {
        width: 90px !important;
      }
    }
  }
}
</style>
