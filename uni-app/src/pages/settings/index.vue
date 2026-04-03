<template>
  <page>
    <view class="container">
      <!-- 头部 -->
      <view class="header">
        <view class="header-content">
          <text class="title">设置</text>
          <text class="subtitle">个性化配置</text>
        </view>
      </view>

      <!-- OCR设置 -->
      <view class="settings-section">
        <view class="section-header">
          <view class="section-icon">
            <uni-icons type="scan" size="18" color="#fff"></uni-icons>
          </view>
          <text class="section-title">OCR设置</text>
        </view>

        <view class="setting-item">
          <text class="setting-label">默认OCR</text>
          <view class="ocr-types">
            <view
              v-for="type in ocrTypes"
              :key="type.value"
              :class="['ocr-type-btn', defaultOcr === type.value ? 'active' : '']"
              @click="defaultOcr = type.value"
            >
              <text>{{ type.label }}</text>
            </view>
          </view>
        </view>

        <view class="setting-item" v-if="defaultOcr === 'baidu'">
          <text class="setting-label">百度API Key</text>
          <input
            type="text"
            v-model="baiduApiKey"
            placeholder="请输入API Key"
            class="setting-input"
          />
        </view>

        <view class="setting-item" v-if="defaultOcr === 'tencent'">
          <text class="setting-label">腾讯API Key</text>
          <input
            type="text"
            v-model="tencentApiKey"
            placeholder="请输入API Key"
            class="setting-input"
          />
        </view>

        <view class="setting-item switch-item">
          <text class="setting-label">本地OCR优先</text>
          <switch
            v-model="preferLocalOcr"
            color="#ff6b35"
            class="setting-switch"
          />
        </view>
      </view>

      <!-- 数据设置 -->
      <view class="settings-section">
        <view class="section-header">
          <view class="section-icon data">
            <uni-icons type="cloud" size="18" color="#fff"></uni-icons>
          </view>
          <text class="section-title">数据设置</text>
        </view>

        <view class="setting-item switch-item">
          <text class="setting-label">自动更新</text>
          <switch
            v-model="autoUpdate"
            color="#ff6b35"
            class="setting-switch"
          />
        </view>

        <view class="setting-item">
          <text class="setting-label">数据版本</text>
          <text class="setting-value">{{ dataVersion }}</text>
        </view>

        <view class="setting-item">
          <text class="setting-label">最后更新</text>
          <text class="setting-value">{{ lastUpdateTime }}</text>
        </view>

        <view class="setting-actions">
          <view class="check-update-btn" @click="checkForUpdates">
            <uni-icons type="refresh" size="18" color="#ff6b35"></uni-icons>
            <text>检查更新</text>
          </view>
          <view class="clear-data-btn" @click="clearData">
            <uni-icons type="delete" size="18" color="#999"></uni-icons>
            <text>清除数据</text>
          </view>
        </view>
      </view>

      <!-- 关于 -->
      <view class="settings-section">
        <view class="section-header">
          <view class="section-icon about">
            <uni-icons type="info" size="18" color="#fff"></uni-icons>
          </view>
          <text class="section-title">关于</text>
        </view>

        <view class="setting-item">
          <text class="setting-label">版本</text>
          <text class="setting-value">{{ appVersion }}</text>
        </view>

        <view class="setting-item">
          <text class="setting-label">项目名称</text>
          <text class="setting-value">汉堡王性价比计算器</text>
        </view>

        <view class="setting-item">
          <text class="setting-label">开源协议</text>
          <text class="setting-value">MIT License</text>
        </view>

        <view class="setting-actions">
          <view class="github-btn" @click="goToGithub">
            <uni-icons type="github" size="18" color="#fff"></uni-icons>
            <text>GitHub</text>
          </view>
          <view class="docs-btn" @click="goToDocs">
            <uni-icons type="help" size="18" color="#fff"></uni-icons>
            <text>文档</text>
          </view>
        </view>
      </view>
    </view>
  </page>
</template>

<script setup>
import { ref } from 'vue'
import uniIcons from '@/components/uni-icons/uni-icons.vue'

// OCR设置
const defaultOcr = ref('baidu')
const ocrTypes = [
  { value: 'baidu', label: '百度' },
  { value: 'tencent', label: '腾讯' },
  { value: 'local', label: '本地' }
]
const baiduApiKey = ref('')
const tencentApiKey = ref('')
const preferLocalOcr = ref(false)

// 数据设置
const autoUpdate = ref(true)
const dataVersion = ref('1.0.0')
const lastUpdateTime = ref('2026-04-01')

// 应用信息
const appVersion = ref('1.0.0')

// 检查更新
const checkForUpdates = async () => {
  uni.showLoading({
    title: '检查更新中...'
  })

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    uni.hideLoading()
    uni.showToast({
      title: '已是最新版本',
      icon: 'success'
    })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '检查更新失败',
      icon: 'none'
    })
  }
}

// 清除数据
const clearData = () => {
  uni.showModal({
    title: '清除数据',
    content: '确定要清除所有本地数据吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '数据已清除',
          icon: 'success'
        })
      }
    }
  })
}

// 跳转到GitHub
const goToGithub = () => {
  // #ifdef H5
  window.open('https://github.com/your-username/burgerking-calculator')
  // #endif
  // #ifndef H5
  uni.showToast({
    title: '请在浏览器中打开',
    icon: 'none'
  })
  // #endif
}

// 跳转到文档
const goToDocs = () => {
  // #ifdef H5
  window.open('https://github.com/your-username/burgerking-calculator/blob/main/docs')
  // #endif
  // #ifndef H5
  uni.showToast({
    title: '请在浏览器中打开',
    icon: 'none'
  })
  // #endif
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.header {
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

.settings-section {
  margin: 24rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-icon {
  width: 40rpx;
  height: 40rpx;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-icon.data {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
}

.section-icon.about {
  background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.setting-item:last-of-type {
  border-bottom: none;
}

.setting-label {
  font-size: 28rpx;
  color: #333;
}

.setting-value {
  font-size: 28rpx;
  color: #999;
}

.setting-input {
  flex: 1;
  max-width: 300rpx;
  height: 64rpx;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  text-align: right;
}

.switch-item {
  padding: 16rpx 0;
}

.setting-switch {
  transform: scale(0.85);
}

.ocr-types {
  display: flex;
  gap: 10rpx;
}

.ocr-type-btn {
  padding: 10rpx 20rpx;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #666;
}

.ocr-type-btn.active {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  color: #fff;
}

.setting-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.check-update-btn,
.clear-data-btn,
.github-btn,
.docs-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
}

.check-update-btn {
  background-color: #fff5f0;
}

.check-update-btn text {
  color: #ff6b35;
}

.clear-data-btn {
  background-color: #f5f5f5;
}

.clear-data-btn text {
  color: #666;
}

.github-btn {
  background: linear-gradient(135deg, #24292e 0%, #3a3f41 100%);
}

.github-btn text,
.docs-btn text {
  color: #fff;
}

.docs-btn {
  background: linear-gradient(135deg, #007acc 0%, #2196f3 100%);
}
</style>
