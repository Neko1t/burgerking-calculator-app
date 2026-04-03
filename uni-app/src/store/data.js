import { defineStore } from 'pinia'

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Neko1t/burgerking-calculator@master/data'

export const useDataStore = defineStore('data', {
	state: () => ({
		// CDN基础数据（只读）
		cdnFoods: [],
		cdnCombos: [],
		cdnComboFoods: [],

		// 本地用户数据（可读写）
		localFoods: [],
		localCombos: [],
		localComboFoods: [],

		// 用户删除记录
		deletedItems: [],

		// 版本信息
		cdnVersion: '1.0.0',
		localVersion: '1.0.0',
		lastSyncTime: null,

		// 加载状态
		isLoading: false,
		isSyncing: false
	}),

	getters: {
		// 合并后的食物列表（CDN + 本地）
		allFoods: (state) => {
			const cdnFiltered = state.cdnFoods.filter(
				f => !state.deletedItems.some(d => d.type === 'food' && d.id === f.id)
			)
			return [...cdnFiltered, ...state.localFoods]
		},

		// 合并后的套餐列表
		allCombos: (state) => {
			const cdnFiltered = state.cdnCombos.filter(
				c => !state.deletedItems.some(d => d.type === 'combo' && d.id === c.id)
			)
			return [...cdnFiltered, ...state.localCombos]
		},

		// 合并后的套餐食物关联
		allComboFoods: (state) => {
			const cdnFiltered = state.cdnComboFoods.filter(
				cf => !state.deletedItems.some(d =>
					(d.type === 'combo' && d.id === cf.comboId) ||
					(d.type === 'food' && d.id === cf.foodId)
				)
			)
			return [...cdnFiltered, ...state.localComboFoods]
		},

		// 兼容旧API - foods
		foods: (state) => {
			const cdnFiltered = state.cdnFoods.filter(
				f => !state.deletedItems.some(d => d.type === 'food' && d.id === f.id)
			)
			return [...cdnFiltered, ...state.localFoods]
		},

		// 兼容旧API - combos
		combos: (state) => {
			const cdnFiltered = state.cdnCombos.filter(
				c => !state.deletedItems.some(d => d.type === 'combo' && d.id === c.id)
			)
			return [...cdnFiltered, ...state.localCombos]
		},

		// 兼容旧API - comboFoods
		comboFoods: (state) => {
			const cdnFiltered = state.cdnComboFoods.filter(
				cf => !state.deletedItems.some(d =>
					(d.type === 'combo' && d.id === cf.comboId) ||
					(d.type === 'food' && d.id === cf.foodId)
				)
			)
			return [...cdnFiltered, ...state.localComboFoods]
		},

		// 获取已删除的CDN食物
		deletedFoods: (state) => {
			return state.deletedItems
				.filter(d => d.type === 'food')
				.map(d => state.cdnFoods.find(f => f.id === d.id))
				.filter(Boolean)
		},

		// 获取已删除的CDN套餐
		deletedCombos: (state) => {
			return state.deletedItems
				.filter(d => d.type === 'combo')
				.map(d => state.cdnCombos.find(c => c.id === d.id))
				.filter(Boolean)
		}
	},

	actions: {
		// 初始化：从本地存储加载数据
		async init() {
			this.isLoading = true
			try {
				// 1. 尝试从本地存储加载
				this.loadFromLocal()

				// 2. 检查CDN更新
				await this.syncFromCDN()
			} finally {
				this.isLoading = false
			}
		},

		// 从本地存储加载
		loadFromLocal() {
			try {
				const localData = uni.getStorageSync('local_user_data')
				if (localData) {
					this.localFoods = localData.localFoods || []
					this.localCombos = localData.localCombos || []
					this.localComboFoods = localData.localComboFoods || []
					this.deletedItems = localData.deletedItems || []
					this.localVersion = localData.version || '1.0.0'
				}

				// 加载CDN缓存
				const cdnCache = uni.getStorageSync('cdn_data_cache')
				if (cdnCache) {
					this.cdnFoods = cdnCache.cdnFoods || []
					this.cdnCombos = cdnCache.cdnCombos || []
					this.cdnComboFoods = cdnCache.cdnComboFoods || []
					this.cdnVersion = cdnCache.version || '1.0.0'
				}
			} catch (error) {
				console.error('加载本地数据失败:', error)
			}
		},

		// 保存到本地存储
		saveToLocal() {
			try {
				const localData = {
					version: this.localVersion,
					localFoods: this.localFoods,
					localCombos: this.localCombos,
					localComboFoods: this.localComboFoods,
					deletedItems: this.deletedItems,
					lastUpdate: new Date().toISOString()
				}
				uni.setStorageSync('local_user_data', localData)
			} catch (error) {
				console.error('保存本地数据失败:', error)
			}
		},

		// 从CDN同步数据
		async syncFromCDN() {
			this.isSyncing = true
			try {
				const metadata = await this.fetchData('metadata.json')

				// 下载CDN数据
				const [foodsData, combosData, comboFoodsData] = await Promise.all([
					this.fetchData('foods.json'),
					this.fetchData('combos.json'),
					this.fetchData('combo_foods.json')
				])

				this.cdnFoods = foodsData.foods || []
				this.cdnCombos = combosData.combos || []
				this.cdnComboFoods = comboFoodsData.comboFoods || []
				this.cdnVersion = metadata.version

				// 保存到CDN缓存
				uni.setStorageSync('cdn_data_cache', {
					cdnFoods: this.cdnFoods,
					cdnCombos: this.cdnCombos,
					cdnComboFoods: this.cdnComboFoods,
					version: this.cdnVersion
				})

				this.lastSyncTime = new Date().toISOString()
			} catch (error) {
				console.error('从CDN同步数据失败:', error)
				// 如果CDN加载失败，使用本地缓存
				if (this.cdnFoods.length === 0) {
					const cdnCache = uni.getStorageSync('cdn_data_cache')
					if (cdnCache) {
						this.cdnFoods = cdnCache.cdnFoods || []
						this.cdnCombos = cdnCache.cdnCombos || []
						this.cdnComboFoods = cdnCache.cdnComboFoods || []
					}
				}
			} finally {
				this.isSyncing = false
			}
		},

		// 从CDN获取数据
		fetchData(filename) {
			const url = `${CDN_BASE}/${filename}`
			return new Promise((resolve, reject) => {
				uni.request({
					url,
					method: 'GET',
					success: (res) => {
						if (res.statusCode >= 200 && res.statusCode < 300) {
							resolve(res.data)
						} else {
							reject(new Error(`获取${filename}失败: HTTP状态码 ${res.statusCode}`))
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},

		// ==================== 本地增删改操作 ====================

		// 添加食物
		addFood(food) {
			const newFood = {
				...food,
				id: `local_food_${Date.now()}`,
				source: 'local',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
			this.localFoods.push(newFood)
			this.saveToLocal()
			return newFood
		},

		// 更新食物
		updateFood(foodId, updates) {
			const index = this.localFoods.findIndex(f => f.id === foodId)
			if (index !== -1) {
				this.localFoods[index] = {
					...this.localFoods[index],
					...updates,
					updatedAt: new Date().toISOString()
				}
				this.saveToLocal()
			}
		},

		// 删除食物
		deleteFood(foodId) {
			// 如果是CDN数据，记录到deletedItems
			const isCDNFood = this.cdnFoods.some(f => f.id === foodId)
			if (isCDNFood) {
				this.deletedItems.push({
					type: 'food',
					id: foodId,
					deletedAt: new Date().toISOString()
				})
			} else {
				// 本地数据直接删除
				this.localFoods = this.localFoods.filter(f => f.id !== foodId)
				this.localComboFoods = this.localComboFoods.filter(cf => cf.foodId !== foodId)
			}
			this.saveToLocal()
		},

		// 恢复CDN食物（从删除列表移除）
		restoreFood(foodId) {
			this.deletedItems = this.deletedItems.filter(
				d => !(d.type === 'food' && d.id === foodId)
			)
			this.saveToLocal()
		},

		// 添加套餐
		addCombo(combo, foodIds) {
			const newCombo = {
				...combo,
				id: `local_combo_${Date.now()}`,
				source: 'local',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
			this.localCombos.push(newCombo)

			// 添加套餐食物关联
			const comboFoods = (foodIds || []).map(foodId => ({
				comboId: newCombo.id,
				foodId,
				quantity: 1
			}))
			this.localComboFoods.push(...comboFoods)

			this.saveToLocal()
			return newCombo
		},

		// 更新套餐
		updateCombo(comboId, updates, newFoodIds) {
			const index = this.localCombos.findIndex(c => c.id === comboId)
			if (index !== -1) {
				this.localCombos[index] = {
					...this.localCombos[index],
					...updates,
					updatedAt: new Date().toISOString()
				}

				// 更新套餐食物关联
				if (newFoodIds) {
					this.localComboFoods = this.localComboFoods.filter(cf => cf.comboId !== comboId)
					const comboFoods = newFoodIds.map(foodId => ({
						comboId,
						foodId,
						quantity: 1
					}))
					this.localComboFoods.push(...comboFoods)
				}

				this.saveToLocal()
			}
		},

		// 删除套餐
		deleteCombo(comboId) {
			const isCDNCombo = this.cdnCombos.some(c => c.id === comboId)
			if (isCDNCombo) {
				this.deletedItems.push({
					type: 'combo',
					id: comboId,
					deletedAt: new Date().toISOString()
				})
			} else {
				this.localCombos = this.localCombos.filter(c => c.id !== comboId)
				this.localComboFoods = this.localComboFoods.filter(cf => cf.comboId !== comboId)
			}
			this.saveToLocal()
		},

		// 恢复CDN套餐
		restoreCombo(comboId) {
			this.deletedItems = this.deletedItems.filter(
				d => !(d.type === 'combo' && d.id === comboId)
			)
			this.saveToLocal()
		},

		// 获取单个套餐的所有食物
		getComboFoods(comboId) {
			const allFoods = this.allFoods
			const comboFoodIds = this.allComboFoods
				.filter(cf => cf.comboId === comboId)
				.map(cf => cf.foodId)
			return allFoods.filter(f => comboFoodIds.includes(f.id))
		},

		// 获取食物所在的所有套餐
		getCombosByFoodId(foodId) {
			const comboIds = this.allComboFoods
				.filter(cf => cf.foodId === foodId)
				.map(cf => cf.comboId)
			return this.allCombos.filter(c => comboIds.includes(c.id))
		},

		// 兼容旧API
		getFoodById(id) {
			return this.allFoods.find(f => f.id === id)
		},

		getComboById(id) {
			return this.allCombos.find(c => c.id === id)
		},

		getComboFoodCount(comboId) {
			return this.allComboFoods.filter(cf => cf.comboId === comboId).length
		},

		// ==================== 数据导出导入 ====================

		// 导出本地数据
		exportLocalData() {
			return {
				version: this.localVersion,
				localFoods: this.localFoods,
				localCombos: this.localCombos,
				localComboFoods: this.localComboFoods,
				deletedItems: this.deletedItems,
				exportTime: new Date().toISOString()
			}
		},

		// 导入本地数据
		importLocalData(data) {
			if (data.localFoods) this.localFoods = data.localFoods
			if (data.localCombos) this.localCombos = data.localCombos
			if (data.localComboFoods) this.localComboFoods = data.localComboFoods
			if (data.deletedItems) this.deletedItems = data.deletedItems
			if (data.version) this.localVersion = data.version
			this.saveToLocal()
		},

		// 清除本地数据
		clearLocalData() {
			this.localFoods = []
			this.localCombos = []
			this.localComboFoods = []
			this.deletedItems = []
			this.localVersion = '1.0.0'
			this.saveToLocal()
		}
	}
})
