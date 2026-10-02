// ============================================================================
// src/data/dev/devSubjects.ts
//
// ⚠️ DEV ONLY — stand-in for the Subjects table on AWS.
//
// This file is intentionally generic. Notice that nothing in the shape of
// the data is DG- or AVSEC-specific — those are just two rows here. Adding
// "Cabin Crew Safety" or "English Proficiency" later is a new object in
// this array (or, once the admin UI exists, a new row in DynamoDB).
//
// 🔌 AWS: Replaced by DynamoDB table `subjects`.
//         Primary key: id (partition). Simple key, no sort.
// ============================================================================

import type { Subject, Module, Competency } from '../../types/exam.types';

// ---------------------------------------------------------------------------
// Subjects (top-level categories)
// ---------------------------------------------------------------------------

export const devSubjects: Subject[] = [
  {
    id: 'subj-dg',
    name: 'Dangerous Goods',
    code: 'DG',
    description:
      'Training and certification for the safe handling, classification, packing, documentation, and transport of dangerous goods by air.',
    regulatoryAuthority: 'SACAA',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'subj-avsec',
    name: 'Aviation Security',
    code: 'AVSEC',
    description:
      'Security awareness, threat identification, response protocols, and regulatory compliance for aviation personnel.',
    regulatoryAuthority: 'SACAA',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Modules (subdivisions within a subject)
// ---------------------------------------------------------------------------

export const devModules: Module[] = [
  // -------------------------- Dangerous Goods --------------------------
  {
    id: 'mod-dg-classification',
    subjectId: 'subj-dg',
    name: 'Classification',
    description:
      'Identifying and classifying dangerous goods into the nine ICAO hazard classes and divisions.',
    order: 1,
  },
  {
    id: 'mod-dg-packing',
    subjectId: 'subj-dg',
    name: 'Packing & Labelling',
    description:
      'Selecting compliant packaging, applying correct markings and labels, and understanding packing instructions.',
    order: 2,
  },
  {
    id: 'mod-dg-documentation',
    subjectId: 'subj-dg',
    name: 'Documentation',
    description:
      'Completing the Shipper\'s Declaration, air waybill entries, and required regulatory paperwork.',
    order: 3,
  },
  {
    id: 'mod-dg-acceptance',
    subjectId: 'subj-dg',
    name: 'Acceptance Procedures',
    description:
      'Inspecting shipments, verifying documentation, and applying acceptance checklists before loading.',
    order: 4,
  },
  {
    id: 'mod-dg-emergency',
    subjectId: 'subj-dg',
    name: 'Emergency Response',
    description:
      'Responding to incidents, spills, leaks, and fires involving dangerous goods in flight or on the ground.',
    order: 5,
  },

  // ------------------------------ AVSEC --------------------------------
  {
    id: 'mod-avsec-threat',
    subjectId: 'subj-avsec',
    name: 'Threat Identification',
    description:
      'Recognising suspicious behaviour, prohibited items, and potential security threats.',
    order: 1,
  },
  {
    id: 'mod-avsec-hijack',
    subjectId: 'subj-avsec',
    name: 'Hijacking & Unlawful Interference',
    description:
      'Response protocols, crew coordination, and communication during unlawful interference events.',
    order: 2,
  },
  {
    id: 'mod-avsec-access',
    subjectId: 'subj-avsec',
    name: 'Access Control',
    description:
      'Airside access, screening procedures, and preventing unauthorised entry to restricted areas.',
    order: 3,
  },
  {
    id: 'mod-avsec-compliance',
    subjectId: 'subj-avsec',
    name: 'Regulatory Compliance',
    description:
      'ICAO Annex 17, SACAA regulations, and reporting obligations for security incidents.',
    order: 4,
  },
];

// ---------------------------------------------------------------------------
// Competencies (CBTA-aligned)
// ---------------------------------------------------------------------------

export const devCompetencies: Competency[] = [
  // ------------------------------ DG -----------------------------------
  {
    id: 'comp-dg-classify',
    subjectId: 'subj-dg',
    name: 'Classify dangerous goods correctly',
    description:
      'Determine the correct hazard class, division, and subsidiary risk for any item offered for transport.',
    cbtaLevel: 'intermediate',
  },
  {
    id: 'comp-dg-package',
    subjectId: 'subj-dg',
    name: 'Select and apply compliant packaging',
    description:
      'Choose the correct UN specification packaging and apply it according to the applicable packing instruction.',
    cbtaLevel: 'intermediate',
  },
  {
    id: 'comp-dg-document',
    subjectId: 'subj-dg',
    name: 'Complete required documentation',
    description:
      'Fill out the Shipper\'s Declaration and related documents without errors that could cause regulatory non-compliance.',
    cbtaLevel: 'basic',
  },
  {
    id: 'comp-dg-accept',
    subjectId: 'subj-dg',
    name: 'Accept or reject shipments',
    description:
      'Apply acceptance checklists accurately to determine whether a shipment can be loaded.',
    cbtaLevel: 'advanced',
  },
  {
    id: 'comp-dg-respond',
    subjectId: 'subj-dg',
    name: 'Respond to dangerous goods emergencies',
    description:
      'Execute the correct emergency response for spills, leaks, fires, and contamination involving dangerous goods.',
    cbtaLevel: 'advanced',
  },

  // ----------------------------- AVSEC ---------------------------------
  {
    id: 'comp-avsec-recognise',
    subjectId: 'subj-avsec',
    name: 'Recognise security threats',
    description:
      'Identify suspicious behaviour, prohibited items, and indicators of a potential security threat.',
    cbtaLevel: 'basic',
  },
  {
    id: 'comp-avsec-respond',
    subjectId: 'subj-avsec',
    name: 'Respond to security incidents',
    description:
      'Execute correct protocols when a security incident occurs, including communication and escalation.',
    cbtaLevel: 'intermediate',
  },
  {
    id: 'comp-avsec-control-access',
    subjectId: 'subj-avsec',
    name: 'Control access to restricted areas',
    description:
      'Apply screening, identification, and access-control procedures to prevent unauthorised entry.',
    cbtaLevel: 'intermediate',
  },
  {
    id: 'comp-avsec-comply',
    subjectId: 'subj-avsec',
    name: 'Comply with security regulations',
    description:
      'Interpret and apply ICAO Annex 17, SACAA regulations, and organisational security policy correctly.',
    cbtaLevel: 'basic',
  },
];

// ---------------------------------------------------------------------------
// Convenience lookups (used throughout the UI)
// ---------------------------------------------------------------------------

export function getSubjectById(id: string): Subject | undefined {
  return devSubjects.find((s) => s.id === id);
}

export function getModulesForSubject(subjectId: string): Module[] {
  return devModules
    .filter((m) => m.subjectId === subjectId)
    .sort((a, b) => a.order - b.order);
}

export function getCompetenciesForSubject(subjectId: string): Competency[] {
  return devCompetencies.filter((c) => c.subjectId === subjectId);
}

export function getModuleById(id: string): Module | undefined {
  return devModules.find((m) => m.id === id);
}

export function getCompetencyById(id: string): Competency | undefined {
  return devCompetencies.find((c) => c.id === id);
}