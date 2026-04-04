/**
 * 套餐推荐算法服务
 *
 * 使用 foodName 作为菜品唯一标识
 * 匹配策略：
 * 1. 精确匹配 (exact) - 单套餐完全覆盖用户选择，数量一致
 * 2. 多套餐匹配 (multi_combo) - 多套餐组合完全覆盖用户选择
 * 3. 置换匹配 (substitution) - 用同类菜品替换实现降级覆盖
 * 4. 部分匹配 (partial) - 返回任何能覆盖部分需求的套餐
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
	'主食': 1,
	'小食': 2,
	'甜品': 3,
	'饮料': 4
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

	// 构建正排索引：comboId -> foodName[]
	const comboFoodIndex = buildComboFoodIndex(allComboFoods)

	// 用户需求频次表
	const userRequirementMap = getFrequencyMap(selectedFoodNames)

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
		selectedFoodNames,
		userRequirementMap,
		allCombos,
		comboFoodIndex,
		allFoods
	)

	console.log('[算法] 置换匹配结果:', substitutionMatches.length)

	if (substitutionMatches.length > 0) {
		return rankRecommendations(substitutionMatches, dataStore)
	}

	// 4. 部分匹配 - 任何能覆盖部分需求的套餐
	const partialMatches = findPartialMatches(
		selectedFoodNames,
		userRequirementMap,
		allCombos,
		comboFoodIndex,
		allFoods
	)

	console.log('[算法] 部分匹配结果:', partialMatches.length)

	return rankRecommendations(partialMatches, dataStore)
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
 * 精确匹配：单套餐完全覆盖用户选择（数量完全一致）
 */
function findExactMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex) {
	const matches = []

	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		let isFullCoverage = true
		for (const [foodName, requiredCount] of Object.entries(userRequirementMap)) {
			const providedCount = comboProvideMap[foodName] || 0
			if (providedCount < requiredCount) {
				isFullCoverage = false
				break
			}
		}

		// 精确匹配：完全覆盖且数量相等
		if (isFullCoverage && selectedFoodNames.length === comboFoodNames.length) {
			matches.push({
				combo,
				type: 'exact',
				matchedFoodIds: [...selectedFoodNames]
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

	// 获取相关套餐（至少包含用户选择中的一个菜品）
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
					const soloPrice = matchedFoodNames.reduce((sum, foodName) => {
						return sum + getSoloPrice(foodName)
					}, 0)

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
						efficiency: soloPrice / totalPrice
					})
				}
			}
		}
	}

	return matches.sort((a, b) => b.efficiency - a.efficiency).slice(0, 3)
}

/**
 * 置换匹配：按类别优先级降级替换
 */
function findSubstitutionMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex, allFoods) {
	const matches = []

	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		const matchedFoodNames = []
		const unmatchedItems = [] // { foodName, needed }

		// 区分已匹配和未匹配的菜品
		for (const [foodName, required] of Object.entries(userRequirementMap)) {
			const provided = comboProvideMap[foodName] || 0
			if (provided >= required) {
				for (let i = 0; i < required; i++) matchedFoodNames.push(foodName)
			} else if (provided > 0) {
				// 部分匹配：套餐提供了部分
				for (let i = 0; i < provided; i++) matchedFoodNames.push(foodName)
				unmatchedItems.push({ foodName, needed: required - provided })
			} else {
				// 完全不匹配
				unmatchedItems.push({ foodName, needed: required })
			}
		}

		if (unmatchedItems.length === 0) continue

		// 按优先级排序（低优先级的先替换：饮料 > 甜品 > 小食 > 主食）
		const sortedUnmatched = unmatchedItems
			.map(({ foodName, needed }) => {
				const food = allFoods.find(f => f.id === foodName)
				return { foodName, needed, priority: CATEGORY_PRIORITY[food?.category] || 99 }
			})
			.sort((a, b) => b.priority - a.priority)

		// 对每个未匹配项尝试找替代品
		for (const { foodName, needed } of sortedUnmatched) {
			const food = allFoods.find(f => f.id === foodName)
			if (!food) continue

			// 在套餐中找同类但不在用户选择中的菜品
			const substitute = comboFoodNames.find(comboFoodName => {
				if (userRequirementMap[comboFoodName]) return false
				const comboFood = allFoods.find(f => f.id === comboFoodName)
				return comboFood?.category === food.category
			})

			if (substitute) {
				const newMatchedFoodNames = [...matchedFoodNames]
				for (let i = 0; i < needed; i++) {
					newMatchedFoodNames.push(substitute)
				}

				const soloPrice = newMatchedFoodNames.reduce((sum, fname) => sum + getSoloPrice(fname), 0)
				const efficiency = soloPrice / combo.price

				if (efficiency > 0.15) {
					const originalFood = allFoods.find(f => f.id === foodName)
					const substitutedFood = allFoods.find(f => f.id === substitute)

					matches.push({
						combo,
						type: 'substitution',
						matchedFoodIds: newMatchedFoodNames,
						efficiency,
						substitutionInfo: {
							original: originalFood?.nameZh || originalFood?.name || foodName,
							substituted: substitutedFood?.nameZh || substitutedFood?.name || substitute,
							category: food.category
						}
					})
				}
			}
		}
	}

	return matches.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5)
}

/**
 * 部分匹配：任何能覆盖部分用户需求的套餐
 */
function findPartialMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex, allFoods) {
	const matches = []

	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		let matchedCount = 0
		const matchedFoodNames = []

		for (const [foodName, required] of Object.entries(userRequirementMap)) {
			const provided = comboProvideMap[foodName] || 0
			const actualMatched = Math.min(provided, required)
			matchedCount += actualMatched
			for (let i = 0; i < actualMatched; i++) {
				matchedFoodNames.push(foodName)
			}
		}

		if (matchedCount > 0) {
			const soloPrice = matchedFoodNames.reduce((sum, fname) => sum + getSoloPrice(fname), 0)
			const efficiency = soloPrice / combo.price

			matches.push({
				combo,
				type: 'partial',
				matchedFoodIds: matchedFoodNames,
				efficiency,
				matchRatio: matchedCount / selectedFoodNames.length
			})
		}
	}

	return matches.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5)
}

/**
 * 获取菜品的单点价格
 */
function getSoloPrice(foodName) {
	const dataStore = useDataStore()
	const food = dataStore.allFoods.find(f => f.id === foodName)
	return food?.soloPrice || 0
}

/**
 * 计算套餐效率
 */
function calculateComboEfficiency(matchedFoodNames, comboPrice) {
	if (!comboPrice || comboPrice <= 0) return 0
	const soloPrice = matchedFoodNames.reduce((sum, foodName) => sum + getSoloPrice(foodName), 0)
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
		return recommendation.efficiency || recommendation.combinedEfficiency || 0
	}

	if (type === 'substitution' || type === 'partial') {
		return recommendation.efficiency || 0
	}

	// 计算匹配食物的单点总价
	const soloPrice = matchedFoodIds.reduce((sum, foodName) => {
		return sum + getSoloPrice(foodName)
	}, 0)

	if (!combo.price || combo.price <= 0) return 0

	// 计算浪费值
	const comboFoodNames = comboFoodIndex.get(combo.id) || []
	const matchedSet = new Set(matchedFoodIds)
	const wasteFoodNames = comboFoodNames.filter(name => !matchedSet.has(name))
	const wasteSoloPrice = wasteFoodNames.reduce((sum, foodName) => {
		return sum + getSoloPrice(foodName)
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
