/* ============================================================
   AGENT JOB TRACKER
   Frontend JavaScript
   Google Sheets / Apps Script ready
   ============================================================ */

// Paste your deployed Google Apps Script Web App URL here.
// Example:
// const API_URL = 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec';

const API_URL = 'https://script.google.com/macros/s/AKfycbw1L6lTJqAaPA8YsWNhnv3-UkKmIDoMtTLVTfclGOGjKsalJDzjLsY68uEz1WYAodUw/exec';

let jobs = [];
let agents = [];
let taskTypes = [];
let sessions = [];

let currentFilter = {
    search: '',
    status: 'all',
    priority: 'all'
};

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    setupNavigation();
    setupFilters();
    setupModal();
    setupThemeToggle();
    setupRefreshButton();

    await loadAllData();
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadAllData() {
    try {
        showLoadingState();

        if (!API_URL || API_URL.includes('PASTE_YOUR')) {
            console.warn('Apps Script API URL has not been configured.');
            loadDemoData();
            renderAll();
            return;
        }

        const response = await fetch(`${API_URL}?action=getAll`, {
            method: 'GET',
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        jobs = Array.isArray(data.jobs) ? data.jobs : [];
        agents = Array.isArray(data.agents) ? data.agents : [];
        taskTypes = Array.isArray(data.taskTypes) ? data.taskTypes : [];
        sessions = Array.isArray(data.sessions) ? data.sessions : [];

        renderAll();

    } catch (error) {
        console.error('Unable to load Google Sheets data:', error);

        // Use demo data so the page remains usable while the backend
        // is being configured.
        loadDemoData();
        renderAll();

        showNotification(
            'Unable to connect to Google Sheets. Showing demo data.',
            'warning'
        );
    }
}

// ============================================================
// DEMO DATA
// ============================================================

function loadDemoData() {
    agents = [
        {
            agentId: 'A001',
            agentName: 'John Doe',
            active: true,
            currentJob: 'JOB-1024',
            status: 'Working'
        },
        {
            agentId: 'A002',
            agentName: 'Jane Smith',
            active: true,
            currentJob: 'JOB-1025',
            status: 'Working'
        },
        {
            agentId: 'A003',
            agentName: 'Mark Reyes',
            active: true,
            currentJob: '',
            status: 'Available'
        },
        {
            agentId: 'A004',
            agentName: 'Sarah Cruz',
            active: true,
            currentJob: 'JOB-1026',
            status: 'Working'
        }
    ];

    taskTypes = [
        {
            taskType: 'Identifying Poles and Lines',
            description: 'Identify utility poles and lines',
            active: true
        },
        {
            taskType: 'Encroachment',
            description: 'Identify vegetation or other encroachment',
            active: true
        }
    ];

    sessions = [
        {
            session: 'S1',
            sessionName: 'Session 1',
            active: true
        },
        {
            session: 'S2',
            sessionName: 'Session 2',
            active: true
        },
        {
            session: 'S3',
            sessionName: 'Session 3',
            active: true
        },
        {
            session: 'S4',
            sessionName: 'Session 4',
            active: true
        }
    ];

    jobs = [
        {
            jobId: 'JOB-1024',
            agentName: 'John Doe',
            jobName: 'Vegetation Survey - North',
            taskType: 'Identifying Poles and Lines',
            session: 'S3',
            slices: 24,
            priority: 'High',
            status: 'In Progress',
            startTimestamp: '2026-08-20T08:15:00'
        },
        {
            jobId: 'JOB-1025',
            agentName: 'Jane Smith',
            jobName: 'Line Clearance Review',
            taskType: 'Encroachment',
            session: 'S2',
            slices: 18,
            priority: 'Normal',
            status: 'Completed',
            startTimestamp: '2026-08-20T08:30:00',
            finishTimestamp: '2026-08-20T10:05:00'
        },
        {
            jobId: 'JOB-1026',
            agentName: 'Sarah Cruz',
            jobName: 'Pole Identification - East',
            taskType: 'Identifying Poles and Lines',
            session: 'S4',
            slices: 31,
            priority: 'High',
            status: 'In Progress',
            startTimestamp: '2026-08-20T09:00:00'
        }
    ];
}

// ============================================================
// RENDERING
// ============================================================

function renderAll() {
    renderDashboardStats();
    renderJobs();
    renderAgents();
    renderReports();
    populateFormOptions();
}

function renderDashboardStats() {
    const activeAgents = agents.filter(
        agent => String(agent.status).toLowerCase() === 'working'
    ).length;

    const inProgress = jobs.filter(
        job => normalizeStatus(job.status) === 'in progress'
    ).length;

    const completed = jobs.filter(
        job => normalizeStatus(job.status) === 'completed'
    ).length;

    const highPriority = jobs.filter(
        job => normalizePriority(job.priority) === 'high'
    ).length;

    const totalSlices = jobs.reduce(
        (sum, job) => sum + Number(job.slices || 0),
        0
    );

    setText('activeAgents', activeAgents);
    setText('inProgressJobs', inProgress);
    setText('completedJobs', completed);
    setText('highPriorityJobs', highPriority);
    setText('totalSlices', totalSlices.toLocaleString());
}

function renderJobs() {
    const tableBody = document.querySelector('#jobsTableBody');

    if (!tableBody) {
        return;
    }

    const filteredJobs = jobs.filter(job => {
        const search = currentFilter.search.toLowerCase();

        const matchesSearch =
            !search ||
            String(job.jobId || '').toLowerCase().includes(search) ||
            String(job.agentName || '').toLowerCase().includes(search) ||
            String(job.jobName || '').toLowerCase().includes(search) ||
            String(job.taskType || '').toLowerCase().includes(search);

        const matchesStatus =
            currentFilter.status === 'all' ||
            normalizeStatus(job.status) === normalizeStatus(currentFilter.status);

        const matchesPriority =
            currentFilter.priority === 'all' ||
            normalizePriority(job.priority) === normalizePriority(currentFilter.priority);

        return matchesSearch && matchesStatus && matchesPriority;
    });

    tableBody.innerHTML = '';

    if (filteredJobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    No jobs found.
                </td>
            </tr>
        `;
        return;
    }

    filteredJobs.forEach(job => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <strong>${escapeHtml(job.jobId || '—')}</strong>
            </td>

            <td>${escapeHtml(job.agentName || '—')}</td>

            <td>
                <div class="job-name">
                    ${escapeHtml(job.jobName || '—')}
                </div>
            </td>

            <td>${escapeHtml(job.taskType || '—')}</td>

            <td>${escapeHtml(job.session || '—')}</td>

            <td>${Number(job.slices || 0).toLocaleString()}</td>

            <td>
                ${renderPriorityBadge(job.priority)}
            </td>

            <td>
                ${renderStatusBadge(job.status)}
            </td>

            <td>
                ${formatDateTime(job.startTimestamp)}
            </td>

            <td>
                ${renderJobAction(job)}
            </td>
        `;

        tableBody.appendChild(row);
    });

    document.querySelectorAll('[data-job-action]').forEach(button => {
        button.addEventListener('click', handleJobAction);
    });
}

function renderAgents() {
    const container = document.querySelector('#agentsContainer');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    agents.forEach(agent => {
        const agentJobs = jobs.filter(
            job => job.agentName === agent.agentName
        );

        const completedJobs = agentJobs.filter(
            job => normalizeStatus(job.status) === 'completed'
        ).length;

        const slices = agentJobs.reduce(
            (sum, job) => sum + Number(job.slices || 0),
            0
        );

        const isWorking =
            String(agent.status).toLowerCase() === 'working';

        const card = document.createElement('div');

        card.className = 'agent-card';

        card.innerHTML = `
            <div class="agent-card-header">
                <div class="agent-avatar">
                    ${getInitials(agent.agentName)}
                </div>

                <div>
                    <h3>${escapeHtml(agent.agentName)}</h3>

                    <span class="agent-status ${
                        isWorking ? 'working' : 'available'
                    }">
                        ${isWorking ? 'Working' : 'Available'}
                    </span>
                </div>
            </div>

            <div class="agent-card-details">
                <div>
                    <span>Current Job</span>
                    <strong>${escapeHtml(agent.currentJob || '—')}</strong>
                </div>

                <div>
                    <span>Jobs Today</span>
                    <strong>${completedJobs}</strong>
                </div>

                <div>
                    <span>Slices</span>
                    <strong>${slices.toLocaleString()}</strong>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderReports() {
    renderTaskTypeReport();
    renderStatusReport();
}

function renderTaskTypeReport() {
    const container = document.querySelector('#taskTypeReport');

    if (!container) {
        return;
    }

    const counts = {};

    jobs.forEach(job => {
        const task = job.taskType || 'Other';

        counts[task] = (counts[task] || 0) + 1;
    });

    const entries = Object.entries(counts);

    container.innerHTML = '';

    if (entries.length === 0) {
        container.innerHTML = '<p>No report data available.</p>';
        return;
    }

    const total = jobs.length || 1;

    entries.forEach(([name, count]) => {
        const percentage = Math.round((count / total) * 100);

        container.innerHTML += `
            <div class="report-row">
                <div class="report-row-label">
                    <span>${escapeHtml(name)}</span>
                    <strong>${count}</strong>
                </div>

                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        style="width: ${percentage}%"
                    ></div>
                </div>
            </div>
        `;
    });
}

function renderStatusReport() {
    const container = document.querySelector('#statusReport');

    if (!container) {
        return;
    }

    const statuses = {
        'Completed': 0,
        'In Progress': 0,
        'Not Started': 0
    };

    jobs.forEach(job => {
        const status = normalizeStatus(job.status);

        if (status === 'completed') {
            statuses['Completed']++;
        } else if (status === 'in progress') {
            statuses['In Progress']++;
        } else {
            statuses['Not Started']++;
        }
    });

    container.innerHTML = `
        <div class="status-report-item">
            <span class="status-dot completed"></span>
            <span>Completed</span>
            <strong>${statuses['Completed']}</strong>
        </div>

        <div class="status-report-item">
            <span class="status-dot progress"></span>
            <span>In Progress</span>
            <strong>${statuses['In Progress']}</strong>
        </div>

        <div class="status-report-item">
            <span class="status-dot not-started"></span>
            <span>Not Started</span>
            <strong>${statuses['Not Started']}</strong>
        </div>
    `;
}

// ============================================================
// FORM OPTIONS
// ============================================================

function populateFormOptions() {
    const agentSelect = document.querySelector('#agentName');
    const taskSelect = document.querySelector('#taskType');
    const sessionSelect = document.querySelector('#session');

    if (agentSelect) {
        agentSelect.innerHTML = '<option value="">Select agent</option>';

        agents
            .filter(agent => agent.active !== false)
            .forEach(agent => {
                agentSelect.innerHTML += `
                    <option value="${escapeAttribute(agent.agentName)}">
                        ${escapeHtml(agent.agentName)}
                    </option>
                `;
            });
    }

    if (taskSelect) {
        taskSelect.innerHTML = '<option value="">Select task type</option>';

        taskTypes
            .filter(task => task.active !== false)
            .forEach(task => {
                taskSelect.innerHTML += `
                    <option value="${escapeAttribute(task.taskType)}">
                        ${escapeHtml(task.taskType)}
                    </option>
                `;
            });
    }

    if (sessionSelect) {
        sessionSelect.innerHTML = '<option value="">Select session</option>';

        sessions
            .filter(session => session.active !== false)
            .forEach(session => {
                sessionSelect.innerHTML += `
                    <option value="${escapeAttribute(session.session)}">
                        ${escapeHtml(
                            session.sessionName || session.session
                        )}
                    </option>
                `;
            });
    }
}

// ============================================================
// CREATE JOB
// ============================================================

async function createJob(formData) {
    const job = {
        action: 'createJob',

        agentName: formData.get('agentName'),
        jobName: formData.get('jobName'),
        taskType: formData.get('taskType'),
        session: formData.get('session'),
        slices: Number(formData.get('slices') || 0),
        priority: formData.get('priority') || 'Normal',
        status: 'Not Started'
    };

    try {
        showLoadingState();

        if (!API_URL || API_URL.includes('PASTE_YOUR')) {
            const demoJob = {
                jobId: `JOB-${Date.now()}`,
                ...job,
                createdTimestamp: new Date().toISOString()
            };

            jobs.unshift(demoJob);

            closeModal();
            renderAll();

            showNotification(
                'Demo job created. Connect Apps Script to save it to Google Sheets.',
                'success'
            );

            return;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(job)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Unable to create job.');
        }

        closeModal();

        await loadAllData();

        showNotification(
            'Job created successfully.',
            'success'
        );

    } catch (error) {
        console.error(error);

        showNotification(
            error.message || 'Unable to create job.',
            'error'
        );
    }
}

// ============================================================
// START / FINISH JOB
// ============================================================

async function handleJobAction(event) {
    const button = event.currentTarget;

    const jobId = button.dataset.jobId;
    const action = button.dataset.jobAction;

    if (!jobId || !action) {
        return;
    }

    try {
        button.disabled = true;

        if (!API_URL || API_URL.includes('PASTE_YOUR')) {
            handleDemoJobAction(jobId, action);

            renderAll();

            showNotification(
                action === 'start'
                    ? 'Job started.'
                    : 'Job completed.',
                'success'
            );

            return;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action,
                jobId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message || 'Unable to update job.'
            );
        }

        await loadAllData();

        showNotification(
            action === 'start'
                ? 'Job started successfully.'
                : 'Job completed successfully.',
            'success'
        );

    } catch (error) {
        console.error(error);

        showNotification(
            error.message || 'Unable to update job.',
            'error'
        );

        button.disabled = false;
    }
}

function handleDemoJobAction(jobId, action) {
    const job = jobs.find(item => item.jobId === jobId);

    if (!job) {
        return;
    }

    const now = new Date().toISOString();

    if (action === 'start') {
        job.status = 'In Progress';
        job.startTimestamp = now;
    }

    if (action === 'finish') {
        job.status = 'Completed';
        job.finishTimestamp = now;
    }

    if (action === 'delete') {
        jobs = jobs.filter(item => item.jobId !== jobId);
    }
}

// ============================================================
// MODAL
// ============================================================

function setupModal() {
    const modal = document.querySelector('#jobModal');
    const openButton = document.querySelector('[data-open-job-modal]');
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    const form = document.querySelector('#jobForm');

    if (openButton) {
        openButton.addEventListener('click', openModal);
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    if (modal) {
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', event => {
            event.preventDefault();

            const formData = new FormData(form);

            createJob(formData);
        });
    }
}

function openModal() {
    const modal = document.querySelector('#jobModal');

    if (!modal) {
        return;
    }

    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

function closeModal() {
    const modal = document.querySelector('#jobModal');
    const form = document.querySelector('#jobForm');

    if (modal) {
        modal.classList.remove('open');
    }

    document.body.classList.remove('modal-open');

    if (form) {
        form.reset();
    }
}

// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(button => {
        button.addEventListener('click', event => {
            const page = event.currentTarget.dataset.page;

            document
                .querySelectorAll('[data-page]')
                .forEach(item => item.classList.remove('active'));

            event.currentTarget.classList.add('active');

            document
                .querySelectorAll('.page-section')
                .forEach(section => {
                    section.classList.remove('active');
                });

            const target = document.querySelector(
                `[data-page-section="${page}"]`
            );

            if (target) {
                target.classList.add('active');
            }
        });
    });
}

// ============================================================
// FILTERS
// ============================================================

function setupFilters() {
    const searchInput = document.querySelector('#jobSearch');
    const statusFilter = document.querySelector('#statusFilter');
    const priorityFilter = document.querySelector('#priorityFilter');

    if (searchInput) {
        searchInput.addEventListener('input', event => {
            currentFilter.search = event.target.value;
            renderJobs();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', event => {
            currentFilter.status = event.target.value;
            renderJobs();
        });
    }

    if (priorityFilter) {
        priorityFilter.addEventListener('change', event => {
            currentFilter.priority = event.target.value;
            renderJobs();
        });
    }
}

// ============================================================
// THEME
// ============================================================

function setupThemeToggle() {
    const toggle = document.querySelector('[data-theme-toggle]');

    if (!toggle) {
        return;
    }

    const savedTheme = localStorage.getItem('agentTrackerTheme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');

        localStorage.setItem(
            'agentTrackerTheme',
            document.body.classList.contains('dark-mode')
                ? 'dark'
                : 'light'
        );
    });
}

// ============================================================
// REFRESH
// ============================================================

function setupRefreshButton() {
    const button = document.querySelector('[data-refresh]');

    if (!button) {
        return;
    }

    button.addEventListener('click', async () => {
        await loadAllData();

        showNotification(
            'Dashboard refreshed.',
            'success'
        );
    });
}

// ============================================================
// UI HELPERS
// ============================================================

function showLoadingState() {
    document.body.classList.add('loading');
}

function hideLoadingState() {
    document.body.classList.remove('loading');
}

function showNotification(message, type = 'info') {
    let container = document.querySelector('#notificationContainer');

    if (!container) {
        container = document.createElement('div');

        container.id = 'notificationContainer';

        document.body.appendChild(container);
    }

    const notification = document.createElement('div');

    notification.className = `notification notification-${type}`;

    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');

        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

function renderPriorityBadge(priority) {
    const normalized = normalizePriority(priority);

    if (normalized === 'high') {
        return `
            <span class="badge badge-high">
                High
            </span>
        `;
    }

    return `
        <span class="badge badge-normal">
            Normal
        </span>
    `;
}

function renderStatusBadge(status) {
    const normalized = normalizeStatus(status);

    if (normalized === 'completed') {
        return `
            <span class="badge badge-completed">
                Completed
            </span>
        `;
    }

    if (normalized === 'in progress') {
        return `
            <span class="badge badge-progress">
                In Progress
            </span>
        `;
    }

    return `
        <span class="badge badge-not-started">
            Not Started
        </span>
    `;
}

function renderJobAction(job) {
    const status = normalizeStatus(job.status);

    if (status === 'not started') {
        return `
            <button
                class="job-action-btn start"
                data-job-action="start"
                data-job-id="${escapeAttribute(job.jobId)}"
            >
                Start
            </button>
        `;
    }

    if (status === 'in progress') {
        return `
            <button
                class="job-action-btn finish"
                data-job-action="finish"
                data-job-id="${escapeAttribute(job.jobId)}"
            >
                Finish
            </button>
        `;
    }

    return `
        <span class="completed-label">
            Completed
        </span>
    `;
}

function normalizeStatus(status) {
    return String(status || '')
        .trim()
        .toLowerCase();
}

function normalizePriority(priority) {
    return String(priority || '')
        .trim()
        .toLowerCase();
}

function formatDateTime(timestamp) {
    if (!timestamp) {
        return '—';
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return String(timestamp);
    }

    return date.toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function getInitials(name) {
    return String(name || 'A')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');
}

function setText(selector, value) {
    const element = document.getElementById(selector);

    if (element) {
        element.textContent = value;
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

// Prevent stuck loading indicator.
window.addEventListener('load', () => {
    hideLoadingState();
});
