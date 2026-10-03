// ============================================================================
// src/data/courses.ts
//
// The course catalogue. Each course has an optional hero image used on the
// course detail page.
// ============================================================================

import type { Course } from '../types/course.types';

export type Mode = 'online' | 'inperson';

export const courses: Course[] = [
  {
    slug: 'avmed',
    title: 'Aviation Medicine (AVMED) Course',
    category: 'Medical & Health',
    description:
      'Essential medical knowledge, emergency first aid, health protocols, and onboard physiological management for aviation crew.',
    duration: '2-3 Days',
    accreditation: 'SACAA Approved',
    accessDurationDays: 90,
    image: '/images/home/Course1.jpg',
  },
  {
    slug: 'avsec-awareness',
    title: 'Aviation Security (AVSEC) Awareness Training',
    category: 'Security',
    description:
      'Comprehensive security awareness training covering threat identification, hijacking protocols, and airport security compliance.',
    duration: '1-2 Days',
    accreditation: 'SACAA / ASTO Accredited',
    accessDurationDays: 30,
    image: '/images/home/Course2.jpg',
    online: {
      learn: [
        'Recognising security threats and suspicious behaviour',
        'Hijacking and unlawful interference response protocols',
        'Airport and aircraft security compliance requirements',
      ],
      price: '$199',
      duration: '4 hours',
      purchaseUrl: '',
    },
  },
  {
    slug: 'initial-cabin-crew',
    title: 'Initial Cabin Crew Training Course',
    category: 'Cabin Crew',
    description:
      'The complete foundational certification course for new recruits preparing for SACAA commercial cabin crew licensing.',
    duration: '6 Weeks',
    accreditation: 'SACAA ATO Accredited',
    accessDurationDays: 180,
    image: '/images/home/Course3.jpg',
  },
  {
    slug: 'cabin-crew-service',
    title: 'Cabin Crew Service Training',
    category: 'Cabin Crew',
    description:
      'Focused training on onboard hospitality, passenger relations, premium service delivery, and cabin management.',
    duration: '5 Days',
    accreditation: 'Flitedux Certified',
    accessDurationDays: 90,
    image: '/images/home/Course4.jpg',
  },
  {
    slug: 'crew-resource-management',
    title: 'Crew Resource Management',
    category: 'Operations & Safety',
    description:
      'Optimizing human performance, error management, communication, and leadership for flight deck, cabin crew, and ground staff.',
    duration: '2 Days',
    accreditation: 'SACAA Compliant',
    accessDurationDays: 60,
    image: '/images/home/Course5.jpg',
    online: {
      learn: [
        'Communication and teamwork across flight deck, cabin and ground',
        'Human error, threat and error management',
        'Leadership, decision-making and situational awareness',
      ],
      price: '$249',
      duration: '6 hours',
      purchaseUrl: '',
    },
  },
  {
    slug: 'dangerous-goods',
    title: 'Dangerous Goods Training',
    category: 'Safety & Compliance',
    description:
      'Handling, recognition, documentation, and regulatory safety procedures for transporting hazardous materials by air.',
    duration: '3-5 Days',
    accreditation: 'SACAA Accredited',
    accessDurationDays: 90,
    image: '/images/home/Course6.jpg',
    online: {
      learn: [
        'Identifying and classifying dangerous goods',
        'Packing, marking, labelling and documentation rules',
        'Regulatory responsibilities and incident reporting',
      ],
      price: '$199',
      duration: '5 hours',
      purchaseUrl: '',
    },
  },
  {
    slug: 'english-proficiency',
    title: 'English Proficiency Testing',
    category: 'Testing & Language',
    description:
      'Formal language proficiency evaluations for aviation personnel in compliance with international aviation standards.',
    duration: '1 Day (Assessment)',
    accreditation: 'ICAO Compliant',
    accessDurationDays: 30,
    image: '/images/home/Course7.jpg',
  },
  {
    slug: 'rvsm',
    title: 'Reduced Vertical Separation Minimum (RVSM) Course',
    category: 'Flight Operations',
    description:
      'Specialized operational airspace compliance training for flight crew operating within RVSM airspace corridors.',
    duration: '1 Day',
    accreditation: 'SACAA Approved',
    accessDurationDays: 90,
    image: '/images/home/Course8.jpg',
  },
  {
    slug: 'safety-emergency-procedures',
    title: 'Safety and Emergency Procedures Training',
    category: 'Safety & Emergency',
    description:
      'Intensive theoretical and practical training covering emergency equipment operation, evacuations, and survival protocols.',
    duration: 'Varies (Initial / Recurrent)',
    accreditation: 'SACAA ATO Accredited',
    accessDurationDays: 120,
    image: '/images/home/Course9.jpg',
  },
  {
    slug: 'sccm',
    title: 'Senior Cabin Crew Member (SCCM) Course',
    category: 'Leadership',
    description:
      'Advanced supervisory, team leadership, and emergency management training designed for senior cabin crew personnel.',
    duration: '1 Week',
    accreditation: 'SACAA Accredited',
    accessDurationDays: 120,
    image: '/images/home/Course10.jpg',
  },
  {
    slug: 'train-the-trainer',
    title: 'Train The Trainer',
    category: 'Instructor Training',
    description:
      'Empowering experienced professionals with instructional techniques, curriculum delivery, and student assessment skills.',
    duration: '5 Days',
    accreditation: 'SAQA Accredited',
    accessDurationDays: 180,
    image: '/images/home/Course11.jpg',
  },
  {
    slug: 'wet-ditching',
    title: 'Wet Ditching & Survival Course',
    category: 'Emergency Survival',
    description:
      'Practical water survival, life raft deployment, and open-water evacuation training conducted in aquatic facilities.',
    duration: '1-2 Days',
    accreditation: 'SACAA Accredited',
    accessDurationDays: 90,
    image: '/images/home/Course12.jpg',
  },
];