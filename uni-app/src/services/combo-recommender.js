/**
 * 套餐推荐算法服务
 *
 * 使用 foodName 作为菜品唯一标识
 * 匹配策略：
 * 1. 精确匹配 (exact) - 单套餐完全覆盖用户选择
 * 2. 多套餐匹配 (multi_combo) - 多套餐组合完全覆盖
 * 3. 置换匹配 (substitution) - 按类别优先级替换实现降级覆盖
 */

import { useDataStore } from '../store/data'

// --- 辅助工具函数：统计数组中元素的频次 ---
function getFrequencyMap(arr) {
	return arr.reduce((acc, val) => {
		acc[val] = (acc[val] || 0) + 1
		return acc
	}, {})
}

// --- 类别优先级 (数值越小优先级越高) ---
const CATEGORY_PRIORITY = {
	'主食': 1,    // 汉堡
	'小食': 2,    // 薯条、小食
	'甜品': 3,    // 甜点
	'饮料': 4     // 饮料
}

// --- 浪费惩罚权重 ---
const WASTE_PENALTY_WEIGHT = 0.3

/**
 * 推荐套餐入口
 * @param {string[]} selectedFoodNames - 用户选择的菜品名称列表 (可能包含重复)
 * @returns {Array} 推荐结果列表
 */
export function recommendCombos(selectedFoodNames) {
	if (!selectedFoodNames || selectedFoodNames.length === 0) return []

	const dataStore = useDataStore()
	const allCombos = dataStore.allCombos
	const allComboFoods = dataStore.allComboFoods
	const allFoods = dataStore.allFoods

	// 构建倒排索引：foodName -> Set<comboId>
	const foodComboIndex = buildFoodComboIndex(allComboFoods)
	// 构建正排索引：comboId -> foodName[]
	const comboFoodIndex = buildComboFoodIndex(allComboFoods)

	// 用户需求频次表
	const userRequirementMap = getFrequencyMap(selectedFoodNames)
	const selectedUniqueFoods = [...new Set(selectedFoodNames)]

	console.log('[算法] 用户选择:', selectedFoodNames)
	console.log('[算法] 需求频次:', userRequirementMap)

	// 1. 精确匹配
	const exactMatches = findExactMatches(
		selectedFoodNames,
		userRequirementMap,
		allCombos,
		comboFoodIndex
	)

	console.log('[算法] 精确匹配结果:', exactMatches.length)

	if (exactMatches.length > 0) {
		return rankRecommendations(exactMatches, dataStore)
	}

	// 2. 多套餐匹配
	const multiComboMatches = findMultiComboMatches(
		selectedFoodNames,
		userRequirementMap,
		allCombos,
		comboFoodIndex
	)

	console.log('[算法] 多套餐匹配结果:', multiComboMatches.length)

	if (multiComboMatches.length > 0) {
		return rankRecommendations(multiComboMatches, dataStore)
	}

	// 3. 置换匹配
	const substitutionMatches = findSubstitutionMatches(
		selectedUniqueFoods,
		userRequirementMap,
		allCombos,
		comboFoodIndex,
		allFoods
	)

	console.log('[算法] 置换匹配结果:', substitutionMatches.length)

	return rankRecommendations(substitutionMatches, dataStore)
}

/**
 * 构建菜品→套餐倒排索引
 * foodName → Set<comboId>
 */
function buildFoodComboIndex(comboFoods) {
	const index = new Map()
	for (const cf of comboFoods) {
		const foodName = cf.foodId || cf.foodName
		if (!index.has(foodName)) {
			index.set(foodName, new Set())
		}
		index.get(foodName).add(cf.comboId)
	}
	return index
}

/**
 * 构建套餐→菜品正排索引
 * comboId → foodName[]
 */
function buildComboFoodIndex(comboFoods) {
	const index = new Map()
	for (const cf of comboFoods) {
		if (!index.has(cf.comboId)) {
			index.set(cf.comboId, [])
		}
		index.get(cf.comboId).push(cf.foodId || cf.foodName)
	}
	return index
}

/**
 * 精确匹配：单套餐完全覆盖用户选择（不多不少）
 */
function findExactMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex) {
	const matches = []

	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		let isExact = true
		for (const [foodName, requiredCount] of Object.entries(userRequirementMap)) {
			const providedCount = comboProvideMap[foodName] || 0
			if (providedCount < requiredCount) {
				isExact = false
				break
			}
		}

		// 精确匹配：完全覆盖且数量相等
		if (isExact && selectedFoodNames.length === comboFoodNames.length) {
			matches.push({
				combo,
				type: 'exact',
				matchedFoodIds: [...selectedFoodNames] // 使用foodName作为ID
			})
		}
	}

	return matches
}

/**
 * 多套餐匹配：多个套餐组合覆盖用户选择
 */
function findMultiComboMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex) {
	const matches = []

	// 获取相关套餐
	const relevantCombos = allCombos.filter(combo => {
		const comboFoods = comboFoodIndex.get(combo.id) || []
		return comboFoods.some(foodName => new Set(selectedFoodNames).has(foodName))
	})

	// 按匹配度排序
	const sortedCombos = relevantCombos
		.map(combo => {
			const comboFoods = comboFoodIndex.get(combo.id) || []
			const comboProvideMap = getFrequencyMap(comboFoods)
			let matchedCount = 0
			for (const [foodName, required] of Object.entries(userRequirementMap)) {
				matchedCount += Math.min(comboProvideMap[foodName] || 0, required)
			}
			return { combo, matchedCount, matchRatio: matchedCount / selectedFoodNames.length }
		})
		.sort((a, b) => b.matchRatio - a.matchRatio)

	// 尝试两两组合
	for (let i = 0; i < Math.min(sortedCombos.length, 15); i++) {
		for (let j = i + 1; j < Math.min(sortedCombos.length, 15); j++) {
			const comboA = sortedCombos[i].combo
			const comboB = sortedCombos[j].combo

			const foodsA = comboFoodIndex.get(comboA.id) || []
			const foodsB = comboFoodIndex.get(comboB.id) || []
			const combinedFoods = [...foodsA, ...foodsB]
			const combinedProvideMap = getFrequencyMap(combinedFoods)

			let isFullCoverage = true
			const matchedFoodNames = []

			for (const [foodName, required] of Object.entries(userRequirementMap)) {
				const provided = combinedProvideMap[foodName] || 0
				if (provided >= required) {
					for (let k = 0; k < required; k++) {
						matchedFoodNames.push(foodName)
					}
				} else {
					isFullCoverage = false
					break
				}
			}

			if (isFullCoverage) {
				const totalPrice = comboA.price + comboB.price

				if (totalPrice > 0) {
					matches.push({
						combo: {
							...comboA,
							id: `multi_${comboA.id}_${comboB.id}`,
							name: `${comboA.name} + ${comboB.name}`,
							price: totalPrice,
							isMultiCombo: true,
							componentCombos: [comboA, comboB]
						},
						type: 'multi_combo',
						matchedFoodIds: matchedFoodNames,
						combinedEfficiency: calculateComboEfficiency(matchedFoodNames, totalPrice)
					})
				}
			}
		}
	}

	return matches.sort((a, b) => b.combinedEfficiency - a.combinedEfficiency).slice(0, 3)
}

/**
 * 置换匹配：按类别优先级降级替换
 */
function findSubstitutionMatches(selectedUniqueFoods, userRequirementMap, allCombos, comboFoodIndex, allFoods) {
	const matches = []

	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		const matchedFoodNames = []
		const unmatchedFoodNames = []

		for (const [foodName, required] of Object.entries(userRequirementMap)) {
			if ((comboProvideMap[foodName] || 0) >= required) {
				for (let i = 0; i < required; i++) matchedFoodNames.push(foodName)
			} else {
				unmatchedFoodNames.push(foodName)
			}
		}

		if (unmatchedFoodNames.length === 0) continue

		// 按优先级排序（低优先级的先替换）
		const sortedUnmatched = unmatchedFoodNames
			.map(foodName => {
				const food = allFoods.find(f => f.id === foodName)
				return {
					foodName,
					priority: CATEGORY_PRIORITY[food?.category] || 99
				}
			})
			.sort((a, b) => b.priority - a.priority)

		// 尝试置换
		for (const { foodName: unmatchedFoodName } of sortedUnmatched) {
			const unmatchedFood = allFoods.find(f => f.id === unmatchedFoodName)
			if (!unmatchedFood) continue

			// 在套餐中找同类但不在用户选择中的菜品
			const substitutable = comboFoodNames.find(comboFoodName => {
				if (userRequirementMap[comboFoodName]) return false
				const comboFood = allFoods.find(f => f.id === comboFoodName)
				return comboFood?.category === unmatchedFood.category
			})

			if (substitutable) {
				const newMatchedFoodNames = [...matchedFoodNames, substitutable]
				const efficiency = calculateComboEfficiency(newMatchedFoodNames, combo.price)

				if (efficiency > 0.2) {
					const originalFood = allFoods.find(f => f.id === unmatchedFoodName)
					const substitutedFood = allFoods.find(f => f.id === substitutable)

					matches.push({
						combo,
						type: 'substitution',
						matchedFoodIds: newMatchedFoodNames,
						substitutionInfo: {
							original: originalFood?.nameZh || originalFood?.name || unmatchedFoodName,
							substituted: substitutedFood?.nameZh || substitutedFood?.name || substitutable,
							category: unmatchedFood.category
						},
						efficiency
					})
				}
			}
		}
	}

	return matches.sort((a, b) => b.matchedFoodIds.length - a.matchedFoodIds.length).slice(0, 5)
}

/**
 * 计算套餐效率
 */
function calculateComboEfficiency(matchedFoodNames, comboPrice) {
	if (!comboPrice || comboPrice <= 0) return 0

	const dataStore = useDataStore()
	const soloPrice = matchedFoodNames.reduce((sum, foodName) => {
		const food = dataStore.allFoods.find(f => f.id === foodName)
		return sum + (food?.soloPrice || 0)
	}, 0)

	return soloPrice / comboPrice
}

/**
 * 排序推荐结果
 */
function rankRecommendations(recommendations, dataStore) {
	const allComboFoods = dataStore.allComboFoods
	const comboFoodIndex = buildComboFoodIndex(allComboFoods)

	const withEfficiency = recommendations.map(rec => ({
		...rec,
		costEfficiency: calculateCostEfficiency(rec, comboFoodIndex, dataStore)
	}))

	return withEfficiency.sort(sortRecommendations)
}

/**
 * 计算性价比
 */
function calculateCostEfficiency(recommendation, comboFoodIndex, dataStore) {
	const { combo, type, matchedFoodIds } = recommendation

	if (type === 'multi_combo') {
		return recommendation.combinedEfficiency || 0
	}

	// 计算匹配食物的单点总价
	const soloPrice = matchedFoodIds.reduce((sum, foodName) => {
		const food = dataStore.allFoods.find(f => f.id === foodName)
		return sum + (food?.soloPrice || 0)
	}, 0)

	if (!combo.price || combo.price <= 0) return 0

	// 计算浪费值
	const comboFoodNames = comboFoodIndex.get(combo.id) || []
	const matchedSet = new Set(matchedFoodIds)
	const wasteFoodNames = comboFoodNames.filter(name => !matchedSet.has(name))
	const wasteSoloPrice = wasteFoodNames.reduce((sum, foodName) => {
		const food = dataStore.allFoods.find(f => f.id === foodName)
		return sum + (food?.soloPrice || 0)
	}, 0)

	// 有效价值 = 匹配物品总价 - 浪费惩罚
	const effectiveValue = soloPrice - wasteSoloPrice * WASTE_PENALTY_WEIGHT

	return Math.max(0, effectiveValue / combo.price)
}

/**
 * 排序函数
 */
function sortRecommendations(a, b) {
	const typeOrder = { exact: 0, multi_combo: 1, substitution: 2, partial: 3 }
	if (typeOrder[a.type] !== typeOrder[b.type]) {
		return typeOrder[a.type] - typeOrder[b.type]
	}

	if (a.costEfficiency !== b.costEfficiency) {
		return b.costEfficiency - a.costEfficiency
	}

	if (a.combo.price !== b.combo.price) {
		return a.combo.price - b.combo.price
	}

	return a.combo.id.localeCompare(b.combo.id)
}

// --- 导出辅助函数 ---

export function getExactMatches(recommendations) {
	return recommendations.filter(item => item.type === 'exact')
}

export function getMultiComboMatches(recommendations) {
	return recommendations.filter(item => item.type === 'multi_combo')
}

export function getSubstitutionMatches(recommendations) {
	return recommendations.filter(item => item.type === 'substitution')
}

export function getPartialMatches(recommendations) {
	return recommendations.filter(item => item.type === 'partial')
}

/**
 * 计算节省金额
 */
export function calculateSavedAmount(recommendation, dataStore) {
	const { combo, matchedFoodIds } = recommendation
	const soloPrice = matchedFoodIds.reduce((sum, foodName) => {
		const food = dataStore.allFoods.find(f => f.id === foodName)
		return sum + (food?.soloPrice || 0)
	}, 0)

	return soloPrice - combo.price
}
