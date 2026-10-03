// ============================================================================
// src/data/courseContent.ts
//
// Sample learning content for courses. Each entry is a CourseContent tree
// with modules and lessons.
//
// ⚠️ This is placeholder content written for the demo. Replace it with
//    your real course material before going live. Only two courses are
//    filled in here (AVSEC Awareness and Dangerous Goods) — the others
//    fall back to a "Coming soon" state in the learning page.
//
// 🔌 AWS: Replaced by S3 objects or a DynamoDB `course_content` table.
//         Each course is one JSON document.
// ============================================================================

import type { CourseContent } from '../types/course.types';

// ---------------------------------------------------------------------------
// AVSEC AWARENESS
// ---------------------------------------------------------------------------

const avsecAwareness: CourseContent = {
  courseSlug: 'avsec-awareness',
  introduction:
    'Aviation security is everyone\'s responsibility. This course will give you the foundations you need to recognise threats, respond correctly, and comply with the regulations that keep aviation safe.',

  modules: [
    // =======================================================================
    // MODULE 1 — Introduction to Aviation Security
    // =======================================================================
    {
      id: 'avsec-mod-1',
      title: 'Introduction to Aviation Security',
      description:
        'What AVSEC is, why it matters, and the regulatory landscape that shapes it.',
      order: 1,
      lessons: [
        {
          id: 'avsec-m1-l1',
          title: 'What is Aviation Security?',
          type: 'text',
          estimatedMinutes: 8,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'The three pillars of aviation security',
            },
            {
              type: 'paragraph',
              text: 'Aviation security — AVSEC in aviation shorthand — is the set of measures, procedures, and behaviours that protect civil aviation from acts of unlawful interference. It sits alongside safety (preventing accidents) and efficiency (running on time) as one of the three foundations of the industry.',
            },
            {
              type: 'callout',
              variant: 'info',
              title: 'Unlawful interference',
              text: 'The formal ICAO term for any act that jeopardises the safety of civil aviation — hijacking, sabotage, bomb threats, and unauthorised access all fall under it.',
            },
            {
              type: 'paragraph',
              text: 'Unlike safety, which is about protecting people from accidents, security is about protecting people from deliberate harm. That distinction shapes everything about how security is designed, regulated, and trained.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Why layers matter',
            },
            {
              type: 'paragraph',
              text: 'Aviation security is designed as a set of layers. No single measure is perfect. Instead, each layer catches what the previous layer might miss:',
            },
            {
              type: 'list',
              items: [
                'Intelligence and threat assessment',
                'Airport perimeter and access control',
                'Passenger and baggage screening',
                'Aircraft and cargo security',
                'In-flight security and crew response',
                'Cybersecurity and information protection',
              ],
            },
            {
              type: 'paragraph',
              text: 'Every airport worker, crew member, and ground handler is part of one of these layers. The training you\'re doing now is part of how the industry maintains that chain.',
            },
            {
              type: 'quote',
              text: 'Security is not a product, but a process. It is not a destination, but a journey.',
              attribution: 'Bruce Schneier',
            },
          ],
        },

        {
          id: 'avsec-m1-l2',
          title: 'The Regulatory Landscape',
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoProvider: 'youtube',
          estimatedMinutes: 12,
          transcript:
            'In this lesson we look at the three layers of regulation that shape aviation security globally: ICAO at the top, national regulators like the SACAA in the middle, and operator-level procedures at the bottom.',
          notes: [
            {
              type: 'heading',
              level: 3,
              text: 'Key points from the video',
            },
            {
              type: 'list',
              items: [
                'ICAO Annex 17 sets the international standard — countries adopt it into national law',
                'SACAA (in South Africa) is the national regulator that enforces Annex 17',
                'Each operator (airline, airport, ground handler) must have an approved security programme',
                'Every individual with airside access is legally bound by that programme',
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Personal legal responsibility',
              text: 'Breaches of aviation security regulation can lead to fines or imprisonment — not just for the operator, but for the individual who committed the breach.',
            },
          ],
        },

        {
          id: 'avsec-m1-l3',
          title: 'Module 1 Knowledge Check',
          type: 'quiz',
          estimatedMinutes: 5,
          passMarkPercent: 70,
          allowRetry: true,
          questions: [
            {
              id: 'avsec-m1-q1',
              question: 'What is the correct term for any act that jeopardises the safety of civil aviation?',
              options: [
                { id: 'a', text: 'Safety incident', isCorrect: false },
                { id: 'b', text: 'Unlawful interference', isCorrect: true },
                { id: 'c', text: 'Security event', isCorrect: false },
                { id: 'd', text: 'Aviation hazard', isCorrect: false },
              ],
              explanation:
                'Unlawful interference is the formal ICAO term covering hijacking, sabotage, bomb threats, and unauthorised access.',
            },
            {
              id: 'avsec-m1-q2',
              question: 'Which ICAO Annex sets the international standard for aviation security?',
              options: [
                { id: 'a', text: 'Annex 1', isCorrect: false },
                { id: 'b', text: 'Annex 6', isCorrect: false },
                { id: 'c', text: 'Annex 17', isCorrect: true },
                { id: 'd', text: 'Annex 19', isCorrect: false },
              ],
              explanation:
                'ICAO Annex 17 — Security: Safeguarding International Civil Aviation Against Acts of Unlawful Interference. It\'s the foundation of every national aviation security programme.',
            },
            {
              id: 'avsec-m1-q3',
              question: 'Who is personally bound by an operator\'s security programme?',
              options: [
                { id: 'a', text: 'Only the security manager', isCorrect: false },
                { id: 'b', text: 'Only pilots and cabin crew', isCorrect: false },
                { id: 'c', text: 'Everyone with airside access', isCorrect: true },
                { id: 'd', text: 'Only airport employees', isCorrect: false },
              ],
              explanation:
                'Every individual with airside access — crew, ground handlers, contractors, cleaners, caterers — is legally bound by the security programme.',
            },
            {
              id: 'avsec-m1-q4',
              question: 'Why is aviation security designed in layers rather than a single measure?',
              options: [
                {
                  id: 'a',
                  text: 'Because each layer catches what the previous one might miss',
                  isCorrect: true,
                },
                {
                  id: 'b',
                  text: 'Because it is cheaper to build',
                  isCorrect: false,
                },
                {
                  id: 'c',
                  text: 'Because regulations require exactly six layers',
                  isCorrect: false,
                },
                {
                  id: 'd',
                  text: 'Because a single measure would be too complex',
                  isCorrect: false,
                },
              ],
              explanation:
                'No single measure is perfect. Layered security means an attack must defeat multiple defences, which is far harder than defeating just one.',
            },
          ],
        },
      ],
    },

    // =======================================================================
    // MODULE 2 — Threat Recognition
    // =======================================================================
    {
      id: 'avsec-mod-2',
      title: 'Threat Recognition',
      description:
        'How to spot suspicious behaviour, identify prohibited items, and know when to report.',
      order: 2,
      lessons: [
        {
          id: 'avsec-m2-l1',
          title: 'Behavioural Indicators',
          type: 'text',
          estimatedMinutes: 10,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'Reading people, not profiles',
            },
            {
              type: 'paragraph',
              text: 'Modern aviation security does not rely on profiling — that is, guessing who might be a threat based on appearance, nationality, or religion. It relies on behavioural indicators: specific observable behaviours that, taken together, may indicate someone is preparing or about to commit an act of unlawful interference.',
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'One indicator is meaningless',
              text: 'A single behavioural indicator is almost never conclusive. Nervous passengers exist. Sweating is normal. What matters is a cluster of indicators that are unusual for the context — and your judgement, then your report.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Common behavioural indicators',
            },
            {
              type: 'list',
              items: [
                'Excessive sweating, trembling, or visible nervousness unusual for the situation',
                'Avoiding eye contact or being unusually hostile to security staff',
                'Wearing clothing inappropriate for the weather (e.g. heavy coat in summer) — sometimes used to conceal items',
                'Repeatedly checking a bag, watch, or phone in a way that suggests timing',
                'Leaving a bag unattended then observing it from a distance',
                'Refusing routine screening or becoming aggressive about it',
                'Unusual interest in security procedures or staff rotations',
              ],
            },
            {
              type: 'heading',
              level: 3,
              text: 'What to do',
            },
            {
              type: 'paragraph',
              text: 'The correct response is always the same: do not confront, do not delay, report. Your job is not to determine whether someone is a threat — that\'s the job of security professionals. Your job is to notice and report so they can assess.',
            },
            {
              type: 'paragraph',
              text: 'Report through your organisation\'s designated channel. This might be a security hotline, a supervisor, a radio call, or a specific app. Know your channel before you need it.',
            },
            {
              type: 'quote',
              text: 'If you see something, say something. The cost of a false alarm is nothing. The cost of a missed signal is catastrophic.',
              attribution: 'TSA public awareness campaign',
            },
          ],
        },

        {
          id: 'avsec-m2-l2',
          title: 'Prohibited Items & Concealment',
          type: 'text',
          estimatedMinutes: 10,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'Categories of prohibited items',
            },
            {
              type: 'paragraph',
              text: 'Prohibited items are grouped by the risk they present and the environment they are prohibited in. The same item might be permitted in checked baggage but banned in carry-on — always refer to the current regulations.',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'Weapons — firearms, knives, sharp objects, blunt instruments',
                'Explosives and incendiaries — including improvised devices',
                'Chemical and biological agents — gases, toxins, hazardous substances',
                'Radioactive materials',
                'Disabling substances — pepper spray, tear gas, stun devices',
                'Lithium batteries and other hazardous goods',
              ],
            },
            {
              type: 'heading',
              level: 3,
              text: 'Common concealment methods',
            },
            {
              type: 'paragraph',
              text: 'Attackers don\'t walk up with items in their hands. They hide them — in clothing, in electronics, in food, in toys, in books, in shoes, even inside their own bodies. The skill of the searcher is understanding where items can hide.',
            },
            {
              type: 'list',
              items: [
                'Hollowed-out electronics (laptops, phones, chargers)',
                'Lining of bags, jackets, and shoes',
                'Inside food containers or drink bottles',
                'Between the pages of books',
                'Inside toys and children\'s items',
                'Inside items that would normally be X-rayed but not opened',
              ],
            },
            {
              type: 'callout',
              variant: 'info',
              title: 'Where to find the current list',
              text: 'Prohibited item lists are updated regularly. In South Africa, the current list is published by the SACAA and reproduced by every operator. Check it before every shift — the list does change.',
            },
          ],
        },

        {
          id: 'avsec-m2-l3',
          title: 'Module 2 Knowledge Check',
          type: 'quiz',
          estimatedMinutes: 5,
          passMarkPercent: 70,
          allowRetry: true,
          questions: [
            {
              id: 'avsec-m2-q1',
              question: 'Which of the following is a behavioural indicator of a potential threat?',
              options: [
                { id: 'a', text: 'A passenger reading a book in the departure lounge', isCorrect: false },
                { id: 'b', text: 'A passenger wearing a heavy coat in summer', isCorrect: true },
                { id: 'c', text: 'A passenger arriving early for a flight', isCorrect: false },
                { id: 'd', text: 'A passenger checking their phone before boarding', isCorrect: false },
              ],
              explanation:
                'Wearing clothing inappropriate for the weather is a common concealment indicator. But remember — one indicator alone is not conclusive.',
            },
            {
              id: 'avsec-m2-q2',
              question: 'What should you do if you notice a cluster of behavioural indicators in a passenger?',
              options: [
                { id: 'a', text: 'Confront the passenger directly', isCorrect: false },
                { id: 'b', text: 'Follow the passenger to see what they do', isCorrect: false },
                { id: 'c', text: 'Report it through your organisation\'s designated channel', isCorrect: true },
                { id: 'd', text: 'Wait and see if anything happens', isCorrect: false },
              ],
              explanation:
                'Your job is to notice and report — not to investigate. Security professionals will assess the situation once you report.',
            },
            {
              id: 'avsec-m2-q3',
              question: 'Which of the following is NOT a common concealment method for prohibited items?',
              options: [
                { id: 'a', text: 'Inside hollowed-out electronics', isCorrect: false },
                { id: 'b', text: 'Inside food containers', isCorrect: false },
                { id: 'c', text: 'Worn openly around the neck', isCorrect: true },
                { id: 'd', text: 'In the lining of a jacket', isCorrect: false },
              ],
              explanation:
                'Attackers conceal items; they don\'t display them. Wearing something openly is not concealment.',
            },
            {
              id: 'avsec-m2-q4',
              question: 'Where can you find the current list of prohibited items in South Africa?',
              options: [
                { id: 'a', text: 'The police station', isCorrect: false },
                { id: 'b', text: 'Published by the SACAA and reproduced by operators', isCorrect: true },
                { id: 'c', text: 'The airport website only', isCorrect: false },
                { id: 'd', text: 'It is not published publicly', isCorrect: false },
              ],
              explanation:
                'The SACAA publishes the current list, and every operator reproduces it. Check before every shift — the list changes.',
            },
          ],
        },
      ],
    },

    // =======================================================================
    // MODULE 3 — Response & Reporting
    // =======================================================================
    {
      id: 'avsec-mod-3',
      title: 'Response & Reporting',
      description:
        'What to do when something happens — and what to log afterwards.',
      order: 3,
      lessons: [
        {
          id: 'avsec-m3-l1',
          title: 'Your Role in an Incident',
          type: 'text',
          estimatedMinutes: 8,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'The first sixty seconds',
            },
            {
              type: 'paragraph',
              text: 'How you respond in the first minute of a security incident often determines the outcome. Panic spreads. Calm spreads. Your job is to be the calm.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'The four Ds',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'Detect — recognise that something is wrong. Trust your training and your instincts.',
                'Deter — make your presence known. Sometimes that\'s enough. Stand tall, make eye contact, be visibly attentive.',
                'Delay — if the situation is developing, slow the attacker down. Lock doors, block access, call for help.',
                'Defend — if all else fails and lives are at risk, act. This is a last resort.',
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Never confront a suspected armed attacker',
              text: 'Your life is worth more than any asset. Withdraw, alert, and let trained responders handle the physical response.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Communication',
            },
            {
              type: 'paragraph',
              text: 'Use the shortest, clearest language possible. "Suspicious bag, Terminal 2, Gate 15, male, dark jacket" is better than a long explanation. Security teams need position, description, and nature of the threat — in that order.',
            },
          ],
        },

        {
          id: 'avsec-m3-l2',
          title: 'Reporting Obligations',
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoProvider: 'youtube',
          estimatedMinutes: 10,
          transcript:
            'Every security incident must be reported — even if nothing happened. The reporting chain goes from you to your supervisor, from your supervisor to the operator\'s security manager, and from there to the national authority if the incident meets the threshold for mandatory reporting.',
          notes: [
            {
              type: 'heading',
              level: 3,
              text: 'What counts as reportable',
            },
            {
              type: 'list',
              items: [
                'Any actual breach of security, regardless of outcome',
                'Any attempted breach',
                'Any suspicious item or behaviour that prompted a response',
                'Any prohibited item found during screening',
                'Any interference with security equipment',
                'Any information suggesting a credible threat',
              ],
            },
            {
              type: 'callout',
              variant: 'success',
              title: 'Failing to report is itself a violation',
              text: 'You cannot decide whether something is "worth reporting." If it happened, it must be logged. That is the law.',
            },
          ],
        },

        {
          id: 'avsec-m3-l3',
          title: 'Module 3 Knowledge Check',
          type: 'quiz',
          estimatedMinutes: 5,
          passMarkPercent: 70,
          allowRetry: true,
          questions: [
            {
              id: 'avsec-m3-q1',
              question: 'What does the first D in the four-D response framework stand for?',
              options: [
                { id: 'a', text: 'Defend', isCorrect: false },
                { id: 'b', text: 'Delay', isCorrect: false },
                { id: 'c', text: 'Detect', isCorrect: true },
                { id: 'd', text: 'Deter', isCorrect: false },
              ],
              explanation:
                'Detect is the first step — recognising that something is wrong using your training and instincts.',
            },
            {
              id: 'avsec-m3-q2',
              question: 'Should you personally decide whether an incident is "worth reporting"?',
              options: [
                { id: 'a', text: 'Yes, if nothing actually happened', isCorrect: false },
                { id: 'b', text: 'Yes, if it was a false alarm', isCorrect: false },
                { id: 'c', text: 'No — if it happened, it must be reported', isCorrect: true },
                { id: 'd', text: 'Only if a supervisor is not present', isCorrect: false },
              ],
              explanation:
                'You cannot decide whether something is worth reporting. Every incident must be reported — failing to report is itself a violation.',
            },
            {
              id: 'avsec-m3-q3',
              question: 'What is the correct order for a security communication?',
              options: [
                { id: 'a', text: 'Nature of threat, description, position', isCorrect: false },
                { id: 'b', text: 'Position, description, nature of threat', isCorrect: true },
                { id: 'c', text: 'Description, position, nature of threat', isCorrect: false },
                { id: 'd', text: 'Nature of threat, position, description', isCorrect: false },
              ],
              explanation:
                'Position first (where), then description (who), then nature of threat (what). This lets responders move while listening.',
            },
            {
              id: 'avsec-m3-q4',
              question: 'What should you do if a suspected armed attacker is present and lives are at immediate risk?',
              options: [
                {
                  id: 'a',
                  text: 'Act to defend — this is the last resort',
                  isCorrect: true,
                },
                {
                  id: 'b',
                  text: 'Always confront them to end the situation',
                  isCorrect: false,
                },
                {
                  id: 'c',
                  text: 'Ignore the situation and continue working',
                  isCorrect: false,
                },
                {
                  id: 'd',
                  text: 'Take photographs for evidence',
                  isCorrect: false,
                },
              ],
              explanation:
                'Defend is the last of the four Ds — used only when all else has failed and lives are at immediate risk. Otherwise, withdraw and alert.',
            },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// DANGEROUS GOODS TRAINING
// ---------------------------------------------------------------------------

const dangerousGoods: CourseContent = {
  courseSlug: 'dangerous-goods',
  introduction:
    'Dangerous goods travel by air every day — some safely, some not. This course teaches you how to classify, package, document, and handle them so they arrive safely and comply with every regulation.',

  modules: [
    // =======================================================================
    // MODULE 1 — Classification
    // =======================================================================
    {
      id: 'dg-mod-1',
      title: 'Classification',
      description:
        'How dangerous goods are classified into the nine hazard classes.',
      order: 1,
      lessons: [
        {
          id: 'dg-m1-l1',
          title: 'The Nine Hazard Classes',
          type: 'text',
          estimatedMinutes: 10,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'Why classification matters',
            },
            {
              type: 'paragraph',
              text: 'Every dangerous good belongs to a hazard class. The class determines how the item must be packed, labelled, documented, and carried. Get the class wrong and every downstream decision is wrong.',
            },
            {
              type: 'callout',
              variant: 'info',
              title: 'One substance, one class',
              text: 'A substance is assigned exactly one primary class, even if it has multiple hazardous properties. Secondary hazards are listed separately as subsidiary risks.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'The nine classes',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'Class 1 — Explosives',
                'Class 2 — Gases (flammable, non-flammable, toxic)',
                'Class 3 — Flammable Liquids',
                'Class 4 — Flammable Solids, Spontaneously Combustible, and Dangerous When Wet',
                'Class 5 — Oxidisers and Organic Peroxides',
                'Class 6 — Toxic and Infectious Substances',
                'Class 7 — Radioactive Material',
                'Class 8 — Corrosives',
                'Class 9 — Miscellaneous Dangerous Goods',
              ],
            },
            {
              type: 'paragraph',
              text: 'Class 9 is a catch-all for items that don\'t fit the first eight — lithium batteries, magnetised material, environmentally hazardous substances, and similar. It is not a "less dangerous" class; the name just means "everything else."',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Subsidiary risks',
            },
            {
              type: 'paragraph',
              text: 'Many substances carry more than one hazard. Petrol is primarily a flammable liquid (Class 3) but is also toxic if inhaled — so it carries a subsidiary risk of Class 6.1. Subsidiary risks must be identified on documentation and labelled on packaging.',
            },
          ],
        },

        {
          id: 'dg-m1-l2',
          title: 'Reading the UN Number System',
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoProvider: 'youtube',
          estimatedMinutes: 12,
          transcript:
            'Every dangerous good has a four-digit UN number — a globally recognised identifier. UN 1203 is petrol. UN 3480 is lithium-ion batteries. UN 1017 is chlorine. Learning to read these numbers fluently is a core skill for anyone handling dangerous goods.',
          notes: [
            {
              type: 'heading',
              level: 3,
              text: 'Structure of the UN number',
            },
            {
              type: 'list',
              items: [
                'Always four digits',
                'Assigned by the UN Committee of Experts',
                'Same number worldwide, regardless of language',
                'Sometimes a "UN" prefix is used (e.g. "UN1203") — same thing',
              ],
            },
            {
              type: 'callout',
              variant: 'success',
              title: 'Why this matters',
              text: 'In an emergency, the UN number is what responders look up in the Emergency Response Guide. Knowing the number means knowing the response.',
            },
          ],
        },

        {
          id: 'dg-m1-l3',
          title: 'Module 1 Knowledge Check',
          type: 'quiz',
          estimatedMinutes: 5,
          passMarkPercent: 70,
          allowRetry: true,
          questions: [
            {
              id: 'dg-m1-q1',
              question: 'How many hazard classes are defined in the ICAO Technical Instructions?',
              options: [
                { id: 'a', text: 'Seven', isCorrect: false },
                { id: 'b', text: 'Nine', isCorrect: true },
                { id: 'c', text: 'Eleven', isCorrect: false },
                { id: 'd', text: 'Thirteen', isCorrect: false },
              ],
              explanation:
                'There are nine classes, from Class 1 (Explosives) to Class 9 (Miscellaneous).',
            },
            {
              id: 'dg-m1-q2',
              question: 'Petrol (UN 1203) is primarily which hazard class?',
              options: [
                { id: 'a', text: 'Class 2 — Gases', isCorrect: false },
                { id: 'b', text: 'Class 3 — Flammable Liquids', isCorrect: true },
                { id: 'c', text: 'Class 6 — Toxic Substances', isCorrect: false },
                { id: 'd', text: 'Class 8 — Corrosives', isCorrect: false },
              ],
              explanation:
                'Petrol is a Class 3 flammable liquid, with a subsidiary risk of Class 6.1 (toxic).',
            },
            {
              id: 'dg-m1-q3',
              question: 'What does a UN number look like?',
              options: [
                { id: 'a', text: 'Two digits', isCorrect: false },
                { id: 'b', text: 'Three digits', isCorrect: false },
                { id: 'c', text: 'Four digits', isCorrect: true },
                { id: 'd', text: 'Six digits', isCorrect: false },
              ],
              explanation:
                'UN numbers are always four digits — e.g. UN 1203 for petrol.',
            },
            {
              id: 'dg-m1-q4',
              question: 'Which of these would fall under Class 9?',
              options: [
                { id: 'a', text: 'Petrol', isCorrect: false },
                { id: 'b', text: 'Liquid nitrogen', isCorrect: false },
                { id: 'c', text: 'Lithium-ion batteries', isCorrect: true },
                { id: 'd', text: 'Sulphuric acid', isCorrect: false },
              ],
              explanation:
                'Lithium batteries are Class 9 — the catch-all class for items that don\'t fit the first eight.',
            },
          ],
        },
      ],
    },

    // =======================================================================
    // MODULE 2 — Packing & Labelling
    // =======================================================================
    {
      id: 'dg-mod-2',
      title: 'Packing & Labelling',
      description:
        'How to select the correct packaging and apply the right markings and labels.',
      order: 2,
      lessons: [
        {
          id: 'dg-m2-l1',
          title: 'UN Specification Packaging',
          type: 'text',
          estimatedMinutes: 12,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'The UN mark',
            },
            {
              type: 'paragraph',
              text: 'Any packaging used for dangerous goods must be UN specification packaging — tested and certified to a UN standard. The UN mark on the package tells you exactly what the packaging is capable of.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Reading the UN mark',
            },
            {
              type: 'paragraph',
              text: 'A typical UN mark looks like: 4G/Y25/S. Every character has meaning:',
            },
            {
              type: 'list',
              items: [
                '4 — packaging type (4 = box)',
                'G — material (G = fibreboard)',
                'Y — packing group (X = I, II, III; Y = II, III; Z = III only)',
                '25 — maximum gross mass in kilograms',
                'S — intended for solids or inner packagings',
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'The gross mass is a hard limit',
              text: 'If a UN mark says 25 kg, you cannot ship 30 kg in that package — no exceptions. The packaging is only certified up to that mass.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Selecting the right packaging',
            },
            {
              type: 'paragraph',
              text: 'You don\'t guess — you look it up. The ICAO Technical Instructions give a Packing Instruction (PI) number for every UN number. That PI tells you the packaging options, the quantity limits, and any special provisions.',
            },
          ],
        },

        {
          id: 'dg-m2-l2',
          title: 'Markings and Labels',
          type: 'text',
          estimatedMinutes: 10,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'Markings vs. labels',
            },
            {
              type: 'paragraph',
              text: 'Markings are text and numbers applied directly to the package — they identify what\'s inside. Labels are the coloured hazard diamonds that warn handlers and responders. You need both.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Required markings',
            },
            {
              type: 'list',
              items: [
                'UN number with the UN prefix (e.g. "UN1203")',
                'Proper Shipping Name (PSN)',
                'Shipper and consignee full names and addresses',
                'Net quantity and package count',
                'Orientation arrows if liquid',
                'Overpack marking if applicable',
              ],
            },
            {
              type: 'heading',
              level: 3,
              text: 'Required labels',
            },
            {
              type: 'list',
              items: [
                'Primary hazard label (determined by the hazard class)',
                'Subsidiary hazard labels (if any)',
                'Handling labels (e.g. "Cargo Aircraft Only", "Cryogenic Liquid")',
              ],
            },
            {
              type: 'callout',
              variant: 'info',
              title: 'Label placement',
              text: 'Labels go on the same surface as the address and on at least one other side or end. A label on the bottom of a package cannot be seen and is not compliant.',
            },
            {
              type: 'paragraph',
              text: 'Every label must be legible, durable, and correctly sized. Faded, torn, or wrongly-sized labels are a compliance failure — and often the first thing an inspector looks for.',
            },
          ],
        },

        {
          id: 'dg-m2-l3',
          title: 'Module 2 Knowledge Check',
          type: 'quiz',
          estimatedMinutes: 5,
          passMarkPercent: 70,
          allowRetry: true,
          questions: [
            {
              id: 'dg-m2-q1',
              question: 'What does the "Y" in the UN specification 4G/Y25/S indicate?',
              options: [
                { id: 'a', text: 'The packaging is made of cardboard', isCorrect: false },
                { id: 'b', text: 'Packing Group II or III permitted', isCorrect: true },
                { id: 'c', text: 'The package is Y-shaped', isCorrect: false },
                { id: 'd', text: 'The package weighs 25 kg', isCorrect: false },
              ],
              explanation:
                'Y indicates the packaging is certified for Packing Group II and III substances.',
            },
            {
              id: 'dg-m2-q2',
              question: 'If the UN specification says 25, what is the maximum gross mass?',
              options: [
                { id: 'a', text: '25 kg', isCorrect: true },
                { id: 'b', text: '250 kg', isCorrect: false },
                { id: 'c', text: '2.5 kg', isCorrect: false },
                { id: 'd', text: 'Any mass — this is just a code', isCorrect: false },
              ],
              explanation:
                'The number in the UN mark is the maximum gross mass in kilograms.',
            },
            {
              id: 'dg-m2-q3',
              question: 'Where must hazard labels be applied?',
              options: [
                { id: 'a', text: 'Only on the top', isCorrect: false },
                {
                  id: 'b',
                  text: 'On the same surface as the address and one other side or end',
                  isCorrect: true,
                },
                { id: 'c', text: 'On all six sides', isCorrect: false },
                { id: 'd', text: 'On the bottom', isCorrect: false },
              ],
              explanation:
                'Labels must be visible on the same surface as the address, and on at least one other side or end.',
            },
            {
              id: 'dg-m2-q4',
              question: 'Where do you look up which packaging is permitted for a specific UN number?',
              options: [
                { id: 'a', text: 'The manufacturer\'s manual', isCorrect: false },
                {
                  id: 'b',
                  text: 'The ICAO Technical Instructions Packing Instruction for that UN number',
                  isCorrect: true,
                },
                { id: 'c', text: 'The package itself', isCorrect: false },
                { id: 'd', text: 'Ask the pilot', isCorrect: false },
              ],
              explanation:
                'Every UN number has a Packing Instruction in the ICAO TI that tells you the permitted packaging.',
            },
          ],
        },
      ],
    },

    // =======================================================================
    // MODULE 3 — Documentation
    // =======================================================================
    {
      id: 'dg-mod-3',
      title: 'Documentation',
      description:
        'The Shipper\'s Declaration and the paperwork trail that keeps shipments compliant.',
      order: 3,
      lessons: [
        {
          id: 'dg-m3-l1',
          title: 'The Shipper\'s Declaration',
          type: 'text',
          estimatedMinutes: 12,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'The single most important document',
            },
            {
              type: 'paragraph',
              text: 'The Shipper\'s Declaration for Dangerous Goods is the legal document that accompanies a DG shipment. It declares what the shipment contains, certifies that it\'s packed and labelled correctly, and is signed by the shipper.',
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'The signature is a legal certification',
              text: 'Signing the Shipper\'s Declaration is not a formality — it is a legal statement that everything on it is accurate and compliant. Incorrect declarations can lead to criminal charges.',
            },
            {
              type: 'heading',
              level: 3,
              text: 'Required fields',
            },
            {
              type: 'list',
              items: [
                'Air Waybill number',
                'Shipper\'s name, address, and signature',
                'Consignee\'s name and address',
                'UN number and Proper Shipping Name for each item',
                'Hazard class and subsidiary risks',
                'Packing group',
                'Number and type of packages',
                'Net quantity per package',
                'Packing instruction number',
                'Authorisations (if any)',
              ],
            },
            {
              type: 'paragraph',
              text: 'Any single field left blank or incorrectly filled means the shipment is non-compliant and will be rejected at acceptance.',
            },
          ],
        },

        {
          id: 'dg-m3-l2',
          title: 'Common Documentation Errors',
          type: 'text',
          estimatedMinutes: 8,
          content: [
            {
              type: 'heading',
              level: 2,
              text: 'The errors that get shipments rejected',
            },
            {
              type: 'paragraph',
              text: 'The vast majority of shipment rejections are not caused by dangerous packing or a wrong label. They\'re caused by paperwork errors. Learning to spot these before they leave the shipper\'s premises saves money and time.',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'Wrong packing group listed (I, II, or III incorrect)',
                'Subsidiary risk missing entirely',
                'Packing instruction number wrong or omitted',
                'Net quantity per package missing or incorrect',
                'Signature missing from the declaration',
                'Multiple different UN entries mixed together incorrectly',
              ],
            },
            {
              type: 'callout',
              variant: 'info',
              title: 'Two-person check',
              text: 'High-volume shippers use a two-person check on every declaration — one person prepares, another verifies against the source data. Simple and effective.',
            },
            {
              type: 'paragraph',
              text: 'At acceptance, the operator\'s acceptance personnel are required to inspect the declaration and packaging together. Any mismatch between the two — even a small one — means the shipment must be rejected.',
            },
          ],
        },

        {
          id: 'dg-m3-l3',
          title: 'Module 3 Knowledge Check',
          type: 'quiz',
          estimatedMinutes: 5,
          passMarkPercent: 70,
          allowRetry: true,
          questions: [
            {
              id: 'dg-m3-q1',
              question: 'What does signing the Shipper\'s Declaration legally represent?',
              options: [
                { id: 'a', text: 'An acknowledgment of receipt', isCorrect: false },
                {
                  id: 'b',
                  text: 'A certification that the shipment is fully and accurately described and compliant',
                  isCorrect: true,
                },
                { id: 'c', text: 'A request for transport', isCorrect: false },
                { id: 'd', text: 'A billing authorisation', isCorrect: false },
              ],
              explanation:
                'The signature is a legal certification that the shipment is correctly declared and complies with regulations.',
            },
            {
              id: 'dg-m3-q2',
              question: 'Which field is most commonly the source of shipment rejections?',
              options: [
                { id: 'a', text: 'Shipper name', isCorrect: false },
                { id: 'b', text: 'Consignee address', isCorrect: false },
                { id: 'c', text: 'Packing group and net quantity', isCorrect: true },
                { id: 'd', text: 'Air Waybill number', isCorrect: false },
              ],
              explanation:
                'Wrong packing group and missing/wrong net quantity are two of the most common causes of rejection.',
            },
            {
              id: 'dg-m3-q3',
              question: 'What should happen if the declaration and the package label disagree at acceptance?',
              options: [
                { id: 'a', text: 'The shipment is accepted anyway', isCorrect: false },
                { id: 'b', text: 'The label is changed to match the declaration', isCorrect: false },
                { id: 'c', text: 'The shipment is rejected', isCorrect: true },
                { id: 'd', text: 'The pilot decides', isCorrect: false },
              ],
              explanation:
                'Any mismatch between declaration and packaging means the shipment must be rejected and corrected before acceptance.',
            },
            {
              id: 'dg-m3-q4',
              question: 'What is a "two-person check"?',
              options: [
                {
                  id: 'a',
                  text: 'One person prepares the declaration, another verifies it',
                  isCorrect: true,
                },
                { id: 'b', text: 'Two people must sign every declaration', isCorrect: false },
                { id: 'c', text: 'The check happens twice', isCorrect: false },
                { id: 'd', text: 'Two regulators must approve the shipment', isCorrect: false },
              ],
              explanation:
                'A two-person check has one person prepare and another verify — simple and highly effective at catching errors.',
            },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// CONTENT MAP
// ---------------------------------------------------------------------------
// Maps course slug → CourseContent.
// Courses not in this map will show a "Content coming soon" state.
// ---------------------------------------------------------------------------

const courseContentBySlug: Record<string, CourseContent> = {
  'avsec-awareness': avsecAwareness,
  'dangerous-goods': dangerousGoods,
};

/**
 * Look up the learning content for a course by slug.
 * Returns null if there's no content yet for that course.
 */
export function getCourseContent(slug: string): CourseContent | null {
  return courseContentBySlug[slug] ?? null;
}

/**
 * Are there any courses with content?
 * Used to decide whether to show the "content coming soon" state.
 */
export function hasCourseContent(slug: string): boolean {
  return slug in courseContentBySlug;
}

/**
 * List the slugs that have content. Useful for admin views.
 */
export function getAllCourseContentSlugs(): string[] {
  return Object.keys(courseContentBySlug);
}