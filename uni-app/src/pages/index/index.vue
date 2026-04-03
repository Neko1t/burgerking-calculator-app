<template>
	<page>
		<view class="container">
			<!-- 头部区域 -->
			<view class="header">
				<view class="brand-wrapper">
					<view class="brand-icon">🍔</view>
					<view class="brand-text">
						<text class="subtitle">选择你想要的菜品，找到最划算的套餐</text>
					</view>
				</view>
			</view>

			<!-- 分类标签 -->
			<view class="category-tabs">
				<view v-for="(category, index) in categories" :key="index"
					:class="['tab', selectedCategory === category.id ? 'active' : '']"
					@click="selectCategory(category.id)">
					{{ category.name }}
				</view>
			</view>

			<!-- 食物列表 -->
			<scroll-view class="food-scroll" scroll-y>
				<view class="food-list">
					<view v-for="food in filteredFoods" :key="food.id" class="food-item"
						@click="toggleFoodSelection(food)" :class="{'selected': isSelected(food)}">
						<view class="food-info">
							<text class="food-name">{{ food.name }}</text>
							<text class="food-price">¥{{ food.soloPrice || '待定' }}</text>
						</view>
						<view class="food-actions">
							<text class="food-count" v-if="getSelectedCount(food) > 0">
								{{ getSelectedCount(food) }}
							</text>
							<view class="food-icon" :class="isSelected(food) ? 'selected' : ''">
								<uni-icons :type="isSelected(food) ? 'checkbox-filled' : 'plus'" :size="20"
									:color="isSelected(food) ? '#fff' : '#999'"></uni-icons>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 底部浮窗操作栏 -->
			<view class="bottom-float-bar">
				<view class="bottom-float-bar-inner">
					<view class="float-bar-content">
						<view class="float-bar-left">
							<view class="selected-info">
								<text class="selected-count">{{ selectedFoods.length }}项</text>
								<text class="selected-price">¥{{ totalPrice }}</text>
							</view>
						</view>
						<view class="float-bar-right">
							<view class="clear-btn" @click="clearSelection">
								<text>清空</text>
							</view>
							<view class="calculate-btn" @click="calculateRecommendations">
								<text>开始计算</text>
								<uni-icons type="arrow-right" :size="16" color="#fff"></uni-icons>
							</view>
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
		computed
	} from 'vue'
	import {
		useDataStore
	} from '@/store/data'
	import uniIcons from '@/components/uni-icons/uni-icons.vue'

	const dataStore = useDataStore()

	// 分类数据
	const categories = ref([{
			id: 'burger',
			name: '汉堡'
		},
		{
			id: 'side',
			name: '小食'
		},
		{
			id: 'drink',
			name: '饮料'
		},
		{
			id: 'dessert',
			name: '甜点'
		}
	])

	// 选中的分类
	const selectedCategory = ref('burger')

	// 选中的食物列表
	const selectedFoods = ref([])

	// 过滤食物列表
	const filteredFoods = computed(() => {
		return dataStore.foods.filter(food => food.category === selectedCategory.value)
	})

	// 计算总价
	const totalPrice = computed(() => {
		return selectedFoods.value.reduce((sum, food) => sum + (food.soloPrice || 0), 0).toFixed(2)
	})

	// 选择分类
	const selectCategory = (categoryId) => {
		selectedCategory.value = categoryId
	}

	// 切换食物选择
	const toggleFoodSelection = (food) => {
		const index = selectedFoods.value.findIndex(f => f.id === food.id)
		if (index === -1) {
			selectedFoods.value.push(food)
		} else {
			selectedFoods.value.splice(index, 1)
		}
	}

	// 检查食物是否被选中
	const isSelected = (food) => {
		return selectedFoods.value.some(f => f.id === food.id)
	}

	// 获取选中数量
	const getSelectedCount = (food) => {
		return selectedFoods.value.filter(f => f.id === food.id).length
	}

	// 清空选择
	const clearSelection = () => {
		selectedFoods.value = []
	}

	// 开始计算推荐
	const calculateRecommendations = () => {
		if (selectedFoods.value.length === 0) return

		// 获取选中的食物ID
		const selectedFoodIds = selectedFoods.value.map(f => f.id)

		// 跳转到结果页并传递数据
		uni.navigateTo({
			url: `/pages/result/index?foodIds=${encodeURIComponent(JSON.stringify(selectedFoodIds))}`
		})
	}
</script>

<style lang="scss" scoped>
	.container {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}

	.header {
		padding: 20rpx 30rpx;
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		flex-shrink: 0;
	}

	.brand-wrapper {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.brand-icon {
		font-size: 56rpx;
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.95);
		border-radius: 18rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
	}

	.brand-text {
		flex: 1;
	}

	.subtitle {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.95);
	}

	.category-tabs {
		display: flex;
		justify-content: space-around;
		margin: 20rpx 30rpx;
		background-color: #fff;
		border-radius: 24rpx;
		padding: 6rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
		flex-shrink: 0;
	}

	.tab {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		font-size: 28rpx;
		color: #666;
		border-radius: 20rpx;
		margin: 0 4rpx;
		transition: all 0.25s ease;
	}

	.tab.active {
		color: #fff;
		background-color: #ff6b35;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.35);
	}

	.food-scroll {
		flex: 1;
		min-height: 0;
		padding: 0 30rpx;
	}

	.food-list {
		padding-bottom: 200rpx;
	}

	.food-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #fff;
		padding: 28rpx;
		margin-bottom: 14rpx;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		transition: all 0.25s ease;
	}

	.food-item.selected {
		background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
		border: 2rpx solid #ff6b35;
	}

	.food-info {
		flex: 1;
	}

	.food-name {
		font-size: 32rpx;
		color: #333;
		font-weight: 500;
	}

	.food-price {
		font-size: 26rpx;
		color: #999;
		margin-top: 6rpx;
	}

	.food-actions {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.food-count {
		font-size: 26rpx;
		color: #ff6b35;
		font-weight: bold;
	}

	.food-icon {
		width: 52rpx;
		height: 52rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f0f0f0;
		border-radius: 50%;
		transition: all 0.25s ease;
	}

	.food-icon.selected {
		background-color: #ff6b35;
	}

	/* 底部浮窗 - 固定在屏幕底部，适配tabBar */
	.bottom-float-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 16rpx 24rpx;
		padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
		background-color: transparent;
		z-index: 999;
		margin-bottom: 60rpx;
	}

	.bottom-float-bar-inner {
		background-color: #fff;
		border-radius: 24rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15), 0 0 1rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.float-bar-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 24rpx;
	}

	.float-bar-left {
		display: flex;
		align-items: center;
	}

	.selected-info {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.selected-count {
		font-size: 24rpx;
		color: #999;
	}

	.selected-price {
		font-size: 36rpx;
		color: #ff6b35;
		font-weight: bold;
	}

	.float-bar-right {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.clear-btn {
		height: 72rpx;
		padding: 0 28rpx;
		background-color: #f5f5f5;
		border-radius: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-btn text {
		font-size: 26rpx;
		color: #666;
	}

	.calculate-btn {
		height: 72rpx;
		padding: 0 32rpx;
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		border-radius: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 53, 0.4);
	}

	.calculate-btn text {
		font-size: 28rpx;
		color: #fff;
		font-weight: 500;
	}
</style>