export interface StructuredIncident {
  location: 'Gate A' | 'Gate B' | 'Gate C' | 'Gate D' | 'North Stand' | 'South Stand' | 'East Stand' | 'West Stand' | 'Pitch' | 'Unknown';
  category: 'Crowd' | 'Medical' | 'Security' | 'Facility' | 'Lost Person' | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  description: string;
  suggested_teams: string[];
}

export interface Recommendation {
  id: string;
  action: string;
  reasoning: string;
  priority: number;
}

/**
 * Calculates a numerical priority score (1 to 10) based on severity and recent incident density.
 */
export function calculatePriorityScore(severity: 'Low' | 'Medium' | 'High' | 'Critical', zoneIncidentCount: number): number {
  let baseScore = 1;
  switch (severity) {
    case 'Low':
      baseScore = 2;
      break;
    case 'Medium':
      baseScore = 4;
      break;
    case 'High':
      baseScore = 7;
      break;
    case 'Critical':
      baseScore = 9;
      break;
  }

  // Boost priority if there are multiple active incidents in the same zone (indicates escalating issue)
  const boost = Math.min(zoneIncidentCount * 0.8, 2.0);
  return Math.min(baseScore + boost, 10);
}

/**
 * Provides a fallback structured incident if the LLM API is unavailable.
 * Analyzes keywords in the text to classify location, category, and severity.
 */
export function getFallbackIncident(text: string): StructuredIncident {
  const lowercase = text.toLowerCase();
  
  // 1. Detect location
  let location: StructuredIncident['location'] = 'Unknown';
  if (lowercase.includes('gate a')) location = 'Gate A';
  else if (lowercase.includes('gate b')) location = 'Gate B';
  else if (lowercase.includes('gate c')) location = 'Gate C';
  else if (lowercase.includes('gate d')) location = 'Gate D';
  else if (lowercase.includes('north')) location = 'North Stand';
  else if (lowercase.includes('south')) location = 'South Stand';
  else if (lowercase.includes('east')) location = 'East Stand';
  else if (lowercase.includes('west')) location = 'West Stand';
  else if (lowercase.includes('pitch') || lowercase.includes('field')) location = 'Pitch';

  // 2. Detect category & suggested teams
  let category: StructuredIncident['category'] = 'Other';
  let suggested_teams = ['Operations'];
  
  if (lowercase.includes('crowd') || lowercase.includes('queue') || lowercase.includes('congestion') || lowercase.includes('bottleneck')) {
    category = 'Crowd';
    suggested_teams = ['Stewards', 'Security'];
  } else if (lowercase.includes('hurt') || lowercase.includes('bleed') || lowercase.includes('medical') || lowercase.includes('cpr') || lowercase.includes('faint')) {
    category = 'Medical';
    suggested_teams = ['Medical Team', 'First Responders'];
  } else if (lowercase.includes('fight') || lowercase.includes('thief') || lowercase.includes('security') || lowercase.includes('weapon') || lowercase.includes('trespass')) {
    category = 'Security';
    suggested_teams = ['Security', 'Police Liaison'];
  } else if (lowercase.includes('leak') || lowercase.includes('broken') || lowercase.includes('light') || lowercase.includes('power') || lowercase.includes('toilet')) {
    category = 'Facility';
    suggested_teams = ['Maintenance', 'Facilities'];
  } else if (lowercase.includes('lost') || lowercase.includes('child') || lowercase.includes('find my') || lowercase.includes('missing')) {
    category = 'Lost Person';
    suggested_teams = ['Stewards', 'Customer Service'];
  }

  // 3. Detect severity
  let severity: StructuredIncident['severity'] = 'Low';
  if (lowercase.includes('cpr') || lowercase.includes('unconscious') || lowercase.includes('weapon') || lowercase.includes('fire') || lowercase.includes('riot')) {
    severity = 'Critical';
  } else if (lowercase.includes('fight') || lowercase.includes('injury') || lowercase.includes('crush') || lowercase.includes('broken bone')) {
    severity = 'High';
  } else if (lowercase.includes('slow') || lowercase.includes('clogged') || lowercase.includes('leak') || lowercase.includes('lost')) {
    severity = 'Medium';
  }

  return {
    location,
    category,
    severity,
    confidence: 0.5,
    description: text.substring(0, 100),
    suggested_teams,
  };
}

/**
 * Generates fallback ranked recommendations based on the category and location.
 */
export function getFallbackRecommendations(category: string, location: string): Recommendation[] {
  const targetLoc = location !== 'Unknown' ? location : 'the affected area';
  
  switch (category) {
    case 'Crowd':
      return [
        {
          id: 'crowd-1',
          action: `Deploy 2 additional stewards to ${targetLoc}`,
          reasoning: `Direct crowd management needed to ease queuing and monitor flow.`,
          priority: 1,
        },
        {
          id: 'crowd-2',
          action: `Open adjacent overflow gates if queue continues to grow`,
          reasoning: `Increases processing capacity and decreases local pressure.`,
          priority: 2,
        },
        {
          id: 'crowd-3',
          action: `Broadcast audio announcement: "Please use alternative entry points"`,
          reasoning: `Nudges fans toward lower density zones to distribute load.`,
          priority: 3,
        },
      ];
    case 'Medical':
      return [
        {
          id: 'med-1',
          action: `Dispatch nearest First Responder unit to ${targetLoc}`,
          reasoning: `Immediate triage required for reported medical situation.`,
          priority: 1,
        },
        {
          id: 'med-2',
          action: `Clear access pathway from Section Entrance to ${targetLoc}`,
          reasoning: `Ensures swift transport of stretcher or equipment if required.`,
          priority: 2,
        },
        {
          id: 'med-3',
          action: `Notify Stadium Command Center of active medical dispatch`,
          reasoning: `Keeps control room informed for escalation and coordination.`,
          priority: 3,
        },
      ];
    case 'Security':
      return [
        {
          id: 'sec-1',
          action: `Deploy Security Team Alpha to ${targetLoc}`,
          reasoning: `De-escalation or intervention required to maintain safety.`,
          priority: 1,
        },
        {
          id: 'sec-2',
          action: `Direct CCTV Camera coverage to ${targetLoc} immediately`,
          reasoning: `Allows live visual monitoring and evidence gathering for Command.`,
          priority: 2,
        },
        {
          id: 'sec-3',
          action: `Alert Police Liaison Team if situation escalates`,
          reasoning: `Maintains readiness in case law enforcement intervention is needed.`,
          priority: 3,
        },
      ];
    case 'Facility':
      return [
        {
          id: 'fac-1',
          action: `Dispatch maintenance team to ${targetLoc}`,
          reasoning: `Inspect and isolate/repair the reported facility issue.`,
          priority: 1,
        },
        {
          id: 'fac-2',
          action: `Set up warning signage / barricades around the affected spot`,
          reasoning: `Prevents slip-and-fall or safety hazards for passing fans.`,
          priority: 2,
        },
      ];
    case 'Lost Person':
      return [
        {
          id: 'lost-1',
          action: `Log description in Central Lost & Found register`,
          reasoning: `Cross-references reporting with any incoming queries.`,
          priority: 1,
        },
        {
          id: 'lost-2',
          action: `Instruct local stewards to scan the immediate area`,
          reasoning: `Finds lost individuals nearby before they move further away.`,
          priority: 2,
        },
      ];
    default:
      return [
        {
          id: 'gen-1',
          action: `Alert local section supervisor at ${targetLoc}`,
          reasoning: `Assesses situation firsthand and reports back details.`,
          priority: 1,
        },
        {
          id: 'gen-2',
          action: `Monitor location for follow-up reports`,
          reasoning: `Determines if escalation or direct intervention is warranted.`,
          priority: 2,
        },
      ];
  }
}
