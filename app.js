// =====================================================
// AGENT JOB TRACKER
// Google Sheets → Apps Script → GitHub Pages
// =====================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbxGpEvTmnk2sz7ZjLT3ITFHwh8W6bb2xlxV2XJzreCGw2VZb7zkod1JWobGhPbtebBE/exec";

let jobs = [];


// =====================================================
// START APPLICATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  setupEvents();

  loadJobs();

});


// =====================================================
// EVENTS
// =====================================================

function setupEvents() {

  const searchInput =
    document.getElementById("searchInput");

  const statusFilter =
    document.getElementById("statusFilter");

  const priorityFilter =
    document.getElementById("priorityFilter");

  const refreshBtn =
    document.getElementById("refreshBtn");


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      renderJobs
    );

  }


  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      renderJobs
    );

  }


  if (priorityFilter) {

    priorityFilter.addEventListener(
      "change",
      renderJobs
    );

  }


  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      loadJobs
    );

  }

}


// =====================================================
// LOAD DATA FROM GOOGLE SHEETS
// =====================================================

function loadJobs() {

  if (
    !API_URL ||
    API_URL.includes("PASTE_YOUR")
  ) {

    showError(
      "Apps Script URL has not been added to app.js."
    );

    return;

  }


  const callbackName =
    "sheetCallback_" +
    Date.now();


  const script =
    document.createElement("script");


  window[callbackName] =
    function(data) {

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }


      if (
        !data ||
        data.success !== true
      ) {

        showError(
          "Apps Script returned an error."
        );

        return;

      }


      jobs =
        Array.isArray(data.jobs)
          ? data.jobs
          : [];


      renderAll();

    };


  script.onerror =
    function() {

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }


      showError(
        "Could not connect to Google Sheets."
      );

    };


  script.src =
    API_URL +
    "?action=getAll&prefix=" +
    encodeURIComponent(
      callbackName
    );


  document.body.appendChild(script);

}


// =====================================================
// RENDER EVERYTHING
// =====================================================

function renderAll() {

  renderStatistics();

  renderJobs();

  renderAgents();

}


// =====================================================
// STATISTICS
// =====================================================

function renderStatistics() {

  const activeJobs =
    jobs.filter(
      job =>
        normalize(job.status) ===
        "in progress"
    ).length;


  const completedJobs =
    jobs.filter(
      job =>
        normalize(job.status) ===
        "completed"
    ).length;


  const highPriority =
    jobs.filter(
      job =>
        normalize(job.priority) ===
        "high"
    ).length;


  const totalSlices =
    jobs.reduce(
      (total, job) =>
        total +
        Number(job.slices || 0),
      0
    );


  setText(
    "activeJobs",
    activeJobs
  );


  setText(
    "completedJobs",
    completedJobs
  );


  setText(
    "highPriority",
    highPriority
  );


  setText(
    "totalSlices",
    totalSlices.toLocaleString()
  );

}


// =====================================================
// JOB TABLE
// =====================================================

function renderJobs() {

  const body =
    document.getElementById(
      "jobsBody"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  if (!body) {
    return;
  }


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const statusFilter =
    document.getElementById(
      "statusFilter"
    );


  const priorityFilter =
    document.getElementById(
      "priorityFilter"
    );


  const search =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";


  const status =
    statusFilter
      ? statusFilter.value
      : "all";


  const priority =
    priorityFilter
      ? priorityFilter.value
      : "all";


  const filteredJobs =
    jobs.filter(job => {

      const searchableText = [

        job.jobName,

        job.agentName,

        job.taskType,

        job.session

      ]
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !search ||
        searchableText.includes(search);


      const matchesStatus =
        status === "all" ||
        normalize(job.status) ===
        normalize(status);


      const matchesPriority =
        priority === "all" ||
        normalize(job.priority) ===
        normalize(priority);


      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );

    });


  body.innerHTML = "";


  if (
    filteredJobs.length === 0
  ) {

    if (emptyState) {

      emptyState.hidden = false;

      emptyState.textContent =
        jobs.length === 0
          ? "No jobs found in Google Sheets."
          : "No jobs match your filters.";

    }

    return;

  }


  if (emptyState) {
    emptyState.hidden = true;
  }


  filteredJobs.forEach(job => {

    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td class="job-name">
        ${escapeHtml(
          job.jobName || "—"
        )}
      </td>

      <td>
        ${escapeHtml(
          job.agentName || "—"
        )}
      </td>

      <td>
        ${escapeHtml(
          job.taskType || "—"
        )}
      </td>

      <td>
        ${formatSession(
          job.session
        )}
      </td>

      <td>
        ${Number(
          job.slices || 0
        ).toLocaleString()}
      </td>

      <td>
        ${renderPriorityBadge(
          job.priority
        )}
      </td>

      <td>
        ${renderStatusBadge(
          job.status
        )}
      </td>

      <td>
        ${formatDateTime(
          job.startTimestamp
        )}
      </td>

      <td>
        ${formatDateTime(
          job.finishTimestamp
        )}
      </td>

      <td>
        ${escapeHtml(
          job.duration || "—"
        )}
      </td>

    `;


    body.appendChild(row);

  });

}


// =====================================================
// AGENTS
// =====================================================

function renderAgents() {

  const container =
    document.getElementById(
      "agentsGrid"
    );


  if (!container) {
    return;
  }


  const agentMap =
    new Map();


  jobs.forEach(job => {

    const agentName =
      job.agentName ||
      "Unassigned";


    if (
      !agentMap.has(agentName)
    ) {

      agentMap.set(
        agentName,
        {
          jobs: [],
          slices: 0
        }
      );

    }


    const agent =
      agentMap.get(agentName);


    agent.jobs.push(job);


    agent.slices +=
      Number(
        job.slices || 0
      );

  });


  container.innerHTML = "";


  agentMap.forEach(
    (data, agentName) => {

      const activeJob =
        data.jobs.find(
          job =>
            normalize(job.status) ===
            "in progress"
        );


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "agent-card";


      card.innerHTML = `

        <div class="agent-top">

          <div>

            <div class="agent-name">

              ${escapeHtml(
                agentName
              )}

            </div>


            <div class="agent-job">

              ${
                activeJob
                  ? escapeHtml(
                      activeJob.jobName
                    )
                  : "No active job"
              }

            </div>

          </div>


          <div>

            ${
              activeJob
                ? renderStatusBadge(
                    "In Progress"
                  )
                : renderStatusBadge(
                    "Not Started"
                  )
            }

          </div>

        </div>


        <div class="agent-metrics">

          <div class="metric">

            <span>
              Jobs
            </span>

            <strong>
              ${data.jobs.length}
            </strong>

          </div>


          <div class="metric">

            <span>
              Slices
            </span>

            <strong>
              ${data.slices.toLocaleString()}
            </strong>

          </div>

        </div>

      `;


      container.appendChild(card);

    }
  );

}


// =====================================================
// PRIORITY BADGE
// =====================================================

function renderPriorityBadge(
  priority
) {

  const isHigh =
    normalize(priority) ===
    "high";


  return `

    <span class="
      badge
      ${
        isHigh
          ? "badge-high"
          : "badge-normal"
      }
    ">

      ${escapeHtml(
        priority || "Normal"
      )}

    </span>

  `;

}


// =====================================================
// STATUS BADGE
// =====================================================

function renderStatusBadge(
  status
) {

  const normalized =
    normalize(status);


  let className =
    "badge-not-started";


  if (
    normalized ===
    "in progress"
  ) {

    className =
      "badge-progress";

  }


  if (
    normalized ===
    "completed"
  ) {

    className =
      "badge-completed";

  }


  return `

    <span class="
      badge
      ${className}
    ">

      ${escapeHtml(
        status || "Not Started"
      )}

    </span>

  `;

}


// =====================================================
// SESSION
// =====================================================

function formatSession(
  session
) {

  if (!session) {
    return "—";
  }


  const value =
    String(session);


  /*
    Converts:
    "Session 3"
    into:
    "S3"

    If your spreadsheet already
    returns "S3", it stays "S3".
  */

  const match =
    value.match(
      /(?:Session\s*)?(\d+)/i
    );


  if (match) {

    return `S${match[1]}`;

  }


  return escapeHtml(
    value
  );

}


// =====================================================
// DATE / TIME
// =====================================================

function formatDateTime(
  value
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return escapeHtml(
      String(value)
    );

  }


  return escapeHtml(
    date.toLocaleString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    )
  );

}


// =====================================================
// ERROR MESSAGE
// =====================================================

function showError(
  message
) {

  const body =
    document.getElementById(
      "jobsBody"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  if (body) {
    body.innerHTML = "";
  }


  if (emptyState) {

    emptyState.hidden = false;

    emptyState.textContent =
      message;

  }

}


// =====================================================
// HELPERS
// =====================================================

function normalize(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}
