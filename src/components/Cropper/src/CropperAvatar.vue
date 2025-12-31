<template>
  <div class="user-info-head" @click="open()">
    <el-avatar v-if="sourceValue" :src="sourceValue" alt="avatar" class="img-circle img-lg" />
    <!-- 无头像时显示姓名首字 -->
    <div v-else class="img-circle img-lg text-avatar" :style="{ background: avatarBgColor }">
      {{ avatarText }}
    </div>
    <el-button v-if="showBtn" :class="`${prefixCls}-upload-btn`" @click="open()">
      {{ btnText ? btnText : t('cropper.selectImage') }}
    </el-button>
    <CopperModal
      ref="cropperModelRef"
      :srcValue="sourceValue"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>
<script lang="ts" setup>
import { useDesign } from '@/hooks/web/useDesign'

import { propTypes } from '@/utils/propTypes'
import { useI18n } from 'vue-i18n'
import CopperModal from './CopperModal.vue'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'CropperAvatar' })

const props = defineProps({
  width: propTypes.string.def('200px'),
  value: propTypes.string.def(''),
  showBtn: propTypes.bool.def(true),
  btnText: propTypes.string.def('')
})

const userStore = useUserStore()

// 获取姓名首字作为默认头像文字
const avatarText = computed(() => {
  const realName = userStore.user.realName
  const nickname = userStore.user.nickname
  // 优先使用真实姓名的第一个字，否则使用昵称的第一个字
  const name = realName || nickname || ''
  return name.charAt(0) || '用'
})

// 根据姓名生成一个稳定的背景色
const avatarBgColor = computed(() => {
  const name = userStore.user.realName || userStore.user.nickname || ''
  // 预定义一组好看的渐变色
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ]
  // 根据姓名的字符码生成一个稳定的索引
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

const emit = defineEmits(['update:value', 'change'])
const sourceValue = ref(props.value)
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('cropper-avatar')
const message = useMessage()
const { t } = useI18n()

const cropperModelRef = ref()

watchEffect(() => {
  sourceValue.value = props.value
})

watch(
  () => sourceValue.value,
  (v: string) => {
    emit('update:value', v)
  }
)

function handleUploadSuccess({ source, data, filename }) {
  sourceValue.value = source
  emit('change', { source, data, filename })
  message.success(t('cropper.uploadSuccess'))
}

function open() {
  cropperModelRef.value.openModal()
}

function close() {
  cropperModelRef.value.closeModal()
}

defineExpose({
  open,
  close
})
</script>
<style lang="scss" scoped>
$prefix-cls: #{$namespace}--cropper-avatar;

.#{$prefix-cls} {
  display: inline-block;
  text-align: center;

  &-image-wrapper {
    overflow: hidden;
    cursor: pointer;
    border: 1px solid;
    border-radius: 50%;

    img {
      width: 100%;
    }
  }

  &-image-mask {
    position: absolute;
    width: inherit;
    height: inherit;
    cursor: pointer;
    background: rgb(0 0 0 / 40%);
    border: inherit;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.4s;

    ::v-deep(svg) {
      margin: auto;
    }
  }

  &-image-mask:hover {
    opacity: 40;
  }

  &-upload-btn {
    margin: 10px auto;
  }
}

.user-info-head {
  position: relative;
  display: inline-block;
}

.img-circle {
  border-radius: 50%;
}

.img-lg {
  width: 120px;
  height: 120px;
}

/* 文字头像样式 */
.text-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 48px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.user-info-head:hover::after {
  position: absolute;
  inset: 0;
  font-size: 24px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  line-height: 110px;
  color: #eee;
  cursor: pointer;
  background: rgb(0 0 0 / 50%);
  border-radius: 50%;
  content: '+';
}
</style>
