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
							<view v-for="item in exactMatches" :key="item.combo.id" class="combo-item">
								<view class="combo-main" @click="goToPurchase(item.combo)">
									<view class="combo-info">
										<text class="combo-name">{{ item.combo.name }}</text>
										<text class="combo-foods">{{ getComboFoodsSummary(item.combo.id) }}</text>
									</view>
									<view class="combo-price">
										<text class="price-value">¥{{ item.combo.price }}</text>
										<text class="price-saved"
											v-if="item.savedAmount > 0">省¥{{ item.savedAmount.toFixed(1) }}</text>
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
							<view v-for="item in highValueMatches" :key="item.combo.id" class="combo-item">
								<view class="combo-main" @click="goToPurchase(item.combo)">
									<view class="combo-info">
										<text class="combo-name">{{ item.combo.name }}</text>
										<text class="combo-foods">{{ getComboFoodsSummary(item.combo.id) }}</text>
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
									<view class="combo-go" @click.stop="showComboDetail(item)">
										<text>去看看</text>
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
							<view v-for="item in partialMatches" :key="item.combo.id" class="combo-item">
								<view class="combo-main" @click="goToPurchase(item.combo)">
									<view class="combo-info">
										<text class="combo-name">{{ item.combo.name }}</text>
										<text class="combo-foods">{{ getComboFoodsSummary(item.combo.id) }}</text>
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
									<view class="combo-go" @click.stop="showComboDetail(item)">
										<text>去看看</text>
										<uni-icons type="arrow-right" size="14" color="#ff6b35"></uni-icons>
									</view>
								</view>
							</view>
						</view>
					</view>

					<!-- 无结果 -->
					<view class="no-results"
						v-if="exactMatches.length === 0 && highValueMatches.length === 0 && partialMatches.length === 0 && multiComboMatches.length === 0 && substitutionMatches.length === 0">
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
							<uni-icons type="calendar" size="20" color="#ff6b35"></uni-icons>
							<text>套餐管理</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 套餐详情弹窗 -->
			<view class="detail-modal-overlay" :class="showDetailModal ? 'show' : ''" v-if="showDetailModal" @click="closeDetailModal">
				<view class="detail-modal" @click.stop>
					<view class="detail-header">
						<text class="detail-title">{{ selectedCombo?.name }}</text>
						<view class="detail-close" @click="closeDetailModal">
							<uni-icons type="close" size="20" color="#999"></uni-icons>
						</view>
					</view>

					<view class="detail-body" v-if="selectedCombo">
						<view class="detail-price-row">
							<text class="detail-label">套餐价格</text>
							<text class="detail-price">¥{{ selectedCombo.price }}</text>
						</view>
						<view class="detail-price-row">
							<text class="detail-label">平台来源</text>
							<text class="detail-value">{{ getPlatformName(selectedCombo.platform) }}</text>
						</view>
						<view class="detail-price-row">
							<text class="detail-label">包含菜品</text>
						</view>
						<view class="detail-foods">
							<view v-for="food in selectedComboFoods" :key="food.id" class="detail-food-item">
								<text class="detail-food-name">{{ food.nameZh || food.name }}</text>
								<text class="detail-food-price">×{{ food.quantity || 1 }}</text>
							</view>
						</view>
					</view>

					<view class="detail-footer">
						<view class="detail-buy-btn" v-if="selectedCombo?.originalUrl" @click="goToPurchaseUrl(selectedCombo.originalUrl)">
							<uni-icons type="shop" size="18" color="#fff"></uni-icons>
							<text>去购买</text>
						</view>
						<view class="detail-buy-btn disabled" v-else>
							<text>暂无购买链接</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</page>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import {
		useDataStore
	} from '@/store/data'
	import {
		recommendCombos,
		calculateSavedAmount
	} from '@/services/combo-recommender'
	import uniIcons from '@/components/uni-icons/uni-icons.vue'

	const dataStore = useDataStore()

	// 加载状态
	const loading = ref(true)

	// 推荐结果
	const exactMatches = ref([])
	const highValueMatches = ref([])
	const partialMatches = ref([])
	const multiComboMatches = ref([])
	const substitutionMatches = ref([])

	// 详情弹窗
	const showDetailModal = ref(false)
	const selectedCombo = ref(null)
	const selectedComboFoods = ref([])

	// 获取URL参数中的食物名称
	const selectedFoodNames = ref([])

	// 计算推荐
	const calculateRecommendations = async () => {
		loading.value = true

		try {
			// 确保数据已加载
			await dataStore.init()

			const selectedFoods = dataStore.allFoods.filter(food => selectedFoodNames.value.includes(food.id))

			if (selectedFoods.length === 0) {
				loading.value = false
				return
			}

			const recommendations = recommendCombos(selectedFoodNames.value)

			recommendations.forEach(rec => {
				rec.savedAmount = calculateSavedAmount(rec, dataStore)
				// 对于 multi_combo 类型，使用 componentCombos 计算
				if (rec.type === 'multi_combo' && rec.combo.componentCombos) {
					const totalFoodCount = rec.combo.componentCombos.reduce((sum, c) => {
						return sum + dataStore.comboFoods.filter(cf => cf.comboId === c.id).length
					}, 0)
					rec.matchRatio = rec.matchedFoodIds.length / totalFoodCount
				} else {
					rec.matchRatio = rec.matchedFoodIds.length / dataStore.comboFoods.filter(cf => cf
						.comboId === rec.combo.id).length
				}
			})

			exactMatches.value = recommendations.filter(item => item.type === 'exact')
			highValueMatches.value = recommendations.filter(item => item.type === 'partial' && item.costEfficiency > 1)
			partialMatches.value = recommendations.filter(item => item.type === 'partial' && item.costEfficiency <= 1)
			multiComboMatches.value = recommendations.filter(item => item.type === 'multi_combo')
			substitutionMatches.value = recommendations.filter(item => item.type === 'substitution')
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

	// 显示套餐详情
	const showComboDetail = (item) => {
		selectedCombo.value = item.combo
		// 获取套餐包含的食物
		const comboFoods = dataStore.allComboFoods.filter(cf => cf.comboId === item.combo.id)
		selectedComboFoods.value = comboFoods.map(cf => {
			const food = dataStore.getFoodById(cf.foodId)
			return { ...food, quantity: cf.quantity }
		}).filter(Boolean)
		showDetailModal.value = true
	}

	// 关闭详情弹窗
	const closeDetailModal = () => {
		showDetailModal.value = false
		selectedCombo.value = null
		selectedComboFoods.value = []
	}

	// 获取平台名称
	const getPlatformName = (platform) => {
		const map = { meituan: '美团', eleme: '饿了么', custom: '自定义' }
		return map[platform] || platform || '未知'
	}

	// 获取套餐食物摘要
	const getComboFoodsSummary = (comboId) => {
		const comboFoods = dataStore.allComboFoods.filter(cf => cf.comboId === comboId)
		const names = comboFoods.slice(0, 3).map(cf => {
			const food = dataStore.getFoodById(cf.foodId)
			return food?.nameZh || food?.name || ''
		}).filter(Boolean)
		const suffix = comboFoods.length > 3 ? '...' : ''
		return names.join(' + ') + suffix
	}

	// 跳转到购买链接
	const goToPurchaseUrl = (url) => {
		if (url) {
			uni.navigateTo({
				url: url
			})
		}
	}

	// 跳转到购买（兼容）
	const goToPurchase = (combo) => {
		if (combo.originalUrl) {
			goToPurchaseUrl(combo.originalUrl)
		} else {
			// 没有链接时显示详情
			const item = { combo }
			showComboDetail(item)
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

		if (options.foodNames) {
			try {
				selectedFoodNames.value = JSON.parse(decodeURIComponent(options.foodNames))
			} catch (e) {
				selectedFoodNames.value = []
			}
		}

		calculateRecommendations()
	})
</script>

<style lang="scss" scoped>
	/* ===== CSS变量 - 统一颜色和字体 ===== */
	page {
		--color-primary: #e09550;
		--color-primary-light: #f0b27a;
		--color-primary-gradient: linear-gradient(135deg, #e85d04 0%, #f48c06 100%);
		--color-accent: #d00000;
		--color-success: #38b000;
		--color-text: #1a1a1a;
		--color-text-secondary: #6c757d;
		--color-text-tertiary: #adb5bd;
		--color-bg: #fefae0;
		--color-bg-card: #ffffff;
		--color-border: #f0f0f0;
		--font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		--font-size-xs: 22rpx;
		--font-size-sm: 24rpx;
		--font-size-md: 28rpx;
		--font-size-lg: 32rpx;
		--font-size-xl: 36rpx;
		--font-size-xxl: 44rpx;
		--letter-spacing-tight: -0.02em;
		--letter-spacing-normal: 0;
		--letter-spacing-wide: 0.05em;
	}

	/* ===== 动画定义 ===== */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20rpx);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ===== 容器 ===== */
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: linear-gradient(180deg, #fff 0%, var(--color-bg) 100%);
		font-family: var(--font-family);
	}

	/* ===== 头部 ===== */
	.header {
		padding: 22rpx 32rpx;
		padding-top: calc(22rpx + env(safe-area-inset-top));
		background: var(--color-primary-gradient);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
	}

	.header::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -15%;
		width: 300rpx;
		height: 300rpx;
		background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 65%);
		border-radius: 50%;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 20rpx;
		position: relative;
		z-index: 1;
	}

	.back-btn {
		width: 68rpx;
		height: 68rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.back-btn:active {
		background-color: rgba(255, 255, 255, 0.35);
		transform: scale(0.9);
	}

	.header-title {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.title {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: #fff;
		letter-spacing: 1px;
	}

	.subtitle {
		font-size: var(--font-size-sm);
		color: rgba(255, 255, 255, 0.88);
		font-weight: 400;
	}

	/* ===== 加载状态 ===== */
	.loading {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 30rpx;
	}

	.loading-spinner {
		width: 72rpx;
		height: 72rpx;
		border: 4rpx solid rgba(232, 93, 4, 0.15);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-text {
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		letter-spacing: 1px;
	}

	/* ===== 结果列表 ===== */
	.results-scroll {
		flex: 1;
		min-height: 0;
	}

	.results {
		padding: 24rpx 32rpx;
		padding-bottom: 140rpx;
	}

	.result-section {
		margin-bottom: 40rpx;
		animation: fadeInUp 0.5s ease-out both;
	}

	.result-section:nth-child(1) { animation-delay: 0.08s; }
	.result-section:nth-child(2) { animation-delay: 0.16s; }
	.result-section:nth-child(3) { animation-delay: 0.24s; }

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title-wrapper {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.section-icon {
		width: 44rpx;
		height: 44rpx;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);
	}

	.section-icon.exact {
		background: var(--color-primary-gradient);
	}

	.section-icon.high-value {
		background: linear-gradient(135deg, #f48c06 0%, #ffb700 100%);
	}

	.section-icon.partial {
		background: linear-gradient(135deg, #78909c 0%, #90a4ae 100%);
	}

	.section-title {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: var(--letter-spacing-tight);
	}

	.section-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		background-color: #f0f0f0;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
		font-weight: 500;
	}

	.combo-list {
		display: flex;
		flex-direction: column;
		gap: 18rpx;
	}

	.combo-item {
		background-color: var(--color-bg-card);
		border-radius: 22rpx;
		padding: 28rpx;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1.5px solid transparent;
	}

	.combo-item:active {
		transform: scale(0.985);
		border-color: var(--color-primary);
	}

	.combo-main {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20rpx;
	}

	.combo-info {
		flex: 1;
		min-width: 0;
	}

	.combo-name {
		font-size: var(--font-size-lg);
		color: var(--color-text);
		font-weight: 700;
		display: block;
		margin-bottom: 8rpx;
		letter-spacing: var(--letter-spacing-tight);
	}

	.combo-platform {
		font-size: var(--font-size-sm);
		color: var(--color-text-tertiary);
		margin-top: 6rpx;
		display: block;
	}

	.combo-foods {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin-top: 10rpx;
		display: block;
		line-height: 1.6;
	}

	.combo-price {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8rpx;
	}

	.price-value {
		font-size: var(--font-size-xxl);
		color: var(--color-text);
		font-weight: 800;
		letter-spacing: -0.03em;
	}

	.price-saved {
		font-size: var(--font-size-xs);
		color: var(--color-success);
		font-weight: 600;
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		padding: 6rpx 14rpx;
		border-radius: 12rpx;
	}

	.combo-footer {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding-top: 20rpx;
		border-top: 1px solid var(--color-border);
	}

	.efficiency-badge {
		padding: 8rpx 18rpx;
		border-radius: 20rpx;
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: 0.3px;
	}

	.efficiency-badge.excellent {
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		color: #2e7d32;
	}

	.efficiency-badge.good {
		background: linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%);
		color: #388e3c;
	}

	.efficiency-badge.normal {
		background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
		color: #e65100;
	}

	.efficiency-badge.poor {
		background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
		color: #c62828;
	}

	.match-badge {
		padding: 8rpx 18rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.combo-go {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 6rpx;
		padding: 12rpx 22rpx;
		background: linear-gradient(135deg, #fff 0%, #fff8f5 100%);
		border: 1.5px solid var(--color-primary);
		border-radius: 24rpx;
		transition: all 0.2s ease;
	}

	.combo-go:active {
		transform: scale(0.95);
		background-color: #fff5f0;
	}

	.combo-go text {
		font-size: var(--font-size-sm);
		color: var(--color-primary);
		font-weight: 600;
	}

	/* ===== 无结果 ===== */
	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 140rpx 0;
		animation: fadeInUp 0.5s ease-out;
	}

	.no-results-icon {
		font-size: 100rpx;
		margin-bottom: 28rpx;
		opacity: 0.5;
	}

	.no-results-text {
		font-size: var(--font-size-lg);
		color: var(--color-text-secondary);
		margin-bottom: 14rpx;
		font-weight: 600;
	}

	.no-results-hint {
		font-size: var(--font-size-md);
		color: var(--color-text-tertiary);
	}

	/* ===== 底部浮窗 ===== */
	.bottom-float-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 16rpx 28rpx;
		padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
		background-color: transparent;
		z-index: 999;
		margin-bottom: 100rpx;
	}

	.bottom-float-bar-inner {
		background-color: rgba(255, 255, 255, 0.97);
		border-radius: 24rpx;
		box-shadow: 0 -4rpx 30rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
		backdrop-filter: blur(20px);
	}

	.float-bar-content {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 18rpx 28rpx;
	}

	.ocr-btn {
		display: flex;
		align-items: center;
		gap: 10rpx;
		padding: 18rpx 50rpx;
		background: linear-gradient(135deg, #fff 0%, #fff8f5 100%);
		border: 2px solid var(--color-primary);
		border-radius: 40rpx;
		transition: all 0.2s ease;
	}

	.ocr-btn:active {
		transform: scale(0.95);
		background-color: #fff5f0;
	}

	.ocr-btn text {
		font-size: var(--font-size-md);
		color: var(--color-primary);
		font-weight: 600;
	}

	/* ===== 详情弹窗 ===== */
	.detail-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.35);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 1000;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.detail-modal-overlay.show {
		opacity: 1;
	}

	.detail-modal {
		width: 100%;
		max-height: 75vh;
		background-color: var(--color-bg-card);
		border-radius: 28rpx 28rpx 0 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transform: translateY(100%);
		transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.detail-modal-overlay.show .detail-modal {
		transform: translateY(0);
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
		background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
	}

	.detail-title {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: var(--letter-spacing-tight);
	}

	.detail-close {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.detail-close:active {
		background-color: #e8e8e8;
		transform: scale(0.9);
	}

	.detail-body {
		flex: 1;
		overflow-y: auto;
		padding: 26rpx 32rpx;
	}

	.detail-price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 22rpx 0;
		border-bottom: 1px solid var(--color-border);
	}

	.detail-label {
		font-size: var(--font-size-md);
		color: var(--color-text-tertiary);
	}

	.detail-value {
		font-size: var(--font-size-md);
		color: var(--color-text);
		font-weight: 600;
	}

	.detail-price {
		font-size: var(--font-size-xxl);
		color: var(--color-primary);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.detail-foods {
		margin-top: 22rpx;
	}

	.detail-food-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 24rpx;
		background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
		border-radius: 16rpx;
		margin-bottom: 14rpx;
		transition: all 0.2s ease;
	}

	.detail-food-item:active {
		transform: scale(0.98);
		background-color: #f0f0f0;
	}

	.detail-food-name {
		font-size: var(--font-size-md);
		color: var(--color-text);
		font-weight: 600;
	}

	.detail-food-price {
		font-size: var(--font-size-sm);
		color: var(--color-text-tertiary);
	}

	.detail-footer {
		padding: 22rpx 32rpx;
		padding-bottom: calc(22rpx + env(safe-area-inset-bottom));
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.detail-buy-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		height: 90rpx;
		background: var(--color-primary-gradient);
		border-radius: 45rpx;
		box-shadow: 0 8rpx 28rpx rgba(232, 93, 4, 0.35);
		transition: all 0.2s ease;
	}

	.detail-buy-btn:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 16rpx rgba(232, 93, 4, 0.25);
	}

	.detail-buy-btn text {
		font-size: var(--font-size-md);
		color: #fff;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.detail-buy-btn.disabled {
		background: linear-gradient(135deg, #ccc 0%, #ddd 100%);
		box-shadow: none;
	}
</style>