import { z } from 'zod/v4'

export const summaryTemplateIdSchema = z.enum([
  'enhanced',
  'sales',
  'sales_sandler',
  'sales_spiced',
  'sales_meddpicc',
  'sales_bant',
  'customer_success',
  'customer_success_reach',
  'candidate_interview',
  'demo',
  'one_on_one',
  'project_kick_off',
  'project_update',
  'q_and_a',
  'retrospective',
  'stand_up'
])

export type SummaryTemplateId = z.infer<typeof summaryTemplateIdSchema>

type SummaryTemplateSection = {
  heading: string
  guidance: string
}

type SummaryTemplateDefinition = {
  sections: SummaryTemplateSection[]
  formatNotes?: string
}

const _BASE_SUMMARY_SYSTEM_INSTRUCTIONS = [
  'You write meeting notes for people who missed the call.',
  'Use only information explicitly supported by the provided transcript.',
  'If a detail is unclear or not stated, omit it — never guess, infer, or fill gaps.',
  'Do not invent people, roles, numbers, dates, quotes, decisions, or action items.',
  'Paraphrase briefly; do not paste long verbatim quotes.',
  'Output markdown only. Begin with the first required section heading (##).',
  'No title line, no preamble, no postscript, no sign-off, no offers to help.',
  'Never mention or allude to: AI, models, prompts, system instructions, templates,',
  'formatting rules, "the transcript", "this meeting", "as discussed above", or how the note was produced.',
  'Never label content as "user directions", "additional instructions", or similar.',
  'Use ## for each section heading exactly as specified below (same spelling and order).',
  'Under each heading use bullet lists unless the section guidance calls for another shape.',
  'Include a section only when there is substantive content; skip empty sections entirely.',
  'Do not add extra ## sections. Do not write "N/A", "None", or "Not discussed".'
].join(' ')

function _formatSectionBlock(section: SummaryTemplateSection): string {
  return `## ${section.heading}\n${section.guidance}`
}

function _formatTemplateDefinition(definition: SummaryTemplateDefinition): string {
  const sectionBlocks = definition.sections.map(_formatSectionBlock).join('\n\n')
  const formatNotes = definition.formatNotes
    ? ` Section-specific formatting: ${definition.formatNotes}`
    : ''

  return `Required sections (in order):\n\n${sectionBlocks}${formatNotes}`
}

const _SUMMARY_TEMPLATE_DEFINITIONS: Record<SummaryTemplateId, SummaryTemplateDefinition> =
  {
    enhanced: {
      sections: [
        {
          heading: 'Overview',
          guidance: 'Two to four sentences on purpose and outcome of the conversation.'
        },
        {
          heading: 'Key takeaways',
          guidance: 'Bullet list of the most important insights someone should remember.'
        },
        {
          heading: 'Discussion highlights',
          guidance: 'Bullet list of major topics covered, in logical order.'
        },
        {
          heading: 'Decisions',
          guidance: 'Bullet list of explicit decisions; omit section if none.'
        },
        {
          heading: 'Action items',
          guidance:
            'Bullet list with owner when stated (e.g. "- Alex: send deck by Friday").'
        },
        {
          heading: 'Open questions',
          guidance: 'Bullet list of unresolved questions; omit section if none.'
        }
      ]
    },
    sales: {
      sections: [
        {
          heading: 'Overview',
          guidance: 'Brief context on the opportunity and stage of conversation.'
        },
        {
          heading: 'Prospect context',
          guidance: 'Company, stakeholders, and situation mentioned on the call.'
        },
        {
          heading: 'Needs and challenges',
          guidance: 'Problems, goals, and requirements the prospect expressed.'
        },
        {
          heading: 'Buying journey',
          guidance: 'Timeline, process, evaluation criteria, and competitors if raised.'
        },
        {
          heading: 'Objections and risks',
          guidance: 'Concerns, blockers, or pushback; omit if none.'
        },
        {
          heading: 'Next steps',
          guidance: 'Agreed follow-ups with owners and timing when stated.'
        }
      ]
    },
    sales_sandler: {
      sections: [
        { heading: 'Overview', guidance: 'Short summary of the sales conversation.' },
        {
          heading: 'Agenda and expectations',
          guidance: 'What both sides agreed to cover or accomplish on the call.'
        },
        {
          heading: 'Pain and impact',
          guidance: 'Pain points and business impact the prospect described.'
        },
        {
          heading: 'Budget and decision process',
          guidance: 'Budget signals, approvers, and how decisions get made.'
        },
        {
          heading: 'Fit and risks',
          guidance: 'Mutual fit, disqualifiers, or deal risks if discussed.'
        },
        {
          heading: 'Next steps',
          guidance: 'Concrete follow-ups agreed on the call.'
        }
      ]
    },
    sales_spiced: {
      sections: [
        { heading: 'Situation', guidance: 'Current state and context of the prospect.' },
        { heading: 'Pain', guidance: 'Problems and frustrations they described.' },
        {
          heading: 'Impact',
          guidance: 'Business impact tied to the pain when speakers connected them.'
        },
        {
          heading: 'Critical event',
          guidance: 'Deadlines or events that force a decision; omit if none.'
        },
        {
          heading: 'Decision',
          guidance: 'How they will decide, who is involved, and criteria.'
        },
        { heading: 'Next steps', guidance: 'Agreed actions after the call.' }
      ]
    },
    sales_meddpicc: {
      sections: [
        { heading: 'Metrics', guidance: 'Quantified goals or success measures discussed.' },
        {
          heading: 'Economic buyer',
          guidance: 'Who controls budget and whether they appeared on the call.'
        },
        {
          heading: 'Decision criteria',
          guidance: 'How they will judge solutions.'
        },
        {
          heading: 'Decision process',
          guidance: 'Steps and stakeholders in their buying process.'
        },
        {
          heading: 'Paper process',
          guidance: 'Legal, procurement, or contracting steps if mentioned.'
        },
        { heading: 'Identified pain', guidance: 'Core pain driving the initiative.' },
        { heading: 'Champion', guidance: 'Internal advocate and their role if stated.' },
        { heading: 'Competition', guidance: 'Alternatives or vendors in play.' },
        { heading: 'Next steps', guidance: 'Follow-ups with owners when known.' }
      ]
    },
    sales_bant: {
      sections: [
        { heading: 'Budget', guidance: 'Budget range, constraints, or funding status.' },
        {
          heading: 'Authority',
          guidance: 'Decision makers and influencers identified on the call.'
        },
        { heading: 'Need', guidance: 'Business need and urgency.' },
        { heading: 'Timeline', guidance: 'Target dates or buying window.' },
        { heading: 'Next steps', guidance: 'Agreed follow-ups.' }
      ]
    },
    customer_success: {
      sections: [
        { heading: 'Overview', guidance: 'Purpose of the customer conversation.' },
        {
          heading: 'Customer experience',
          guidance: 'How they describe their experience with the product or team.'
        },
        {
          heading: 'Challenges and goals',
          guidance: 'Problems they face and outcomes they want.'
        },
        {
          heading: 'Wins and progress',
          guidance: 'Positive outcomes or adoption since last touch.'
        },
        {
          heading: 'Q&A highlights',
          guidance: 'Notable questions and answers; omit if none.'
        },
        {
          heading: 'Commitments and next steps',
          guidance: 'What each side committed to do next.'
        }
      ]
    },
    customer_success_reach: {
      sections: [
        {
          heading: 'Relationship health',
          guidance: 'Trust, satisfaction, and engagement signals.'
        },
        {
          heading: 'Expansion opportunities',
          guidance: 'Upsell, cross-sell, or growth areas discussed.'
        },
        {
          heading: 'Advocacy and champions',
          guidance: 'References, case studies, or internal champions.'
        },
        {
          heading: 'Outcomes and metrics',
          guidance: 'Results, KPIs, or ROI mentioned.'
        },
        { heading: 'Risks', guidance: 'Churn or downgrade risks if raised.' },
        { heading: 'Next steps', guidance: 'Follow-ups and owners when stated.' }
      ]
    },
    candidate_interview: {
      sections: [
        { heading: 'Overview', guidance: 'Role focus and interview format in one short paragraph.' },
        {
          heading: 'Background and experience',
          guidance: 'Relevant history the candidate shared.'
        },
        {
          heading: 'Skills and examples',
          guidance: 'Capabilities demonstrated with examples from their answers.'
        },
        {
          heading: 'Motivation and goals',
          guidance: 'Why they are interested and what they want next.'
        },
        {
          heading: 'Notable responses',
          guidance: 'Standout answers to important questions.'
        },
        {
          heading: 'Strengths',
          guidance: 'Strengths evident from the conversation.'
        },
        {
          heading: 'Concerns or gaps',
          guidance: 'Open concerns only if raised in the interview; omit if none.'
        },
        {
          heading: 'Next steps',
          guidance: 'Hiring process next steps if stated.'
        }
      ],
      formatNotes:
        'Do not infer protected characteristics. Stick to job-relevant facts from the conversation.'
    },
    demo: {
      sections: [
        { heading: 'Overview', guidance: 'Who attended and what was demoed at a high level.' },
        {
          heading: 'What was demonstrated',
          guidance: 'Features, workflows, and scenarios shown.'
        },
        {
          heading: 'Value discussed',
          guidance: 'Benefits and outcomes tied to what was shown.'
        },
        {
          heading: 'Reactions and feedback',
          guidance: 'Audience response, interest, or friction.'
        },
        {
          heading: 'Questions raised',
          guidance: 'Product or commercial questions from the audience.'
        },
        { heading: 'Next steps', guidance: 'Follow-ups agreed on the call.' }
      ]
    },
    one_on_one: {
      sections: [
        { heading: 'Updates', guidance: 'Progress and news each person shared.' },
        { heading: 'Priorities', guidance: 'Current focus areas and goals.' },
        {
          heading: 'Blockers and support',
          guidance: 'Obstacles and help requested; omit if none.'
        },
        {
          heading: 'Discussion themes',
          guidance: 'Coaching, feedback, or topics explored.'
        },
        {
          heading: 'Agreements and next steps',
          guidance: 'What was decided and who does what next.'
        }
      ]
    },
    project_kick_off: {
      sections: [
        {
          heading: 'Vision and objectives',
          guidance: 'Why the project exists and what success looks like.'
        },
        { heading: 'Scope', guidance: 'In-scope and out-of-scope if defined.' },
        {
          heading: 'Milestones and targets',
          guidance: 'Dates, deliverables, and measurable targets.'
        },
        {
          heading: 'Roles and resources',
          guidance: 'Owners, team members, and resources assigned.'
        },
        {
          heading: 'Risks and assumptions',
          guidance: 'Known risks and assumptions stated on the call.'
        },
        { heading: 'Decisions', guidance: 'Decisions made during kick-off.' },
        { heading: 'Open items', guidance: 'Unresolved topics needing follow-up.' }
      ]
    },
    project_update: {
      sections: [
        {
          heading: 'Overview',
          guidance: 'One short paragraph on overall project health.'
        },
        {
          heading: 'Workstream updates',
          guidance:
            'For each distinct task or workstream discussed, use a ### subheading with the workstream name, then bullets for Status, Discussion, and Next steps.'
        },
        {
          heading: 'Blockers',
          guidance: 'Cross-cutting blockers; omit if none.'
        },
        { heading: 'Decisions', guidance: 'Decisions made in this sync.' },
        { heading: 'Action items', guidance: 'Owners and due dates when stated.' }
      ]
    },
    q_and_a: {
      sections: [
        { heading: 'Overview', guidance: 'Topic or context for the Q&A session.' },
        {
          heading: 'Questions and answers',
          guidance:
            'For each question, use a ### subheading with a short question label, then bullets for the answer or conclusion.'
        },
        {
          heading: 'Unanswered questions',
          guidance: 'Questions left open; omit section if none.'
        }
      ]
    },
    retrospective: {
      sections: [
        { heading: 'Overview', guidance: 'Sprint or period this retro covers.' },
        {
          heading: 'Start doing',
          guidance: 'New practices to adopt; only items raised in the retro.'
        },
        {
          heading: 'Stop doing',
          guidance: 'Practices to end; only items raised in the retro.'
        },
        {
          heading: 'Continue doing',
          guidance: 'Practices to keep; only items raised in the retro.'
        },
        {
          heading: 'Action items',
          guidance: 'Owners and follow-ups when stated.'
        }
      ]
    },
    stand_up: {
      sections: [
        {
          heading: 'Overview',
          guidance: 'Team or squad name if stated; otherwise one line of context.'
        },
        {
          heading: 'Participant updates',
          guidance:
            'For each speaker when identifiable, use ### with their name, then bullets: Done, Planned, Blockers.'
        },
        {
          heading: 'Escalations',
          guidance: 'Issues needing help outside the team; omit if none.'
        }
      ]
    }
  }

function _buildSummaryTemplateSectionHeadings(): Record<
  SummaryTemplateId,
  readonly string[]
> {
  const headings = {} as Record<SummaryTemplateId, readonly string[]>

  for (const id of summaryTemplateIdSchema.options) {
    headings[id] = _SUMMARY_TEMPLATE_DEFINITIONS[id].sections.map(
      (section) => section.heading
    )
  }

  return headings
}

export const summaryTemplateSectionHeadings = _buildSummaryTemplateSectionHeadings()

export function getSummaryTemplateSystemPrompt(template: SummaryTemplateId): string {
  const definition = _SUMMARY_TEMPLATE_DEFINITIONS[template]
  return `${_BASE_SUMMARY_SYSTEM_INSTRUCTIONS}\n\n${_formatTemplateDefinition(definition)}`
}

export function buildMeetingSummarySystemPrompt({
  template,
  additionalDirections
}: {
  template: SummaryTemplateId
  additionalDirections?: string
}): string {
  const templatePrompt = getSummaryTemplateSystemPrompt(template)
  const trimmedDirections = additionalDirections?.trim()

  if (!trimmedDirections) {
    return templatePrompt
  }

  return [
    templatePrompt,
    'Private note for you only (apply when consistent with the transcript; never quote,',
    'reference, or reveal that these notes existed):',
    trimmedDirections
  ].join(' ')
}
