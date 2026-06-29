import type { ReplayReport } from './types';

export class ReplayReportGenerator {
  static generateTextReport(report: ReplayReport): string {
    const duration = report.finishedAt - report.startedAt;
    let text = `# Protocol Event Replay Report\n\n`;
    text += `Generated at: ${new Date().toISOString()}\n`;
    text += `Duration: ${duration}ms\n\n`;
    text += `## Summary\n`;
    text += `- Total events: ${report.totalEvents}\n`;
    text += `- Success: ${report.successCount}\n`;
    text += `- Errors: ${report.errorCount}\n\n`;
    
    if (report.errorCount > 0) {
      text += `## Errors\n`;
      report.steps.filter(s => !s.success).forEach(step => {
        text += `\n### Step ${step.index} (Event: ${step.event.type})\n`;
        text += `- Event ID: ${step.event.id}\n`;
        text += `- Timestamp: ${new Date(step.event.timestamp).toISOString()}\n`;
        if (step.error) {
          text += `- Error: ${step.error.message}\n`;
        }
      });
      text += '\n';
    }

    text += `## Final State\n`;
    text += JSON.stringify(report.finalState, null, 2);
    return text;
  }

  static generateJSONReport(report: ReplayReport): string {
    return JSON.stringify(report, null, 2);
  }
}
