import { expect, test } from '@playwright/test';

test('a response for an edited draft cannot enable publishing', async ({ page }) => {
	await page.clock.install();
	await page.goto('/');
	await page.getByRole('button', { name: 'Review draft' }).click();
	await page.getByLabel('Kit name').fill('Camera kit V2');
	await page.clock.runFor(1_000);
	await expect(page.getByRole('status')).toHaveText('The draft changed during review. Run the review again.');
	await expect(page.getByRole('button', { name: 'Publish reviewed draft' })).toBeDisabled();
});

test('publishing keeps edits made after the reviewed revision', async ({ page }) => {
	await page.clock.install();
	await page.goto('/');
	const title = page.getByLabel('Kit name');
	await title.fill('Camera kit V2');
	await page.getByRole('button', { name: 'Review draft' }).click();
	await page.clock.runFor(1_000);
	await page.getByRole('button', { name: 'Publish reviewed draft' }).click();
	await title.fill('Camera kit V3');
	await page.clock.runFor(1_000);
	await expect(page.getByRole('region', { name: 'Published version' })).toContainText('Camera kit V2');
	await expect(title).toHaveValue('Camera kit V3');
	await expect(page.getByRole('status')).toContainText('Your newer edits are still in the draft.');
});

test('a failed publication can be retried once for the same reviewed revision', async ({ page }) => {
	await page.clock.install();
	await page.goto('/');
	await page.getByLabel('Kit name').fill('Reviewed kit');
	await page.getByRole('button', { name: 'Review draft' }).click();
	await page.clock.runFor(1_000);
	await page.getByLabel('Simulate the next publication failing').check();
	const publish = page.getByRole('button', { name: 'Publish reviewed draft' });
	await publish.dblclick();
	await expect(publish).toBeDisabled();
	await page.clock.runFor(1_000);
	await expect(page.getByRole('region', { name: 'Published version' })).toContainText('Awaiting publication.');
	await expect(page.getByRole('status')).toContainText('You can retry the reviewed revision.');
	await publish.click();
	await page.clock.runFor(1_000);
	await expect(page.getByRole('region', { name: 'Published version' })).toContainText('Reviewed kit');
});
