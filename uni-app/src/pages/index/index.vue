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
							<view class="cart-btn" @click="showCartModal">
								<uni-icons type="cart" size="20" color="#ff6b35"></uni-icons>
								<text class="cart-btn-text">购物车</text>
							</view>
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

			<!-- 购物车弹窗 -->
			<view class="cart-modal-overlay" :class="showCart ? 'show' : ''" v-if="showCart" @click="closeCartModal">
				<view class="cart-modal" @click.stop>
					<view class="cart-header">
						<text class="cart-title">已选菜品</text>
						<view class="cart-close" @click="closeCartModal">
							<uni-icons type="close" size="20" color="#999"></uni-icons>
						</view>
					</view>

					<view class="cart-empty" v-if="cartItems.length === 0">
						<text class="cart-empty-text">购物车是空的</text>
					</view>

					<scroll-view class="cart-list" scroll-y v-else>
						<view v-for="item in cartItems" :key="item.food.id" class="cart-item">
							<view class="cart-item-info">
								<text class="cart-item-name">{{ item.food.name }}</text>
								<text class="cart-item-price">¥{{ item.food.soloPrice }} × {{ item.count }}</text>
							</view>
							<view class="cart-item-actions">
								<view class="cart-item-subtotal">¥{{ (item.food.soloPrice * item.count).toFixed(2) }}</view>
								<view class="cart-item-delete" @click="removeFromCart(item.food.id)">
									<uni-icons type="minus" size="14" color="#ff6b35"></uni-icons>
								</view>
							</view>
						</view>
					</scroll-view>

					<view class="cart-footer" v-if="cartItems.length > 0">
						<view class="cart-total">
							<text class="cart-total-label">合计</text>
							<text class="cart-total-value">¥{{ cartTotalPrice }}</text>
						</view>
						<view class="cart-clear-btn" @click="clearSelection">
							<text>清空</text>
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
		computed,
		onMounted
	} from 'vue'
	import {
		useDataStore
	} from '@/store/data'
	import uniIcons from '@/components/uni-icons/uni-icons.vue'

	const dataStore = useDataStore()

	// 初始化数据
	onMounted(async () => {
		await dataStore.init()
	})

	// 分类数据
	const categories = ref([{
			id: '主食',
			name: '汉堡'
		},
		{
			id: '小食',
			name: '小食'
		},
		{
			id: '饮料',
			name: '饮料'
		},
		{
			id: '甜品',
			name: '甜点'
		}
	])

	// 选中的分类
	const selectedCategory = ref('主食')

	// 选中的食物列表
	const selectedFoods = ref([])

	// 购物车弹窗
	const showCart = ref(false)

	// 购物车商品（带数量统计）
	const cartItems = computed(() => {
		const countMap = {}
		selectedFoods.value.forEach(food => {
			if (countMap[food.id]) {
				countMap[food.id].count++
			} else {
				countMap[food.id] = { food, count: 1 }
			}
		})
		return Object.values(countMap)
	})

	// 购物车总价
	const cartTotalPrice = computed(() => {
		return cartItems.value.reduce((sum, item) => sum + (item.food.soloPrice * item.count), 0).toFixed(2)
	})

	// 显示购物车
	const showCartModal = () => {
		showCart.value = true
	}

	// 关闭购物车
	const closeCartModal = () => {
		showCart.value = false
	}

	// 从购物车移除一个
	const removeFromCart = (foodId) => {
		const index = selectedFoods.value.findIndex(f => f.id === foodId)
		if (index !== -1) {
			selectedFoods.value.splice(index, 1)
		}
	}

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

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(100%);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(0.95);
		}
	}

	/* ===== 容器 ===== */
	.container {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: linear-gradient(180deg, #fff 0%, var(--color-bg) 100%);
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
		font-family: var(--font-family);
	}

	/* ===== 头部 ===== */
	.header {
		padding: 24rpx 32rpx;
		background: var(--color-primary-gradient);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
	}

	.header::before {
		content: '';
		position: absolute;
		top: -60%;
		right: -25%;
		width: 350rpx;
		height: 350rpx;
		background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%);
		border-radius: 50%;
	}

	.header::after {
		content: '';
		position: absolute;
		bottom: -40%;
		left: 5%;
		width: 200rpx;
		height: 200rpx;
		background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
		border-radius: 50%;
	}

	.brand-wrapper {
		display: flex;
		align-items: center;
		gap: 20rpx;
		position: relative;
		z-index: 1;
	}

	.brand-icon {
		font-size: 56rpx;
		width: 76rpx;
		height: 76rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.96);
		border-radius: 20rpx;
		box-shadow: 0 8rpx 24rpx rgba(232, 93, 4, 0.25);
		animation: fadeInUp 0.5s ease-out;
	}

	.brand-text {
		flex: 1;
		animation: fadeInUp 0.5s ease-out 0.08s both;
	}

	.subtitle {
		font-size: var(--font-size-sm);
		color: rgba(255, 255, 255, 0.92);
		font-weight: 400;
		letter-spacing: 0.5px;
	}

	/* ===== 分类标签 ===== */
	.category-tabs {
		display: flex;
		justify-content: space-around;
		margin: 20rpx 32rpx;
		background-color: var(--color-bg-card);
		border-radius: 20rpx;
		padding: 6rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
		flex-shrink: 0;
		backdrop-filter: blur(10px);
	}

	.tab {
		flex: 1;
		text-align: center;
		padding: 18rpx 0;
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		border-radius: 16rpx;
		margin: 0 4rpx;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		letter-spacing: var(--letter-spacing-normal);
	}

	.tab.active {
		color: #fff;
		background: var(--color-primary-gradient);
		box-shadow: 0 4rpx 16rpx rgba(232, 93, 4, 0.35);
		font-weight: 600;
	}

	.tab:active {
		transform: scale(0.96);
	}

	/* ===== 食物列表 ===== */
	.food-scroll {
		flex: 1;
		min-height: 0;
		padding: 0 32rpx;
	}

	.food-list {
		padding-bottom: 200rpx;
	}

	.food-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--color-bg-card);
		padding: 30rpx;
		margin-bottom: 16rpx;
		border-radius: 20rpx;
		box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: fadeInUp 0.4s ease-out both;
		border: 1.5px solid transparent;
	}

	.food-item:nth-child(1) { animation-delay: 0.04s; }
	.food-item:nth-child(2) { animation-delay: 0.08s; }
	.food-item:nth-child(3) { animation-delay: 0.12s; }
	.food-item:nth-child(4) { animation-delay: 0.16s; }
	.food-item:nth-child(5) { animation-delay: 0.2s; }
	.food-item:nth-child(6) { animation-delay: 0.24s; }

	.food-item:active {
		transform: scale(0.985);
	}

	.food-item.selected {
		background: linear-gradient(135deg, #fff 0%, #fff5f0 100%);
		border-color: var(--color-primary);
		box-shadow: 0 4rpx 24rpx rgba(232, 93, 4, 0.12);
	}

	.food-info {
		flex: 1;
	}

	.food-name {
		font-size: var(--font-size-lg);
		color: var(--color-text);
		font-weight: 600;
		margin-bottom: 6rpx;
		letter-spacing: var(--letter-spacing-tight);
	}

	.food-price {
		font-size: var(--font-size-sm);
		color: var(--color-text-tertiary);
		font-weight: 400;
	}

	.food-actions {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.food-count {
		font-size: var(--font-size-md);
		color: var(--color-primary);
		font-weight: 700;
		min-width: 36rpx;
		text-align: center;
		letter-spacing: var(--letter-spacing-tight);
	}

	.food-icon {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f8f8f8;
		border-radius: 50%;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.food-icon.selected {
		background: var(--color-primary-gradient);
		box-shadow: 0 4rpx 14rpx rgba(232, 93, 4, 0.4);
	}

	.food-icon:active {
		animation: pulse 0.25s ease;
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
		justify-content: space-between;
		padding: 22rpx 26rpx;
	}

	.float-bar-left {
		display: flex;
		align-items: center;
	}

	.selected-info {
		display: flex;
		flex-direction: column;
		gap: 2rpx;
	}

	.selected-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		letter-spacing: 0.5px;
	}

	.selected-price {
		font-size: var(--font-size-xxl);
		color: var(--color-primary);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.float-bar-right {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.clear-btn {
		height: 72rpx;
		padding: 0 30rpx;
		background-color: #f8f8f8;
		border-radius: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.clear-btn:active {
		background-color: #efefef;
		transform: scale(0.95);
	}

	.clear-btn text {
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.calculate-btn {
		height: 72rpx;
		padding: 0 34rpx;
		background: var(--color-primary-gradient);
		border-radius: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		box-shadow: 0 6rpx 20rpx rgba(232, 93, 4, 0.35);
		transition: all 0.2s ease;
	}

	.calculate-btn:active {
		transform: scale(0.95);
		box-shadow: 0 4rpx 12rpx rgba(232, 93, 4, 0.25);
	}

	.calculate-btn text {
		font-size: var(--font-size-md);
		color: #fff;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.cart-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 0 26rpx;
		height: 72rpx;
		background: linear-gradient(135deg, #fff 0%, #fff8f5 100%);
		border-radius: 36rpx;
		border: 1.5px solid var(--color-primary);
		transition: all 0.2s ease;
	}

	.cart-btn:active {
		transform: scale(0.95);
		background-color: #fff5f0;
	}

	.cart-btn-text {
		font-size: var(--font-size-md);
		color: var(--color-primary);
		font-weight: 600;
	}

	/* ===== 购物车弹窗 ===== */
	.cart-modal-overlay {
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

	.cart-modal-overlay.show {
		opacity: 1;
	}

	.cart-modal {
		width: 100%;
		max-height: 70vh;
		background-color: var(--color-bg-card);
		border-radius: 28rpx 28rpx 0 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transform: translateY(100%);
		transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.cart-modal-overlay.show .cart-modal {
		transform: translateY(0);
	}

	.cart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.cart-title {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: var(--letter-spacing-tight);
	}

	.cart-close {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.cart-close:active {
		background-color: #ebebeb;
		transform: scale(0.9);
	}

	.cart-empty {
		padding: 100rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
	}

	.cart-empty-icon {
		font-size: 80rpx;
		opacity: 0.4;
	}

	.cart-empty-text {
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
	}

	.cart-list {
		flex: 1;
		min-height: 0;
		padding: 0 32rpx;
	}

	.cart-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 26rpx 0;
		border-bottom: 1px solid var(--color-border);
		animation: fadeInUp 0.3s ease-out;
	}

	.cart-item-info {
		flex: 1;
	}

	.cart-item-name {
		font-size: var(--font-size-md);
		color: var(--color-text);
		display: block;
		margin-bottom: 6rpx;
		font-weight: 600;
		letter-spacing: var(--letter-spacing-tight);
	}

	.cart-item-price {
		font-size: var(--font-size-sm);
		color: var(--color-text-tertiary);
	}

	.cart-item-actions {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.cart-item-subtotal {
		font-size: var(--font-size-md);
		color: var(--color-primary);
		font-weight: 700;
		letter-spacing: var(--letter-spacing-tight);
	}

	.cart-item-delete {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #fff5f0;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.cart-item-delete:active {
		transform: scale(0.9);
		background-color: #ffe8dc;
	}

	.cart-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 26rpx 32rpx;
		padding-bottom: calc(26rpx + env(safe-area-inset-bottom));
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
		background-color: #fafafa;
	}

	.cart-total {
		display: flex;
		align-items: baseline;
		gap: 12rpx;
	}

	.cart-total-label {
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
	}

	.cart-total-value {
		font-size: var(--font-size-xl);
		color: var(--color-primary);
		font-weight: 700;
		letter-spacing: var(--letter-spacing-tight);
	}

	.cart-clear-btn {
		padding: 14rpx 30rpx;
		background-color: var(--color-bg-card);
		border: 1.5px solid #e8e8e8;
		border-radius: 24rpx;
		transition: all 0.2s ease;
	}

	.cart-clear-btn:active {
		background-color: #f5f5f5;
		transform: scale(0.95);
	}

	.cart-clear-btn text {
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		font-weight: 500;
	}
</style>