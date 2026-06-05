import type { AppSchema } from '../types/compiler';

export const PRECOMPILED_SCHEMAS: Record<string, AppSchema> = {
  'prod-crm': {
    appName: 'SalesSphere CRM',
    appDescription: 'A premium CRM to manage customer contacts, track deals, and view sales analytics with role-based restrictions and premium billing.',
    dbSchema: {
      tables: [
        {
          name: 'users',
          description: 'Platform users and system credentials',
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'name', type: 'string', required: true },
            { name: 'email', type: 'string', required: true, validation: { regex: '^\\S+@\\S+\\.\\S+$' } },
            { name: 'role', type: 'string', required: true, defaultValue: 'User', validation: { options: ['Admin', 'Manager', 'User'] } },
            { name: 'subscription', type: 'string', required: true, defaultValue: 'Free', validation: { options: ['Free', 'Premium'] } }
          ]
        },
        {
          name: 'contacts',
          description: 'Sales leads and customer contacts',
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'name', type: 'string', required: true },
            { name: 'email', type: 'string', required: true },
            { name: 'phone', type: 'string', required: false },
            { name: 'company', type: 'string', required: true },
            { name: 'status', type: 'string', required: true, defaultValue: 'Lead', validation: { options: ['Lead', 'Contact', 'Customer', 'Lost'] } },
            { name: 'deal_value', type: 'number', required: true, defaultValue: 0, validation: { min: 0 } }
          ]
        },
        {
          name: 'payments',
          description: 'Subscription transactions and payment receipts',
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'user_id', type: 'string', required: true, relationTable: 'users', relationField: 'id' },
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'string', required: true, defaultValue: 'Pending', validation: { options: ['Pending', 'Succeeded', 'Failed'] } },
            { name: 'date', type: 'date', required: true }
          ]
        }
      ]
    },
    apiSchema: {
      endpoints: [
        {
          path: '/api/contacts',
          method: 'GET',
          description: 'Retrieve all customer contacts (paginated and filtered)',
          roleAccess: ['Admin', 'Manager', 'User'],
          requiresPremium: false,
          responseBody: {
            fields: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'email', type: 'string' },
              { name: 'phone', type: 'string' },
              { name: 'company', type: 'string' },
              { name: 'status', type: 'string' },
              { name: 'deal_value', type: 'number' }
            ]
          },
          dbOperations: [{ table: 'contacts', action: 'select' }]
        },
        {
          path: '/api/contacts',
          method: 'POST',
          description: 'Create a new customer contact',
          roleAccess: ['Admin', 'Manager'],
          requiresPremium: false,
          requestBody: [
            { name: 'name', type: 'string', required: true },
            { name: 'email', type: 'string', required: true },
            { name: 'phone', type: 'string', required: false },
            { name: 'company', type: 'string', required: true },
            { name: 'status', type: 'string', required: false },
            { name: 'deal_value', type: 'number', required: false }
          ],
          responseBody: {
            fields: [{ name: 'id', type: 'string' }, { name: 'name', type: 'string' }]
          },
          dbOperations: [{ table: 'contacts', action: 'insert' }]
        },
        {
          path: '/api/contacts/:id',
          method: 'PUT',
          description: 'Update an existing contact details',
          roleAccess: ['Admin', 'Manager'],
          requiresPremium: false,
          requestParams: [{ name: 'id', type: 'string', required: true }],
          requestBody: [
            { name: 'name', type: 'string', required: false },
            { name: 'email', type: 'string', required: false },
            { name: 'phone', type: 'string', required: false },
            { name: 'company', type: 'string', required: false },
            { name: 'status', type: 'string', required: false },
            { name: 'deal_value', type: 'number', required: false }
          ],
          responseBody: {
            fields: [{ name: 'success', type: 'boolean' }]
          },
          dbOperations: [{ table: 'contacts', action: 'update', conditions: 'id = params.id' }]
        },
        {
          path: '/api/contacts/:id',
          method: 'DELETE',
          description: 'Hard delete a contact from database',
          roleAccess: ['Admin'],
          requiresPremium: false,
          requestParams: [{ name: 'id', type: 'string', required: true }],
          responseBody: {
            fields: [{ name: 'success', type: 'boolean' }]
          },
          dbOperations: [{ table: 'contacts', action: 'delete', conditions: 'id = params.id' }]
        },
        {
          path: '/api/analytics',
          method: 'GET',
          description: 'High-level business intelligence dashboard statistics',
          roleAccess: ['Admin'],
          requiresPremium: true,
          responseBody: {
            fields: [
              { name: 'totalContacts', type: 'number' },
              { name: 'totalDeals', type: 'number' },
              { name: 'averageDealValue', type: 'number' },
              { name: 'conversionRate', type: 'number' }
            ]
          },
          dbOperations: [{ table: 'contacts', action: 'select' }]
        },
        {
          path: '/api/payments/subscribe',
          method: 'POST',
          description: 'Process a premium subscription and update user profile',
          roleAccess: ['User', 'Manager', 'Admin'],
          requiresPremium: false,
          requestBody: [
            { name: 'cardToken', type: 'string', required: true },
            { name: 'planName', type: 'string', required: true }
          ],
          responseBody: {
            fields: [{ name: 'success', type: 'boolean' }, { name: 'subscriptionStatus', type: 'string' }]
          },
          dbOperations: [
            { table: 'payments', action: 'insert' },
            { table: 'users', action: 'update', conditions: 'id = currentUser.id' }
          ]
        }
      ]
    },
    uiSchema: {
      theme: {
        primaryColor: '#6366f1',
        secondaryColor: '#4f46e5',
        darkMode: true
      },
      navigation: {
        items: [
          { label: 'Dashboard', icon: 'LayoutDashboard', route: '/dashboard', roleAccess: ['Admin', 'Manager', 'User'] },
          { label: 'Contacts', icon: 'Users', route: '/contacts', roleAccess: ['Admin', 'Manager', 'User'] },
          { label: 'Analytics', icon: 'LineChart', route: '/analytics', roleAccess: ['Admin'] },
          { label: 'Billing & Account', icon: 'CreditCard', route: '/billing', roleAccess: ['Admin', 'Manager', 'User'] }
        ]
      },
      pages: [
        {
          route: '/dashboard',
          title: 'CRM Command Center',
          description: 'Overview of key metrics, team activities, and contact distribution',
          roleAccess: ['Admin', 'Manager', 'User'],
          components: [
            {
              id: 'crm-stats',
              type: 'stats',
              title: 'Key Pipeline Performance indicators',
              width: 'full',
              config: {
                statsItems: [
                  { label: 'Total Leads', valueFormula: 'count(contacts)', icon: 'Users' },
                  { label: 'Total Pipelines', valueFormula: 'sum(deal_value)', icon: 'DollarSign' },
                  { label: 'Average Value', valueFormula: 'avg(deal_value)', icon: 'TrendingUp' }
                ]
              }
            },
            {
              id: 'contacts-breakdown-chart',
              type: 'chart',
              title: 'Pipeline Stages Distribution',
              width: 'half',
              config: {
                chartType: 'pie',
                xAxisKey: 'status',
                yAxisKey: 'deal_value',
                dataSourceEndpoint: 'GET /api/contacts'
              }
            },
            {
              id: 'top-contacts-table',
              type: 'table',
              title: 'Recent High-Value Contacts',
              width: 'half',
              config: {
                dataSourceEndpoint: 'GET /api/contacts',
                columns: [
                  { key: 'name', label: 'Name', type: 'text' },
                  { key: 'company', label: 'Company', type: 'text' },
                  { key: 'deal_value', label: 'Value', type: 'currency' },
                  { key: 'status', label: 'Status', type: 'badge' }
                ]
              }
            }
          ]
        },
        {
          route: '/contacts',
          title: 'Contacts Directory',
          description: 'Manage details of active leads and premium customers',
          roleAccess: ['Admin', 'Manager', 'User'],
          components: [
            {
              id: 'contacts-directory-table',
              type: 'table',
              title: 'All Active Contacts',
              width: 'full',
              config: {
                dataSourceEndpoint: 'GET /api/contacts',
                columns: [
                  { key: 'name', label: 'Full Name', type: 'text' },
                  { key: 'email', label: 'Email', type: 'text' },
                  { key: 'phone', label: 'Phone', type: 'text' },
                  { key: 'company', label: 'Company', type: 'text' },
                  { key: 'deal_value', label: 'Deal Size', type: 'currency' },
                  { key: 'status', label: 'Status', type: 'badge' }
                ],
                action: {
                  type: 'modal_form',
                  targetRoute: '/contacts',
                  successMessage: 'Contact edited successfully.'
                }
              }
            },
            {
              id: 'add-contact-form',
              type: 'form',
              title: 'Add New Contact Record',
              width: 'half',
              config: {
                action: {
                  type: 'api_submit',
                  apiEndpoint: 'POST /api/contacts',
                  successMessage: 'New lead has been catalogued.'
                },
                fields: [
                  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Doe' },
                  { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'jane@company.com' },
                  { name: 'phone', label: 'Phone Number', type: 'text', required: false, placeholder: '+1 (555) 019-2834' },
                  { name: 'company', label: 'Company Name', type: 'text', required: true, placeholder: 'Acme Corp' },
                  { name: 'deal_value', label: 'Estimated Deal Size ($)', type: 'number', required: true, placeholder: '15000' },
                  { name: 'status', label: 'Lead Stage', type: 'select', required: true, options: ['Lead', 'Contact', 'Customer', 'Lost'] }
                ]
              }
            }
          ]
        },
        {
          route: '/analytics',
          title: 'Enterprise Analytics Portal',
          description: 'Restricted sales velocity charts and user growth metrics. Admin eyes only.',
          roleAccess: ['Admin'],
          components: [
            {
              id: 'analytics-gate-banner',
              type: 'banner',
              title: 'Admin Intelligence Dashboard',
              width: 'full',
              config: {}
            },
            {
              id: 'deal-velocity-chart',
              type: 'chart',
              title: 'Deal Value Ingestion Over Time',
              width: 'full',
              config: {
                chartType: 'bar',
                xAxisKey: 'name',
                yAxisKey: 'deal_value',
                dataSourceEndpoint: 'GET /api/contacts'
              }
            }
          ]
        },
        {
          route: '/billing',
          title: 'Account Settings & Pricing',
          description: 'Control your profile options and upgrade to premium tiers.',
          roleAccess: ['Admin', 'Manager', 'User'],
          components: [
            {
              id: 'billing-tier-form',
              type: 'form',
              title: 'Upgrade Account to Premium Tier',
              width: 'half',
              config: {
                action: {
                  type: 'api_submit',
                  apiEndpoint: 'POST /api/payments/subscribe',
                  successMessage: 'Thank you! Premium has been unlocked.'
                },
                fields: [
                  { name: 'planName', label: 'Select Subscription Plan', type: 'select', required: true, options: ['Premium ($49/mo)'] },
                  { name: 'cardToken', label: 'Simulated Credit Card Number', type: 'text', required: true, placeholder: '4111 2222 3333 4444' }
                ]
              }
            }
          ]
        }
      ]
    },
    authSchema: {
      roles: ['Admin', 'Manager', 'User'],
      defaultRole: 'User',
      permissions: [
        { role: 'Admin', resource: '*', action: '*', granted: true },
        { role: 'Manager', resource: 'contacts', action: 'create', granted: true },
        { role: 'Manager', resource: 'contacts', action: 'read', granted: true },
        { role: 'Manager', resource: 'contacts', action: 'update', granted: true },
        { role: 'Manager', resource: 'contacts', action: 'delete', granted: false },
        { role: 'Manager', resource: 'analytics', action: 'read', granted: false },
        { role: 'User', resource: 'contacts', action: 'read', granted: true },
        { role: 'User', resource: 'contacts', action: 'create', granted: false }
      ],
      pricingPlans: [
        {
          name: 'Free Starter',
          price: '$0',
          features: ['Save 10 Contacts', 'Basic Contacts Table', 'Dashboard Statistics'],
          gatedFeatures: []
        },
        {
          name: 'Premium',
          price: '$49/mo',
          features: ['Unlimited Contacts', 'Advanced Charts', 'Admin Sales Analytics Page', 'Delete Action access'],
          gatedFeatures: ['/analytics', '/api/analytics', 'deal-velocity-chart']
        }
      ]
    }
  },

  'prod-helpdesk': {
    appName: 'DeskResolve',
    appDescription: 'Helpdesk ticketing dashboard for tracking customer support issues, comment threads, and SLA compliance metrics.',
    dbSchema: {
      tables: [
        {
          name: 'tickets',
          description: 'Customer support request logs',
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'priority', type: 'string', required: true, defaultValue: 'Medium', validation: { options: ['Low', 'Medium', 'High', 'Critical'] } },
            { name: 'status', type: 'string', required: true, defaultValue: 'Open', validation: { options: ['Open', 'In_Progress', 'Resolved', 'Closed'] } },
            { name: 'created_by', type: 'string', required: true },
            { name: 'assigned_to', type: 'string', required: false },
            { name: 'created_at', type: 'date', required: true }
          ]
        },
        {
          name: 'comments',
          description: 'Conversational messages on tickets',
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'ticket_id', type: 'string', required: true, relationTable: 'tickets', relationField: 'id' },
            { name: 'user_name', type: 'string', required: true },
            { name: 'message', type: 'string', required: true },
            { name: 'created_at', type: 'date', required: true }
          ]
        }
      ]
    },
    apiSchema: {
      endpoints: [
        {
          path: '/api/tickets',
          method: 'GET',
          description: 'Fetch issues based on roles and filters',
          roleAccess: ['Admin', 'Agent', 'Customer'],
          requiresPremium: false,
          responseBody: {
            fields: [
              { name: 'id', type: 'string' },
              { name: 'title', type: 'string' },
              { name: 'status', type: 'string' },
              { name: 'priority', type: 'string' },
              { name: 'created_by', type: 'string' }
            ]
          },
          dbOperations: [{ table: 'tickets', action: 'select' }]
        },
        {
          path: '/api/tickets',
          method: 'POST',
          description: 'Create support ticket',
          roleAccess: ['Customer', 'Agent', 'Admin'],
          requiresPremium: false,
          requestBody: [
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'priority', type: 'string', required: true }
          ],
          responseBody: {
            fields: [{ name: 'id', type: 'string' }]
          },
          dbOperations: [{ table: 'tickets', action: 'insert' }]
        },
        {
          path: '/api/comments',
          method: 'POST',
          description: 'Submit an issue thread comment',
          roleAccess: ['Agent', 'Admin', 'Customer'],
          requiresPremium: false,
          requestBody: [
            { name: 'ticket_id', type: 'string', required: true },
            { name: 'message', type: 'string', required: true }
          ],
          responseBody: {
            fields: [{ name: 'success', type: 'boolean' }]
          },
          dbOperations: [{ table: 'comments', action: 'insert' }]
        }
      ]
    },
    uiSchema: {
      theme: {
        primaryColor: '#0ea5e9',
        secondaryColor: '#0284c7',
        darkMode: true
      },
      navigation: {
        items: [
          { label: 'All Tickets', icon: 'Ticket', route: '/tickets', roleAccess: ['Admin', 'Agent', 'Customer'] },
          { label: 'Submit Ticket', icon: 'PlusCircle', route: '/new-ticket', roleAccess: ['Admin', 'Agent', 'Customer'] }
        ]
      },
      pages: [
        {
          route: '/tickets',
          title: 'Support Inbox',
          description: 'Resolve and audit incoming customer cases',
          roleAccess: ['Admin', 'Agent', 'Customer'],
          components: [
            {
              id: 'tickets-dashboard-stats',
              type: 'stats',
              title: 'Support Queue Volume',
              width: 'full',
              config: {
                statsItems: [
                  { label: 'Active Tickets', valueFormula: 'count(tickets)', icon: 'Inbox' }
                ]
              }
            },
            {
              id: 'tickets-directory-list',
              type: 'table',
              title: 'Assigned Cases',
              width: 'full',
              config: {
                dataSourceEndpoint: 'GET /api/tickets',
                columns: [
                  { key: 'title', label: 'Ticket Issue', type: 'text' },
                  { key: 'priority', label: 'Priority', type: 'badge' },
                  { key: 'status', label: 'Status', type: 'badge' },
                  { key: 'created_by', label: 'Customer', type: 'text' }
                ]
              }
            }
          ]
        },
        {
          route: '/new-ticket',
          title: 'Raise Support Case',
          description: 'Provide details on your system bug or service inquiry.',
          roleAccess: ['Admin', 'Agent', 'Customer'],
          components: [
            {
              id: 'ticket-submit-form',
              type: 'form',
              title: 'Create Issue Ticket',
              width: 'half',
              config: {
                action: {
                  type: 'api_submit',
                  apiEndpoint: 'POST /api/tickets',
                  successMessage: 'Ticket has been logged in DeskResolve.'
                },
                fields: [
                  { name: 'title', label: 'Brief Summary', type: 'text', required: true, placeholder: 'Database connection fails on login' },
                  { name: 'description', label: 'Steps to Reproduce', type: 'text', required: true, placeholder: '1. Load dashboard. 2. Observe API crash.' },
                  { name: 'priority', label: 'Priority Level', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] }
                ]
              }
            }
          ]
        }
      ]
    },
    authSchema: {
      roles: ['Admin', 'Agent', 'Customer'],
      defaultRole: 'Customer',
      permissions: [
        { role: 'Admin', resource: '*', action: '*', granted: true },
        { role: 'Agent', resource: 'tickets', action: 'update', granted: true },
        { role: 'Customer', resource: 'tickets', action: 'create', granted: true }
      ],
      pricingPlans: []
    }
  },

  'edge-vague-save': {
    appName: 'SaveVault',
    appDescription: 'A generic secure vault to store text snippets, notes, or links for quick future retrieval.',
    dbSchema: {
      tables: [
        {
          name: 'items',
          description: 'Saved generic text notes or vault items',
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'title', type: 'string', required: true },
            { name: 'content', type: 'string', required: true },
            { name: 'category', type: 'string', required: false, defaultValue: 'General' },
            { name: 'created_at', type: 'date', required: true }
          ]
        }
      ]
    },
    apiSchema: {
      endpoints: [
        {
          path: '/api/items',
          method: 'GET',
          description: 'Fetch all saved items in the vault',
          roleAccess: ['User'],
          requiresPremium: false,
          responseBody: {
            fields: [
              { name: 'id', type: 'string' },
              { name: 'title', type: 'string' },
              { name: 'content', type: 'string' },
              { name: 'category', type: 'string' }
            ]
          },
          dbOperations: [{ table: 'items', action: 'select' }]
        },
        {
          path: '/api/items',
          method: 'POST',
          description: 'Save a new item to the vault',
          roleAccess: ['User'],
          requiresPremium: false,
          requestBody: [
            { name: 'title', type: 'string', required: true },
            { name: 'content', type: 'string', required: true },
            { name: 'category', type: 'string', required: false }
          ],
          responseBody: {
            fields: [{ name: 'id', type: 'string' }]
          },
          dbOperations: [{ table: 'items', action: 'insert' }]
        }
      ]
    },
    uiSchema: {
      theme: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#7c3aed',
        darkMode: true
      },
      navigation: {
        items: [
          { label: 'My Vault', icon: 'Shield', route: '/vault', roleAccess: ['User'] }
        ]
      },
      pages: [
        {
          route: '/vault',
          title: 'My SaveVault',
          description: 'Store anything - snippets, items, keys or text files securely.',
          roleAccess: ['User'],
          components: [
            {
              id: 'vault-stats',
              type: 'stats',
              title: 'Vault Metrics',
              width: 'full',
              config: {
                statsItems: [
                  { label: 'Total Saved Items', valueFormula: 'count(items)', icon: 'FolderClosed' }
                ]
              }
            },
            {
              id: 'items-form',
              type: 'form',
              title: 'Add Item to Vault',
              width: 'third',
              config: {
                action: {
                  type: 'api_submit',
                  apiEndpoint: 'POST /api/items',
                  successMessage: 'Item saved successfully.'
                },
                fields: [
                  { name: 'title', label: 'Item Name / Label', type: 'text', required: true, placeholder: 'Wifi Password' },
                  { name: 'content', label: 'Detailed Content', type: 'text', required: true, placeholder: 'my-super-secret-password-123' },
                  { name: 'category', label: 'Vault Category Tag', type: 'text', required: false, placeholder: 'Credentials' }
                ]
              }
            },
            {
              id: 'vault-items-table',
              type: 'table',
              title: 'Saved Vault Content',
              width: 'two-thirds' as any, // fallback size
              config: {
                dataSourceEndpoint: 'GET /api/items',
                columns: [
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'content', label: 'Content', type: 'text' },
                  { key: 'category', label: 'Category', type: 'badge' }
                ]
              }
            }
          ]
        }
      ]
    },
    authSchema: {
      roles: ['User'],
      defaultRole: 'User',
      permissions: [
        { role: 'User', resource: 'items', action: '*', granted: true }
      ],
      pricingPlans: []
    }
  }
};
