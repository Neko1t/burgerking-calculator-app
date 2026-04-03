<template>
  <page>
    <view class="container">
      <!-- 头部 -->
      <view class="header">
        <view class="header-content">
          <view class="back-btn" @click="goBack">
            <uni-icons type="arrow-left" size="20" color="#fff"></uni-icons>
          </view>
          <view class="header-title">
            <text class="title">推荐套餐</text>
            <text class="subtitle">为您找到最划算的搭配</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading" v-if="loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在计算...</text>
      </view>

      <!-- 结果列表 -->
      <scroll-view class="results-scroll" scroll-y v-else>
        <view class="results">
          <!-- 精确匹配 -->
          <view class="result-section" v-if="exactMatches.length > 0">
            <view class="section-header">
              <view class="section-title-wrapper">
                <view class="section-icon exact">
                  <uni-icons type="location-filled" size="16" color="#fff"></uni-icons>
                </view>
                <text class="section-title">精确匹配</text>
              </view>
              <text class="section-count">{{ exactMatches.length }}个</text>
            </view>

            <view class="combo-list">
              <view
                v-for="item in exactMatches"
                :key="item.combo.id"
                class="combo-item"
                @click="goToPurchase(item.combo)"
              >
                <view class="combo-main">
                  <view class="combo-info">
                    <text class="combo-name">{{ item.combo.name }}</text>
                    <text class="combo-platform">{{ item.combo.platform }}</text>
                  </view>
                  <view class="combo-price">
                    <text class="price-value">¥{{ item.combo.price }}</text>
                    <text class="price-saved" v-if="item.savedAmount > 0">省¥{{ item.savedAmount.toFixed(1) }}</text>
                  </view>
                </view>
                <view class="combo-footer">
                  <view class="efficiency-badge" :class="getEfficiencyClass(item.costEfficiency)">
                    <text>性价比 {{ item.costEfficiency.toFixed(2) }}x</text>
                  </view>
                  <view class="combo-go" @click.stop="goToPurchase(item.combo)">
                    <text>去购买</text>
                    <uni-icons type="arrow-right" size="14" color="#ff6b35"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 高性价比推荐 -->
          <view class="result-section" v-if="highValueMatches.length > 0">
            <view class="section-header">
              <view class="section-title-wrapper">
                <view class="section-icon high-value">
                  <uni-icons type="star-filled" size="16" color="#fff"></uni-icons>
                </view>
                <text class="section-title">高性价比推荐</text>
              </view>
              <text class="section-count">{{ highValueMatches.length }}个</text>
            </view>

            <view class="combo-list">
              <view
                v-for="item in highValueMatches"
                :key="item.combo.id"
                class="combo-item"
                @click="goToPurchase(item.combo)"
              >
                <view class="combo-main">
                  <view class="combo-info">
                    <text class="combo-name">{{ item.combo.name }}</text>
                    <text class="combo-platform">{{ item.combo.platform }}</text>
                  </view>
                  <view class="combo-price">
                    <text class="price-value">¥{{ item.combo.price }}</text>
                  </view>
                </view>
                <view class="combo-footer">
                  <view class="efficiency-badge" :class="getEfficiencyClass(item.costEfficiency)">
                    <text>性价比 {{ item.costEfficiency.toFixed(2) }}x</text>
                  </view>
                  <view class="match-badge">
                    <text>匹配度 {{ (item.matchRatio * 100).toFixed(0) }}%</text>
                  </view>
                  <view class="combo-go" @click.stop="goToPurchase(item.combo)">
                    <text>去购买</text>
                    <uni-icons type="arrow-right" size="14" color="#ff6b35"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 部分匹配 -->
          <view class="result-section" v-if="partialMatches.length > 0">
            <view class="section-header">
              <view class="section-title-wrapper">
                <view class="section-icon partial">
                  <uni-icons type="list" size="16" color="#fff"></uni-icons>
                </view>
                <text class="section-title">部分匹配</text>
              </view>
              <text class="section-count">{{ partialMatches.length }}个</text>
            </view>

            <view class="combo-list">
              <view
                v-for="item in partialMatches"
                :key="item.combo.id"
                class="combo-item"
                @click="goToPurchase(item.combo)"
              >
                <view class="combo-main">
                  <view class="combo-info">
                    <text class="combo-name">{{ item.combo.name }}</text>
                    <text class="combo-platform">{{ item.combo.platform }}</text>
                  </view>
                  <view class="combo-price">
                    <text class="price-value">¥{{ item.combo.price }}</text>
                  </view>
                </view>
                <view class="combo-footer">
                  <view class="efficiency-badge" :class="getEfficiencyClass(item.costEfficiency)">
                    <text>性价比 {{ item.costEfficiency.toFixed(2) }}x</text>
                  </view>
                  <view class="match-badge">
                    <text>匹配度 {{ (item.matchRatio * 100).toFixed(0) }}%</text>
                  </view>
                  <view class="combo-go" @click.stop="goToPurchase(item.combo)">
                    <text>去看看</text>
                    <uni-icons type="arrow-right" size="14" color="#ff6b35"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 无结果 -->
          <view class="no-results" v-if="exactMatches.length === 0 && highValueMatches.length === 0 && partialMatches.length === 0">
            <view class="no-results-icon">🔍</view>
            <text class="no-results-text">没有找到匹配的套餐</text>
            <text class="no-results-hint">请尝试选择其他菜品组合</text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部浮窗 -->
      <view class="bottom-float-bar">
        <view class="bottom-float-bar-inner">
          <view class="float-bar-content">
            <view class="ocr-btn" @click="goToCombo">
              <uni-icons type="camera" size="20" color="#ff6b35"></uni-icons>
              <text>套餐管理</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDataStore } from '@/store/data'
import { recommendCombos, calculateSavedAmount } from '@/services/combo-recommender'
import uniIcons from '@/components/uni-icons/uni-icons.vue'

const dataStore = useDataStore()

// 加载状态
const loading = ref(true)

// 推荐结果
const exactMatches = ref([])
const highValueMatches = ref([])
const partialMatches = ref([])

// 获取URL参数中的食物ID
const selectedFoodIds = ref([])

// 计算推荐
const calculateRecommendations = async () => {
  loading.value = true

  try {
    const selectedFoods = dataStore.foods.filter(food => selectedFoodIds.value.includes(food.id))

    if (selectedFoods.length === 0) {
      loading.value = false
      return
    }

    const recommendations = recommendCombos(selectedFoodIds.value)

    recommendations.forEach(rec => {
      rec.savedAmount = calculateSavedAmount(rec, selectedFoodIds.value, dataStore)
      rec.matchRatio = rec.matchedFoodIds.length / dataStore.comboFoods.filter(cf => cf.comboId === rec.combo.id).length
    })

    exactMatches.value = recommendations.filter(item => item.type === 'exact')
    highValueMatches.value = recommendations.filter(item => item.type === 'partial' && item.costEfficiency > 1)
    partialMatches.value = recommendations.filter(item => item.type === 'partial' && item.costEfficiency <= 1)
  } catch (error) {
    console.error('计算推荐时出错:', error)
  } finally {
    loading.value = false
  }
}

// 获取性价比样式类
const getEfficiencyClass = (efficiency) => {
  if (efficiency >= 1.5) return 'excellent'
  if (efficiency >= 1.2) return 'good'
  if (efficiency >= 1.0) return 'normal'
  return 'poor'
}

// 跳转到购买
const goToPurchase = (combo) => {
  if (combo.originalUrl) {
    uni.navigateTo({
      url: combo.originalUrl
    })
  }
}

// 返回选择页面
const goBack = () => {
  uni.switchTab({
    url: '/pages/index/index'
  })
}

// 跳转到套餐页面
const goToCombo = () => {
  uni.switchTab({
    url: '/pages/combo/index'
  })
}

// 组件挂载时计算推荐
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}

  if (options.foodIds) {
    try {
      selectedFoodIds.value = JSON.parse(decodeURIComponent(options.foodIds))
    } catch (e) {
      selectedFoodIds.value = []
    }
  }

  calculateRecommendations()
})
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.header {
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
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

.loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top-color: #ff6b35;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.results-scroll {
  flex: 1;
  min-height: 0;
}

.results {
  padding: 24rpx;
  padding-bottom: 140rpx;
}

.result-section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-icon.exact {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
}

.section-icon.high-value {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
}

.section-icon.partial {
  background: linear-gradient(135deg, #999 0%, #bbb 100%);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.section-count {
  font-size: 24rpx;
  color: #999;
}

.combo-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.combo-item {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.combo-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.combo-info {
  flex: 1;
  min-width: 0;
}

.combo-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
  display: block;
}

.combo-platform {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.combo-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.price-value {
  font-size: 34rpx;
  color: #333;
  font-weight: bold;
}

.price-saved {
  font-size: 22rpx;
  color: #ff6b35;
}

.combo-footer {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.efficiency-badge {
  padding: 6rpx 14rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
}

.efficiency-badge.excellent {
  background-color: #e6f7e6;
  color: #4caf50;
}

.efficiency-badge.good {
  background-color: #e8f5e9;
  color: #66bb6a;
}

.efficiency-badge.normal {
  background-color: #fff3e0;
  color: #ff9800;
}

.efficiency-badge.poor {
  background-color: #ffebee;
  color: #f44336;
}

.match-badge {
  padding: 6rpx 14rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
  font-size: 22rpx;
  color: #666;
}

.combo-go {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  background-color: #fff5f0;
  border-radius: 20rpx;
}

.combo-go text {
  font-size: 24rpx;
  color: #ff6b35;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.no-results-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.no-results-text {
  font-size: 30rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.no-results-hint {
  font-size: 26rpx;
  color: #999;
}

/* 底部浮窗 - 固定在屏幕底部 */
.bottom-float-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: transparent;
  z-index: 999;
  margin-bottom: 100rpx;
}

.bottom-float-bar-inner {
  background-color: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.float-bar-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 24rpx;
}

.ocr-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
  border: 2rpx solid #ff6b35;
  border-radius: 40rpx;
}

.ocr-btn text {
  font-size: 28rpx;
  color: #ff6b35;
  font-weight: 500;
}
</style>
