import { Panel } from '@/components/cyber/Panel';
import { format } from 'date-fns';
import { User, Calendar, Heart, FileText, Briefcase, Brain } from 'lucide-react';

interface AdmissionDetailProps {
  applicantName: string;
  applicantAge?: number | null;
  applicantSkills?: string | null;
  healthNotes?: string | null;
  backgroundNotes?: string | null;
  photoUrl?: string | null;
  idCardUrl?: string | null;
  createdAt?: string | null;
}

export function AdmissionDetailPanel({
  applicantName,
  applicantAge,
  applicantSkills,
  healthNotes,
  backgroundNotes,
  photoUrl,
  idCardUrl,
  createdAt,
}: AdmissionDetailProps) {
  return (
    <Panel title={applicantName} tag="ADM.DETAIL" accent="cyan">
      <div className="space-y-3 font-mono-data text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
          <span className="text-muted-foreground">AGE:</span>
          <span className="text-foreground">{applicantAge ?? '—'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
          <span className="text-muted-foreground">CREATED:</span>
          <span className="text-foreground">
            {createdAt ? format(new Date(createdAt), 'dd/MM/yyyy HH:mm') : '—'}
          </span>
        </div>

        {applicantSkills && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
              <span className="text-muted-foreground">SKILLS:</span>
            </div>
            <div className="border border-[oklch(0.68_0.32_340_/_0.2)] p-2 bg-[oklch(0.15_0.05_320_/_0.5)]">
              <p className="text-foreground/80">{applicantSkills}</p>
            </div>
          </div>
        )}

        {healthNotes && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
              <span className="text-muted-foreground">HEALTH NOTES:</span>
            </div>
            <div className="border border-[oklch(0.68_0.32_340_/_0.2)] p-2 bg-[oklch(0.15_0.05_320_/_0.5)]">
              <p className="text-foreground/80">{healthNotes}</p>
            </div>
          </div>
        )}

        {backgroundNotes && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
              <span className="text-muted-foreground">BACKGROUND:</span>
            </div>
            <div className="border border-[oklch(0.68_0.32_340_/_0.2)] p-2 bg-[oklch(0.15_0.05_320_/_0.5)]">
              <p className="text-foreground/80">{backgroundNotes}</p>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
            <span className="text-muted-foreground">PHOTO:</span>
          </div>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Applicant"
              className="max-h-32 max-w-full border border-zinc-700"
            />
          ) : (
            <span className="text-muted-foreground/50">No photo uploaded</span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
            <span className="text-muted-foreground">ID CARD:</span>
          </div>
          {idCardUrl ? (
            <a
              href={idCardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--neon-cyan)] underline text-[10px]"
            >
              View ID card
            </a>
          ) : (
            <span className="text-muted-foreground/50">No ID card uploaded</span>
          )}
        </div>

        {!applicantSkills && !healthNotes && !backgroundNotes && (
          <div className="flex items-center gap-2 py-2">
            <Brain className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-muted-foreground/50">No additional applicant data recorded</span>
          </div>
        )}
      </div>
    </Panel>
  );
}
