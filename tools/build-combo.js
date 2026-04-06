#!/usr/bin/env node

/**
 * 套餐数据库构建工具
 *
 * 功能：使用LLM直接从套餐截图识别并生成标准JSON格式的套餐数据
 *
 * 使用方式：
 *   node build-combo.js --clipboard    # 从剪贴板读取图片
 *   node build-combo.js --image path   # 从文件读取图片
 *
 * 输出：
 *   标准格式的 combos.json 和 combo_foods.json
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const readline = require('readline')

// ==================== 配置 ====================

const CONFIG_FILE = path.join(__dirname, '..', 'config.json')

function loadConfig() {
	try {
		if (fs.existsSync(CONFIG_FILE)) {
			const data = fs.readFileSync(CONFIG_FILE, 'utf8')
			return JSON.parse(data)
		}
	} catch (e) {
		console.warn('[配置] 读取配置文件失败:', e.message)
	}
	return {}
}

const configFile = loadConfig()

const CONFIG = {
	llm: {
		apiKey: process.env.MINIMAX_API_KEY || configFile.minimaxApiKey || '',
		baseUrl: process.env.MINIMAX_BASE_URL || configFile.minimaxBaseUrl || 'https://api.minimaxi.com/v1',
		model: configFile.minimaxModel || 'MiniMax-M2.7'
	},
	foodsMapPath: path.join(__dirname, '..', 'uni-app', 'static', 'data', 'foods.json'),
	outputDir: path.join(__dirname, '..', 'uni-app', 'static', 'data')
}

// ==================== 食物映射表 ====================

function loadFoodsMap() {
	try {
		const data = fs.readFileSync(CONFIG.foodsMapPath, 'utf8')
		const foods = JSON.parse(data).foods

		// 构建食物映射：中文名 -> foodId
		const foodMap = {}
		for (const food of foods) {
			foodMap[food.nameZh] = food.name
			// 别名支持（如果有）
			if (food.aliases) {
				for (const alias of food.aliases) {
					foodMap[alias] = food.name
				}
			}
		}

		console.log(`[配置] 已加载 ${foods.length} 个食物映射\n`)
		return { foodMap, foods }
	} catch (e) {
		console.warn('[配置] 加载食物映射失败:', e.message)
		return { foodMap: {}, foods: [] }
	}
}

// ==================== LLM 调用 ====================

async function callLLMWithImage(base64Image, foodList) {
	const prompt = buildPrompt(foodList)

	const response = await fetch(`${CONFIG.llm.baseUrl}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${CONFIG.llm.apiKey}`
		},
		body: JSON.stringify({
			model: CONFIG.llm.model,
			messages: [{
				role: 'user',
				content: [
					{ type: 'text', text: prompt },
					{ type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
				]
			}]
		})
	})

	if (!response.ok) {
		throw new Error(`LLM API错误: ${response.status}`)
	}

	const data = await response.json()
	const content = data.choices?.[0]?.messages?.[0]?.content || data.choices?.[0]?.message?.content || ''

	// 提取<answer>标签内容
	return extractAnswer(content)
}

function extractAnswer(content) {
	if (!content) return ''
	const match = content.match(/<answer>([\s\S]*)<\/answer>/)
	return match ? match[1].trim() : content.trim()
}

function buildPrompt(foodList) {
	return `你是一个汉堡王套餐数据解析专家。请识别图片中的套餐信息并转换为标准JSON格式。

## 可用食物列表（必须严格使用以下foodId）：
${foodList}

## 输出JSON格式：
{
  "combos": [
    {
      "id": "combo_序号",
      "name": "套餐名称",
      "platform": "meituan|eleme|custom",
      "price": 价格数字,
      "description": "套餐简述"
    }
  ],
  "comboFoods": [
    { "comboId": "combo_序号", "foodName": "foodId", "quantity": 1 }
  ]
}

## 规则：
1. comboId格式：combo_001, combo_002, ...（必须是唯一的序号）
2. platform：meituan(美团)、eleme(饿了么)、custom(自定义)
3. price：必须是数字，不带¥符号
4. foodName：必须使用上面列表中的foodId，不能自己创造
5. 只输出JSON，不要任何其他文字
6. 确保JSON格式正确可解析
7. 如果图片中套餐的食物不在列表里，用null表示foodName并在description中说明

请识别图片中的所有套餐并输出JSON。`
}

// ==================== 图片读取 ====================

async function getImageFromClipboard() {
	if (process.platform !== 'win32') {
		throw new Error('当前仅支持Windows系统')
	}

	const tmpFile = path.join(os.tmpdir(), `clipboard_${Date.now()}.png`)
	const scriptFile = path.join(os.tmpdir(), `clip_script_${Date.now()}.ps1`)

	const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img -ne $null) {
    $img.Save('${tmpFile.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output 'SUCCESS'
} else {
    Write-Output 'NO_IMAGE'
}
`

	fs.writeFileSync(scriptFile, psScript, 'utf8')

	return new Promise((resolve, reject) => {
		const { exec } = require('child_process')
		exec(`powershell -ExecutionPolicy Bypass -File "${scriptFile}"`, (error, stdout) => {
			try { fs.unlinkSync(scriptFile) } catch (e) {}

			if (error) {
				reject(new Error(`剪贴板读取失败: ${error.message}`))
				return
			}

			const result = stdout.trim()
			if (result === 'NO_IMAGE') {
				reject(new Error('剪贴板中没有图片'))
				return
			}
			if (result === 'SUCCESS') {
				resolve(tmpFile)
			} else {
				reject(new Error(`剪贴板读取失败: ${result}`))
			}
		})
	})
}

async function readImageFile(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`文件不存在: ${filePath}`)
	}
	return filePath
}

// ==================== 解析和输出 ====================

function parseLLMResponse(response, startComboId = 1) {
	let jsonStr = response
	const jsonMatch = response.match(/\{[\s\S]*\}/)
	if (jsonMatch) {
		jsonStr = jsonMatch[0]
	}

	try {
		const parsed = JSON.parse(jsonStr)

		const combos = []
		const comboFoods = []

		for (let i = 0; i < (parsed.combos || []).length; i++) {
			const combo = parsed.combos[i]
			const comboId = `combo_${String(startComboId + i).padStart(3, '0')}`

			combos.push({
				id: comboId,
				name: combo.name,
				platform: combo.platform || 'meituan',
				price: parseFloat(combo.price),
				description: combo.description || ''
			})

			// 处理套餐食物
			const foods = parsed.comboFoods?.filter(f => {
				// 找到属于这个套餐的食物
				const relatedFood = parsed.comboFoods?.find(cf =>
					cf.comboId === combo.id || cf.comboId === comboId
				)
				return relatedFood
			}) || []

			// 如果没有明确的comboFoods关联，从description推断
			if (foods.length === 0 && combo.description) {
				// 从description中提取食物
				const descFoods = inferFoodsFromDescription(combo.description)
				for (const foodName of descFoods) {
					comboFoods.push({
						comboId,
						foodName,
						quantity: 1
					})
				}
			} else {
				for (const food of foods) {
					comboFoods.push({
						comboId,
						foodName: food.foodName,
						quantity: food.quantity || 1
					})
				}
			}
		}

		return { combos, comboFoods, raw: parsed }
	} catch (e) {
		throw new Error(`JSON解析失败: ${e.message}\n原始内容:\n${response.substring(0, 500)}`)
	}
}

function inferFoodsFromDescription(description) {
	// 从描述中提取食物名称的简单逻辑
	const foodPatterns = [
		/皇堡/g,
		/安格斯/g,
		/香辣鸡腿堡/g,
		/薯霸王\(大\)|大薯/g,
		/薯霸王\(中\)|中薯/g,
		/薯霸王\(小\)|小薯/g,
		/可口可乐\(大\)|大可乐/g,
		/可口可乐\(中\)|中可乐/g,
		/可口可乐\(小\)|小可乐/g,
		/鸡块\(5块\)|鸡块5/g,
		/鸡块\(3块\)|鸡块3/g,
		/洋葱圈/g,
		/玉米杯/g,
		/冰淇淋/g,
		/美式咖啡/g,
		/华夫饼/g,
		/鲜蔬沙拉/g
	]

	// 这个函数在实际中应该由LLM填充准确的foodName
	// 这里只是一个占位
	return []
}

function mergeWithExisting(newCombos, newComboFoods, startComboId) {
	// 读取现有数据
	let existingCombos = { combos: [] }
	let existingComboFoods = { comboFoods: [] }

	const combosPath = path.join(CONFIG.outputDir, 'combos.json')
	const comboFoodsPath = path.join(CONFIG.outputDir, 'combo_foods.json')

	if (fs.existsSync(combosPath)) {
		try {
			existingCombos = JSON.parse(fs.readFileSync(combosPath, 'utf8'))
		} catch (e) {
			console.warn('[警告] 读取现有combos.json失败:', e.message)
		}
	}

	if (fs.existsSync(comboFoodsPath)) {
		try {
			existingComboFoods = JSON.parse(fs.readFileSync(comboFoodsPath, 'utf8'))
		} catch (e) {
			console.warn('[警告] 读取现有combo_foods.json失败:', e.message)
		}
	}

	// 找到最大的序号
	let maxId = 0
	for (const combo of existingCombos.combos) {
		const match = combo.id.match(/combo_(\d+)/)
		if (match) {
			maxId = Math.max(maxId, parseInt(match[1]))
		}
	}

	// 重新编号新套餐
	const idMapping = {}
	for (let i = 0; i < newCombos.length; i++) {
		maxId++
		idMapping[newCombos[i].id] = `combo_${String(maxId).padStart(3, '0')}`
		newCombos[i].id = idMapping[newCombos[i].id]
	}

	// 更新comboFoods中的comboId
	for (const cf of newComboFoods) {
		if (idMapping[cf.comboId]) {
			cf.comboId = idMapping[cf.comboId]
		}
	}

	return {
		combos: [...existingCombos.combos, ...newCombos],
		comboFoods: [...existingComboFoods.comboFoods, ...newComboFoods]
	}
}

function saveResults(merged) {
	const combosPath = path.join(CONFIG.outputDir, 'combos.json')
	const comboFoodsPath = path.join(CONFIG.outputDir, 'combo_foods.json')

	fs.writeFileSync(combosPath, JSON.stringify({ combos: merged.combos }, null, 2), 'utf8')
	console.log(`[保存] ${combosPath}`)

	fs.writeFileSync(comboFoodsPath, JSON.stringify({ comboFoods: merged.comboFoods }, null, 2), 'utf8')
	console.log(`[保存] ${comboFoodsPath}`)
}

function displayResults(result) {
	console.log('\n========== 解析结果 ==========\n')

	for (const combo of result.combos) {
		const foods = result.comboFoods.filter(cf => cf.comboId === combo.id)
		console.log(`[${combo.id}] ${combo.name}`)
		console.log(`   价格: ¥${combo.price}`)
		console.log(`   平台: ${combo.platform}`)
		console.log(`   食物: ${foods.map(f => f.foodName).join(' + ')}`)
		console.log()
	}
}

// ==================== 主程序 ====================

async function main() {
	console.log('====================================')
	console.log('   汉堡王套餐数据构建工具')
	console.log('====================================\n')

	// 检查LLM配置
	if (!CONFIG.llm.apiKey) {
		console.error('[错误] LLM未配置')
		console.error('请在config.json中设置minimaxApiKey')
		process.exit(1)
	}

	// 加载食物映射
	const { foodMap, foods } = loadFoodsMap()

	// 构建食物列表供LLM参考
	const foodList = foods.map(f =>
		`${f.name} (${f.nameZh}) - 单品价: ¥${f.soloPrice}`
	).join('\n')

	// 获取图片路径
	const args = process.argv.slice(2)
	let imagePath

	if (args.includes('--clipboard') || args.includes('--cb')) {
		console.log('[工具] 从剪贴板读取图片...\n')
		imagePath = await getImageFromClipboard()
	} else if (args.includes('--image') || args.includes('-i')) {
		const idx = args.indexOf('--image')
		const imgIdx = idx !== -1 ? idx : args.indexOf('-i')
		imagePath = args[imgIdx + 1]
		if (!imagePath) {
			console.error('[错误] 请指定图片路径')
			process.exit(1)
		}
		imagePath = path.resolve(imagePath)
	} else {
		console.error('[错误] 请使用 --clipboard 或 --image 参数')
		process.exit(1)
	}

	// 读取图片
	console.log('[工具] 读取图片...')
	const imageBuffer = fs.readFileSync(imagePath)
	const base64Image = imageBuffer.toString('base64')

	// 清理临时文件
	if (imagePath.includes(os.tmpdir())) {
		try { fs.unlinkSync(imagePath) } catch (e) {}
	}

	// 调用LLM
	console.log('[工具] 调用LLM识别图片...\n')
	const response = await callLLMWithImage(base64Image, foodList)

	console.log('[LLM] 识别完成\n')
	console.log('原始响应预览:')
	console.log(response.substring(0, 300) + '...\n')

	// 解析响应
	console.log('[工具] 解析JSON...\n')
	const result = parseLLMResponse(response)

	// 显示结果
	displayResults(result)

	// 合并现有数据
	const merged = mergeWithExisting(result.combos, result.comboFoods)

	// 保存结果
	saveResults(merged)

	console.log('\n[完成] 套餐数据已保存')
}

main().catch(err => {
	console.error('\n[错误]', err.message)
	process.exit(1)
})
