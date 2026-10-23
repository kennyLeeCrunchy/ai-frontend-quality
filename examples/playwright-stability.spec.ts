/**
 * Playwright 验收骨架：需按项目路由、data-testid 和后端 mock/测试数据库调整。
 * 不保证复制后零修改即可执行；在实际项目中接入 @playwright/test。
 */
import { test, expect } from '@playwright/test';

const widths = [375, 768, 1280, 1440, 1920];
for (const width of widths) {
  test(`布局宽度 ${width}px 不横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/workspace/demo');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
    // 中央必须可读，可根据项目调整界面断点要求
    await expect(page.getByTestId('workspace')).toBeVisible();
  });
}

test('超长内容不会把四象限挤出容器', async ({ page }) => {
  await page.goto('/workspace/demo');
  await page.getByTestId('add-card').click();
  await page.getByTestId('card-editor').fill('LONG_WORD_'.repeat(150));
  const result = await page.getByTestId('workspace').evaluate(el => ({
    contentWidth: el.scrollWidth, clientWidth: el.clientWidth,
  }));
  expect(result.contentWidth).toBeLessThanOrEqual(result.clientWidth + 1);
});

test('生成中可以切换对话、编辑工作区，生成结果仍归原会话', async ({ page }) => {
  await page.goto('/chats/A');
  // 测试后端请固定可控地模拟 SSE 长任务，防止真实模型返回太快导致不稳定。
  await page.getByTestId('send-message').click();
  await expect(page.getByTestId('task-status')).toContainText(/queued|running|streaming/);
  await page.getByTestId('chat-B').click();
  await expect(page).toHaveURL(/\/chats\/B/);
  await page.getByTestId('edit-workspace').click();
  await expect(page.getByTestId('editor')).toBeEnabled();
  await page.getByTestId('chat-A').click();
  await expect(page.getByTestId('task-status')).toContainText(/streaming|succeeded/);
  // 服务端需要验证任务不会因为导航触发取消。
});

test('编辑一条卡片不会让无关卡片的输入草稿重置', async ({ page }) => {
  await page.goto('/workspace/demo');
  const draft = page.getByTestId('card-draft-other');
  await draft.fill('未保存的草稿');
  await page.getByTestId('save-first-card').click();
  await expect(draft).toHaveValue('未保存的草稿');
});

// 额外：检测请求是否发起 document Reload、卡片编辑时是否出现全屏 Loading、
// 任务中断线重连、cancel_requested/完成竞态、SSE seq 去重；也应有人手测。

// New-video regression ideas. The selectors/routes are placeholders for project integration.
test.skip('中文输入法 Enter 确认候选词不应直接发送', async ({ page }) => {
  await page.goto('/chats/A');
  // Playwright keyboard alone does not faithfully simulate a real OS IME session.
  // Use a manual cross-platform CJK IME matrix, or app-level synthetic composition
  // event test for the event handler (both are needed; neither proves the other).
  await expect(page.getByTestId('message-composer')).toBeVisible();
});

test.skip('流式输出期间，上滚阅读不会被自动拉回底部', async ({ page }) => {
  await page.goto('/chats/long-stream');
  const history = page.getByTestId('chat-history');
  await history.evaluate(el => { el.scrollTop = 0; });
  const before = await history.evaluate(el => el.scrollTop);
  // Insert mock streamed chunks here, then verify scrollTop does not jump.
  expect(await history.evaluate(el => el.scrollTop)).toBe(before);
  await page.getByRole('button', { name: /回到底部/ }).click();
});

test.skip('分屏 drag / Escape / 折叠后可以恢复', async ({ page }) => {
  await page.goto('/workspace/split');
  const handle = page.getByRole('separator', { name: '调整左右面板宽度' });
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(handle).toHaveAttribute('aria-valuenow', /\d+/);
  // Pointer movement + Escape + pointercancel requires project-specific tests.
});
