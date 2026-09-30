// ==============================================================================
// Audit Workflow Engine & Data Resolver
// Johnson & Johnson Internal Audit Reporting (IAR)
// ==============================================================================

import assessmentsData from '../data/assessments.json';
import engagementsData from '../data/engagements.json';
import issuesData from '../data/issues.json';
import assignmentsData from '../data/assignments.json';
import testProceduresData from '../data/testProcedures.json';
import usersData from '../data/users.json';
import rolesData from '../data/roles.json';

export const assessments = assessmentsData;
export const engagements = engagementsData;
export const issues = issuesData;
export const assignments = assignmentsData;
export const testProcedures = testProceduresData;
export const users = usersData;
export const roles = rolesData;

export const userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));
export const roleMap = Object.fromEntries(roles.map((r: any) => [r.id, r]));
export const assessmentMap = Object.fromEntries(assessments.map((a: any) => [a.id, a]));

export const engagementAssignments: Record<string, any[]> = {};
assignments.forEach((asg: any) => {
  if (asg.engagementId) {
    if (!engagementAssignments[asg.engagementId]) {
      engagementAssignments[asg.engagementId] = [];
    }
    engagementAssignments[asg.engagementId].push(asg);
  }
  if (asg.jobId && asg.jobId !== asg.engagementId) {
    if (!engagementAssignments[asg.jobId]) {
      engagementAssignments[asg.jobId] = [];
    }
    engagementAssignments[asg.jobId].push(asg);
  }
});

export const getAssignmentsByEngagement = (engagementIdOrJobId: string): any[] => {
  if (!engagementIdOrJobId) return engagementAssignments['REP-2026-001'] || [];
  return engagementAssignments[engagementIdOrJobId] || [];
};

export const getIssuesByEngagement = (engagementIdOrJobId: string): any[] => {
  if (!engagementIdOrJobId) return [];
  return issues.filter((iss: any) =>
    iss.engagementId === engagementIdOrJobId || iss.jobId === engagementIdOrJobId
  );
};

export const getTestProceduresByEngagement = (engagementIdOrJobId: string): any[] => {
  if (!engagementIdOrJobId) return [];
  return testProcedures.filter((tp: any) =>
    tp.engagementId === engagementIdOrJobId || tp.jobId === engagementIdOrJobId
  );
};

export const getUsersByEngagementAndRole = (engagementIdOrJobId: string, roleId: string): any[] => {
  const asgs = getAssignmentsByEngagement(engagementIdOrJobId);
  const found = asgs.find((a: any) => a.roleId === roleId);
  if (found && found.users) return found.users;
  return [];
};

export const ENGAGEMENT_STATUS = {
  NOT_STARTED: 'Not Started',
  AUDIT_IN_PROGRESS: 'Audit Report Inprogress',
  EXEC_IN_PROGRESS: 'Executive Report Inprogress',
  COMPLETED: 'Completed'
} as const;

export const formatUSDateTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return '';
  const cleanStr = dateTimeStr.replace(' ', 'T');
  const dateObj = new Date(cleanStr);
  if (isNaN(dateObj.getTime())) return dateTimeStr;

  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${formattedDate}, ${formattedTime}`;
};

export const getEngagementWorkflowState = (job: any) => {
  if (!job) {
    return {
      status: ENGAGEMENT_STATUS.NOT_STARTED,
      queue: 'Staff',
      queueList: ['Staff'],
      queueVariant: 'staff',
      owners: ['Unassigned'],
      ownerText: 'Unassigned',
      ownersByRole: { Staff: ['Unassigned'] } as Record<string, string[]>,
      isPendingBusiness: false,
      issuesCount: 0
    };
  }

  const jobId = job.jobId || job.id;
  const engIssues = (job.issuesList && job.issuesList.length > 0)
    ? job.issuesList
    : getIssuesByEngagement(jobId);

  // 1. Resolve Engagement Status
  let status: string = ENGAGEMENT_STATUS.NOT_STARTED;
  const rawStatus = (job.status || '').toLowerCase();
  const rawSubStatus = (job.subStatus || '').toLowerCase();

  if (
    rawStatus === 'completed' ||
    rawSubStatus.includes('executive report completed') ||
    job.assessmentStatus === 'Closed'
  ) {
    status = ENGAGEMENT_STATUS.COMPLETED;
  } else if (
    rawStatus.includes('executive report') ||
    rawSubStatus.includes('executive report')
  ) {
    status = ENGAGEMENT_STATUS.EXEC_IN_PROGRESS;
  } else if (engIssues.length > 0 || rawStatus === 'in progress' || rawStatus.includes('audit report') || rawStatus === 'in review') {
    status = ENGAGEMENT_STATUS.AUDIT_IN_PROGRESS;
  } else {
    status = ENGAGEMENT_STATUS.NOT_STARTED;
  }

  // 2. Resolve Role Assignments for this Engagement
  const staffUsers = getUsersByEngagementAndRole(jobId, 'it-auditor')
    .concat(getUsersByEngagementAndRole(jobId, 'finops-auditor'));
  const tcUsers = getUsersByEngagementAndRole(jobId, 'it-team-coordinator')
    .concat(getUsersByEngagementAndRole(jobId, 'finops-team-coordinator'));
  const mgrUsers = getUsersByEngagementAndRole(jobId, 'it-manager')
    .concat(getUsersByEngagementAndRole(jobId, 'finops-manager'));
  const dirUsers = getUsersByEngagementAndRole(jobId, 'it-director')
    .concat(getUsersByEngagementAndRole(jobId, 'finops-director'));
  const vpUsers = getUsersByEngagementAndRole(jobId, 'it-vp')
    .concat(getUsersByEngagementAndRole(jobId, 'finops-vp'));
  const bizUsers = getUsersByEngagementAndRole(jobId, 'business-contact');

  const defaultStaff = staffUsers.length > 0 ? staffUsers.map((u: any) => u.name) : ['Marcus Vance'];
  const defaultTC = tcUsers.length > 0 ? tcUsers.map((u: any) => u.name) : ['Kevin Zhang'];
  const defaultMgr = mgrUsers.length > 0 ? mgrUsers.map((u: any) => u.name) : ['Amanda Palmer'];
  const defaultDir = dirUsers.length > 0 ? dirUsers.map((u: any) => u.name) : ['Brian Cox'];
  const defaultVP = vpUsers.length > 0 ? vpUsers.map((u: any) => u.name) : ['Robert Chen'];
  const defaultBiz = bizUsers.length > 0 ? bizUsers.map((u: any) => u.name) : [job.leadOwner || 'Thomas Wright'];

  // Rule A: Completed -> Closed / Finalized
  if (status === ENGAGEMENT_STATUS.COMPLETED) {
    return {
      status,
      queue: 'Closed',
      queueList: ['Closed'],
      queueVariant: 'completed',
      owners: ['QA Archive'],
      ownerText: 'QA Archive',
      ownersByRole: { Closed: ['QA Archive'] },
      isPendingBusiness: false,
      issuesCount: engIssues.length
    };
  }

  // Rule B: Not Started -> Staff
  if (status === ENGAGEMENT_STATUS.NOT_STARTED || engIssues.length === 0) {
    return {
      status: ENGAGEMENT_STATUS.NOT_STARTED,
      queue: 'Staff',
      queueList: ['Staff'],
      queueVariant: 'staff',
      owners: defaultStaff,
      ownerText: defaultStaff.join(', '),
      ownersByRole: { Staff: defaultStaff },
      isPendingBusiness: false,
      issuesCount: 0
    };
  }

  // Rule C: Report-Level Executive Review Gates (VP & Director)
  const isAllVP = engIssues.length > 0 && engIssues.every((iss: any) => (iss.status || '').toLowerCase().includes('vp'));
  if (isAllVP) {
    return {
      status,
      queue: 'Vice President',
      queueList: ['Vice President'],
      queueVariant: 'vp',
      owners: defaultVP,
      ownerText: defaultVP.join(', '),
      ownersByRole: { 'Vice President': defaultVP },
      isPendingBusiness: false,
      issuesCount: engIssues.length
    };
  }

  const isAllDirector = engIssues.length > 0 && engIssues.every((iss: any) => {
    const s = (iss.status || '').toLowerCase();
    return s.includes('pending director') || s.includes('ready for director') || (s.includes('director') && !s.includes('ready'));
  });
  if (isAllDirector) {
    return {
      status,
      queue: 'Director',
      queueList: ['Director'],
      queueVariant: 'director',
      owners: defaultDir,
      ownerText: defaultDir.join(', '),
      ownersByRole: { Director: defaultDir },
      isPendingBusiness: false,
      issuesCount: engIssues.length
    };
  }

  // Rule E: Pre-Director Distributed Issue Workflow
  const ROLE_ORDER = ['Staff', 'Team Coordinator', 'Manager', 'Business Contact'];
  const activeRolesSet = new Set<string>();
  const bizContactNames: string[] = [];

  engIssues.forEach((iss: any) => {
    const s = ((iss.status || '') + ' ' + (iss.currentLevel || '')).toLowerCase();
    if (s === 'completed' || s.includes('waiting other') || s.includes('waiting on other')) {
      return;
    }
    if (s.includes('business') || s.includes('auditee')) {
      activeRolesSet.add('Business Contact');
      const contact = iss.accountableContact || iss.primaryContact;
      if (contact) bizContactNames.push(contact);
    } else if (s.includes('manager') || s.includes('mgr')) {
      activeRolesSet.add('Manager');
    } else if (s.includes('tc') || s.includes('team coordinator') || s.includes('coordinator')) {
      activeRolesSet.add('Team Coordinator');
    } else {
      activeRolesSet.add('Staff');
    }
  });

  if (activeRolesSet.size === 0) {
    activeRolesSet.add('Manager');
  }

  const queueList = ROLE_ORDER.filter(role => activeRolesSet.has(role));
  const queueText = queueList.join(', ');

  const resolvedOwners: string[] = [];
  const ownersByRole: Record<string, string[]> = {};

  queueList.forEach(role => {
    let roleOwners: string[] = [];
    if (role === 'Staff') roleOwners = defaultStaff;
    else if (role === 'Team Coordinator') roleOwners = defaultTC;
    else if (role === 'Manager') roleOwners = defaultMgr;
    else if (role === 'Business Contact') {
      roleOwners = bizContactNames.length > 0 ? Array.from(new Set(bizContactNames)) : defaultBiz;
    }

    ownersByRole[role] = roleOwners;
    roleOwners.forEach(name => {
      if (!resolvedOwners.includes(name)) {
        resolvedOwners.push(name);
      }
    });
  });

  const queueVariant = queueList.length === 1 ? queueList[0].toLowerCase().replace(' ', '-') : 'multi-role';

  return {
    status,
    queue: queueText,
    queueList,
    queueVariant,
    owners: resolvedOwners,
    ownerText: resolvedOwners.join(', '),
    ownersByRole,
    isPendingBusiness: activeRolesSet.has('Business Contact'),
    issuesCount: engIssues.length
  };
};

export const getRoleDetails = (roleId?: string) => {
  const rLower = (roleId || '').toLowerCase();
  const isIT = rLower.includes('it-') || rLower.startsWith('it');
  const isFinOps = rLower.includes('finops');
  const domain = isIT ? 'IT' : isFinOps ? 'FinOps' : 'All';

  let baseRole = 'manager';
  if (rLower.includes('auditor')) baseRole = 'auditor';
  else if (rLower.includes('coordinator') || rLower.includes('team-coordinator') || rLower.includes('tc')) baseRole = 'team-coordinator';
  else if (rLower.includes('manager')) baseRole = 'manager';
  else if (rLower.includes('director')) baseRole = 'director';
  else if (rLower.includes('vp')) baseRole = 'vp';
  else if (rLower.includes('business') || rLower.includes('contact')) baseRole = 'primary-business-contact';

  return { domain, baseRole };
};

export const isITIssue = (iss: any): boolean => {
  const tech = (iss.tech || '').toUpperCase();
  const func = (iss.functionType || iss.function || '').toUpperCase();
  const title = (iss.title || iss.header || '').toLowerCase();
  return (
    tech === 'IT' ||
    func === 'IT' ||
    title.includes('firmware') ||
    title.includes('software') ||
    title.includes('sox') ||
    title.includes('telemetry') ||
    title.includes('bluetooth') ||
    title.includes('robotics') ||
    title.includes('access') ||
    title.includes('network')
  );
};

export const isIssueNeedingUserAction = (iss: any, role?: string): boolean => {
  if (!iss) return false;
  const { domain, baseRole } = getRoleDetails(role);

  // Business role check: only issues pending with business
  if (
    baseRole === 'primary-business-contact' ||
    (role || '').toLowerCase().includes('business') ||
    (role || '').toLowerCase().includes('contact')
  ) {
    const statusLower = (iss.status || '').toLowerCase();
    const levelLower = (iss.currentLevel || '').toLowerCase();
    const targetRole = (iss.currentRoleTarget || '').toLowerCase();
    return statusLower.includes('business') || levelLower.includes('business') || targetRole.includes('business');
  }

  // Completed issues do not require action
  const statusLower = (iss.status || '').toLowerCase();
  const levelLower = (iss.currentLevel || '').toLowerCase();
  if (statusLower === 'completed' || (levelLower.includes('signed off') && baseRole !== 'vp')) {
    return false;
  }

  // Domain check (IT vs FinOps)
  const itIssue = isITIssue(iss);
  if (domain === 'IT' && !itIssue) return false;
  if (domain === 'FinOps' && itIssue) return false;

  // Role target check
  const targetRole = (iss.currentRoleTarget || '').toLowerCase();

  if (baseRole === 'auditor') {
    return (
      targetRole === 'auditor' ||
      levelLower.includes('auditor') ||
      levelLower.includes('draft') ||
      statusLower === 'drafting' ||
      statusLower === 'draft' ||
      statusLower === 'pending staff'
    );
  }

  if (baseRole === 'team-coordinator') {
    return (
      targetRole === 'team-coordinator' ||
      targetRole === 'tc' ||
      levelLower.includes('coordinator') ||
      levelLower.includes('tc') ||
      statusLower === 'in review' ||
      statusLower === 'tc review' ||
      statusLower === 'pending tc'
    );
  }

  if (baseRole === 'manager') {
    return (
      targetRole === 'manager' ||
      levelLower.includes('manager') ||
      statusLower.includes('manager review') ||
      statusLower.includes('pending sign-off') ||
      statusLower.includes('pending manager')
    );
  }

  if (baseRole === 'director') {
    return (
      targetRole === 'director' ||
      levelLower.includes('director') ||
      statusLower.includes('director') ||
      statusLower.includes('in executive review') ||
      statusLower.includes('pending director')
    );
  }

  if (baseRole === 'vp') {
    return (
      targetRole === 'vp' ||
      levelLower.includes('vp') ||
      statusLower.includes('vp review') ||
      statusLower.includes('pending executive') ||
      statusLower.includes('pending vp')
    );
  }

  return targetRole === baseRole;
};

export const isAuditNeedingAction = (job: any, role?: string): boolean => {
  if (!job) return false;
  const { baseRole } = getRoleDetails(role);
  if (baseRole === 'auditor' && (job.status || '').toLowerCase() === 'not started') {
    return true;
  }
  return (job.issuesList || []).some((iss: any) => isIssueNeedingUserAction(iss, role));
};

export const getIssueBreakdown = (job: any, userRole?: string, forMyActionsOnly: boolean = false) => {
  let issuesList: any[] = job.issuesList || [];
  const { baseRole } = getRoleDetails(userRole);
  const isBusinessRole = baseRole === 'primary-business-contact';

  if (isBusinessRole) {
    issuesList = issuesList.filter((iss: any) => (iss.status || '').toLowerCase().includes('business'));
  } else if (forMyActionsOnly) {
    issuesList = issuesList.filter((iss: any) => isIssueNeedingUserAction(iss, userRole));
  }

  const total = issuesList.length;
  const totalIT = issuesList.filter((iss: any) => isITIssue(iss)).length;
  const totalFin = total - totalIT;

  const inProgressList = issuesList.filter((iss: any) => iss.status !== 'Completed');
  const inProgress = inProgressList.length;
  const inProgressIT = inProgressList.filter((iss: any) => isITIssue(iss)).length;
  const inProgressFin = inProgress - inProgressIT;

  const completedList = issuesList.filter((iss: any) => iss.status === 'Completed');
  const completed = completedList.length;
  const completedIT = completedList.filter((iss: any) => isITIssue(iss)).length;
  const completedFin = completed - completedIT;

  return {
    total,
    totalIT,
    totalFin,
    inProgress,
    inProgressIT,
    inProgressFin,
    completed,
    completedIT,
    completedFin
  };
};

export const getPersonaAuditState = (job: any, role?: string) => {
  const issuesList: any[] = job.issuesList || [];
  const roleLower = (role || 'manager').toLowerCase();

  const pendingIssues = issuesList.filter((iss: any) => {
    if (roleLower.includes('business') || roleLower.includes('contact')) {
      return (
        (iss.status || '').toLowerCase().includes('business') ||
        (iss.currentLevel || '').toLowerCase().includes('business') ||
        (iss.currentRoleTarget || '').toLowerCase().includes('business')
      );
    }
    if (roleLower.includes('auditor')) return iss.currentRoleTarget === 'auditor' || iss.status === 'Drafting' || iss.status === 'Pending Staff';
    if (roleLower.includes('coordinator') || roleLower.includes('tc')) return iss.currentRoleTarget === 'team-coordinator' || iss.status === 'In Review' || iss.status === 'Pending TC';
    if (roleLower.includes('manager')) return iss.currentRoleTarget === 'manager' || iss.status === 'Manager Review' || iss.status === 'Pending Manager';
    if (roleLower.includes('director')) return iss.currentRoleTarget === 'director' || iss.status === 'Director Sign-Off' || iss.status === 'Pending Director';
    if (roleLower.includes('vp')) return iss.currentRoleTarget === 'vp' || iss.status === 'VP Review' || iss.status === 'Pending VP';
    return iss.currentRoleTarget === roleLower;
  });

  const myContributions = issuesList.filter((iss: any) => {
    if (roleLower.includes('auditor')) {
      return iss.createdRole === 'auditor' || (iss.createdBy && (iss.createdBy.includes('Rachel') || iss.createdBy.includes('Carlos') || iss.createdBy.includes('Marcus')));
    }
    return true;
  });

  const isPendingWithMe = pendingIssues.length > 0 || (roleLower.includes('auditor') && job.status === 'Not Started');
  const isMyContribution = myContributions.length > 0;

  return {
    isPendingWithMe,
    pendingCount: pendingIssues.length || (roleLower.includes('auditor') && job.status === 'Not Started' ? 1 : 0),
    isMyContribution,
    pendingIssues,
    myContributions
  };
};

export const getCategoryFilteredIssues = (job: any, categoryTabKey: string, userRole?: string, onlyMyActions: boolean = false) => {
  let issuesList: any[] = job.issuesList || [];
  const { baseRole } = getRoleDetails(userRole);
  const isBusinessRole = baseRole === 'primary-business-contact';

  if (isBusinessRole) {
    return issuesList.filter((iss: any) => (iss.status || '').toLowerCase().includes('business'));
  }
  if (onlyMyActions) {
    issuesList = issuesList.filter((iss: any) => isIssueNeedingUserAction(iss, userRole));
  }
  if (categoryTabKey === 'it') {
    return issuesList.filter((iss: any) => isITIssue(iss));
  }
  if (categoryTabKey === 'finops') {
    return issuesList.filter((iss: any) => !isITIssue(iss));
  }
  if (categoryTabKey === 'completed') {
    return issuesList.filter((iss: any) => iss.status === 'Completed' || (iss.currentLevel || '').toLowerCase().includes('completed') || (iss.currentLevel || '').toLowerCase().includes('signed off'));
  }
  return issuesList;
};

export const ROLE_STAGES = [
  { id: 'Auditor Drafting', label: 'Auditor Drafting', role: 'Auditor', color: '#1E293B', bg: '#F1F5F9' },
  { id: 'Manager Review', label: 'Manager Review', role: 'Manager', color: '#D97706', bg: '#FEF3C7' },
  { id: 'Director Review', label: 'Director Review', role: 'Director', color: '#7C3AED', bg: '#F3E8FF' },
  { id: 'VP Sign-Off', label: 'VP Sign-Off', role: 'VP', color: '#059669', bg: '#ECFDF5' }
];

export const getAvailableNextStages = (currentLevel?: string) => {
  const levelStr = (currentLevel || '').toLowerCase();
  const curIdx = ROLE_STAGES.findIndex(stg =>
    levelStr.includes(stg.id.toLowerCase()) ||
    levelStr.includes(stg.role.toLowerCase())
  );
  if (curIdx === -1) {
    if (levelStr.includes('tc')) return ROLE_STAGES.slice(1);
    return ROLE_STAGES.slice(1);
  }
  return ROLE_STAGES.slice(curIdx + 1);
};

export const getInitialReportingJobs = (): any[] => {
  return engagements.map((eng: any) => {
    const engId = eng.id || eng.jobId;
    const issuesList = getIssuesByEngagement(engId);
    const testProceduresList = getTestProceduresByEngagement(engId);
    const asgs = getAssignmentsByEngagement(engId);
    const wf = getEngagementWorkflowState({ ...eng, issuesList });

    let status = eng.status || 'Not Started';
    let subStatus = eng.subStatus || (status === 'Not Started' ? 'Not Started' : 'Audit Report In Progress');
    if (wf.status === ENGAGEMENT_STATUS.NOT_STARTED) {
      status = 'Not Started';
      subStatus = 'Not Started';
    } else if (wf.status === ENGAGEMENT_STATUS.COMPLETED) {
      status = 'Completed';
      subStatus = 'Executive Report Completed';
    } else if (wf.status === ENGAGEMENT_STATUS.EXEC_IN_PROGRESS) {
      status = 'In Progress';
      subStatus = 'Executive Report In Progress';
    } else if (wf.status === ENGAGEMENT_STATUS.AUDIT_IN_PROGRESS) {
      status = 'In Progress';
      subStatus = 'Audit Report In Progress';
    }

    return {
      id: eng.id,
      jobId: eng.jobId,
      reportId: eng.id,
      fileName: eng.fileName || eng.engagementName || eng.title,
      engagement: eng.engagementName || eng.title,
      engagementName: eng.engagementName || eng.title,
      plant: eng.plant || eng.plantLocation || 'Global Operations',
      year: eng.year || 2026,
      assessmentId: eng.assessmentId || 'ASM-2026',
      assessmentName: eng.assessmentName || '2026 Internal Audit Assessments',
      assessmentStatus: eng.assessmentStatus || 'Open',
      leadOwner: eng.leadOwner || 'Amanda Palmer',
      businessContactId: eng.businessContactId || 'USR-013',
      status: status,
      subStatus: subStatus,
      workflowStatus: wf.status,
      executionStatus: eng.executionStatus || (status === 'Completed' ? 'Completed' : (status === 'Not Started' ? 'Pending' : 'Running')),
      currentQueue: wf.queue,
      currentQueueList: wf.queueList,
      currentOwner: wf.ownerText,
      currentOwners: wf.owners,
      ownersByRole: wf.ownersByRole,
      queueVariant: wf.queueVariant,
      aging: status === 'Not Started' ? '1 day 2.15 Hours' : (status === 'Completed' ? '11 days 4.00 Hours' : '3 days 5.20 Hours'),
      lastUpdated: status === 'Completed' ? '2026-07-31 16:20:00' : '2026-08-04 14:30:00',
      discussionPoints: {
        count: issuesList.length,
        status: status === 'Completed' ? 'Completed' : (issuesList.length > 0 ? 'Active' : 'Active'),
        startDateTime: '2026-08-01 08:30:00',
        endDateTime: '2026-08-04 14:30:00'
      },
      auditReport: {
        executionStatus: status === 'Completed' ? 'Completed' : (status === 'Not Started' ? 'Pending' : 'Running'),
        validationStatus: status === 'Completed' ? 'Approved' : (status === 'Not Started' ? 'Not Started' : 'In Progress'),
        genAiExtractionDateTime: '2026-08-01 09:00:00',
        validationStartDateTime: '2026-08-01 10:00:00',
        validationEndDateTime: '2026-08-04 14:00:00'
      },
      executiveSummaryReport: {
        executionStatus: status === 'Completed' ? 'Completed' : 'Pending',
        validationStatus: status === 'Completed' ? 'Approved' : 'Not Started',
        genAiExtractionDateTime: '2026-08-01 09:30:00',
        validationStartDateTime: '2026-08-01 10:30:00',
        validationEndDateTime: '2026-08-04 14:15:00'
      },
      issuesList: issuesList,
      testProcedures: testProceduresList,
      roster: asgs.map((a: any) => ({
        role: a.roleName || a.roleId,
        name: a.users && a.users.length > 0 ? a.users.map((u: any) => u.name).join(', ') : 'Unassigned',
        avatar: a.users && a.users.length > 0 ? a.users[0].name.split(' ').map((n: string) => n[0]).join('') : 'U',
        status: (a.roleName || '').includes('Auditor') ? 'Assigned' : 'Reviewer'
      }))
    };
  });
};
