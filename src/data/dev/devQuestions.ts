// ============================================================================
// src/data/dev/devQuestions.ts
//
// ⚠️ DEV ONLY — stand-in for the DynamoDB `questions` table.
//
// Notice: this file contains question STEMS, OPTIONS, and ANSWER KEYS
// (the `isCorrect` flags). In production, the answer key NEVER goes to
// the candidate's browser.
//
// That stripping is done in src/services/api.ts — see the function
// `getQuestionsForAttempt`. This file holds the full question including
// answers because it stands in for the server-side store.
//
// 🔌 AWS: DynamoDB table `questions`.
//         Primary key: subjectId (partition), id (sort).
//         GSI: moduleId-index, competencyId-index, difficulty-index.
//         Consider S3 for bulk import/export of question banks.
// ============================================================================

import type { Question } from '../../types/exam.types';

export const devQuestions: Question[] = [
  // ========================================================================
  // DANGEROUS GOODS
  // ========================================================================

  // -------------------- Classification (mod-dg-classification) -----------
  {
    id: 'q-dg-class-001',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-classification',
    competencyId: 'comp-dg-classify',
    type: 'mcq',
    difficulty: 'easy',
    flags: ['regulatory', 'safety-critical'],
    stem: 'How many hazard classes are defined under the ICAO Technical Instructions for the Safe Transport of Dangerous Goods by Air?',
    options: [
      { id: 'a', text: '7', isCorrect: false },
      { id: 'b', text: '9', isCorrect: true },
      { id: 'c', text: '11', isCorrect: false },
      { id: 'd', text: '13', isCorrect: false },
    ],
    explanation:
      'The ICAO Technical Instructions define nine hazard classes, ranging from Class 1 (Explosives) to Class 9 (Miscellaneous Dangerous Goods).',
    reference: 'ICAO TI Part 2; IATA DGR 2.0',
    version: 1,
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: '2025-01-05T09:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-class-002',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-classification',
    competencyId: 'comp-dg-classify',
    type: 'mcq',
    difficulty: 'medium',
    flags: ['regulatory', 'safety-critical'],
    stem: 'A substance is identified as UN 1203. Which hazard class does this belong to?',
    options: [
      { id: 'a', text: 'Class 2 — Gases', isCorrect: false },
      { id: 'b', text: 'Class 3 — Flammable Liquids', isCorrect: true },
      { id: 'c', text: 'Class 6 — Toxic Substances', isCorrect: false },
      { id: 'd', text: 'Class 8 — Corrosives', isCorrect: false },
    ],
    explanation:
      'UN 1203 is Petrol (gasoline), which is a Class 3 flammable liquid.',
    reference: 'ICAO TI Part 3; UN Model Regulations',
    version: 1,
    createdAt: '2025-01-05T09:10:00Z',
    updatedAt: '2025-01-05T09:10:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-class-003',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-classification',
    competencyId: 'comp-dg-classify',
    type: 'scenario',
    difficulty: 'hard',
    flags: ['regulatory', 'safety-critical'],
    scenario:
      'A shipper presents a consignment of lithium-ion batteries (UN 3480) packed alone in a fibreboard box. The shipment is destined for a passenger aircraft.',
    stem: 'Which statement is correct regarding this shipment?',
    options: [
      {
        id: 'a',
        text: 'It may be carried as cargo on a passenger aircraft without restriction.',
        isCorrect: false,
      },
      {
        id: 'b',
        text: 'It is forbidden on passenger aircraft and may only be carried on cargo aircraft under specific conditions.',
        isCorrect: true,
      },
      {
        id: 'c',
        text: 'It may be carried on a passenger aircraft if packed in a rigid outer packaging.',
        isCorrect: false,
      },
      {
        id: 'd',
        text: 'It is not classified as dangerous goods.',
        isCorrect: false,
      },
    ],
    explanation:
      'UN 3480 (lithium-ion batteries packed alone) is forbidden on passenger aircraft. It may only be carried as cargo on cargo aircraft, subject to state-of-charge and packing requirements.',
    reference: 'ICAO TI Part 4, Packing Instruction 965; IATA DGR 4.2',
    version: 2,
    createdAt: '2025-01-06T10:00:00Z',
    updatedAt: '2025-03-12T14:30:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-class-004',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-classification',
    competencyId: 'comp-dg-classify',
    type: 'multi-select',
    difficulty: 'medium',
    flags: ['regulatory'],
    stem: 'Which of the following are subsidiary risks that must be identified on a Shipper\'s Declaration? (Select all that apply.)',
    options: [
      { id: 'a', text: 'Flammable liquid', isCorrect: true },
      { id: 'b', text: 'Toxic', isCorrect: true },
      { id: 'c', text: 'Corrosive', isCorrect: true },
      { id: 'd', text: 'Radioactive', isCorrect: true },
      { id: 'e', text: 'Heavy', isCorrect: false },
    ],
    explanation:
      'Subsidiary risks use the same hazard class divisions. "Heavy" is not a hazard class.',
    reference: 'ICAO TI Part 5; IATA DGR 8',
    version: 1,
    createdAt: '2025-01-06T10:30:00Z',
    updatedAt: '2025-01-06T10:30:00Z',
    createdBy: 'user-admin-001',
  },

  // -------------------- Packing & Labelling (mod-dg-packing) -------------
  {
    id: 'q-dg-pack-001',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-packing',
    competencyId: 'comp-dg-package',
    type: 'mcq',
    difficulty: 'easy',
    flags: ['regulatory'],
    stem: 'What does the "UN" prefix on a packaging code indicate?',
    options: [
      { id: 'a', text: 'The package was manufactured in the United Nations.', isCorrect: false },
      {
        id: 'b',
        text: 'The packaging has been tested and certified to UN specification standards.',
        isCorrect: true,
      },
      { id: 'c', text: 'The contents are United Nations-approved.', isCorrect: false },
      { id: 'd', text: 'The packaging is only used for UN shipments.', isCorrect: false },
    ],
    explanation:
      'The UN mark on packaging indicates the packaging design has passed UN performance testing and meets the specification for its intended use.',
    reference: 'ICAO TI Part 6; IATA DGR 6',
    version: 1,
    createdAt: '2025-01-07T08:00:00Z',
    updatedAt: '2025-01-07T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-pack-002',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-packing',
    competencyId: 'comp-dg-package',
    type: 'scenario',
    difficulty: 'hard',
    flags: ['regulatory', 'safety-critical'],
    scenario:
      'A crate marked with UN specification 4G/Y25/S is offered for a shipment containing 30 kg of a Class 3 flammable liquid.',
    stem: 'Which statement is correct?',
    options: [
      {
        id: 'a',
        text: 'The packaging is suitable — 4G indicates a fibreboard box, Y indicates Packing Group II/III, and 25 indicates a 25 kg gross mass limit.',
        isCorrect: false,
      },
      {
        id: 'b',
        text: 'The packaging is NOT suitable — the maximum gross mass (25 kg) is less than the shipment gross mass (30 kg).',
        isCorrect: true,
      },
      {
        id: 'c',
        text: 'The packaging is suitable because the Y marking permits any gross mass up to 100 kg.',
        isCorrect: false,
      },
      {
        id: 'd',
        text: 'The packaging is suitable because fibreboard is always acceptable for Class 3.',
        isCorrect: false,
      },
    ],
    explanation:
      'The "25" in the UN specification indicates the maximum gross mass in kilograms. A 30 kg shipment exceeds this limit and must be repacked.',
    reference: 'ICAO TI Part 6; IATA DGR 6.0.5',
    version: 1,
    createdAt: '2025-01-07T08:30:00Z',
    updatedAt: '2025-01-07T08:30:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-pack-003',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-packing',
    competencyId: 'comp-dg-package',
    type: 'mcq',
    difficulty: 'medium',
    flags: ['regulatory'],
    stem: 'Where must the hazard label be placed on a package?',
    options: [
      { id: 'a', text: 'Only on the top surface.', isCorrect: false },
      {
        id: 'b',
        text: 'On the same surface as the shipper\'s and consignee\'s address, and on at least one other side.',
        isCorrect: true,
      },
      { id: 'c', text: 'On all six sides of the package.', isCorrect: false },
      { id: 'd', text: 'Only on the side facing the aircraft door.', isCorrect: false },
    ],
    explanation:
      'Hazard labels must be applied to the same surface as the address markings, and on at least one other side or end of the package.',
    reference: 'ICAO TI Part 5, 5.3; IATA DGR 7.2',
    version: 1,
    createdAt: '2025-01-07T09:00:00Z',
    updatedAt: '2025-01-07T09:00:00Z',
    createdBy: 'user-admin-001',
  },

  // -------------------- Documentation (mod-dg-documentation) -------------
  {
    id: 'q-dg-doc-001',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-documentation',
    competencyId: 'comp-dg-document',
    type: 'mcq',
    difficulty: 'easy',
    flags: ['regulatory'],
    stem: 'What is the primary document used to declare dangerous goods for air transport?',
    options: [
      { id: 'a', text: 'Air Waybill', isCorrect: false },
      { id: 'b', text: 'Shipper\'s Declaration for Dangerous Goods', isCorrect: true },
      { id: 'c', text: 'Cargo Manifest', isCorrect: false },
      { id: 'd', text: 'Packing List', isCorrect: false },
    ],
    explanation:
      'The Shipper\'s Declaration for Dangerous Goods is the primary legal document declaring the contents of a DG shipment.',
    reference: 'ICAO TI Part 5; IATA DGR 8',
    version: 1,
    createdAt: '2025-01-08T08:00:00Z',
    updatedAt: '2025-01-08T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-doc-002',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-documentation',
    competencyId: 'comp-dg-document',
    type: 'scenario',
    difficulty: 'medium',
    flags: ['regulatory'],
    scenario:
      'A shipper submits a Shipper\'s Declaration where the "Packing Instruction" column shows "965" and the "Quantity and Type of Packing" column reads "1 fibreboard box x 5 kg".',
    stem: 'What critical information is missing from the "Quantity and Type of Packing" column?',
    options: [
      { id: 'a', text: 'The shipper\'s signature', isCorrect: false },
      { id: 'b', text: 'The net quantity per package', isCorrect: false },
      {
        id: 'c',
        text: 'The package must be described with the net quantity per package AND the number of packages',
        isCorrect: true,
      },
      { id: 'd', text: 'The consignee\'s telephone number', isCorrect: false },
    ],
    explanation:
      'The "Quantity and Type of Packing" field must include both the number and type of packages AND the net quantity in each package.',
    reference: 'ICAO TI Part 5, 5.1.3.2; IATA DGR 8.1',
    version: 1,
    createdAt: '2025-01-08T08:30:00Z',
    updatedAt: '2025-01-08T08:30:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-doc-003',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-documentation',
    competencyId: 'comp-dg-document',
    type: 'true-false',
    difficulty: 'easy',
    flags: ['regulatory'],
    stem: 'The Shipper\'s Declaration must be signed by the shipper, confirming that the shipment is fully and accurately described and compliant with applicable regulations.',
    options: [
      { id: 'true', text: 'True', isCorrect: true },
      { id: 'false', text: 'False', isCorrect: false },
    ],
    explanation:
      'The shipper\'s signature on the Declaration is a legal certification of compliance.',
    reference: 'ICAO TI Part 5, 5.1.4; IATA DGR 8.1.6',
    version: 1,
    createdAt: '2025-01-08T09:00:00Z',
    updatedAt: '2025-01-08T09:00:00Z',
    createdBy: 'user-admin-001',
  },

  // -------------------- Acceptance (mod-dg-acceptance) -------------------
  {
    id: 'q-dg-accept-001',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-acceptance',
    competencyId: 'comp-dg-accept',
    type: 'mcq',
    difficulty: 'medium',
    flags: ['regulatory', 'safety-critical'],
    stem: 'Who is ultimately responsible for verifying that a dangerous goods shipment meets all acceptance requirements?',
    options: [
      { id: 'a', text: 'The shipper', isCorrect: false },
      { id: 'b', text: 'The pilot-in-command', isCorrect: false },
      { id: 'c', text: 'The operator\'s acceptance personnel', isCorrect: true },
      { id: 'd', text: 'The consignee', isCorrect: false },
    ],
    explanation:
      'Acceptance personnel employed by the operator are responsible for verifying compliance before loading.',
    reference: 'ICAO TI Part 7; IATA DGR 9',
    version: 1,
    createdAt: '2025-01-09T08:00:00Z',
    updatedAt: '2025-01-09T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-accept-002',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-acceptance',
    competencyId: 'comp-dg-accept',
    type: 'scenario',
    difficulty: 'hard',
    flags: ['regulatory', 'safety-critical'],
    scenario:
      'During acceptance, an agent notices a package labelled with a Class 8 corrosive label. The Declaration lists the substance as Class 3 flammable liquid. The packing appears intact.',
    stem: 'What is the correct course of action?',
    options: [
      { id: 'a', text: 'Accept the shipment — labels can occasionally differ from the declaration.', isCorrect: false },
      { id: 'b', text: 'Accept the shipment, then send a discrepancy report after loading.', isCorrect: false },
      {
        id: 'c',
        text: 'Reject the shipment and return it to the shipper for correction. Do not load until the discrepancy is resolved.',
        isCorrect: true,
      },
      { id: 'd', text: 'Remove the Class 8 label and replace it with a Class 3 label.', isCorrect: false },
    ],
    explanation:
      'Any mismatch between labels and documentation is a critical non-compliance. The shipment must be rejected and corrected by the shipper before acceptance.',
    reference: 'ICAO TI Part 7, 7.1; IATA DGR 9.1',
    version: 1,
    createdAt: '2025-01-09T08:30:00Z',
    updatedAt: '2025-01-09T08:30:00Z',
    createdBy: 'user-admin-001',
  },

  // -------------------- Emergency Response (mod-dg-emergency) ------------
  {
    id: 'q-dg-emerg-001',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-emergency',
    competencyId: 'comp-dg-respond',
    type: 'mcq',
    difficulty: 'medium',
    flags: ['safety-critical'],
    stem: 'What is the first action when a dangerous goods leak is discovered in the cargo hold during flight?',
    options: [
      { id: 'a', text: 'Enter the hold to identify the substance.', isCorrect: false },
      { id: 'b', text: 'Notify the flight crew and refer to the emergency response guide for the UN number.', isCorrect: true },
      { id: 'c', text: 'Continue the flight as planned.', isCorrect: false },
      { id: 'd', text: 'Deploy the fire suppression system immediately.', isCorrect: false },
    ],
    explanation:
      'Identify the substance via its UN number and follow the emergency response procedures. Never enter a hold with unknown hazards.',
    reference: 'ICAO TI Part 7, 7.4; Emergency Response Guidance for Aircraft Incidents (ICAO Doc 9481)',
    version: 1,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-dg-emerg-002',
    subjectId: 'subj-dg',
    moduleId: 'mod-dg-emergency',
    competencyId: 'comp-dg-respond',
    type: 'scenario',
    difficulty: 'hard',
    flags: ['safety-critical'],
    scenario:
      'A lithium battery fire erupts in the cabin. Cabin crew have access to fire extinguishers, a fire containment bag, and water.',
    stem: 'What is the recommended primary response?',
    options: [
      { id: 'a', text: 'Apply water or another non-alcoholic extinguishing agent to cool the battery and prevent propagation.', isCorrect: true },
      { id: 'b', text: 'Use a Halon extinguisher only.', isCorrect: false },
      { id: 'c', text: 'Do nothing and monitor until landing.', isCorrect: false },
      { id: 'd', text: 'Place the device in a passenger seat.', isCorrect: false },
    ],
    explanation:
      'Lithium battery fires respond best to cooling with water or a non-alcoholic agent. Fire containment bags may be used if available. Halon alone is often ineffective as it does not cool the cell.',
    reference: 'FAA SAFO 09013; ICAO Doc 9481',
    version: 1,
    createdAt: '2025-01-10T08:30:00Z',
    updatedAt: '2025-01-10T08:30:00Z',
    createdBy: 'user-admin-001',
  },

  // ========================================================================
  // AVSEC
  // ========================================================================

  // -------------------- Threat Identification (mod-avsec-threat) ---------
  {
    id: 'q-avsec-threat-001',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-threat',
    competencyId: 'comp-avsec-recognise',
    type: 'mcq',
    difficulty: 'easy',
    flags: ['regulatory'],
    stem: 'Which of the following is a common behavioural indicator of a potential security threat at an airport?',
    options: [
      { id: 'a', text: 'A passenger arriving early for a flight.', isCorrect: false },
      { id: 'b', text: 'Excessive sweating, nervousness, and avoiding eye contact during screening.', isCorrect: true },
      { id: 'c', text: 'A passenger reading a book in the departure lounge.', isCorrect: false },
      { id: 'd', text: 'A passenger wearing a suit.', isCorrect: false },
    ],
    explanation:
      'Behavioural indicators include excessive nervousness, avoiding eye contact, and unusual sweating. One indicator alone is not conclusive, but multiple indicators warrant attention.',
    reference: 'ICAO Annex 17; ICAO Doc 8973',
    version: 1,
    createdAt: '2025-01-11T08:00:00Z',
    updatedAt: '2025-01-11T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-avsec-threat-002',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-threat',
    competencyId: 'comp-avsec-recognise',
    type: 'scenario',
    difficulty: 'medium',
    flags: ['regulatory'],
    scenario:
      'During screening, an agent notices that a bag contains an item that appears to be a modified electronic device with unusual wiring and a timer-like component.',
    stem: 'What is the correct immediate action?',
    options: [
      { id: 'a', text: 'Remove the item from the bag and inspect it manually.', isCorrect: false },
      { id: 'b', text: 'Let it pass through — modified electronics are common.', isCorrect: false },
      {
        id: 'c',
        text: 'Do not touch the item. Isolate the bag, alert security personnel, and follow the airport\'s suspicious item protocol.',
        isCorrect: true,
      },
      { id: 'd', text: 'Ask the passenger what the item is.', isCorrect: false },
    ],
    explanation:
      'Never handle a suspicious item. Isolate, alert, and follow established protocols.',
    reference: 'ICAO Doc 8973, Chapter on suspicious items',
    version: 1,
    createdAt: '2025-01-11T08:30:00Z',
    updatedAt: '2025-01-11T08:30:00Z',
    createdBy: 'user-admin-001',
  },

  // -------------------- Hijacking (mod-avsec-hijack) ---------------------
  {
    id: 'q-avsec-hijack-001',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-hijack',
    competencyId: 'comp-avsec-respond',
    type: 'mcq',
    difficulty: 'medium',
    flags: ['safety-critical'],
    stem: 'When a hijacking occurs, what is the primary responsibility of cabin crew?',
    options: [
      { id: 'a', text: 'Neutralise the hijacker.', isCorrect: false },
      {
        id: 'b',
        text: 'Protect passenger safety, follow crew coordination procedures, and comply with hijacker demands unless passenger safety is at greater risk.',
        isCorrect: true,
      },
      { id: 'c', text: 'Attempt to contact the airline immediately.', isCorrect: false },
      { id: 'd', text: 'Open the cockpit door.', isCorrect: false },
    ],
    explanation:
      'Cabin crew prioritise passenger safety, maintain crew coordination, and comply with demands where compliance does not increase risk to life.',
    reference: 'ICAO Annex 17; airline-specific hijack protocols',
    version: 1,
    createdAt: '2025-01-12T08:00:00Z',
    updatedAt: '2025-01-12T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-avsec-hijack-002',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-hijack',
    competencyId: 'comp-avsec-respond',
    type: 'scenario',
    difficulty: 'hard',
    flags: ['safety-critical'],
    scenario:
      'During a hijack, communications with the flight deck have been lost. Cabin crew are managing passengers in the cabin.',
    stem: 'What is the most appropriate action to re-establish communication with the flight deck?',
    options: [
      { id: 'a', text: 'Knock loudly on the cockpit door and wait.', isCorrect: false },
      {
        id: 'b',
        text: 'Use the designated covert communication code (e.g., specific interphone signals or codes agreed in the airline\'s SOPs) to indicate status.',
        isCorrect: true,
      },
      { id: 'c', text: 'Call the cockpit using the passenger address system.', isCorrect: false },
      { id: 'd', text: 'Wait until landing to communicate.', isCorrect: false },
    ],
    explanation:
      'Airlines use specific covert signals or codes to communicate status during a hijack without alerting the hijacker.',
    reference: 'Airline-specific hijack procedures; ICAO Doc 8973',
    version: 1,
    createdAt: '2025-01-12T08:30:00Z',
    updatedAt: '2025-01-12T08:30:00Z',
    createdBy: 'user-admin-001',
  },

  // -------------------- Access Control (mod-avsec-access) ----------------
  {
    id: 'q-avsec-access-001',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-access',
    competencyId: 'comp-avsec-control-access',
    type: 'mcq',
    difficulty: 'easy',
    flags: ['regulatory'],
    stem: 'Which of the following is the purpose of the 100% hold baggage screening requirement?',
    options: [
      { id: 'a', text: 'To speed up passenger boarding.', isCorrect: false },
      {
        id: 'b',
        text: 'To ensure all checked baggage is screened for prohibited items before being loaded on an aircraft.',
        isCorrect: true,
      },
      { id: 'c', text: 'To reduce airline costs.', isCorrect: false },
      { id: 'd', text: 'To limit the weight carried in the hold.', isCorrect: false },
    ],
    explanation:
      '100% hold baggage screening ensures all checked baggage is screened, preventing prohibited items from being loaded.',
    reference: 'ICAO Annex 17; SACAA Civil Aviation Regulations',
    version: 1,
    createdAt: '2025-01-13T08:00:00Z',
    updatedAt: '2025-01-13T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-avsec-access-002',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-access',
    competencyId: 'comp-avsec-control-access',
    type: 'true-false',
    difficulty: 'easy',
    flags: ['regulatory'],
    stem: 'A crew member\'s airside access badge may be lent to a colleague if the colleague has forgotten theirs.',
    options: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    explanation:
      'Access badges are non-transferable. Lending a badge is a serious security violation and grounds for disciplinary action.',
    reference: 'ICAO Annex 17; SACAA Civil Aviation Regulations',
    version: 1,
    createdAt: '2025-01-13T08:30:00Z',
    updatedAt: '2025-01-13T08:30:00Z',
    createdBy: 'user-admin-001',
  },

  // -------------------- Regulatory Compliance (mod-avsec-compliance) ----
  {
    id: 'q-avsec-comply-001',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-compliance',
    competencyId: 'comp-avsec-comply',
    type: 'mcq',
    difficulty: 'medium',
    flags: ['regulatory'],
    stem: 'Under ICAO Annex 17, who is responsible for the security of passengers and their baggage on an aircraft?',
    options: [
      { id: 'a', text: 'The pilot-in-command only', isCorrect: false },
      { id: 'b', text: 'The state in which the aircraft is registered', isCorrect: false },
      {
        id: 'c',
        text: 'The operator, in coordination with the state of departure, transit, and destination',
        isCorrect: true,
      },
      { id: 'd', text: 'The passenger', isCorrect: false },
    ],
    explanation:
      'Security is a shared responsibility across operator and states, coordinated through the relevant authorities.',
    reference: 'ICAO Annex 17',
    version: 1,
    createdAt: '2025-01-14T08:00:00Z',
    updatedAt: '2025-01-14T08:00:00Z',
    createdBy: 'user-admin-001',
  },
  {
    id: 'q-avsec-comply-002',
    subjectId: 'subj-avsec',
    moduleId: 'mod-avsec-compliance',
    competencyId: 'comp-avsec-comply',
    type: 'scenario',
    difficulty: 'hard',
    flags: ['regulatory', 'safety-critical'],
    scenario:
      'A ground handler discovers a breach of security in a restricted area after the fact but no incident occurred. The handler\'s supervisor says it\'s not worth reporting because "nothing happened".',
    stem: 'What is the correct action?',
    options: [
      { id: 'a', text: 'Follow the supervisor\'s instruction and don\'t report it.', isCorrect: false },
      {
        id: 'b',
        text: 'Report the breach regardless of outcome, per the operator\'s security reporting obligations and applicable regulations.',
        isCorrect: true,
      },
      { id: 'c', text: 'Report it only if a passenger saw it.', isCorrect: false },
      { id: 'd', text: 'Wait 24 hours and only report if it becomes a problem.', isCorrect: false },
    ],
    explanation:
      'Security breaches must be reported regardless of outcome. Failing to report is itself a regulatory violation, and unreported breaches can mask systemic weaknesses.',
    reference: 'ICAO Annex 17; SACAA reporting requirements',
    version: 1,
    createdAt: '2025-01-14T08:30:00Z',
    updatedAt: '2025-01-14T08:30:00Z',
    createdBy: 'user-admin-001',
  },
];

// ---------------------------------------------------------------------------
// Convenience lookups
// ---------------------------------------------------------------------------

export function getQuestionById(id: string): Question | undefined {
  return devQuestions.find((q) => q.id === id);
}

export function getQuestionsForSubject(subjectId: string): Question[] {
  return devQuestions.filter((q) => q.subjectId === subjectId);
}

export function getQuestionsForModule(moduleId: string): Question[] {
  return devQuestions.filter((q) => q.moduleId === moduleId);
}

export function getQuestionsForCompetency(competencyId: string): Question[] {
  return devQuestions.filter((q) => q.competencyId === competencyId);
}

/**
 * Filter questions by multiple criteria. Useful for the admin question bank.
 * All filters are optional; omitted filters are ignored.
 */
export function filterQuestions(filters: {
  subjectId?: string;
  moduleId?: string;
  competencyId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'mcq' | 'multi-select' | 'scenario' | 'true-false';
  flag?: string;
}): Question[] {
  return devQuestions.filter((q) => {
    if (filters.subjectId && q.subjectId !== filters.subjectId) return false;
    if (filters.moduleId && q.moduleId !== filters.moduleId) return false;
    if (filters.competencyId && q.competencyId !== filters.competencyId) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    if (filters.type && q.type !== filters.type) return false;
    if (filters.flag && !q.flags.includes(filters.flag as never)) return false;
    return true;
  });
}