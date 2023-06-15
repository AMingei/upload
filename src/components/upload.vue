<script lang="js" setup>
import { computed, ref, unref, watch } from 'vue'

const host = ''

const files = ref()
const hash = ref()
const fileUploaderRef = ref()
const rawFileUploaderRef = ref()
const hashCalculatorWorker = ref()
const xhrRef = ref()

const uploadedSize = ref('?')
const totalSize = ref('?')

const isOvering = ref(false)
const isCalculating = ref(false)
const isChecked = computed(() => !!unref(files))
const isUploading = ref(false)

watch(files, (newVal, oldVal) => {
	if(newVal !== oldVal) {
		files.value = newVal
		uploadedSize.value = '?'
		totalSize.value = undefined
		if(unref(hashCalculatorWorker)) {
			hashCalculatorWorker.value.terminate()
		}
		hashCalculatorWorker.value = new Worker(new URL('../workers/hashCalculator.js', import.meta.url), { type: 'module' })
		isCalculating.value = true
		hashCalculatorWorker.value.onmessage = (event) => {
			console.log(`[hash calculator worker] ${event.data}.`)
			hash.value = event.data
			isCalculating.value = false
		}
		hashCalculatorWorker.value.postMessage(newVal)
	// } else if(!newVal.every((file) => oldVal.find(file))) {
	// 	files.value = newVal
	}
})

const onClick = () => {
	if(!isUploading.value) {
		rawFileUploaderRef.value.click()
	}
}
const onDragenter = () => {
	if(!isUploading.value) {
		isOvering.value = true
	}
}
const onDragleave = () => {
	if(!isUploading.value) {
		isOvering.value = false
	}
}
const onDrop = (event) => {
	if(!isUploading.value) {
		isOvering.value = false
		// files.value = event.dataTransfer.files || undefined
		files.value = event.dataTransfer.files[0] || undefined
	}
}
const onFileInput = (event) => {
	// files.value = event.target.files
	files.value = event.target.files[0] || undefined
}
const onFileUncheck = () => {
	files.value = undefined
	hash.value = undefined
}

const getUploadedSize = async () => {
	const url = new URL(`file-status/${unref(hash)}`, host)
	const response = await fetch(url)
	if(!response.ok) {
		throw new Error(`something went wrong: ${response.status} ${response.statusText}.`)
	}
	const result = await response.text()
	return result
}
const uploadFile = async () => {
	isUploading.value = true
	const startBytes = await getUploadedSize()
	
	if(startBytes < unref(files).size) {
		const url = new URL(`file/${unref(hash)}`, host)
		const body = unref(files).slice(startBytes)
		
		xhrRef.value = new XMLHttpRequest()

		const xhr = unref(xhrRef)
		xhr.upload.onprogress = (event) => {
			uploadedSize.value = startBytes + event.loaded
			totalSize.value = startBytes + event.total
			console.log(`${uploadedSize.value} of ${totalSize.value}`)
		}
		xhr.onload = () => {
			alert('已上传完毕')
		}
		xhr.onloadend = () => {
			isUploading.value = false
		}

		xhr.open('POST', url)
		xhr.send(body)
	} else {
		isUploading.value = false
		alert('已上传完毕')
	}
}
const abortUpload = () => {
	xhr.value.abort()
}
</script>

<template>
	<div ref="fileUploaderRef" class="file-uploader" :class="{ overing: isOvering, checked: isChecked }"
	@click="onClick"
	@dragenter.prevent="onDragenter"
	@dragleave.prevent="onDragleave"
	@dragover.prevent
	@drop.prevent="onDrop">
	
		<input ref="rawFileUploaderRef" name="file-uploader" id="file-uploader"
		type="file" title="title" hidden
		@input="onFileInput" />

		<div class="uncheck" title="取消"
		v-show="(isChecked || isCalculating) && !isUploading"
		@click.stop="onFileUncheck">
			<svg width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 352 512"><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28L75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256L9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" fill="currentColor"></path></svg>
		</div>

		{{ isCalculating ? '扫描中' : isChecked ? '扫描完成' : '' }}
	
	</div>
	
	<p>{{ files?.name }}</p>
	<p>{{ `${uploadedSize} / ${(totalSize || files?.size || 0)} bytes` }}</p>
	<p>{{ hash }}</p>

	<button :disabled="!isChecked || isCalculating || isUploading"
	@click="uploadFile">upload</button>
	
	&emsp;<button :disabled="!isUploading"
	@click="abortUpload">abort</button>
</template>

<style scoped>
.file-uploader {
	box-sizing: border-box;
	position: relative;
	display: inline-flex;
	justify-content: center;
	align-items: center;
	width: 5em;
	height: 5em;
	border: .25em dashed #FFF3;
	border-radius: .5em;
	transition: box-shadow .4s, border-color .4s;
	cursor: pointer;
}
.file-uploader.overing {
	box-shadow: 0 0 2em -.5em aqua, inset 0 0 2em -1em aqua;
	border-style: solid;
	border-color: aqua;
}
.file-uploader.checked {
	border-style: solid;
	border-color: aqua;
}
.file-uploader > .uncheck {
	box-sizing: border-box;
	position: absolute;
	top: -.5em;
	right: -.5em;
	display: inline-flex;
	justify-content: center;
	align-items: center;
	height: 1.5em;
	width: 1.5em;
	border-radius: 50%;
	color: #242424;
	background-color: darkred;
	transition: background-color .4s;
}
.file-uploader > .uncheck:hover {
	background-color: red;
}
</style>