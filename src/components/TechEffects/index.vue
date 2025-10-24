<!-- 科技感演示组件 - 可在各页面中使用的特效组件 -->
<template>
  <div class="tech-effects-showcase">
    <!-- 光晕按钮展示 -->
    <div class="effect-section">
      <h3 class="section-title">科技感按钮</h3>
      <div class="buttons-container">
        <button class="tech-btn primary">主要按钮</button>
        <button class="tech-btn secondary">次要按钮</button>
        <button class="tech-btn ghost">幽灵按钮</button>
        <button class="tech-btn pulse">脉冲按钮</button>
      </div>
    </div>

    <!-- 毛玻璃卡片展示 -->
    <div class="effect-section">
      <h3 class="section-title">毛玻璃卡片</h3>
      <div class="cards-container">
        <div class="glass-card">
          <div class="card-header">
            <div class="card-icon">📊</div>
            <h4>数据统计</h4>
          </div>
          <div class="card-content">
            <div class="stat-number">1,234</div>
            <div class="stat-label">总记录数</div>
          </div>
        </div>

        <div class="glass-card">
          <div class="card-header">
            <div class="card-icon">⚡</div>
            <h4>处理速度</h4>
          </div>
          <div class="card-content">
            <div class="stat-number">98.5%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>

        <div class="glass-card floating">
          <div class="card-header">
            <div class="card-icon">🚀</div>
            <h4>性能指标</h4>
          </div>
          <div class="card-content">
            <div class="stat-number">2.3s</div>
            <div class="stat-label">响应时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 科技边框效果 -->
    <div class="effect-section">
      <h3 class="section-title">科技边框</h3>
      <div class="borders-container">
        <div class="tech-border-box">
          <div class="border-content">
            <h4>动态边框</h4>
            <p>悬停查看效果</p>
          </div>
        </div>

        <div class="neon-border-box">
          <div class="border-content">
            <h4>霓虹边框</h4>
            <p>持续发光效果</p>
          </div>
        </div>

        <div class="scan-border-box">
          <div class="border-content">
            <h4>扫描边框</h4>
            <p>扫描线动效</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据流效果 */
    <div class="effect-section">
      <h3 class="section-title">数据流动画</h3>
      <div class="data-flow-container">
        <div class="data-stream">
          <div class="stream-line"></div>
          <div class="stream-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 粒子背景效果 -->
    <div class="effect-section">
      <h3 class="section-title">粒子背景</h3>
      <div class="particle-container">
        <div class="particle" v-for="i in 20" :key="i" :style="getParticleStyle(i)"></div>
        <div class="particle-content">
          <h4>科技感背景</h4>
          <p>动态粒子效果</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'TechEffectsShowcase' })

// 生成随机粒子样式
const getParticleStyle = (index: number) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = Math.random() * 10 + 10

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}
</script>

<style lang="scss" scoped>
.tech-effects-showcase {
  padding: 32px;
  background: var(--tech-dark-bg);
  min-height: 100vh;
  color: #e2e8f0;
}

.effect-section {
  margin-bottom: 48px;

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 24px;
    background: var(--tech-gradient-secondary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 60px;
      height: 3px;
      background: var(--tech-gradient-secondary);
      border-radius: 2px;
    }
  }
}

/* 科技感按钮样式 */
.buttons-container {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.tech-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: var(--tech-transition);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  &.primary {
    background: var(--tech-gradient-secondary);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--tech-primary);
    border: 1px solid var(--tech-primary);

    &:hover {
      background: rgba(0, 212, 255, 0.1);
      transform: translateY(-2px);
    }
  }

  &.ghost {
    background: transparent;
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
      border-color: var(--tech-primary);
    }
  }

  &.pulse {
    background: var(--tech-gradient-primary);
    color: white;
    animation: pulse-glow 2s ease-in-out infinite;

    &:hover {
      animation-duration: 1s;
    }
  }
}

/* 毛玻璃卡片样式 */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  transition: var(--tech-transition);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--tech-gradient-secondary);
  }

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  &.floating {
    animation: float 6s ease-in-out infinite;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .card-icon {
      font-size: 2rem;
      filter: drop-shadow(0 0 10px var(--tech-primary));
    }

    h4 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #e2e8f0;
    }
  }

  .card-content {
    text-align: center;

    .stat-number {
      font-size: 2.5rem;
      font-weight: 800;
      background: var(--tech-gradient-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }

    .stat-label {
      color: #94a3b8;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }
}

/* 科技边框效果 */
.borders-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.tech-border-box {
  position: relative;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  transition: var(--tech-transition);

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: var(--tech-gradient-secondary);
    border-radius: 12px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }

  .border-content {
    position: relative;
    z-index: 1;

    h4 {
      margin: 0 0 8px 0;
      color: #e2e8f0;
    }

    p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  }
}

.neon-border-box {
  position: relative;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 2px solid var(--tech-primary);
  box-shadow:
    var(--tech-glow-primary),
    inset 0 0 20px rgba(0, 212, 255, 0.1);
  animation: neon-pulse 2s ease-in-out infinite alternate;

  .border-content {
    h4 {
      margin: 0 0 8px 0;
      color: #e2e8f0;
    }

    p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  }
}

.scan-border-box {
  position: relative;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: var(--tech-gradient-secondary);
    animation: scan-line 3s linear infinite;
  }

  .border-content {
    h4 {
      margin: 0 0 8px 0;
      color: #e2e8f0;
    }

    p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  }
}

/* 数据流效果 */
.data-flow-container {
  height: 120px;
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.data-stream {
  position: relative;
  width: 100%;
  height: 100%;

  .stream-line {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--tech-primary), transparent);
    transform: translateY(-50%);
  }

  .stream-dots {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    justify-content: space-around;

    .dot {
      width: 8px;
      height: 8px;
      background: var(--tech-primary);
      border-radius: 50%;
      animation: data-flow 2s linear infinite;

      &:nth-child(2) { animation-delay: 0.4s; }
      &:nth-child(3) { animation-delay: 0.8s; }
      &:nth-child(4) { animation-delay: 1.2s; }
      &:nth-child(5) { animation-delay: 1.6s; }
    }
  }
}

/* 粒子背景效果 */
.particle-container {
  position: relative;
  height: 200px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .particle {
    position: absolute;
    background: var(--tech-primary);
    border-radius: 50%;
    animation: particle-float linear infinite;
    opacity: 0.6;
    box-shadow: 0 0 6px var(--tech-primary);
  }

  .particle-content {
    position: relative;
    z-index: 10;
    text-align: center;

    h4 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
      color: #e2e8f0;
    }

    p {
      margin: 0;
      color: #94a3b8;
    }
  }
}

/* 动画定义 */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px var(--tech-primary);
  }
  50% {
    box-shadow: 0 0 20px var(--tech-primary), 0 0 30px var(--tech-primary);
  }
}

@keyframes neon-pulse {
  0% {
    box-shadow:
      0 0 5px var(--tech-primary),
      0 0 10px var(--tech-primary),
      inset 0 0 20px rgba(0, 212, 255, 0.1);
  }
  100% {
    box-shadow:
      0 0 10px var(--tech-primary),
      0 0 20px var(--tech-primary),
      0 0 30px var(--tech-primary),
      inset 0 0 20px rgba(0, 212, 255, 0.2);
  }
}

@keyframes scan-line {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes data-flow {
  0% {
    transform: translateX(-20px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(20px);
    opacity: 0;
  }
}

@keyframes particle-float {
  0% {
    transform: translateY(100vh) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100px) translateX(50px);
    opacity: 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>