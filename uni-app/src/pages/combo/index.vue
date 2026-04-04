<template>
	<page>
		<view class="container">
			<!-- 头部 -->
			<view class="header">
				<view class="header-content">
					<text class="title">套餐管理</text>
					<text class="subtitle">管理你的套餐列表</text>
				</view>
			</view>

			<!-- 搜索栏 -->
			<view class="search-section">
				<view class="search-bar">
					<uni-icons type="scan" size="18" color="#999"></uni-icons>
					<input type="text" v-model="searchKeyword" placeholder="搜索套餐名称" class="search-input" />
					<view class="search-btn" @click="handleSearch">
						<text>搜索</text>
					</view>
				</view>
			</view>

			<!-- 平台分类标签 -->
			<view class="platform-tabs">
				<view v-for="platform in platforms" :key="platform.id"
					:class="['platform-tab', selectedPlatform === platform.id ? 'active' : '']"
					@click="selectPlatform(platform.id)">
					<text>{{ platform.name }}</text>
				</view>
			</view>

			<!-- 套餐列表 -->
			<scroll-view class="combo-scroll" scroll-y>
				<view class="combo-list">
					<!-- CDN套餐 -->
					<view class="combo-section" v-if="cdnCombos.length > 0">
						<view class="section-header" v-if="!searchKeyword">
							<view class="section-title-row">
								<uni-icons type="cloud" size="16" color="#4caf50"></uni-icons>
								<text class="section-title">在线拉取</text>
							</view>
							<text class="section-count">{{ cdnCombos.length }}个</text>
						</view>

						<view v-for="combo in filteredCdnCombos" :key="combo.id" class="combo-item"
							@click="showComboDetail(combo)">
							<view class="combo-main">
								<view class="combo-info">
									<text class="combo-name">{{ combo.name }}</text>
									<view class="combo-tags">
										<text class="source-tag cdn">在线</text>
										<text class="platform-tag">{{ getPlatformName(combo.platform) }}</text>
									</view>
								</view>
								<view class="combo-price">
									<text class="price-value">¥{{ combo.price }}</text>
									<text class="food-count">{{ getComboFoodCount(combo.id) }}个菜品</text>
								</view>
							</view>
							<view class="combo-actions">
								<view class="action-btn delete" @click.stop="deleteCombo(combo.id)">
									<uni-icons type="delete" size="16" color="#999"></uni-icons>
								</view>
							</view>
						</view>
					</view>

					<!-- 本地套餐 -->
					<view class="combo-section" v-if="localCombos.length > 0">
						<view class="section-header" v-if="!searchKeyword">
							<view class="section-title-row">
								<uni-icons type="edit" size="16" color="#ff6b35"></uni-icons>
								<text class="section-title">手动添加</text>
							</view>
							<text class="section-count">{{ localCombos.length }}个</text>
						</view>

						<view v-for="combo in filteredLocalCombos" :key="combo.id" class="combo-item"
							@click="showComboDetail(combo)">
							<view class="combo-main">
								<view class="combo-info">
									<text class="combo-name">{{ combo.name }}</text>
									<view class="combo-tags">
										<text class="source-tag local">本地</text>
										<text class="platform-tag">{{ getPlatformName(combo.platform) }}</text>
									</view>
								</view>
								<view class="combo-price">
									<text class="price-value">¥{{ combo.price }}</text>
									<text class="food-count">{{ getComboFoodCount(combo.id) }}个菜品</text>
								</view>
							</view>
							<view class="combo-actions">
								<view class="action-btn edit" @click.stop="editCombo(combo)">
									<uni-icons type="edit" size="16" color="#ff6b35"></uni-icons>
								</view>
								<view class="action-btn delete" @click.stop="deleteCombo(combo.id)">
									<uni-icons type="delete" size="16" color="#999"></uni-icons>
								</view>
							</view>
						</view>
					</view>

					<!-- 空状态 -->
					<view class="empty-state" v-if="filteredCdnCombos.length === 0 && filteredLocalCombos.length === 0">
						<view class="empty-icon">🍔</view>
						<text class="empty-text">{{ searchKeyword ? '没有找到匹配的套餐' : '暂无套餐数据' }}</text>
						<text class="empty-hint" v-if="!searchKeyword">点击底部按钮添加套餐</text>
					</view>
				</view>
			</scroll-view>

			<!-- 底部浮窗 -->
			<view class="bottom-float-bar">
				<view class="bottom-float-bar-inner">
					<view class="float-bar-content">
						<view class="sync-btn" @click="syncFromCDN">
							<uni-icons type="refresh" size="18" :color="isSyncing ? '#999' : '#4caf50'"></uni-icons>
							<text>{{ isSyncing ? '同步中...' : '同步数据' }}</text>
						</view>
						<view class="add-combo-btn" @click="showAddComboModal">
							<uni-icons type="plus" size="20" color="#fff"></uni-icons>
							<text>添加套餐</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 添加套餐弹窗 -->
			<view class="modal-overlay" :class="showModal ? 'show' : ''" v-if="showModal" @click="closeModal">
				<view class="modal-content" @click.stop>
					<view class="modal-header">
						<text class="modal-title">{{ editingCombo ? '编辑套餐' : '添加套餐' }}</text>
						<view class="modal-close" @click="closeModal">
							<uni-icons type="close" size="20" color="#999"></uni-icons>
						</view>
					</view>

					<view class="modal-body">
						<view class="form-item">
							<text class="form-label">套餐名称</text>
							<input type="text" v-model="comboForm.name" placeholder="请输入套餐名称" class="form-input" />
						</view>

						<view class="form-item">
							<text class="form-label">价格</text>
							<input type="digit" v-model="comboForm.price" placeholder="请输入价格" class="form-input" />
						</view>

						<view class="form-item">
							<text class="form-label">平台</text>
							<view class="platform-selector">
								<view v-for="p in platformOptions" :key="p.value"
									:class="['platform-option', comboForm.platform === p.value ? 'active' : '']"
									@click="comboForm.platform = p.value">
									<text>{{ p.label }}</text>
								</view>
							</view>
						</view>

						<view class="form-item">
							<text class="form-label">选择菜品</text>
							<view class="food-selector">
								<view v-for="food in availableFoods" :key="food.id"
									:class="['food-option', isFoodSelected(food.id) ? 'selected' : '']"
									@click="toggleFoodSelection(food.id)">
									<text>{{ food.name }}</text>
								</view>
							</view>
						</view>

						<view class="form-item">
							<text class="form-label">链接(可选)</text>
							<input type="text" v-model="comboForm.originalUrl" placeholder="请输入购买链接"
								class="form-input" />
						</view>
					</view>

					<view class="modal-footer">
						<view class="ocr-btn" @click="goToOCR">
							<uni-icons type="camera" size="18" color="#ff6b35"></uni-icons>
							<text>OCR识别</text>
						</view>
						<view class="submit-btn" @click="submitCombo">
							<text>保存</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 套餐详情弹窗 -->
			<view class="modal-overlay" :class="showDetailModal ? 'show' : ''" v-if="showDetailModal" @click="closeDetailModal">
				<view class="modal-content detail-modal" @click.stop>
					<view class="modal-header">
						<text class="modal-title">{{ selectedCombo?.name }}</text>
						<view class="modal-close" @click="closeDetailModal">
							<uni-icons type="close" size="20" color="#999"></uni-icons>
						</view>
					</view>

					<view class="modal-body">
						<view class="detail-row">
							<text class="detail-label">价格</text>
							<text class="detail-value price">¥{{ selectedCombo?.price }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">平台</text>
							<text class="detail-value">{{ getPlatformName(selectedCombo?.platform) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">来源</text>
							<text class="detail-value">
								{{ selectedCombo?.source === 'local' ? '本地添加' : '在线拉取' }}
							</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">包含菜品</text>
						</view>
						<view class="detail-foods">
							<view v-for="food in selectedComboFoods" :key="food.id" class="detail-food-item">
								<text class="detail-food-name">{{ food.name }}</text>
								<text class="detail-food-price">¥{{ food.soloPrice }}</text>
							</view>
						</view>
					</view>

					<view class="modal-footer" v-if="selectedCombo?.source === 'local'">
						<view class="edit-btn" @click="editSelectedCombo">
							<uni-icons type="edit" size="18" color="#ff6b35"></uni-icons>
							<text>编辑</text>
						</view>
						<view class="delete-btn" @click="deleteSelectedCombo">
							<uni-icons type="delete" size="18" color="#999"></uni-icons>
							<text>删除</text>
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

	// 搜索和筛选
	const searchKeyword = ref('')
	const selectedPlatform = ref('all')

	// 平台选项
	const platforms = [{
			id: 'all',
			name: '全部'
		},
		{
			id: 'meituan',
			name: '美团'
		},
		{
			id: 'eleme',
			name: '饿了么'
		},
		{
			id: 'custom',
			name: '自定义'
		}
	]

	const platformOptions = [{
			value: 'meituan',
			label: '美团'
		},
		{
			value: 'eleme',
			label: '饿了么'
		},
		{
			value: 'custom',
			label: '自定义'
		}
	]

	// 弹窗状态
	const showModal = ref(false)
	const showDetailModal = ref(false)
	const editingCombo = ref(null)
	const selectedCombo = ref(null)
	const selectedComboFoods = ref([])

	// 套餐表单
	const comboForm = ref({
		name: '',
		price: '',
		platform: 'custom',
		originalUrl: '',
		foodIds: []
	})

	// CDN套餐和本地套餐
	const cdnCombos = computed(() => dataStore.cdnCombos || [])
	const localCombos = computed(() => dataStore.localCombos || [])
	const isSyncing = computed(() => dataStore.isSyncing || false)

	// 可选择的食物
	const availableFoods = computed(() => dataStore.allFoods || [])

	// 筛选后的CDN套餐
	const filteredCdnCombos = computed(() => {
		let result = cdnCombos.value
		if (searchKeyword.value) {
			result = result.filter(c =>
				c.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
			)
		}
		if (selectedPlatform.value !== 'all') {
			result = result.filter(c => c.platform === selectedPlatform.value)
		}
		return result
	})

	// 筛选后的本地套餐
	const filteredLocalCombos = computed(() => {
		let result = localCombos.value
		if (searchKeyword.value) {
			result = result.filter(c =>
				c.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
			)
		}
		if (selectedPlatform.value !== 'all') {
			result = result.filter(c => c.platform === selectedPlatform.value)
		}
		return result
	})

	// 选择平台分类
	const selectPlatform = (platformId) => {
		selectedPlatform.value = platformId
	}

	// 搜索
	const handleSearch = () => {
		// 搜索由computed自动处理
	}

	// 获取平台显示名称
	const getPlatformName = (platform) => {
		const platformMap = {
			meituan: '美团',
			eleme: '饿了么',
			custom: '自定义'
		}
		return platformMap[platform] || platform || '未知'
	}

	// 获取套餐包含的食物数量
	const getComboFoodCount = (comboId) => {
		return dataStore.allComboFoods.filter(cf => cf.comboId === comboId).length
	}

	// 显示套餐详情
	const showComboDetail = (combo) => {
		selectedCombo.value = combo
		selectedComboFoods.value = dataStore.getComboFoods(combo.id)
		showDetailModal.value = true
	}

	// 关闭详情弹窗
	const closeDetailModal = () => {
		showDetailModal.value = false
		selectedCombo.value = null
		selectedComboFoods.value = []
	}

	// 编辑套餐
	const editCombo = (combo) => {
		editingCombo.value = combo
		const foods = dataStore.getComboFoods(combo.id)
		comboForm.value = {
			name: combo.name,
			price: combo.price.toString(),
			platform: combo.platform || 'custom',
			originalUrl: combo.originalUrl || '',
			foodIds: foods.map(f => f.id)
		}
		showModal.value = true
	}

	// 编辑选中的套餐
	const editSelectedCombo = () => {
		closeDetailModal()
		editCombo(selectedCombo.value)
	}

	// 删除选中的套餐
	const deleteSelectedCombo = () => {
		if (!selectedCombo.value) return
		uni.showModal({
			title: '删除套餐',
			content: '确定要删除这个套餐吗？',
			success: (res) => {
				if (res.confirm) {
					dataStore.deleteCombo(selectedCombo.value.id)
					closeDetailModal()
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})
				}
			}
		})
	}

	// 删除套餐
	const deleteCombo = (comboId) => {
		const isCDN = cdnCombos.value.some(c => c.id === comboId)
		uni.showModal({
			title: isCDN ? '隐藏套餐' : '删除套餐',
			content: isCDN ? '确定要隐藏这个在线套餐吗？' : '确定要删除这个套餐吗？',
			success: (res) => {
				if (res.confirm) {
					dataStore.deleteCombo(comboId)
					uni.showToast({
						title: '操作成功',
						icon: 'success'
					})
				}
			}
		})
	}

	// 显示添加套餐弹窗
	const showAddComboModal = () => {
		editingCombo.value = null
		comboForm.value = {
			name: '',
			price: '',
			platform: 'custom',
			originalUrl: '',
			foodIds: []
		}
		showModal.value = true
	}

	// 关闭弹窗
	const closeModal = () => {
		showModal.value = false
		editingCombo.value = null
	}

	// 检查食物是否已选
	const isFoodSelected = (foodId) => {
		return comboForm.value.foodIds.includes(foodId)
	}

	// 切换食物选择
	const toggleFoodSelection = (foodId) => {
		const index = comboForm.value.foodIds.indexOf(foodId)
		if (index === -1) {
			comboForm.value.foodIds.push(foodId)
		} else {
			comboForm.value.foodIds.splice(index, 1)
		}
	}

	// 提交套餐
	const submitCombo = () => {
		if (!comboForm.value.name) {
			uni.showToast({
				title: '请输入套餐名称',
				icon: 'none'
			})
			return
		}
		if (!comboForm.value.price) {
			uni.showToast({
				title: '请输入价格',
				icon: 'none'
			})
			return
		}

		const comboData = {
			name: comboForm.value.name,
			price: parseFloat(comboForm.value.price),
			platform: comboForm.value.platform,
			originalUrl: comboForm.value.originalUrl
		}

		if (editingCombo.value) {
			dataStore.updateCombo(editingCombo.value.id, comboData, comboForm.value.foodIds)
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			})
		} else {
			dataStore.addCombo(comboData, comboForm.value.foodIds)
			uni.showToast({
				title: '添加成功',
				icon: 'success'
			})
		}

		closeModal()
	}

	// 跳转到OCR
	const goToOCR = () => {
		uni.showToast({
			title: 'OCR功能开发中',
			icon: 'none'
		})
	}

	// 从CDN同步
	const syncFromCDN = async () => {
		uni.showLoading({
			title: '同步中...'
		})
		try {
			await dataStore.syncFromCDN()
			uni.hideLoading()
			uni.showToast({
				title: '同步成功',
				icon: 'success'
			})
		} catch (e) {
			uni.hideLoading()
			uni.showToast({
				title: '同步失败',
				icon: 'none'
			})
		}
	}

	// 组件挂载时初始化
	onMounted(async () => {
		await dataStore.init()
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
		min-height: 100vh;
		background: linear-gradient(180deg, #fff 0%, var(--color-bg) 100%);
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
		font-family: var(--font-family);
	}

	/* ===== 头部 ===== */
	.header {
		padding: 22rpx 32rpx;
		padding-top: calc(22rpx + env(safe-area-inset-top));
		background: var(--color-primary-gradient);
		position: relative;
		overflow: hidden;
	}

	.header::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 320rpx;
		height: 320rpx;
		background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%);
		border-radius: 50%;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		position: relative;
		z-index: 1;
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

	/* ===== 搜索栏 ===== */
	.search-section {
		padding: 20rpx 32rpx;
		background-color: rgba(255, 255, 255, 0.97);
		backdrop-filter: blur(10px);
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 16rpx;
		background-color: #f5f5f5;
		border-radius: 44rpx;
		padding: 16rpx 22rpx;
		transition: all 0.3s ease;
	}

	.search-bar:focus-within {
		background-color: #fff;
		box-shadow: 0 4rpx 24rpx rgba(232, 93, 4, 0.12);
	}

	.search-input {
		flex: 1;
		font-size: var(--font-size-md);
		color: var(--color-text);
	}

	.search-input::placeholder {
		color: var(--color-text-tertiary);
	}

	.search-btn {
		padding: 12rpx 30rpx;
		background: var(--color-primary-gradient);
		border-radius: 24rpx;
		transition: all 0.2s ease;
	}

	.search-btn:active {
		transform: scale(0.95);
	}

	.search-btn text {
		font-size: var(--font-size-sm);
		color: #fff;
		font-weight: 600;
	}

	/* ===== 平台标签 ===== */
	.platform-tabs {
		display: flex;
		gap: 16rpx;
		padding: 20rpx 32rpx;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.platform-tabs::-webkit-scrollbar {
		display: none;
	}

	.platform-tab {
		padding: 14rpx 34rpx;
		background-color: var(--color-bg-card);
		border-radius: 24rpx;
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		white-space: nowrap;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1.5px solid transparent;
	}

	.platform-tab.active {
		background: var(--color-primary-gradient);
		color: #fff;
		box-shadow: 0 6rpx 24rpx rgba(232, 93, 4, 0.35);
		font-weight: 600;
	}

	.platform-tab:active {
		transform: scale(0.95);
	}

	/* ===== 套餐列表 ===== */
	.combo-scroll {
		flex: 1;
		min-height: 0;
	}

	.combo-list {
		padding: 0 32rpx 32rpx;
	}

	.combo-section {
		margin-bottom: 40rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 18rpx;
	}

	.section-title-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.section-title {
		font-size: var(--font-size-md);
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

	.combo-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--color-bg-card);
		border-radius: 22rpx;
		padding: 28rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1.5px solid transparent;
		animation: fadeInUp 0.4s ease-out both;
	}

	.combo-item:nth-child(1) { animation-delay: 0.04s; }
	.combo-item:nth-child(2) { animation-delay: 0.08s; }
	.combo-item:nth-child(3) { animation-delay: 0.12s; }
	.combo-item:nth-child(4) { animation-delay: 0.16s; }
	.combo-item:nth-child(5) { animation-delay: 0.2s; }

	.combo-item:active {
		transform: scale(0.985);
		border-color: var(--color-primary);
	}

	.combo-main {
		flex: 1;
		min-width: 0;
	}

	.combo-info {
		margin-bottom: 14rpx;
	}

	.combo-name {
		font-size: var(--font-size-lg);
		color: var(--color-text);
		font-weight: 700;
		display: block;
		margin-bottom: 10rpx;
		letter-spacing: var(--letter-spacing-tight);
	}

	.combo-tags {
		display: flex;
		gap: 10rpx;
		flex-wrap: wrap;
	}

	.source-tag {
		padding: 6rpx 14rpx;
		border-radius: 12rpx;
		font-size: var(--font-size-xs);
		font-weight: 600;
	}

	.source-tag.cdn {
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		color: #2e7d32;
	}

	.source-tag.local {
		background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
		color: #e65100;
	}

	.platform-tag {
		padding: 6rpx 14rpx;
		background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
		border-radius: 12rpx;
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.combo-price {
		display: flex;
		align-items: baseline;
		gap: 14rpx;
	}

	.price-value {
		font-size: var(--font-size-xl);
		color: var(--color-primary);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.food-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
	}

	.combo-actions {
		display: flex;
		gap: 14rpx;
		margin-left: 18rpx;
	}

	.action-btn {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: #f5f5f5;
		transition: all 0.2s ease;
	}

	.action-btn:active {
		transform: scale(0.9);
	}

	.action-btn.delete:active {
		background-color: #ffebee;
	}

	/* ===== 空状态 ===== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 140rpx 0;
		animation: fadeInUp 0.5s ease-out;
	}

	.empty-icon {
		font-size: 100rpx;
		margin-bottom: 28rpx;
		opacity: 0.45;
	}

	.empty-text {
		font-size: var(--font-size-lg);
		color: var(--color-text-secondary);
		margin-bottom: 14rpx;
		font-weight: 600;
	}

	.empty-hint {
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
		padding: 18rpx 22rpx;
		gap: 16rpx;
	}

	.sync-btn {
		display: flex;
		align-items: center;
		gap: 10rpx;
		padding: 16rpx 30rpx;
		background-color: #f5f5f5;
		border-radius: 40rpx;
		transition: all 0.2s ease;
	}

	.sync-btn:active {
		transform: scale(0.95);
		background-color: #e8e8e8;
	}

	.sync-btn text {
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.add-combo-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		padding: 20rpx;
		background: var(--color-primary-gradient);
		border-radius: 40rpx;
		box-shadow: 0 8rpx 28rpx rgba(232, 93, 4, 0.35);
		transition: all 0.2s ease;
	}

	.add-combo-btn:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 16rpx rgba(232, 93, 4, 0.25);
	}

	.add-combo-btn text {
		font-size: var(--font-size-md);
		color: #fff;
		font-weight: 600;
	}

	/* ===== 弹窗样式 ===== */
	.modal-overlay {
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

	.modal-overlay.show {
		opacity: 1;
	}

	.modal-content {
		width: 100%;
		max-height: 85vh;
		background-color: var(--color-bg-card);
		border-radius: 28rpx 28rpx 0 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transform: translateY(100%);
		transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.modal-overlay.show .modal-content {
		transform: translateY(0);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
		background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
	}

	.modal-title {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: var(--letter-spacing-tight);
	}

	.modal-close {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.modal-close:active {
		background-color: #e8e8e8;
		transform: scale(0.9);
	}

	.modal-body {
		padding: 32rpx;
		max-height: 60vh;
		overflow-y: auto;
	}

	.form-item {
		margin-bottom: 32rpx;
	}

	.form-item:last-child {
		margin-bottom: 0;
	}

	.form-label {
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		display: block;
		margin-bottom: 14rpx;
		font-weight: 600;
	}

	.form-input {
		width: 100%;
		height: 88rpx;
		background-color: #f8f8f8;
		border-radius: 20rpx;
		padding: 0 24rpx;
		font-size: var(--font-size-md);
		color: var(--color-text);
		transition: all 0.2s ease;
		border: 1.5px solid transparent;
	}

	.form-input:focus {
		border-color: var(--color-primary);
		background-color: #fff;
	}

	.platform-selector {
		display: flex;
		gap: 14rpx;
	}

	.platform-option {
		flex: 1;
		padding: 16rpx 20rpx;
		background-color: #f5f5f5;
		border-radius: 20rpx;
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
		text-align: center;
		transition: all 0.2s ease;
		border: 1.5px solid transparent;
	}

	.platform-option.active {
		background: var(--color-primary-gradient);
		color: #fff;
		border-color: transparent;
		font-weight: 600;
	}

	.platform-option:active {
		transform: scale(0.95);
	}

	.food-selector {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.food-option {
		padding: 14rpx 24rpx;
		background-color: #f5f5f5;
		border-radius: 16rpx;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		transition: all 0.2s ease;
		border: 1.5px solid transparent;
	}

	.food-option.selected {
		background-color: #fff3e0;
		border-color: #ff9800;
		color: #e65100;
		font-weight: 600;
	}

	.food-option:active {
		transform: scale(0.95);
	}

	.modal-footer {
		display: flex;
		gap: 16rpx;
		padding: 22rpx 32rpx;
		padding-bottom: calc(22rpx + env(safe-area-inset-bottom));
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.ocr-btn,
	.submit-btn {
		flex: 1;
		height: 90rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		border-radius: 45rpx;
		font-size: var(--font-size-md);
		transition: all 0.2s ease;
	}

	.ocr-btn {
		background-color: #fff;
		border: 2px solid var(--color-primary);
	}

	.ocr-btn:active {
		background-color: #fff5f0;
		transform: scale(0.95);
	}

	.ocr-btn text {
		color: var(--color-primary);
		font-weight: 600;
	}

	.submit-btn {
		background: var(--color-primary-gradient);
		box-shadow: 0 8rpx 28rpx rgba(232, 93, 4, 0.35);
	}

	.submit-btn:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 16rpx rgba(232, 93, 4, 0.25);
	}

	.submit-btn text {
		color: #fff;
		font-weight: 700;
	}

	/* ===== 详情弹窗 ===== */
	.detail-modal .modal-body {
		padding: 26rpx 32rpx;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
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

	.detail-value.price {
		font-size: var(--font-size-xxl);
		color: var(--color-primary);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.detail-foods {
		margin-top: 20rpx;
	}

	.detail-food-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18rpx 22rpx;
		background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
		border-radius: 14rpx;
		margin-bottom: 12rpx;
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

	.detail-modal .modal-footer {
		justify-content: center;
		gap: 20rpx;
	}

	.edit-btn,
	.delete-btn {
		flex: 1;
		height: 86rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		border-radius: 43rpx;
		font-size: var(--font-size-md);
		transition: all 0.2s ease;
	}

	.edit-btn {
		background-color: #fff5f0;
	}

	.edit-btn:active {
		background-color: #ffe0d0;
		transform: scale(0.95);
	}

	.edit-btn text {
		color: var(--color-primary);
		font-weight: 600;
	}

	.delete-btn {
		background-color: #f5f5f5;
	}

	.delete-btn:active {
		background-color: #e8e8e8;
		transform: scale(0.95);
	}

	.delete-btn text {
		color: var(--color-text-secondary);
	}
</style>