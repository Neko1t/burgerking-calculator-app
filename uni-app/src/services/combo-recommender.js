/**
 * 套餐推荐算法服务 v2.0
 *
 * 使用 foodName 作为菜品唯一标识
 *
 * 四种推荐策略：
 * 1. exact (精确匹配) - 100%覆盖用户选择，无置换、无多余
 * 2. most_efficient (最性价比) - 允许同类置换，按性价比排序
 * 3. match_first (匹配度优先) - 按匹配度降序排列
 * 4. best_upgrade (高获得) - 发现「加钱获得更多」的升级机会
 *
 * 计算指标：
 * - 匹配度 (matchRatio): 用户需求被满足的比例
 * - 性价比 (costEfficiency): 获得物品单点总价 / 实际支出
 * - 综合得分 (comprehensiveScore): 性价比 × 匹配度 × 100
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

// --- 升级模式阈值 ---
const UPGRADE_MODE_THRESHOLDS = {
	aggressive: 0.15, // 激进派：性价比提升 > 15%
	conservative: { extraCostMax: 10, efficiencyGainMin: 0 } // 保守派：额外支出<10元且性价比有提升
}

/**
 * 推荐套餐入口
 * @param {string[]} selectedFoodNames - 用户选择的菜品名称列表 (可能包含重复)
 * @param {object} options - 可选参数
 * @param {string} options.upgradeMode - 升级模式：'aggressive' | 'conservative' | 'all'
 * @returns {Array} 推荐结果列表（已按策略分组）
 */
export function recommendCombos(selectedFoodNames, options = {}) {
	if (!selectedFoodNames || selectedFoodNames.length === 0) return []

	const dataStore = useDataStore()
	const allCombos = dataStore.allCombos
	const allComboFoods = dataStore.allComboFoods
	const allFoods = dataStore.allFoods

	// 构建正排索引：comboId -> foodName[]
	const comboFoodIndex = buildComboFoodIndex(allComboFoods)

	// 用户需求频次表
	const userRequirementMap = getFrequencyMap(selectedFoodNames)
	const userRequirementCount = selectedFoodNames.length

	// 分组收集匹配结果
	const exactMatches = []
	const mostEfficientMatches = []
	const matchFirstMatches = []
	const bestUpgradeMatches = []

	// 1. 遍历所有套餐，收集各种匹配结果
	for (const combo of allCombos) {
		// 跳过可选套餐（暂时不支持）
		if (combo.type === 'choice') continue

		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		// 分析用户选择与套餐的关系
		const analysis = analyzeMatch(selectedFoodNames, userRequirementMap, userRequirementCount, comboFoodNames, comboProvideMap, allFoods)

		// 策略1：精确匹配 (100%覆盖，无多余)
		if (analysis.matchRatio === 1.0 && !analysis.hasExtraItems && !analysis.hasSubstitution) {
			exactMatches.push(buildRecommendation(combo, analysis, 'exact'))
		}

		// 策略2：最性价比 (允许置换，按性价比排序)
		if (analysis.matchRatio > 0 && !analysis.hasExtraItems) {
			mostEfficientMatches.push(buildRecommendation(combo, analysis, 'most_efficient'))
		}

		// 策略3：匹配度优先 (按匹配度排序)
		if (analysis.matchRatio > 0) {
			matchFirstMatches.push(buildRecommendation(combo, analysis, 'match_first'))
		}

		// 策略4：高获得 (分析升级机会)
		if (analysis.matchRatio > 0) {
			const upgrades = findUpgradeOpportunities(selectedFoodNames, userRequirementMap, combo, analysis, allFoods, allCombos, comboFoodIndex)
			if (upgrades.length > 0) {
				bestUpgradeMatches.push(...upgrades)
			}
		}
	}

	// 2. 多套餐组合匹配
	const multiComboMatches = findMultiComboMatches(selectedFoodNames, userRequirementMap, userRequirementCount, allCombos, comboFoodIndex, allFoods, options.upgradeMode)

	// 3. 处理多套餐组合结果
	for (const match of multiComboMatches) {
		exactMatches.push(match)
		mostEfficientMatches.push(match)
		matchFirstMatches.push(match)
		bestUpgradeMatches.push(match)
	}

	// 4. 排序并限制数量
	const sortedExact = sortByStrategy(exactMatches, 'exact').slice(0, 5)
	const sortedMostEfficient = sortByStrategy(mostEfficientMatches, 'most_efficient').slice(0, 5)
	const sortedMatchFirst = sortByStrategy(matchFirstMatches, 'match_first').slice(0, 5)
	const sortedBestUpgrade = sortByStrategy(bestUpgradeMatches, 'best_upgrade').slice(0, 5)

	// 5. 去重（同一个套餐可能在多个策略中出现）
	const uniqueById = (arr) => {
		const seen = new Set()
		return arr.filter(item => {
			const key = item.combo.id + '_' + item.type
			if (seen.has(key)) return false
			seen.add(key)
			return true
		})
	}

	return {
		exact: uniqueById(sortedExact),
		mostEfficient: uniqueById(sortedMostEfficient),
		matchFirst: uniqueById(sortedMatchFirst),
		bestUpgrade: uniqueById(sortedBestUpgrade)
	}
}

/**
 * 分析用户选择与套餐的匹配情况
 */
function analyzeMatch(selectedFoodNames, userRequirementMap, userRequirementCount, comboFoodNames, comboProvideMap, allFoods) {
	const matchedFoodNames = []
	const unmatchedItems = [] // { foodName, needed, reason }
	const substitutionInfo = []
	let hasExtraItems = false
	let hasSubstitution = false

	// 检查每个用户选择的食物
	for (const [foodName, required] of Object.entries(userRequirementMap)) {
		const provided = comboProvideMap[foodName] || 0

		if (provided >= required) {
			// 完全匹配
			for (let i = 0; i < required; i++) matchedFoodNames.push(foodName)
		} else if (provided > 0) {
			// 部分匹配（数量不足）
			for (let i = 0; i < provided; i++) matchedFoodNames.push(foodName)
			unmatchedItems.push({ foodName, needed: required - provided, reason: 'insufficient' })
		} else {
			// 完全没有（需要置换）
			unmatchedItems.push({ foodName, needed: required, reason: 'missing' })
		}
	}

	// 检查套餐中是否有用户未选择的食物（多余物品）
	const userFoodSet = new Set(selectedFoodNames)
	for (const foodName of comboFoodNames) {
		if (!userFoodSet.has(foodName)) {
			hasExtraItems = true
			break
		}
	}

	// 尝试置换缺失的物品
	if (unmatchedItems.length > 0) {
		for (const item of unmatchedItems) {
			const food = allFoods.find(f => f.id === item.foodName)
			if (!food) continue

			// 在套餐中找同类但不在用户选择中的菜品
			const substitute = comboFoodNames.find(comboFoodName => {
				if (userRequirementMap[comboFoodName]) return false
				const comboFood = allFoods.find(f => f.id === comboFoodName)
				return comboFood?.category === food.category
			})

			if (substitute) {
				const substituteFood = allFoods.find(f => f.id === substitute)
				for (let i = 0; i < item.needed; i++) {
					matchedFoodNames.push(substitute)
				}
				substitutionInfo.push({
					original: food?.nameZh || food?.name || item.foodName,
					substituted: substituteFood?.nameZh || substituteFood?.name || substitute,
					category: food.category
				})
				hasSubstitution = true
			}
		}
	}

	const matchRatio = matchedFoodNames.length / userRequirementCount

	return {
		matchedFoodNames,
		unmatchedItems,
		substitutionInfo,
		hasExtraItems,
		hasSubstitution,
		matchRatio
	}
}

/**
 * 构建推荐结果对象
 */
function buildRecommendation(combo, analysis, type) {
	const matchedSoloPrice = calculateMatchedSoloPrice(analysis.matchedFoodNames)
	const totalCost = combo.price
	const matchRatio = analysis.matchRatio
	const costEfficiency = totalCost > 0 ? matchedSoloPrice / totalCost : 0

	return {
		combo,
		type,
		matchedFoodIds: analysis.matchedFoodNames,
		matchRatio,
		costEfficiency,
		totalCost,
		totalValue: matchedSoloPrice,
		savedAmount: matchedSoloPrice - totalCost,
		comprehensiveScore: costEfficiency * matchRatio * 100,
		substitutionInfo: analysis.substitutionInfo.length > 0 ? analysis.substitutionInfo : null
	}
}

/**
 * 查找升级机会
 */
function findUpgradeOpportunities(selectedFoodNames, userRequirementMap, combo, analysis, allFoods, allCombos, comboFoodIndex) {
	const upgrades = []

	// 如果已经是完全匹配，不需要升级
	if (analysis.matchRatio === 1.0 && !analysis.hasExtraItems) {
		return upgrades
	}

	// 找到套餐中用户没选的食物（可作为升级项）
	const userFoodSet = new Set(selectedFoodNames)
	const extraItemsInCombo = comboFoodIndex.get(combo.id)?.filter(f => !userFoodSet.has(f)) || []

	for (const extraFoodId of extraItemsInCombo) {
		const extraFood = allFoods.find(f => f.id === extraFoodId)
		if (!extraFood) continue

		// 计算升级后的性价比
		const newMatchedFoods = [...analysis.matchedFoodNames, extraFoodId]
		const newMatchedSoloPrice = calculateMatchedSoloPrice(newMatchedFoods)
		const newCostEfficiency = combo.price > 0 ? newMatchedSoloPrice / combo.price : 0

		const extraCost = 0 // 加购这个套餐内的项目不需要额外付钱
		const extraValue = extraFood.soloPrice || 0
		const efficiencyGain = newCostEfficiency - (analysis.matchedFoodNames.length > 0 ? calculateMatchedSoloPrice(analysis.matchedFoodNames) / combo.price : 0)

		if (efficiencyGain > 0) {
			upgrades.push({
				combo,
				type: 'best_upgrade',
				matchedFoodIds: newMatchedFoods,
				matchRatio: newMatchedFoods.length / selectedFoodNames.length,
				costEfficiency: newCostEfficiency,
				totalCost: combo.price,
				totalValue: newMatchedSoloPrice,
				savedAmount: newMatchedSoloPrice - combo.price,
				comprehensiveScore: newCostEfficiency * (newMatchedFoods.length / selectedFoodNames.length) * 100,
				upgrade: {
					extraCost,
					extraItems: [extraFoodId],
					extraValue,
					efficiencyGain,
					description: `套餐内含${extraFood.nameZh || extraFood.name}，价值${extraValue}元`
				}
			})
		}
	}

	return upgrades
}

/**
 * 多套餐组合匹配
 */
function findMultiComboMatches(selectedFoodNames, userRequirementMap, userRequirementCount, allCombos, comboFoodIndex, allFoods, upgradeMode = 'all') {
	const matches = []

	// 获取相关套餐（至少包含用户选择中的一个菜品）
	const relevantCombos = allCombos.filter(combo => {
		if (combo.type === 'choice') return false
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
			return { combo, matchedCount, matchRatio: matchedCount / userRequirementCount }
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
					const matchedSoloPrice = calculateMatchedSoloPrice(matchedFoodNames)
					const matchRatio = 1.0 // 完全覆盖
					const costEfficiency = matchedSoloPrice / totalPrice

					matches.push({
						combo: {
							...comboA,
							id: `multi_${comboA.id}_${comboB.id}`,
							name: `${comboA.name} + ${comboB.name}`,
							price: totalPrice,
							isMultiCombo: true,
							componentCombos: [comboA, comboB]
						},
						type: 'exact', // 多套餐完全覆盖视为精确匹配
						matchedFoodIds: matchedFoodNames,
						matchRatio,
						costEfficiency,
						totalCost: totalPrice,
						totalValue: matchedSoloPrice,
						savedAmount: matchedSoloPrice - totalPrice,
						comprehensiveScore: costEfficiency * matchRatio * 100
					})
				}
			}
		}
	}

	return matches.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore).slice(0, 3)
}

/**
 * 根据策略排序
 */
function sortByStrategy(recommendations, strategy) {
	const sorted = [...recommendations]

	switch (strategy) {
		case 'exact':
			// 精确匹配：综合得分降序
			return sorted.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore)

		case 'most_efficient':
			// 最性价比：性价比降序
			return sorted.sort((a, b) => b.costEfficiency - a.costEfficiency)

		case 'match_first':
			// 匹配度优先：匹配度降序
			return sorted.sort((a, b) => b.matchRatio - a.matchRatio)

		case 'best_upgrade':
			// 高获得：性价比提升幅度降序
			return sorted.sort((a, b) => {
				const gainA = a.upgrade?.efficiencyGain || 0
				const gainB = b.upgrade?.efficiencyGain || 0
				return gainB - gainA
			})

		default:
			return sorted.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore)
	}
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
 * 获取菜品的单点价格
 */
function getSoloPrice(foodName) {
	const dataStore = useDataStore()
	const food = dataStore.allFoods.find(f => f.id === foodName)
	return food?.soloPrice || 0
}

/**
 * 计算匹配物品的单点总价
 */
function calculateMatchedSoloPrice(matchedFoodNames) {
	return matchedFoodNames.reduce((sum, foodName) => sum + getSoloPrice(foodName), 0)
}

// --- 导出辅助函数 ---

export function getExactMatches(recommendations) {
	return recommendations.exact || []
}

export function getMostEfficientMatches(recommendations) {
	return recommendations.mostEfficient || []
}

export function getMatchFirstMatches(recommendations) {
	return recommendations.matchFirst || []
}

export function getBestUpgradeMatches(recommendations) {
	return recommendations.bestUpgrade || []
}

/**
 * 计算节省金额（保留兼容性）
 */
export function calculateSavedAmount(recommendation, dataStore) {
	return recommendation.savedAmount || 0
}

/**
 * 获取升级模式推荐
 */
export function getUpgradeRecommendation(recommendations, mode = 'aggressive') {
	const upgrades = recommendations.bestUpgrade || []
	if (upgrades.length === 0) return null

	if (mode === 'all') {
		return upgrades // 返回所有升级选项
	}

	const threshold = UPGRADE_MODE_THRESHOLDS[mode]
	if (!threshold) return upgrades[0]

	if (mode === 'aggressive') {
		// 激进派：性价比提升 > 15%
		const filtered = upgrades.filter(u => u.upgrade?.efficiencyGain > threshold)
		return filtered.length > 0 ? filtered[0] : upgrades[0]
	}

	if (mode === 'conservative') {
		// 保守派：额外支出 < 10元 且 性价比提升 > 0
		const filtered = upgrades.filter(u =>
			u.upgrade?.extraCost < threshold.extraCostMax &&
			u.upgrade?.efficiencyGain > threshold.efficiencyGainMin
		)
		return filtered.length > 0 ? filtered[0] : upgrades[0]
	}

	return upgrades[0]
}
