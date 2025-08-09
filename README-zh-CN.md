# FluxForge

[![npm version](https://img.shields.io/npm/v/fluxforge.svg)](https://www.npmjs.com/package/fluxforge)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

企业级文件分块和并发处理库，具备 Web Workers、自动重试、实时进度跟踪和 MD5 完整性验证功能，专为现代浏览器设计。非常适合大文件上传、流式处理和数据处理管道场景。

[English](README.md) | 简体中文

---

## 在线演示

[在线演示](https://joygqz.github.io/fluxforge/)

---

## 核心特性

### 🚀 高性能架构

- **多线程处理**：利用 Web Workers 实现真正的并行分块，最大化 CPU 利用率
- **零拷贝流式处理**：内存高效的分块处理，无需将整个文件加载到内存中
- **智能资源管理**：自动检测硬件能力并优化线程分配

### 🛡️ 企业级可靠性

- **自动重试逻辑**：内置指数退避策略处理临时故障
- **任务生命周期管理**：全面的暂停/恢复/取消控制，优雅清理资源
- **基于信号的取消**：集成 AbortSignal 实现即时任务终止
- **类型安全 API**：100% TypeScript，严格类型检查和全面接口定义

### 🔧 高级任务调度

- **可配置并发度**：根据系统约束精细调整并行执行限制
- **实时进度跟踪**：细粒度进度回调确保 UI 响应性
- **背压处理**：智能队列防止高吞吐量场景下的内存溢出

### 🔐 数据完整性

- **分块级 MD5 哈希**：使用 SparkMD5 进行每个分块的完整性验证
- **文件级哈希计算**：聚合哈希计算用于完整文件验证
- **确定性处理**：保证并行操作中的分块顺序

---

## 安装

```bash
npm install fluxforge
```

---

## 快速开始

```typescript
import { calculateFileHash, chunkFile, processChunks } from 'fluxforge'

// 使用最优设置创建分块 Promise
const chunkPromises = chunkFile(file, {
  chunkSize: 4 * 1024 * 1024 // 4MB 分块以获得最佳性能
})

// 使用高级配置处理分块
const controller = processChunks(
  chunkPromises,
  async (chunk, signal) => {
    // 优雅处理取消
    if (signal.aborted)
      throw new Error('操作已取消')

    // 您的业务逻辑（上传、转换等）
    await uploadChunk(chunk.blob, chunk.index)

    // 可选：在长时间操作中监听取消
    signal.addEventListener('abort', () => {
      // 清理资源，取消网络请求等
    })
  },
  {
    concurrency: 6, // 大多数场景的最佳值
    onProgress: (completed, total) => {
      const percentage = Math.round((completed / total) * 100)
      updateProgressBar(percentage)
    }
  }
)

// 高级任务控制
controller.pause() // 优雅暂停所有处理
controller.resume() // 从暂停处恢复
controller.cancel() // 立即中止所有操作

// 等待完成
try {
  await controller.promise
  console.log('所有分块处理成功')
}
catch (error) {
  if (error.message === 'Task cancelled') {
    console.log('处理被用户取消')
  }
  else {
    console.error('处理失败:', error)
  }
}

// 验证文件完整性
const fileHash = await calculateFileHash(chunkPromises)
console.log('文件 MD5:', fileHash)
```

---

## 高级使用模式

### 大文件上传与进度跟踪

```typescript
async function uploadLargeFile(file: File, uploadUrl: string) {
  const chunkPromises = chunkFile(file, { chunkSize: 8 * 1024 * 1024 })

  const controller = processChunks(
    chunkPromises,
    async (chunk, signal) => {
      const formData = new FormData()
      formData.append('chunk', chunk.blob)
      formData.append('index', chunk.index.toString())
      formData.append('hash', chunk.hash)

      const response = await fetch(`${uploadUrl}/chunk`, {
        method: 'POST',
        body: formData,
        signal // 自动请求取消
      })

      if (!response.ok) {
        throw new Error(`上传失败: ${response.statusText}`)
      }
    },
    {
      concurrency: 4, // 网络操作的保守设置
      onProgress: (completed, total) => {
        const progress = (completed / total) * 100
        console.log(`上传进度: ${progress.toFixed(1)}%`)
      }
    }
  )

  return controller
}
```

### 数据处理管道

```typescript
// 定义自定义处理后的分块类型
interface ProcessedChunk {
  data: any
  originalHash: string
  index: number
}

async function processFileData(file: File) {
  const chunkPromises = chunkFile(file)
  const processedChunks: ProcessedChunk[] = []

  await processChunks(
    chunkPromises,
    async (chunk, signal) => {
      // 转换分块数据
      const processedData = await transformChunkData(chunk.blob, signal)

      // 保持顺序存储结果
      processedChunks[chunk.index] = {
        data: processedData,
        originalHash: chunk.hash,
        index: chunk.index
      }
    },
    {
      concurrency: navigator.hardwareConcurrency || 4,
      onProgress: (completed, total) => {
        console.log(`处理中: ${completed}/${total} 个分块`)
      }
    }
  )

  return processedChunks
}
```

### 错误处理和重试策略

```typescript
const controller = processChunks(
  chunkPromises,
  async (chunk, signal) => {
    // 库会自动处理指数退避重试
    // 您的处理器只需在失败时抛出错误
    const result = await riskyOperation(chunk.blob)

    if (!result.success) {
      throw new Error(`分块 ${chunk.index} 处理失败`)
    }

    return result
  },
  {
    concurrency: 8,
    onProgress: (completed, total) => {
      // 此回调仅在成功处理后调用
      console.log(`成功处理: ${completed}/${total}`)
    }
  }
)

// 指数退避自动重试:
// 重试 1: 0 秒延迟（立即）
// 重试 2: 1 秒延迟
// 重试 3: 2 秒延迟
// 重试 4: 3 秒延迟
// ...
// 最大延迟: 5 秒
```

---

## API 参考

### 核心函数

#### `chunkFile(file: File, options?: Options): Promise<Chunk>[]`

将文件分割成分块 Promise 数组，每个分块由 Web Workers 并行处理。

**参数:**

- `file`: 要分块的 File 对象
- `options.chunkSize`: 分块大小（字节），默认: `Math.min(1024 * 1024, file.size)`

**返回:** 解析为 `Chunk` 对象的 Promise 数组

**性能说明:**

- 基于 `navigator.hardwareConcurrency` 自动确定最佳 worker 数量
- 所有分块处理完成后自动终止 workers
- 尽管并行处理，仍保证分块顺序

#### `processChunks(chunkPromises, processor, options?): ProcessController`

使用可配置并发度和自动重试逻辑处理分块 Promise。

**参数:**

- `chunkPromises`: 来自 `chunkFile()` 的分块 Promise 数组
- `processor`: 处理每个分块的函数
- `options.concurrency`: 最大并发处理器数量（默认: 6）
- `options.onProgress`: 进度回调函数

**返回:** 具有暂停/恢复/取消功能的 `ProcessController`

**处理器函数:**

```typescript
type ChunkProcessor = (chunk: Chunk, signal: AbortSignal) => void | Promise<void>
```

处理器接收:

- `chunk`: 包含 blob 数据和元数据的已解析分块
- `signal`: 用于取消处理的 AbortSignal

#### `collectChunks(chunkPromises: Promise<Chunk>[]): Promise<Chunk[]>`

等待所有分块 Promise 解析并按原始顺序返回它们。

#### `calculateFileHash(chunkPromises: Promise<Chunk>[]): Promise<string>`

通过聚合各个分块哈希计算整个文件的 MD5 哈希值。

### 类型定义

```typescript
interface Chunk {
  blob: Blob // 分块数据
  hash: string // 此分块的 MD5 哈希
  index: number // 从零开始的分块索引
  start: number // 文件中的起始字节位置
  end: number // 文件中的结束字节位置
}

interface Options {
  chunkSize?: number // 分块大小（字节）
}

interface ProcessOptions {
  concurrency?: number // 最大并发处理器数量
  onProgress?: (completed: number, total: number) => void
}

interface ProcessController {
  pause: () => void // 暂停处理
  resume: () => void // 恢复处理
  cancel: () => void // 取消所有处理
  promise: Promise<void> // 完成 Promise
}
```

---

## 性能考虑

### 最佳分块大小

- **小文件 (<10MB)**: 使用默认分块大小简化操作
- **中等文件 (10MB-1GB)**: 2-8MB 分块平衡内存/性能
- **大文件 (>1GB)**: 8-16MB 分块最小化开销

### 并发度指南

- **CPU 密集型处理**: 使用 `navigator.hardwareConcurrency`
- **网络操作**: 3-6 个并发请求避免服务器过载
- **内存受限环境**: 减少并发度防止内存不足

### 内存管理

- 库使用流式处理最小化内存占用
- 只有活跃分块保存在内存中
- 已处理分块的自动垃圾回收

---

## 错误处理

库提供强大的错误处理和自动重试机制：

1. **临时故障**: 使用指数退避自动重试
2. **取消操作**: 通过 AbortSignal 清洁终止
3. **致命错误**: 立即传播故障

```typescript
try {
  await controller.promise
}
catch (error) {
  if (error.message === 'Task cancelled') {
    // 用户主动取消
  }
  else {
    // 所有重试耗尽后的实际处理错误
  }
}
```

---

## 浏览器兼容性

- **Chrome 51+** (Web Workers, AbortSignal)
- **Firefox 54+** (Web Workers, AbortSignal)
- **Safari 10+** (Web Workers 支持)
- **Edge 79+** (基于 Chromium)

---

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。
