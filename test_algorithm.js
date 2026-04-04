/**
 * 汉堡王性价比计算器 - 算法测试脚本
 *
 * 测试数据结构使用 foodName 作为 ID
 */

// 模拟数据（与 static/data/ 一致）
const testFoods = [
	{ id: 'whopper', name: '皇堡', category: '主食', soloPrice: 28.5 },
	{ id: 'fries_l', name: '薯霸王(大)', category: '小食', soloPrice: 12.0 },
	{ id: 'fries_m', name: '薯霸王(中)', category: '小食', soloPrice: 9.0 },
	{ id: 'coke_l', name: '可口可乐(大)', category: '饮料', soloPrice: 8.5 },
	{ id: 'coke_m', name: '可口可乐(中)', category: '饮料', soloPrice: 6.5 },
	{ id: 'nuggets_5', name: '鸡块(5块)', category: '小食', soloPrice: 11.5 },
	{ id: 'nuggets_3', name: '鸡块(3块)', category: '小食', soloPrice: 7.5 },
	{ id: 'ice_cream', name: '冰淇淋', category: '甜品', soloPrice: 5.0 },
	{ id: 'corn_cup', name: '玉米杯', category: '小食', soloPrice: 8.0 },
	{ id: 'angus_beef', name: '安格斯牛肉堡', category: '主食', soloPrice: 35.0 },
	{ id: 'spicy_chicken', name: '香辣鸡腿堡', category: '主食', soloPrice: 25.0 },
	{ id: 'waffle', name: '华夫饼', category: '甜品', soloPrice: 12.0 },
	{ id: 'salad', name: '鲜蔬沙拉', category: '甜品', soloPrice: 8.0 }
]

const testCombos = [
	{ id: 'combo_001', name: '皇堡套餐', price: 39.9 },
	{ id: 'combo_002', name: '小食套餐', price: 25.0 },
	{ id: 'combo_003', name: '单人豪华套餐', price: 49.9 },
	{ id: 'combo_004', name: '安格斯套餐', price: 52.0 },
	{ id: 'combo_005', name: '下午茶套餐', price: 18.0 },
	{ id: 'combo_006', name: '香辣鸡腿堡套餐', price: 29.9 },
	{ id: 'combo_007', name: '甜品套餐', price: 15.0 },
	{ id: 'combo_008', name: '华夫套餐', price: 22.0 }
]

// 使用 foodName 关联
const testComboFoods = [
	{ comboId: 'combo_001', foodId: 'whopper' },
	{ comboId: 'combo_001', foodId: 'fries_m' },
	{ comboId: 'combo_001', foodId: 'coke_m' },

	{ comboId: 'combo_002', foodId: 'nuggets_5' },
	{ comboId: 'combo_002', foodId: 'fries_m' },
	{ comboId: 'combo_002', foodId: 'coke_m' },

	{ comboId: 'combo_003', foodId: 'whopper' },
	{ comboId: 'combo_003', foodId: 'fries_l' },
	{ comboId: 'combo_003', foodId: 'coke_l' },
	{ comboId: 'combo_003', foodId: 'nuggets_3' },

	{ comboId: 'combo_004', foodId: 'angus_beef' },
	{ comboId: 'combo_004', foodId: 'fries_m' },
	{ comboId: 'combo_004', foodId: 'coke_m' },

	{ comboId: 'combo_005', foodId: 'nuggets_3' },
	{ comboId: 'combo_005', foodId: 'coke_m' },

	{ comboId: 'combo_006', foodId: 'spicy_chicken' },
	{ comboId: 'combo_006', foodId: 'fries_m' },
	{ comboId: 'combo_006', foodId: 'coke_m' },

	{ comboId: 'combo_007', foodId: 'ice_cream' },
	{ comboId: 'combo_007', foodId: 'salad' },

	{ comboId: 'combo_008', foodId: 'waffle' },
	{ comboId: 'combo_008', foodId: 'fries_m' }
]

// 类别优先级
const CATEGORY_PRIORITY = { '主食': 1, '小食': 2, '甜品': 3, '饮料': 4 }

// 辅助函数
function getFrequencyMap(arr) {
	return arr.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc }, {})
}

function findFood(id) { return testFoods.find(f => f.id === id) }

function buildComboFoodIndex(comboFoods) {
	const index = new Map()
	for (const cf of comboFoods) {
		if (!index.has(cf.comboId)) index.set(cf.comboId, [])
		index.get(cf.comboId).push(cf.foodId)
	}
	return index
}

// ========== 核心算法 ==========

function recommendCombos(selectedFoodNames) {
	if (!selectedFoodNames || selectedFoodNames.length === 0) return []

	const comboFoodIndex = buildComboFoodIndex(testComboFoods)
	const userRequirementMap = getFrequencyMap(selectedFoodNames)

	// 1. 精确匹配
	const exactMatches = findExactMatches(selectedFoodNames, userRequirementMap, testCombos, comboFoodIndex)
	if (exactMatches.length > 0) return rankResults(exactMatches)

	// 2. 多套餐匹配
	const multiMatches = findMultiComboMatches(selectedFoodNames, userRequirementMap, testCombos, comboFoodIndex)
	if (multiMatches.length > 0) return rankResults(multiMatches)

	// 3. 置换匹配
	const subMatches = findSubstitutionMatches(selectedFoodNames, userRequirementMap, testCombos, comboFoodIndex)
	if (subMatches.length > 0) return rankResults(subMatches)

	// 4. 部分匹配
	const partialMatches = findPartialMatches(selectedFoodNames, userRequirementMap, testCombos, comboFoodIndex)
	return rankResults(partialMatches)
}

function findExactMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex) {
	const matches = []
	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		let isFullCoverage = true
		for (const [foodName, required] of Object.entries(userRequirementMap)) {
			if ((comboProvideMap[foodName] || 0) < required) {
				isFullCoverage = false
				break
			}
		}

		// 精确匹配：完全覆盖且数量相等
		if (isFullCoverage && selectedFoodNames.length === comboFoodNames.length) {
			matches.push({ combo, type: 'exact', matchedFoodIds: [...selectedFoodNames] })
		}
	}
	return matches
}

function findMultiComboMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex) {
	const matches = []

	const relevantCombos = allCombos.filter(combo => {
		const foods = comboFoodIndex.get(combo.id) || []
		return foods.some(fid => selectedFoodNames.includes(fid))
	})

	const sorted = relevantCombos.map(combo => {
		const foods = comboFoodIndex.get(combo.id) || []
		const map = getFrequencyMap(foods)
		let matched = 0
		for (const [fid, req] of Object.entries(userRequirementMap)) {
			matched += Math.min(map[fid] || 0, req)
		}
		return { combo, ratio: matched / selectedFoodNames.length }
	}).sort((a, b) => b.ratio - a.ratio)

	for (let i = 0; i < Math.min(sorted.length, 10); i++) {
		for (let j = i + 1; j < Math.min(sorted.length, 10); j++) {
			const a = sorted[i].combo
			const b = sorted[j].combo
			const combined = [...(comboFoodIndex.get(a.id) || []), ...(comboFoodIndex.get(b.id) || [])]
			const combinedMap = getFrequencyMap(combined)

			let fullMatch = true
			const matched = []
			for (const [fid, req] of Object.entries(userRequirementMap)) {
				if ((combinedMap[fid] || 0) >= req) {
					for (let k = 0; k < req; k++) matched.push(fid)
				} else {
					fullMatch = false
					break
				}
			}

			if (fullMatch) {
				const price = a.price + b.price
				const soloTotal = matched.reduce((s, fid) => s + (findFood(fid)?.soloPrice || 0), 0)
				matches.push({
					combo: { ...a, id: `multi_${a.id}_${b.id}`, name: `${a.name} + ${b.name}`, price },
					type: 'multi_combo',
					matchedFoodIds: matched,
					efficiency: soloTotal / price
				})
			}
		}
	}

	return matches.sort((a, b) => b.efficiency - a.efficiency).slice(0, 3)
}

function findSubstitutionMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex) {
	const matches = []

	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		const matched = []
		const unmatched = []

		// 找出已匹配和未匹配的菜品
		for (const [foodName, required] of Object.entries(userRequirementMap)) {
			const provided = comboProvideMap[foodName] || 0
			if (provided >= required) {
				for (let i = 0; i < required; i++) matched.push(foodName)
			} else {
				unmatched.push({ foodName, needed: required - provided })
			}
		}

		if (unmatched.length === 0) continue

		// 按优先级排序（低优先级的先替换）
		const sortedUnmatched = unmatched
			.map(({ foodName, needed }) => {
				const food = findFood(foodName)
				return { foodName, needed, priority: CATEGORY_PRIORITY[food?.category] || 99 }
			})
			.sort((a, b) => b.priority - a.priority)

		// 尝试对每个未匹配项找替代品
		for (const { foodName, needed } of sortedUnmatched) {
			const food = findFood(foodName)
			if (!food) continue

			// 在套餐中找同类但不在用户选择中的菜品
			const substitute = comboFoodNames.find(comboFoodName => {
				if (userRequirementMap[comboFoodName]) return false
				const comboFood = findFood(comboFoodName)
				return comboFood?.category === food.category
			})

			if (substitute) {
				const newMatched = [...matched]
				for (let i = 0; i < needed; i++) newMatched.push(substitute)

				const soloTotal = newMatched.reduce((s, fid) => s + (findFood(fid)?.soloPrice || 0), 0)
				const efficiency = soloTotal / combo.price

				if (efficiency > 0.2) {
					matches.push({
						combo,
						type: 'substitution',
						matchedFoodIds: newMatched,
						efficiency,
						substitutionInfo: {
							original: food.name,
							substituted: findFood(substitute)?.name || substitute,
							category: food.category
						}
					})
				}
			}
		}
	}

	return matches.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5)
}

function findPartialMatches(selectedFoodNames, userRequirementMap, allCombos, comboFoodIndex) {
	const matches = []

	for (const combo of allCombos) {
		const comboFoodNames = comboFoodIndex.get(combo.id) || []
		const comboProvideMap = getFrequencyMap(comboFoodNames)

		let matchedCount = 0
		const matched = []

		for (const [foodName, required] of Object.entries(userRequirementMap)) {
			const provided = comboProvideMap[foodName] || 0
			const actualMatched = Math.min(provided, required)
			matchedCount += actualMatched
			for (let i = 0; i < actualMatched; i++) matched.push(foodName)
		}

		if (matchedCount > 0) {
			const soloTotal = matched.reduce((s, fid) => s + (findFood(fid)?.soloPrice || 0), 0)
			const efficiency = soloTotal / combo.price

			matches.push({
				combo,
				type: 'partial',
				matchedFoodIds: matched,
				efficiency,
				matchRatio: matchedCount / selectedFoodNames.length
			})
		}
	}

	return matches.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5)
}

function rankResults(results) {
	return results
		.map(r => ({ ...r, costEfficiency: r.efficiency || r.costEfficiency || 0 }))
		.sort((a, b) => {
			if (a.type !== b.type) {
				const order = { exact: 0, multi_combo: 1, substitution: 2, partial: 3 }
				return order[a.type] - order[b.type]
			}
			return b.costEfficiency - a.costEfficiency
		})
}

// ========== 测试 ==========

const tests = [
	// 精确匹配测试
	{
		name: '精确匹配: 皇堡+薯霸王(中)+可口可乐(中)',
		selected: ['whopper', 'fries_m', 'coke_m'],
		expectType: 'exact',
		expectName: '皇堡套餐'
	},
	{
		name: '精确匹配: 鸡块(3块)+可口可乐(中)',
		selected: ['nuggets_3', 'coke_m'],
		expectType: 'exact',
		expectName: '下午茶套餐'
	},
	{
		name: '精确匹配: 华夫饼+薯霸王(中)',
		selected: ['waffle', 'fries_m'],
		expectType: 'exact',
		expectName: '华夫套餐'
	},

	// 多套餐匹配测试
	{
		name: '多套餐: 皇堡+薯霸王(中)+可口可乐(大)',
		selected: ['whopper', 'fries_m', 'coke_l'],
		expectType: 'multi_combo',
		expectContains: '可口可乐(大)'
	},
	{
		name: '多套餐: 皇堡+冰淇淋',
		selected: ['whopper', 'ice_cream'],
		expectType: 'multi_combo',
		expectContains: '冰淇淋'
	},

	// 置换匹配测试
	{
		name: '置换: 选择可口可乐(中)，套餐只有可口可乐(大)',
		selected: ['whopper', 'coke_l'],  // 可口可乐(大)不在任何套餐中
		// 应该找到 multi_combo 或 partial
		expectHasResults: true
	},

	// 部分匹配测试（单品在套餐中，多套餐更优）
	{
		name: '部分匹配: 只选一个单品',
		selected: ['whopper'],
		expectType: 'multi_combo',  // 多套餐包含whopper
		expectHasResults: true
	},

	// 真正的部分匹配：选择的单品不在任何套餐中
	{
		name: '部分匹配: 选择一个没有在任何套餐中的单品',
		selected: ['corn_cup'],  // 玉米杯不在任何套餐中
		expectType: 'partial',
		expectHasResults: true
	},

	// 边界测试
	{
		name: '空输入',
		selected: [],
		expectHasResults: false
	}
]

console.log('🧪 汉堡王算法测试\n')
let passed = 0, failed = 0

tests.forEach((t, i) => {
	console.log(`📋 ${t.name}`)
	console.log(`   输入: ${t.selected.length > 0 ? t.selected.map(id => findFood(id)?.name).join(', ') : '(空)'}`)

	const results = recommendCombos(t.selected)
	const top = results[0]

	let testPassed = false

	if (!t.expectHasResults && results.length === 0) {
		testPassed = true
	} else if (t.expectHasResults === false && results.length === 0) {
		testPassed = true
	} else if (t.expectHasResults && results.length > 0) {
		testPassed = true
	} else if (top && t.expectType && top.type === t.expectType) {
		testPassed = true
		if (t.expectName && top.combo.name !== t.expectName) {
			testPassed = false
			console.log(`   ⚠️ 类型对但名称不对: ${top.combo.name}`)
		}
	}

	if (testPassed) {
		console.log(`   ✅ ${top?.type || 'empty'}: ${top?.combo?.name || 'N/A'}`)
		if (top?.matchedFoodIds) {
			console.log(`      匹配: ${top.matchedFoodIds.map(id => findFood(id)?.name).join('+')}`)
		}
		passed++
	} else {
		console.log(`   ❌ 期望 ${t.expectType || '有结果'}，得到 ${top?.type || 'none'}`)
		if (top) {
			console.log(`      结果: ${top.combo.name}`)
			console.log(`      匹配: ${top.matchedFoodIds?.map(id => findFood(id)?.name).join('+')}`)
		} else {
			console.log(`      无结果`)
		}
		failed++
	}
	console.log()
})

console.log(`📊 结果: ${passed}通过, ${failed}失败`)

// 打印所有结果的调试信息
console.log('\n========== 调试信息 ==========')
console.log('各套餐包含的菜品:')
testCombos.forEach(combo => {
	const foods = testComboFoods.filter(cf => cf.comboId === combo.id).map(cf => findFood(cf.foodId)?.name)
	console.log(`  ${combo.name}: ${foods.join(' + ')}`)
})
