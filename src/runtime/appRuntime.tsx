import { useState, useEffect, useMemo } from 'react';
import type { AppSchema } from '../types/compiler';
import * as Icons from 'lucide-react';

interface AppRuntimeProps {
  schema: AppSchema;
}

// Initial seed data generator based on tables
function generateSeedData(tables: any[]): Record<string, any[]> {
  const seed: Record<string, any[]> = {};
  
  tables.forEach(table => {
    if (table.name === 'contacts') {
      seed['contacts'] = [
        { id: '1', name: 'Alice Smith', email: 'alice@google.com', phone: '+1-555-0101', company: 'Google Inc', status: 'Customer', deal_value: 45000 },
        { id: '2', name: 'Bob Johnson', email: 'bob@stripe.com', phone: '+1-555-0102', company: 'Stripe Co', status: 'Lead', deal_value: 12000 },
        { id: '3', name: 'Charlie Prince', email: 'charlie@slack.com', phone: '+1-555-0103', company: 'Slack Technologies', status: 'Contact', deal_value: 28000 },
        { id: '4', name: 'Diana Lane', email: 'diana@amazon.com', phone: '+1-555-0104', company: 'Amazon Web', status: 'Lost', deal_value: 8000 }
      ];
    } else if (table.name === 'users') {
      seed['users'] = [
        { id: 'usr-1', name: 'Jane Admin', email: 'admin@salessphere.com', role: 'Admin', subscription: 'Free' },
        { id: 'usr-2', name: 'Mark Manager', email: 'manager@salessphere.com', role: 'Manager', subscription: 'Free' },
        { id: 'usr-3', name: 'Sarah User', email: 'user@salessphere.com', role: 'User', subscription: 'Free' }
      ];
    } else if (table.name === 'tickets') {
      seed['tickets'] = [
        { id: 't-1', title: 'Payment checkout failed', description: 'Getting 402 error on plan purchase.', priority: 'Critical', status: 'Open', created_by: 'alice@google.com', assigned_to: 'Agent Mark', created_at: '2026-06-01' },
        { id: 't-2', title: 'Need to add email notifications', description: 'Requesting webhook alerts on lead assign.', priority: 'Medium', status: 'In_Progress', created_by: 'bob@stripe.com', assigned_to: '', created_at: '2026-06-03' }
      ];
    } else if (table.name === 'items') {
      seed['items'] = [
        { id: 'it-1', title: 'API Client Credentials', content: 'client_id: foo_bar_992, secret: my-top-secret', category: 'Credentials', created_at: '2026-06-02' },
        { id: 'it-2', title: 'Next Steps Checklist', content: 'Add unit tests, configure Vercel deployment, update Loom video link.', category: 'Task', created_at: '2026-06-05' }
      ];
    } else {
      // Create empty table
      seed[table.name] = [];
    }
  });

  return seed;
}

export function AppRuntime({ schema }: AppRuntimeProps) {
  // 1. Mock DB state
  const [db, setDb] = useState<Record<string, any[]>>(() => generateSeedData(schema.dbSchema.tables));
  
  // Re-seed DB when schema name changes
  useEffect(() => {
    setDb(generateSeedData(schema.dbSchema.tables));
    setCurrentUser(schema.authSchema.roles.includes('Admin') ? 'Admin' : schema.authSchema.roles[0] || 'User');
    setSubscription('Free');
    setLogs([]);
  }, [schema]);

  // 2. Active Session context
  const [currentUser, setCurrentUser] = useState<string>(
    schema.authSchema.roles.includes('Admin') ? 'Admin' : schema.authSchema.roles[0] || 'User'
  );
  const [subscription, setSubscription] = useState<string>('Free');
  const [activeRoute, setActiveRoute] = useState<string>(
    schema.uiSchema.pages[0]?.route || '/dashboard'
  );

  // Form submission state
  const [formInputs, setFormInputs] = useState<Record<string, Record<string, any>>>({});
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [logs, setLogs] = useState<{ id: string; timestamp: string; type: 'api' | 'db' | 'auth'; message: string; status: 'info' | 'success' | 'warn' | 'error' }[]>([]);

  // Logging helper
  const addLog = (type: 'api' | 'db' | 'auth', message: string, status: 'info' | 'success' | 'warn' | 'error') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [
      { id: Math.random().toString(), timestamp: time, type, message, status },
      ...prev.slice(0, 49) // Keep last 50
    ]);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 3. Simulated API Gateway Router
  const handleAPIRequest = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<{ status: number; data?: any; error?: string }> => {
    addLog('api', `Incoming Request: ${method} ${path}`, 'info');

    // Find Endpoint
    const endpoint = schema.apiSchema.endpoints.find(ep => {
      if (ep.method !== method) return false;
      // Basic param matching: "/api/contacts/:id" matches "/api/contacts/3"
      const epParts = ep.path.split('/');
      const reqParts = path.split('/');
      if (epParts.length !== reqParts.length) return false;
      return epParts.every((part, idx) => part.startsWith(':') || part === reqParts[idx]);
    });

    if (!endpoint) {
      addLog('api', `Route Not Found: ${method} ${path}`, 'error');
      return { status: 404, error: 'Endpoint not found in API Schema' };
    }

    // Auth gate validation
    const hasRoleAccess = endpoint.roleAccess.includes(currentUser) || endpoint.roleAccess.includes('*');
    addLog('auth', `Access check for ${currentUser} on ${method} ${path} -> ${hasRoleAccess ? 'GRANTED' : 'DENIED'}`, hasRoleAccess ? 'success' : 'warn');
    
    if (!hasRoleAccess) {
      return { status: 403, error: `Unauthorized. Role '${currentUser}' lacks access privileges.` };
    }

    // Premium gate check
    if (endpoint.requiresPremium && subscription !== 'Premium') {
      addLog('auth', `Premium gate check on ${path} -> Subscription level: ${subscription} -> BLOCKED`, 'warn');
      return { status: 402, error: 'Premium subscription required. Upgrade in Billing tab.' };
    }

    // Execute database operations simulated
    let resultData: any = null;

    for (const op of endpoint.dbOperations) {
      addLog('db', `Executing operation: ${op.action.toUpperCase()} on table '${op.table}'`, 'info');
      const tableData = db[op.table] || [];

      if (op.action === 'select') {
        resultData = tableData;
        addLog('db', `Fetched ${tableData.length} records from '${op.table}'`, 'success');
      } else if (op.action === 'insert') {
        const newRecord = {
          id: Math.random().toString().substring(2, 9),
          created_at: new Date().toISOString().split('T')[0],
          ...body
        };
        // Auto convert deal_value to number
        if (newRecord.deal_value !== undefined) {
          newRecord.deal_value = parseFloat(newRecord.deal_value) || 0;
        }

        // Apply DB validation checks
        const tableSchema = schema.dbSchema.tables.find(t => t.name === op.table);
        let valid = true;
        if (tableSchema) {
          for (const field of tableSchema.fields) {
            if (field.required && !field.primaryKey && (newRecord[field.name] === undefined || newRecord[field.name] === '')) {
              addLog('db', `Validation error: field '${field.name}' is required in table '${op.table}'`, 'error');
              valid = false;
              break;
            }
          }
        }

        if (!valid) {
          return { status: 400, error: 'Database integrity check failed: missing required fields.' };
        }

        setDb(prev => ({
          ...prev,
          [op.table]: [...prev[op.table], newRecord]
        }));
        resultData = newRecord;
        addLog('db', `Inserted record into '${op.table}' with ID ${newRecord.id}`, 'success');

        // Handle specific business logic (e.g. Subscribe Payment triggers premium user status)
        if (op.table === 'payments' && path === '/api/payments/subscribe') {
          setSubscription('Premium');
          addLog('auth', `Subscription status upgraded to Premium. Gated components unlocked.`, 'success');
        }
      } else if (op.action === 'delete') {
        // Parse ID from path
        const reqParts = path.split('/');
        const idToDelete = reqParts[reqParts.length - 1];
        setDb(prev => ({
          ...prev,
          [op.table]: prev[op.table].filter(row => row.id !== idToDelete)
        }));
        addLog('db', `Deleted record ID ${idToDelete} from '${op.table}'`, 'success');
        resultData = { success: true };
      } else if (op.action === 'update') {
        const reqParts = path.split('/');
        const idToUpdate = reqParts[reqParts.length - 1];
        
        setDb(prev => ({
          ...prev,
          [op.table]: prev[op.table].map(row => row.id === idToUpdate ? { ...row, ...body } : row)
        }));
        addLog('db', `Updated record ID ${idToUpdate} on table '${op.table}'`, 'success');
        resultData = { success: true };
      }
    }

    return { status: 200, data: resultData };
  };

  // Fetch UI data for page rendering
  const activePage = useMemo(() => {
    return schema.uiSchema.pages.find(p => p.route === activeRoute) || schema.uiSchema.pages[0];
  }, [schema, activeRoute]);

  // Check navigation roles
  const visibleNavItems = useMemo(() => {
    return schema.uiSchema.navigation.items.filter(item => {
      return item.roleAccess.includes(currentUser) || item.roleAccess.includes('*');
    });
  }, [schema, currentUser]);

  // Aggregate stats using local database calculations
  const calculateFormulaValue = (formula: string) => {
    try {
      const match = formula.match(/(\w+)\((\w+)\)/);
      if (!match) return 0;
      const [_, func, table] = match;
      const records = db[table] || [];

      if (func === 'count') return records.length;
      if (func === 'sum') {
        // Sum deal_value
        return records.reduce((acc, row) => acc + (row.deal_value || 0), 0);
      }
      if (func === 'avg') {
        if (records.length === 0) return 0;
        const sum = records.reduce((acc, row) => acc + (row.deal_value || 0), 0);
        return Math.round(sum / records.length);
      }
      return 0;
    } catch {
      return 0;
    }
  };

  // Dynamic Icon component retriever
  const renderIcon = (name: string, className = "w-5 h-5") => {
    const IconComp = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComp className={className} />;
  };

  return (
    <div className="flex flex-col h-[700px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      
      {/* Toast Notification HUD */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 animate-slide-in pointer-events-auto ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/90 border-rose-500 text-rose-300'
            }`}
          >
            {t.type === 'success' ? <Icons.CheckCircle2 className="w-4 h-4" /> : <Icons.AlertCircle className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* TOP META BAR (Switch Roles & Upgrade) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Executable Preview Runtime</span>
          <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-indigo-400 border border-slate-700 font-mono">
            {schema.appName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Role selector panel */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Session Role:</span>
            <select
              value={currentUser}
              onChange={(e) => {
                setCurrentUser(e.target.value);
                addLog('auth', `Switched active session user to role: ${e.target.value}`, 'info');
              }}
              className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {schema.authSchema.roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Premium Badge status */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <span className="text-xs text-slate-400 font-medium">Plan:</span>
            <span className={`text-[10px] px-2 py-0.5 font-bold rounded uppercase tracking-wider ${
              subscription === 'Premium' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'bg-slate-800 text-slate-300'
            }`}>
              {subscription}
            </span>
            {subscription === 'Free' && (
              <button
                onClick={() => {
                  setSubscription('Premium');
                  addLog('auth', `Manual override: account subscription set to Premium.`, 'success');
                  showToast('Developer Override: Premium Unlocked!', 'success');
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                Unlock Premium
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="px-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
                {schema.appName.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200 leading-none">{schema.appName}</h3>
                <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]">{schema.appDescription}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {visibleNavItems.map(item => {
                const isActive = activeRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => {
                      setActiveRoute(item.route);
                      addLog('api', `Navigation redirect to: ${item.route}`, 'info');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    {renderIcon(item.icon, "w-4 h-4")}
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Role Access Control
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Current view limited to: <strong>{activePage?.roleAccess.join(', ')}</strong>. Access rule: verified.
            </p>
          </div>
        </aside>

        {/* MAIN PREVIEW PAGE SCROLLABLE */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-8 space-y-6">
          
          {/* Role validation gate guard */}
          {(!activePage || (!activePage.roleAccess.includes(currentUser) && !activePage.roleAccess.includes('*'))) ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <Icons.Lock className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-200">Gated Resource Blocked</h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Your role <strong>{currentUser}</strong> does not have access permissions for page route <strong>{activeRoute}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* PAGE HEADER */}
              <div className="border-b border-slate-900 pb-4">
                <h1 className="text-xl font-bold text-slate-100">{activePage.title}</h1>
                <p className="text-xs text-slate-400 mt-1">{activePage.description}</p>
              </div>

              {/* DYNAMIC COMPONENT GRID */}
              <div className="grid grid-cols-12 gap-6">
                {activePage.components.map(comp => {
                  // Check if component itself is premium-gated
                  const isPremiumGated = schema.authSchema.pricingPlans.some(p => p.gatedFeatures.includes(comp.id));
                  const showGatedPlaceholder = isPremiumGated && subscription !== 'Premium';

                  const colSpan = comp.width === 'full' ? 'col-span-12' : comp.width === 'half' ? 'col-span-6' : 'col-span-4';

                  if (showGatedPlaceholder) {
                    return (
                      <div key={comp.id} className={`${colSpan} bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]`}>
                        <Icons.Gem className="w-8 h-8 text-amber-500 mb-2" />
                        <h4 className="text-sm font-semibold text-slate-300">Premium Upgrade Required</h4>
                        <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                          Component <strong>{comp.title}</strong> is gated in the {schema.authSchema.pricingPlans[1]?.name || 'Premium'} plan.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={comp.id}
                      className={`${colSpan} bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col`}
                    >
                      {/* Component Header */}
                      <div className="border-b border-slate-800 px-4 py-3 bg-slate-900/50 flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-200 tracking-wide">{comp.title}</h4>
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md font-mono border border-slate-700/50">
                          {comp.type}
                        </span>
                      </div>

                      {/* Component Content Renderer */}
                      <div className="p-4 flex-1">
                        {comp.type === 'stats' && comp.config.statsItems && (
                          <div className="grid grid-cols-3 gap-4">
                            {comp.config.statsItems.map((s, idx) => (
                              <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                  {renderIcon(s.icon, "w-5 h-5")}
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider leading-tight">
                                    {s.label}
                                  </span>
                                  <span className="text-lg font-bold text-slate-200">
                                    {s.valueFormula.includes('sum') || s.valueFormula.includes('avg') ? '$' : ''}
                                    {calculateFormulaValue(s.valueFormula).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {comp.type === 'table' && comp.config.dataSourceEndpoint && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-850 text-slate-400 font-medium bg-slate-950/20">
                                  {comp.config.columns?.map(col => (
                                    <th key={col.key} className="p-2.5 font-medium">{col.label}</th>
                                  ))}
                                  {currentUser === 'Admin' && <th className="p-2.5 text-right">Actions</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {(db[comp.config.dataSourceEndpoint.split(' ')[1].replace('/api/', '')] || []).length === 0 ? (
                                  <tr>
                                    <td colSpan={100} className="p-8 text-center text-slate-500">No records found.</td>
                                  </tr>
                                ) : (
                                  (db[comp.config.dataSourceEndpoint.split(' ')[1].replace('/api/', '')] || []).map((row, rIdx) => (
                                    <tr key={row.id || rIdx} className="border-b border-slate-850 hover:bg-slate-850/20 transition-colors">
                                      {comp.config.columns?.map(col => {
                                        const val = row[col.key];
                                        return (
                                          <td key={col.key} className="p-2.5 font-medium text-slate-300">
                                            {col.type === 'currency' && `$${Number(val).toLocaleString()}`}
                                            {col.type === 'badge' && (
                                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                val === 'Lead' || val === 'Open' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                                                val === 'Customer' || val === 'Resolved' || val === 'Succeeded' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                                val === 'Lost' || val === 'Failed' || val === 'Critical' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                                'bg-slate-800 text-slate-400 border border-slate-700'
                                              }`}>
                                                {val}
                                              </span>
                                            )}
                                            {col.type !== 'currency' && col.type !== 'badge' && String(val || '')}
                                          </td>
                                        );
                                      })}
                                      {currentUser === 'Admin' && (
                                        <td className="p-2.5 text-right">
                                          <button
                                            onClick={async () => {
                                              const table = comp.config.dataSourceEndpoint!.split(' ')[1].replace('/api/', '');
                                              const res = await handleAPIRequest('DELETE', `/api/${table}/${row.id}`);
                                              if (res.status === 200) {
                                                showToast('Item deleted from database', 'success');
                                              } else {
                                                showToast(res.error || 'Failed to delete', 'error');
                                              }
                                            }}
                                            className="text-rose-400 hover:text-rose-300 transition-colors"
                                            title="Delete Record"
                                          >
                                            <Icons.Trash2 className="w-3.5 h-3.5 inline-block" />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {comp.type === 'form' && comp.config.fields && (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const inputs = formInputs[comp.id] || {};
                              const action = comp.config.action;
                              
                              if (action?.type === 'api_submit' && action.apiEndpoint) {
                                const [method, path] = action.apiEndpoint.split(' ');
                                const res = await handleAPIRequest(
                                  method as any,
                                  path,
                                  inputs
                                );
                                
                                if (res.status === 200 || res.status === 201) {
                                  showToast(action.successMessage || 'Form submitted successfully!', 'success');
                                  // Clear input fields
                                  setFormInputs(prev => ({ ...prev, [comp.id]: {} }));
                                } else {
                                  showToast(res.error || 'API Error occurred', 'error');
                                }
                              }
                            }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              {comp.config.fields.map(f => (
                                <div key={f.name} className={`${f.type === 'textarea' ? 'col-span-2' : 'col-span-1'} space-y-1`}>
                                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                    {f.label} {f.required && <span className="text-rose-500">*</span>}
                                  </label>
                                  
                                  {f.type === 'select' ? (
                                    <select
                                      required={f.required}
                                      value={formInputs[comp.id]?.[f.name] || ''}
                                      onChange={(e) => setFormInputs(prev => ({
                                        ...prev,
                                        [comp.id]: { ...(prev[comp.id] || {}), [f.name]: e.target.value }
                                      }))}
                                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                      <option value="">-- Choose option --</option>
                                      {f.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={f.type}
                                      required={f.required}
                                      placeholder={f.placeholder}
                                      value={formInputs[comp.id]?.[f.name] || ''}
                                      onChange={(e) => setFormInputs(prev => ({
                                        ...prev,
                                        [comp.id]: { ...(prev[comp.id] || {}), [f.name]: e.target.value }
                                      }))}
                                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Submit {comp.title.includes('Contact') ? 'Contact' : comp.title.includes('Ticket') ? 'Ticket' : 'Form'}
                            </button>
                          </form>
                        )}

                        {comp.type === 'chart' && comp.config.dataSourceEndpoint && (
                          <div className="h-44 flex flex-col justify-end">
                            <div className="flex items-end gap-3 justify-center h-36 px-4">
                              {(db[comp.config.dataSourceEndpoint.split(' ')[1].replace('/api/', '')] || []).map((row, rIdx) => {
                                // Draw simple visual bar representing deal value
                                const val = Number(row.deal_value || 10000);
                                const maxVal = 50000;
                                const heightPercent = Math.min(100, Math.max(10, (val / maxVal) * 100));

                                return (
                                  <div key={rIdx} className="flex flex-col items-center gap-1 group flex-1">
                                    <div className="w-full bg-slate-800/80 rounded-t-md group-hover:bg-indigo-600/30 transition-all duration-300 relative flex items-end h-full">
                                      <div
                                        style={{ height: `${heightPercent}%` }}
                                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md relative shadow-lg shadow-indigo-600/10 group-hover:shadow-indigo-600/30 transition-all duration-300"
                                      >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[9px] text-slate-300 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                          ${val.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-medium truncate max-w-[50px]">{row.name || row.title}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="border-t border-slate-800/80 mt-2 pt-1.5 flex justify-between text-[8px] text-slate-500 font-semibold px-4 uppercase tracking-wider">
                              <span>X-Axis: {comp.config.xAxisKey || 'Entities'}</span>
                              <span>Y-Axis: {comp.config.yAxisKey || 'Value'}</span>
                            </div>
                          </div>
                        )}

                        {comp.type === 'banner' && (
                          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-5 flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                              <Icons.ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-indigo-300">Audited Enterprise Security Level</h5>
                              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                                Fully isolated tenant keys verified. Sub-module logs are encrypted with AES-256 GCM.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* FOOTER LIVE LOGS & DB MONITOR (Execution Proof) */}
      <footer className="h-48 bg-slate-900 border-t border-slate-800 grid grid-cols-2 divide-x divide-slate-800 overflow-hidden">
        
        {/* NETWORK & AUTH LOGS STREAM */}
        <div className="flex flex-col h-full overflow-hidden p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Activity className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Simulated Network & Gate Logs</h4>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-2">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic p-2">Waiting for interaction logs... Click buttons, submit forms, or switch roles to trigger events.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-2 leading-relaxed">
                  <span className="text-slate-500 whitespace-nowrap">[{log.timestamp}]</span>
                  <span className={`font-semibold uppercase whitespace-nowrap ${
                    log.type === 'api' ? 'text-blue-400' : log.type === 'db' ? 'text-amber-400' : 'text-purple-400'
                  }`}>
                    [{log.type}]
                  </span>
                  <span className={`flex-1 ${
                    log.status === 'success' ? 'text-emerald-400 font-semibold' :
                    log.status === 'warn' ? 'text-amber-500 font-medium' :
                    log.status === 'error' ? 'text-rose-500 font-bold' :
                    'text-slate-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LIVE DATABASE TABLE VIEWER */}
        <div className="flex flex-col h-full overflow-hidden p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icons.Database className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Live Mock Database Tables</h4>
            </div>
            
            <div className="flex gap-1.5 text-[9px] font-mono text-slate-400">
              {schema.dbSchema.tables.map(t => (
                <span key={t.name} className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                  {t.name} ({db[t.name]?.length || 0})
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-400 scrollbar-thin scrollbar-thumb-slate-800">
            <div className="space-y-3">
              {schema.dbSchema.tables.map(table => (
                <div key={table.name} className="border border-slate-850 rounded bg-slate-950/40 p-2 space-y-1">
                  <div className="flex justify-between text-[10px] border-b border-slate-850 pb-1 text-slate-300">
                    <span className="font-semibold text-indigo-300">TABLE: {table.name}</span>
                    <span className="text-slate-500 italic">{table.description}</span>
                  </div>
                  
                  {(!db[table.name] || db[table.name].length === 0) ? (
                    <div className="text-slate-600 italic py-1">Table is empty.</div>
                  ) : (
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {db[table.name].map((row, rIdx) => (
                        <div key={row.id || rIdx} className="hover:bg-slate-900 px-1 py-0.5 rounded transition-colors truncate">
                          {JSON.stringify(row)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
}
