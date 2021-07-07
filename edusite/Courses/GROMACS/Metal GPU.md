```swift

import MetalPerformanceShaders
let device = MTLCreateSystemDefaultDevice()!
MPSSupportsMTLDevice(device)
let commandQueue = device.makeCommandQueue()!
let commandBuffer = commandQueue.makeCommandBuffer()!

```
