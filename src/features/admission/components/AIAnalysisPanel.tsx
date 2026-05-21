import { Panel } from '@/components/cyber/Panel';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { Brain, Lightbulb, Target } from 'lucide-react';

interface AIAnalysisPanelProps {
  aiDecision?: string | null;
  aiReasoning?: string | null;
  aiSuggestedProfession?: string | null;
}

function aiDecisionVariant(decision?: string | null): 'red' | 'amber' | 'green' {
  if (!decision) return 'amber';
  const d = decision.toUpperCase();
  if (d === 'ACCEPTED') return 'green';
  if (d === 'REJECTED') return 'red';
  return 'amber';
}

function aiDecisionLabel(decision?: string | null): string {
  if (!decision) return 'UNAVAILABLE';
  return decision.toUpperCase();
}

export function AIAnalysisPanel({
  aiDecision,
  aiReasoning,
  aiSuggestedProfession,
}: AIAnalysisPanelProps) {
  const hasData = aiDecision || aiReasoning || aiSuggestedProfession;

  if (!hasData) {
    return (
      <Panel title="AI ANALYSIS" tag="AI.EVAL" accent="purple">
        <div className="flex flex-col items-center gap-3 py-6">
          <Brain className="h-8 w-8 text-[var(--neon-fuchsia)]/30" />
          <p className="font-mono-data text-xs text-muted-foreground text-center">
            AI evaluation data is not available for this request.
          </p>
          <p className="font-mono-data text-[10px] text-muted-foreground/60 text-center">
            The AI may still be processing or the backend did not include evaluation fields.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="AI ANALYSIS" tag="AI.EVAL" accent="purple">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4 text-[var(--neon-fuchsia)]" />
          <span className="font-mono-data text-[10px] tracking-[0.2em] text-muted-foreground">
            DECISION //
          </span>
          <StatusBadge
            status={aiDecisionLabel(aiDecision)}
            variant={aiDecisionVariant(aiDecision)}
          />
        </div>

        {aiSuggestedProfession && (
          <div className="flex items-center gap-3">
            <Lightbulb className="h-4 w-4 text-[var(--neon-cyan)]" />
            <span className="font-mono-data text-[10px] tracking-[0.2em] text-muted-foreground">
              SUGGESTED PROFESSION //
            </span>
            <span className="font-mono-data text-xs text-foreground">{aiSuggestedProfession}</span>
          </div>
        )}

        {aiReasoning && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-4 w-4 text-[var(--neon-cyan)]" />
              <span className="font-mono-data text-[10px] tracking-[0.2em] text-muted-foreground">
                REASONING //
              </span>
            </div>
            <div className="border border-[oklch(0.68_0.32_340_/_0.2)] p-3 bg-[oklch(0.15_0.05_320_/_0.5)]">
              <p className="font-mono-data text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {aiReasoning}
              </p>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
