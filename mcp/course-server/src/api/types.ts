/**
 * Read contracts of the canonical DAEMON Authoring API.
 *
 * These mirror what `ArcCourseStudioService` serialises. They are deliberately
 * the same English/camelCase shapes Course Studio consumes: the MCP layer does
 * not invent a second vocabulary for reads.
 */

export interface ObjectiveSummary {
  id: number;
  code: string | null;
  description: string;
  framework: string | null;
  level: string | null;
}

export interface VersionSummary {
  id: number;
  uuid: string;
  courseId: number;
  number: number;
  title: string | null;
  description: string | null;
  audience: string | null;
  difficulty: string | null;
  status: 'draft' | 'published' | 'archived';
  editable: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  clonedFromVersionId: number | null;
  author: { id: number; name: string } | null;
  publisher: { id: number; name: string } | null;
  pathCount: number | null;
}

export interface CourseSummary {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  audience: string | null;
  status: string;
  versionCount: number;
  cohortCount: number;
  publishedVersion: VersionSummary | null;
  draftVersion: VersionSummary | null;
  versions: VersionSummary[];
}

export interface EvidenceConfiguration {
  modalities: string[];
  required: boolean;
  minimumArtifacts: number;
  notes: string | null;
  configured: boolean;
}

export interface RubricCriterion {
  code: string;
  title: string;
  description: string | null;
}

export interface ExperienceDetail {
  id: number;
  uuid: string;
  milestoneId: number;
  unitId: number | null;
  type: string | null;
  variant: string | null;
  title: string;
  description: string | null;
  order: number;
  required: boolean;
  attemptable: boolean;
  maxAttempts: number | null;
  sourceType: string | null;
  sourceId: number | null;
  status: string;
  completion: { mode: string | null; passingScore: number | null };
  review: { required: boolean; source: string };
  evidence: EvidenceConfiguration;
  rubric: { title: string | null; criteria: RubricCriterion[]; legacy: boolean } | null;
  deliveryGuide: Record<string, unknown> | null;
  content: { format: string; summary: string | null; blocks: unknown[]; raw: unknown };
  objectiveIds: number[];
  objectives: ObjectiveSummary[];
}

export interface MilestoneDetail {
  id: number;
  title: string;
  description: string | null;
  order: number;
  required: boolean;
  prerequisiteIds: number[];
  experiences: ExperienceDetail[];
}

export interface PathDetail {
  id: number;
  title: string;
  description: string | null;
  audience: string | null;
  difficulty: string | null;
  status: string;
  editable: boolean;
  milestones: MilestoneDetail[];
}

export interface ValidationFinding {
  code: string;
  scope: string;
  message: string;
  target: number | string | null;
}

export interface ValidationReport {
  versionId: number;
  ready: boolean;
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
  checkedAt: string;
}

export interface UnitDetail {
  id: number;
  title: string;
  description: string | null;
  order: number;
  status: string;
  lessons: { id: number; title: string; order: number; status: string }[];
}

export interface CourseVersionDetail {
  course: { id: number; title: string; code: string | null; level: string | null; status: string };
  version: VersionSummary;
  editable: boolean;
  units: UnitDetail[];
  paths: PathDetail[];
  objectives: ObjectiveSummary[];
  validation: ValidationReport;
  generatedAt: string;
}

export interface AuthoringCatalog {
  experienceTypes: string[];
  audiences: string[];
  difficulties: string[];
  evidenceModalities: string[];
  artifactModalities: string[];
  completionModes: string[];
  contentBlockTypes: string[];
  experienceVariants: string[];
  sourceTypes: string[];
  objectiveLevels: string[];
  statuses: string[];
  authoringConstraints: Record<string, number>;
  authoringScopes: { read: string; write: string; publish: string; serviceDefaults: string[] };
  publication: { requiredScope: string; humanReviewRequired: boolean };
  actor: { id: number; role: string; institutionId: number | null };
  objectives: ObjectiveSummary[];
}

export interface CourseListing {
  courses: CourseSummary[];
  generatedAt: string;
}

export interface CourseEnvelope {
  course: CourseSummary;
  generatedAt: string;
}

/** Identity of the actor the service token authenticates as. */
export interface ActorIdentity {
  id: number;
  role: string;
  institutionId: number | null;
  reference: string;
}
