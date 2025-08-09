
# Changelog

## [0.0.1] - 2025-08-09

### 🎉 Initial Release

**Core Features:**
- **Multi-threaded File Chunking**: Efficient parallel file splitting using Web Workers
- **Concurrent Processing**: Configurable concurrency with automatic retry and backpressure handling  
- **Task Control**: Pause, resume, and cancel operations with graceful cleanup
- **Progress Tracking**: Real-time progress callbacks for UI responsiveness
- **Data Integrity**: MD5 hashing for both chunks and complete files using SparkMD5
- **Memory Optimization**: Stream-based processing without loading entire files

**API:**
- `chunkFile()` - Split files into parallel-processed chunks
- `processChunks()` - Process chunks with retry, concurrency control, and lifecycle management
- `calculateFileHash()` - Compute MD5 hash from chunk hashes
- `collectChunks()` - Gather all processed chunks in order

**TypeScript Support:**
- 100% TypeScript implementation with comprehensive type definitions
- Strict type checking and intellisense support

**Browser Compatibility:**
- Chrome 51+, Firefox 54+, Safari 10+, Edge 79+
- Requires Web Workers and AbortSignal support
