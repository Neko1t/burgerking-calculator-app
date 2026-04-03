/**
 * 套餐推荐算法服务
 */
import {
	useDataStore
} from './data' // 修复：补充导入 store

// --- 辅助工具函数：统计数组中元素的频次 ---
function getFrequencyMap(arr) {
	return arr.reduce((acc, val) => {
		acc[val] = (acc[val] || 0) + 1
		return acc
	}, {})
}

/**
 * 推荐套餐
 * @param {string[]} selectedFoodIds - 用户选择的菜品ID列表 (可能包含重复ID)
 * @returns {Array} 推荐结果列表
 */
export function recommendCombos(selectedFoodIds) {
	if (!selectedFoodIds || selectedFoodIds.length === 0) return []

	const dataStore = useDataStore()

	// 1. 获取每个选中食物的关联套餐集合
	const foodComboSets = selectedFoodIds.map(foodId => {
		const food = dataStore.getFoodById(foodId)
		return new Set(food?.comboIds || [])
	})

	// 2. 收集所有相关的套餐ID
	const allRelatedComboIds = new Set()
	foodComboSets.forEach(set => {
		set.forEach(comboId => allRelatedComboIds.add(comboId))
	})

	// 3. 区分精确匹配和部分匹配
	const exactMatches = []
	const partialMatches = []

	// 将用户的需求转为频次表 (例如：{ 'burger1': 2, 'cola': 1 })
	const userRequirementMap = getFrequencyMap(selectedFoodIds)

	allRelatedComboIds.forEach(comboId => {
		// 获取该套餐实际包含的食物清单
		const comboFoodsList = dataStore.comboFoods
			.filter(cf => cf.comboId === comboId)
			.map(cf => cf.foodId)

		const comboProvideMap = getFrequencyMap(comboFoodsList)

		// 检查是否覆盖了用户的全部需求（种类和数量都要满足）
		let isExact = true
		for (const [foodId, requiredCount] of Object.entries(userRequirementMap)) {
			const providedCount = comboProvideMap[foodId] || 0
			if (providedCount < requiredCount) {
				isExact = false
				break
			}
		}

		if (isExact) {
			exactMatches.push(comboId)
		} else {
			partialMatches.push(comboId)
		}
	})

	// 4. 组装推荐数据
	const allCombos = dataStore.combos
	const allComboFoods = dataStore.comboFoods

	const recommendations = [
		...exactMatches.map(comboId => ({
			combo: allCombos.find(c => c.id === comboId),
			type: 'exact',
			// 精确匹配：匹配到的食物就是用户选的食物
			matchedFoodIds: selectedFoodIds
		})),
		...partialMatches.map(comboId => ({
			combo: allCombos.find(c => c.id === comboId),
			type: 'partial',
			matchedFoodIds: calculateMatchedFoods(comboId, selectedFoodIds, allComboFoods)
		}))
	]

	// 5. 计算性价比得分并排序
	return recommendations
		.map(rec => ({
			...rec,
			costEfficiency: calculateCostEfficiency(rec, allCombos, allComboFoods, selectedFoodIds, dataStore)
		}))
		.sort(sortRecommendations)
}

/**
 * 计算性价比 (修复：处理了相同商品多份的计算 Bug)
 */
function calculateCostEfficiency(recommendation, allCombos, allComboFoods, selectedFoodIds, dataStore) {
	const {
		combo,
		type,
		matchedFoodIds
	} = recommendation

	// 计算匹配到的食物在单点时的总原价
	const soloPrice = matchedFoodIds.reduce((sum, foodId) => {
		const food = dataStore.getFoodById(foodId)
		return sum + (food?.soloPrice || 0)
	}, 0)

	// 防止除以0或价格异常
	if (!combo.price || combo.price <= 0) return 0

	if (type === 'exact') {
		return soloPrice / combo.price
	}

	// 部分匹配：考虑匹配度权重
	const totalItemsInCombo = allComboFoods.filter(cf => cf.comboId === combo.id).length
	// 防止空套餐报错
	const matchRatio = totalItemsInCombo > 0 ? (matchedFoodIds.length / totalItemsInCombo) : 0

	return (soloPrice / combo.price) * matchRatio
}

/**
 * 计算匹配的食物ID (修复：基于数量的交集计算)
 */
function calculateMatchedFoods(comboId, selectedFoodIds, allComboFoods) {
	const comboFoodIds = allComboFoods
		.filter(cf => cf.comboId === comboId)
		.map(cf => cf.foodId)

	const userRequirementMap = getFrequencyMap(selectedFoodIds)
	const comboProvideMap = getFrequencyMap(comboFoodIds)

	const matchedIds = []

	// 取两者的交集（按最小数量）
	for (const foodId of Object.keys(userRequirementMap)) {
		const required = userRequirementMap[foodId] || 0
		const provided = comboProvideMap[foodId] || 0
		const matchCount = Math.min(required, provided)

		for (let i = 0; i < matchCount; i++) {
			matchedIds.push(foodId)
		}
	}

	return matchedIds
}

/**
 * 排序推荐
 */
function sortRecommendations(a, b) {
	// 1. 精确匹配优先
	if (a.type !== b.type) return a.type === 'exact' ? -1 : 1

	// 2. 性价比降序
	if (a.costEfficiency !== b.costEfficiency) {
		return b.costEfficiency - a.costEfficiency
	}

	// 3. 价格升序
	if (a.combo.price !== b.combo.price) {
		return a.combo.price - b.combo.price
	}

	return 0
}

export function getExactMatches(recommendations) {
	return recommendations.filter(item => item.type === 'exact')
}

export function getHighValueMatches(recommendations) {
	return recommendations.filter(item => item.type === 'partial' && item.costEfficiency > 1)
}

export function getPartialMatches(recommendations) {
	return recommendations.filter(item => item.type === 'partial' && item.costEfficiency <= 1)
}

/**
 * 计算节省金额
 */
export function calculateSavedAmount(recommendation, selectedFoodIds, dataStore) {
	const {
		combo,
		matchedFoodIds
	} = recommendation
	const soloPrice = matchedFoodIds.reduce((sum, foodId) => {
		const food = dataStore.getFoodById(foodId)
		return sum + (food?.soloPrice || 0)
	}, 0)

	return soloPrice - combo.price
}