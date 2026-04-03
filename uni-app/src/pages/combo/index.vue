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
			<view class="modal-overlay" v-if="showModal" @click="closeModal">
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
			<view class="modal-overlay" v-if="showDetailModal" @click="closeDetailModal">
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
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
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

	.search-section {
		padding: 20rpx 30rpx;
		background-color: #fff;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 16rpx;
		background-color: #f5f5f5;
		border-radius: 40rpx;
		padding: 16rpx 24rpx;
	}

	.search-input {
		flex: 1;
		font-size: 28rpx;
		color: #333;
	}

	.search-btn {
		padding: 10rpx 24rpx;
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		border-radius: 20rpx;
	}

	.search-btn text {
		font-size: 24rpx;
		color: #fff;
	}

	.platform-tabs {
		display: flex;
		gap: 16rpx;
		padding: 20rpx 30rpx;
		overflow-x: auto;
	}

	.platform-tab {
		padding: 12rpx 28rpx;
		background-color: #fff;
		border-radius: 20rpx;
		font-size: 26rpx;
		color: #666;
		white-space: nowrap;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}

	.platform-tab.active {
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		color: #fff;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.3);
	}

	.combo-scroll {
		flex: 1;
		min-height: 0;
	}

	.combo-list {
		padding: 0 30rpx 30rpx;
	}

	.combo-section {
		margin-bottom: 30rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.section-title-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.section-count {
		font-size: 24rpx;
		color: #999;
	}

	.combo-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #fff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 14rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}

	.combo-main {
		flex: 1;
		min-width: 0;
	}

	.combo-info {
		margin-bottom: 12rpx;
	}

	.combo-name {
		font-size: 30rpx;
		color: #333;
		font-weight: 500;
		display: block;
		margin-bottom: 8rpx;
	}

	.combo-tags {
		display: flex;
		gap: 10rpx;
	}

	.source-tag {
		padding: 4rpx 12rpx;
		border-radius: 10rpx;
		font-size: 20rpx;
	}

	.source-tag.cdn {
		background-color: #e8f5e9;
		color: #4caf50;
	}

	.source-tag.local {
		background-color: #fff3e0;
		color: #ff9800;
	}

	.platform-tag {
		padding: 4rpx 12rpx;
		background-color: #f5f5f5;
		border-radius: 10rpx;
		font-size: 20rpx;
		color: #666;
	}

	.combo-price {
		display: flex;
		align-items: baseline;
		gap: 12rpx;
	}

	.price-value {
		font-size: 32rpx;
		color: #ff6b35;
		font-weight: bold;
	}

	.food-count {
		font-size: 22rpx;
		color: #999;
	}

	.combo-actions {
		display: flex;
		gap: 16rpx;
	}

	.action-btn {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: #f5f5f5;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;
	}

	.empty-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
	}

	.empty-text {
		font-size: 30rpx;
		color: #666;
		margin-bottom: 10rpx;
	}

	.empty-hint {
		font-size: 26rpx;
		color: #999;
	}

	/* 底部浮窗 */
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
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
		overflow: hidden;
	}

	.float-bar-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx 20rpx;
		gap: 16rpx;
	}

	.sync-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 24rpx;
		background-color: #f5f5f5;
		border-radius: 40rpx;
	}

	.sync-btn text {
		font-size: 26rpx;
		color: #666;
	}

	.add-combo-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 20rpx;
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		border-radius: 40rpx;
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 53, 0.4);
	}

	.add-combo-btn text {
		font-size: 28rpx;
		color: #fff;
		font-weight: 500;
	}

	/* 弹窗样式 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		width: 100%;
		max-height: 85vh;
		background-color: #fff;
		border-radius: 32rpx 32rpx 0 0;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-close {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		border-radius: 50%;
	}

	.modal-body {
		padding: 30rpx;
		max-height: 60vh;
		overflow-y: auto;
	}

	.form-item {
		margin-bottom: 30rpx;
	}

	.form-label {
		font-size: 26rpx;
		color: #666;
		display: block;
		margin-bottom: 12rpx;
	}

	.form-input {
		width: 100%;
		height: 80rpx;
		background-color: #f5f5f5;
		border-radius: 20rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
	}

	.platform-selector {
		display: flex;
		gap: 16rpx;
	}

	.platform-option {
		padding: 14rpx 28rpx;
		background-color: #f5f5f5;
		border-radius: 20rpx;
		font-size: 26rpx;
		color: #666;
	}

	.platform-option.active {
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		color: #fff;
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
		font-size: 24rpx;
		color: #666;
		max-width: 45%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.food-option.selected {
		background-color: #fff3e0;
		border: 2rpx solid #ff9800;
		color: #ff9800;
	}

	.modal-footer {
		display: flex;
		gap: 16rpx;
		padding: 20rpx 30rpx;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
		border-top: 1rpx solid #f0f0f0;
	}

	.ocr-btn,
	.submit-btn {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		border-radius: 44rpx;
		font-size: 28rpx;
	}

	.ocr-btn {
		background-color: #fff5f0;
		border: 2rpx solid #ff6b35;
	}

	.ocr-btn text {
		color: #ff6b35;
	}

	.submit-btn {
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 53, 0.4);
	}

	.submit-btn text {
		color: #fff;
		font-weight: 500;
	}

	/* 详情弹窗 */
	.detail-modal .modal-body {
		padding: 20rpx 30rpx;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
	}

	.detail-label {
		font-size: 26rpx;
		color: #999;
	}

	.detail-value {
		font-size: 26rpx;
		color: #333;
	}

	.detail-value.price {
		font-size: 34rpx;
		color: #ff6b35;
		font-weight: bold;
	}

	.detail-foods {
		margin-top: 16rpx;
	}

	.detail-food-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 20rpx;
		background-color: #f9f9f9;
		border-radius: 12rpx;
		margin-bottom: 10rpx;
	}

	.detail-food-name {
		font-size: 26rpx;
		color: #333;
	}

	.detail-food-price {
		font-size: 24rpx;
		color: #999;
	}

	.detail-modal .modal-footer {
		justify-content: center;
	}

	.edit-btn,
	.delete-btn {
		flex: 1;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		border-radius: 40rpx;
		font-size: 26rpx;
	}

	.edit-btn {
		background-color: #fff5f0;
	}

	.edit-btn text {
		color: #ff6b35;
	}

	.delete-btn {
		background-color: #f5f5f5;
	}

	.delete-btn text {
		color: #666;
	}
</style>