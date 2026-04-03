<template>
	<view class="uni-icons" :style="{ color: color, fontSize: size }">
		<text v-if="type === 'plus'">+</text>
		<text v-else-if="type === 'checkbox-filled'">✓</text>
		<text v-else-if="type === 'location-filled'">📍</text>
		<text v-else-if="type === 'star-filled'">⭐</text>
		<text v-else-if="type === 'list'">☰</text>
		<text v-else-if="type === 'camera'">📷</text>
		<text v-else-if="type === 'github'">🐙</text>
		<text v-else-if="type === 'help'">❓</text>
		<text v-else-if="type === 'arrow-right'">→</text>
		<text v-else-if="type === 'arrow-left'">←</text>
		<text v-else-if="type === 'scan'">🔍</text>
		<text v-else-if="type === 'upload'">⬆</text>
		<text v-else-if="type === 'delete'">🗑</text>
		<text v-else-if="type === 'edit'">✏</text>
		<text v-else-if="type === 'refresh'">🔄</text>
		<text v-else-if="type === 'cloud'">☁</text>
		<text v-else-if="type === 'info'">ℹ</text>
		<text v-else-if="type === 'close'">✕</text>
		<text v-else-if="type === 'checkmark'">✓</text>
		<text v-else>{{ type }}</text>
	</view>
</template>

<script setup>
defineProps({
	type: {
		type: String,
		default: ''
	},
	size: {
		type: [String, Number],
		default: '24rpx'
	},
	color: {
		type: String,
		default: '#333'
	}
})
</script>

<style scoped>
.uni-icons {
	display: inline-flex;
	align-items: center;
	justify-content: center;
}
</style>
