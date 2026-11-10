# 外部前端实现的技术核验

仅在复用第三方桌面交互、性能技巧或裁切检测工具时阅读。来源与许可见 [资料与致谢](sources.md)。

## 参数与工具的适用边界

- **500ms 的 post-composition Enter 拦截**只是兼容性示例，可能吞掉用户真实的快速 Enter。应结合 isComposing、keyCode 229 兼容处理，设短时可调的一次性 fallback 并实测。
- **CSS Scroll-Driven Animations 可以减少 JavaScript 介入，但不代表真实 CPU 恒为 0 或所有情况下都在合成器运行**；需要浏览器支持检测与性能测量。
- **`box-shadow` 的 blur 并非严格像素可见边界**，靠 offset+blur+spread 做余量是一种保守近似。
- **[clip-audit](https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/scripts/clip-audit.js) 的 `cut===0` 不是最终视觉正确性证明**：可能漏掉 clip-path 形状、滚动边界、动态中间帧、真实 GPU/窗口裁切或产生误报。用截图、真实窗口和手工核对。
- **分屏 18%/82% 仅是示例吸附阈值**，窄窗口时可能与最小可用宽度矛盾；必须结合实际容器宽度以及单列/Drawer 降级。
- **隐藏滚动条**可能让用户误以为内容不可滚；无障碍优先，谨慎应用。
- **多窗口 Broker / Replica** 是有多窗口共享可写资源需求时的可选架构，不能套用到普通 Web 单标签页。
