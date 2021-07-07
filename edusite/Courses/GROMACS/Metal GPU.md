```swift

import MetalPerformanceShaders // GPU Library

let device = MTLCreateSystemDefaultDevice()! // Calling the default gpu for computation
MPSSupportsMTLDevice(device) // Returns True or False if device is present or not
let commandQueue = device.makeCommandQueue()! //Command Queue that goes to GPU
let commandBuffer = commandQueue.makeCommandBuffer()! // Buffer that goes to Queue then to GPU. Multiple buffer are stacked below a single Queue.

```
