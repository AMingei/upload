import SparkMD5 from 'spark-md5'
// import '../utils/spark-md5.min.js'

onmessage = (event) => {
	console.log(`[main thread] ${event.data.name}`)
	const spark = new SparkMD5.ArrayBuffer()
	const reader = new FileReader()
	reader.readAsArrayBuffer(event.data)
	reader.onload = (event) => {
		spark.append(event.target.result)
		postMessage(spark.end())
	}
}