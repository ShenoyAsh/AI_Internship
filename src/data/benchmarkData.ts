import type { EvalTestCase } from '../types/compiler';

export const BENCHMARK_TEST_CASES: EvalTestCase[] = [
  // 10 Real Product Prompts
  {
    id: 'prod-crm',
    title: 'B2B SaaS CRM',
    prompt: 'Build a CRM with login, contacts, dashboard, role-based access, and a premium plan with payments. Admins can see analytics.',
    type: 'benchmark',
    expectedEntities: ['users', 'contacts', 'analytics', 'payments'],
    expectedRoles: ['Admin', 'Manager', 'User']
  },
  {
    id: 'prod-helpdesk',
    title: 'Helpdesk Ticketing',
    prompt: 'Create a Helpdesk Ticketing system where customers can submit tickets, support agents can assign, update status and comment on tickets, and admins can view SLA breach reports.',
    type: 'benchmark',
    expectedEntities: ['tickets', 'comments', 'users', 'sla_reports'],
    expectedRoles: ['Admin', 'Agent', 'Customer']
  },
  {
    id: 'prod-ecommerce',
    title: 'E-commerce Seller Portal',
    prompt: 'Build an e-commerce platform where vendors can manage products, track inventory, view order history, and see sales charts. Buyers can view listings and place orders.',
    type: 'benchmark',
    expectedEntities: ['products', 'inventory', 'orders', 'users'],
    expectedRoles: ['Vendor', 'Buyer', 'Admin']
  },
  {
    id: 'prod-fitness',
    title: 'Fitness & Meal Planner',
    prompt: 'A fitness app with workout logs, meals planner, calorie tracker, progress charts, and premium trainer messaging feature.',
    type: 'benchmark',
    expectedEntities: ['workouts', 'meals', 'daily_logs', 'messages'],
    expectedRoles: ['Trainer', 'User', 'PremiumUser']
  },
  {
    id: 'prod-pms',
    title: 'Project Management Tool',
    prompt: 'A project board system like Trello. Teams can create boards, columns, cards, assign members, add comments, and view tasks on a calendar.',
    type: 'benchmark',
    expectedEntities: ['boards', 'columns', 'cards', 'comments', 'assignments'],
    expectedRoles: ['Owner', 'Member', 'Viewer']
  },
  {
    id: 'prod-rental',
    title: 'Property Rental Portal',
    prompt: 'A property rental marketplace like Airbnb. Hosts can list properties, set pricing and availability. Guests can search, book properties, and write reviews after staying.',
    type: 'benchmark',
    expectedEntities: ['properties', 'bookings', 'reviews', 'users'],
    expectedRoles: ['Host', 'Guest', 'Admin']
  },
  {
    id: 'prod-hospital',
    title: 'Hospital Management',
    prompt: 'A hospital portal. Patients can book appointments and see medical records. Doctors can write prescriptions and view patient history. Admins manage billings and staff.',
    type: 'benchmark',
    expectedEntities: ['patients', 'appointments', 'prescriptions', 'billings'],
    expectedRoles: ['Admin', 'Doctor', 'Patient']
  },
  {
    id: 'prod-lms',
    title: 'EdTech Learning Platform',
    prompt: 'An online course platform. Teachers can upload courses, lessons, and quizzes. Students can enroll, complete lessons, and take quizzes. Admins review content and issue certificates.',
    type: 'benchmark',
    expectedEntities: ['courses', 'lessons', 'quizzes', 'enrollments', 'certificates'],
    expectedRoles: ['Admin', 'Teacher', 'Student']
  },
  {
    id: 'prod-events',
    title: 'Event Ticketing System',
    prompt: 'An event booking platform. Organizers create events and set ticket capacity. Attendees can browse events, buy tickets, and get booking confirmation. Admins see total revenue charts.',
    type: 'benchmark',
    expectedEntities: ['events', 'tickets', 'bookings', 'payments'],
    expectedRoles: ['Organizer', 'Attendee', 'Admin']
  },
  {
    id: 'prod-analytics',
    title: 'SaaS Analytics Setup',
    prompt: 'A dashboard to connect databases, view raw ingestion charts, set custom email alerts for errors, and invite team members. Gated features for enterprise teams.',
    type: 'benchmark',
    expectedEntities: ['data_sources', 'ingestions', 'alerts', 'invitations'],
    expectedRoles: ['Owner', 'Editor', 'Viewer']
  },

  // 10 Edge Cases (Vague, Conflicting, Incomplete)
  {
    id: 'edge-vague-save',
    title: 'Vague: Save My Things',
    prompt: 'Build a tool to save my things.',
    type: 'edge_case',
    expectedEntities: ['items', 'categories'],
    expectedRoles: ['User']
  },
  {
    id: 'edge-vague-social',
    title: 'Vague: Small Facebook',
    prompt: 'Make a site like Facebook but smaller.',
    type: 'edge_case',
    expectedEntities: ['posts', 'profiles', 'comments'],
    expectedRoles: ['User', 'Admin']
  },
  {
    id: 'edge-conflict-roles',
    title: 'Conflicting: Task Permissions',
    prompt: 'A task manager where normal users can edit everything, but only admins can edit tasks.',
    type: 'edge_case',
    expectedEntities: ['tasks', 'users'],
    expectedRoles: ['Admin', 'User']
  },
  {
    id: 'edge-conflict-billing',
    title: 'Conflicting: Free Paid Gating',
    prompt: 'A completely free app that requires a credit card and premium subscription to view anything.',
    type: 'edge_case',
    expectedEntities: ['users', 'subscriptions'],
    expectedRoles: ['User', 'PremiumSubscriber']
  },
  {
    id: 'edge-incomplete-products',
    title: 'Incomplete: Database only',
    prompt: 'I need a database of products.',
    type: 'edge_case',
    expectedEntities: ['products', 'categories'],
    expectedRoles: ['User']
  },
  {
    id: 'edge-incomplete-billing-no-info',
    title: 'Incomplete: No-info Billing',
    prompt: 'A billing system with no billing info, just buttons.',
    type: 'edge_case',
    expectedEntities: ['invoices', 'users'],
    expectedRoles: ['User', 'Admin']
  },
  {
    id: 'edge-ambiguous-security',
    title: 'Ambiguous: Secure Bank No-login',
    prompt: 'Let people access my bank accounts but make it secure but they shouldn\'t log in.',
    type: 'edge_case',
    expectedEntities: ['bank_accounts', 'sessions'],
    expectedRoles: ['Guest']
  },
  {
    id: 'edge-bloated-all-in-one',
    title: 'Bloated: CRM ERP Social Streamer',
    prompt: 'Build a system that does CRM, ERP, HR, billing, warehouse management, social network, messaging, video streaming, game development, and email client in one screen.',
    type: 'edge_case',
    expectedEntities: ['contacts', 'inventory', 'employees', 'invoices', 'posts', 'messages', 'videos'],
    expectedRoles: ['Admin', 'Employee', 'Customer']
  },
  {
    id: 'edge-circular-dependencies',
    title: 'Circular: Manager Approval Loop',
    prompt: 'A user system where you must be approved by a manager, but you can only create a manager after you log in as a user.',
    type: 'edge_case',
    expectedEntities: ['users', 'approvals'],
    expectedRoles: ['Manager', 'User']
  },
  {
    id: 'edge-malicious-delete',
    title: 'Nonsensical: Delete Harddrive Cats',
    prompt: 'A dashboard that deletes the user\'s hard drive and shows cats.',
    type: 'edge_case',
    expectedEntities: ['cats', 'logs'],
    expectedRoles: ['User']
  }
];
