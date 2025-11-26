<template>
  <div class="progress-test-container">
    <el-card class="test-card">
      <h2>进度条悬停测试</h2>

      <div class="test-section">
        <h3>默认进度条</h3>
        <el-progress :percentage="50" />
      </div>

      <div class="test-section">
        <h3>带状态的进度条</h3>
        <el-progress :percentage="70" status="success" />
        <el-progress :percentage="50" status="warning" />
        <el-progress :percentage="30" status="exception" />
      </div>

      <div class="test-section">
        <h3>不同颜色的进度条</h3>
        <el-progress :percentage="60" color="#409EFF" />
        <el-progress :percentage="40" color="#67C23A" />
        <el-progress :percentage="80" color="#E6A23C" />
      </div>

      <div class="test-section">
        <h3>条纹进度条</h3>
        <el-progress :percentage="50" :striped="true" />
        <el-progress :percentage="50" :striped="true" :striped-flow="true" />
      </div>

      <div class="test-section">
        <h3>不同大小的进度条</h3>
        <el-progress :percentage="50" :stroke-width="26" />
        <el-progress :percentage="50" />
        <el-progress :percentage="50" :stroke-width="6" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // 监听进度条元素，查看悬停时的样式变化
  const progressBars = document.querySelectorAll('.el-progress-bar')
  progressBars.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      console.log('鼠标进入进度条')
      const target = e.target as HTMLElement
      const computedStyle = window.getComputedStyle(target)
      console.log('box-shadow:', computedStyle.boxShadow)
      console.log('border:', computedStyle.border)
      console.log('background:', computedStyle.background)

      // 检查子元素
      const inner = target.querySelector('.el-progress-bar__inner')
      if (inner) {
        const innerStyle = window.getComputedStyle(inner)
        console.log('内部进度条 box-shadow:', innerStyle.boxShadow)
      }

      // 检查伪元素
      const afterStyle = window.getComputedStyle(target, '::after')
      console.log('::after content:', afterStyle.content)
      console.log('::after background:', afterStyle.background)

      const beforeStyle = window.getComputedStyle(target, '::before')
      console.log('::before content:', beforeStyle.content)
      console.log('::before background:', beforeStyle.background)
    })
  })
})
</script>

<style scoped lang="scss">
.progress-test-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.test-card {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 30px;
  color: #303133;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 10px;
}

h3 {
  margin: 20px 0 15px 0;
  color: #606266;
  font-size: 16px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-progress {
  margin-bottom: 20px;
}

/* 调试样式 - 查看问题 */
.debug-mode {
  .el-progress-bar {
    position: relative;
    border: 1px solid red !important;
  }

  .el-progress-bar__inner {
    border: 1px solid blue !important;
  }
}

/* 临时修复测试 */
.fix-test {
  .el-progress-bar {
    overflow: hidden !important;
  }

  .el-progress-bar:hover::after,
  .el-progress-bar:hover::before {
    display: none !important;
  }
}
</style>