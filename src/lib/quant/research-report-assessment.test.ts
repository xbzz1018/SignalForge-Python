import { expect, it } from 'vitest';
import { buildDailyResearchReport } from './research-reports';

const evidence = { source: 'test', status: 'available' as const, detail: '', capturedAt: '2026-11-20T12:00:00Z' };
function report(ready: number, screener: unknown) {
  return buildDailyResearchReport({
    watchlist: { id: 'watch', name: '示例', status: 'active', universeId: 'pool', symbols: [], markets: [],
      description: null, schedule: {}, reportTemplate: 'daily', notificationChannelIds: [], updatedAt: evidence.capturedAt },
    universesProbe: { data: { universes: [{ id: 'pool', ready_count: ready, member_count: 300 }] }, evidence },
    screenerProbe: { data: screener, evidence },
    clickhouseProbe: { data: null, evidence: { ...evidence, status: 'disabled' } },
  });
}

it('explains missing bars without issuing a risk assessment', () => {
  const result = report(0, { eligible_symbols: 0, candidates: [] });
  expect(result).toMatchObject({ riskLevel: 'unassessed', score: null });
  expect(result.summary).toContain('0/300');
  expect(result.contentMarkdown).not.toMatch(/\d+\/100|防守为主|风险等级：高/);
});

it('distinguishes a completed empty screen from an unavailable screen', () => {
  expect(report(90, { eligible_symbols: 18, candidates: [] }).summary).toContain('18 个标的具备筛选条件');
  expect(report(90, {}).summary).toContain('筛选结果不可用');
});

it('keeps candidate evidence and a numerical score for a successful screen', () => {
  const result = report(200, { eligible_symbols: 60, candidates: [{ symbol: 'TEST', name: '样例', score: 78 }] });
  expect(result.score).toEqual(expect.any(Number));
  expect(result.contentMarkdown).toContain('样例 TEST');
});
