/*
  AGENT JOB TRACKER

  For now this uses demo data.

  Later we will connect:
  GitHub Pages
       ↓
  Google Apps Script
       ↓
  Google Sheets

  When the Apps Script Web App is ready,
  put its URL inside API_URL.
*/


const API_URL = "https://script.google.com/macros/s/AKfycbyQuFLxpdGgUYCDIhzHj1LvrWBgQXl30tmnBBIpv30Gsq6p0SA8O23nyTpFVt7UR9LZ/exec";


/* =========================
   DEMO DATA
========================= */

const demoJobs = [

  {
    jobName: "North Pole Survey",

    agentName: "John Doe",

    taskType:
      "identification of poles and lines",

    session: "S3",

    slices: 25,

    priority: "High",

    status: "In Progress",

    startTimestamp:
      "2026-08-21T08:30:00",

    finishTimestamp: "",

    duration: ""
  },


  {
    jobName:
      "East Route Encroachment",

    agentName: "Jane Smith",

    taskType:
      "encroachment",

    session: "S2",

    slices: 18,

    priority: "Normal",

    status: "Completed",

    startTimestamp:
      "2026-08-21T08:00:00",

    finishTimestamp:
      "2026-08-21T09:25:00",

    duration:
      "1h 25m"
  },


  {
    jobName:
      "Line Identification - Sector 4",

    agentName: "Mark Reyes",

    taskType:
      "identification of poles and lines",

    session: "S5",

    slices: 31,

    priority: "High",

    status: "Not Started",

    startTimestamp: "",

    finishTimestamp: "",

    duration: ""
  }

];


let jobs = [];


/* =========================
   START APPLICATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);


async function init() {

  setupEvents();

  await loadData();

}


/* =========================
   EVENTS
========================= */

function setupEvents() {

  document
    .getElementById("searchInput")
    .addEventListener(
      "input",
      render
    );


  document
    .getElementById("statusFilter")
    .addEventListener(
      "change",
      render
    );


  document
    .getElementById("priorityFilter")
    .addEventListener(
      "change",
      render
    );


  document
    .getElementById("refreshBtn")
    .addEventListener(
      "click",
      loadData
    );

}


/* =========================
   LOAD DATA
========================= */

async function loadData() {

  /*
    Until the Google Apps Script URL
    is added, use demo data.
  */

  if (!API_URL) {

    jobs = [...demoJobs];

    render();

    return;
  }


  try {

    const response =
      await fetch(
        `${API_URL}?action=getAll`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    jobs =
      Array.isArray(data.jobs)
        ? data.jobs
        : [];


    render();

  }

  catch (error) {

    console.error(
      "Google Sheets connection failed:",
      error
    );


    jobs =
      [...demoJobs];


    render();

  }

}


/* =========================
   RENDER EVERYTHING
========================= */

function render() {

  renderStatistics();

  renderJobs();

  renderAgents();

}


/* =========================
   STATISTICS
========================= */

function renderStatistics() {

  const active =
    jobs.filter(
      job =>
        normalize(job.status)
        === "in progress"
    ).length;


  const completed =
    jobs.filter(
      job =>
        normalize(job.status)
        === "completed"
    ).length;


  const highPriority =
    jobs.filter(
      job =>
        normalize(job.priority)
        === "high"
    ).length;


  const totalSlices =
    jobs.reduce(
      (total, job) =>
        total +
        Number(job.slices || 0),
      0
    );


  document.getElementById(
    "activeJobs"
  ).textContent = active;


  document.getElementById(
    "completedJobs"
  ).textContent = completed;


  document.getElementById(
    "highPriority"
  ).textContent = highPriority;


  document.getElementById(
    "totalSlices"
  ).textContent =
    totalSlices.toLocaleString();

}


/* =========================
   JOB TABLE
========================= */

function renderJobs() {

  const body =
    document.getElementById(
      "jobsBody"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  const search =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .trim()
      .toLowerCase();


  const status =
    document.getElementById(
      "statusFilter"
    ).value;


  const priority =
    document.getElementById(
      "priorityFilter"
    ).value;


  const filtered =
    jobs.filter(job => {

      const searchable = [

        job.jobName,

        job.agentName,

        job.taskType,

        job.session

      ]
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !search ||
        searchable.includes(search);


      const matchesStatus =
        status === "all" ||
        job.status === status;


      const matchesPriority =
        priority === "all" ||
        job.priority === priority;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );

    });


  body.innerHTML = "";


  if (!filtered.length) {

    emptyState.hidden = false;

    return;

  }


  emptyState.hidden = true;


  filtered.forEach(job => {

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

        ${escapeHtml(
          job.session || "—"
        )}

      </td>


      <td>

        ${Number(
          job.slices || 0
        ).toLocaleString()}

      </td>


      <td>

        ${priorityBadge(
          job.priority
        )}

      </td>


      <td>

        ${statusBadge(
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


/* =========================
   AGENTS
========================= */

function renderAgents() {

  const grid =
    document.getElementById(
      "agentsGrid"
    );


  const agentMap =
    new Map();


  jobs.forEach(job => {

    const name =
      job.agentName ||
      "Unassigned";


    if (!agentMap.has(name)) {

      agentMap.set(
        name,
        {
          jobs: [],
          slices: 0
        }
      );

    }


    const agent =
      agentMap.get(name);


    agent.jobs.push(job);


    agent.slices +=
      Number(
        job.slices || 0
      );

  });


  grid.innerHTML = "";


  agentMap.forEach(
    (data, name) => {

      const activeJob =
        data.jobs.find(
          job =>
            normalize(
              job.status
            ) === "in progress"
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

              ${escapeHtml(name)}

            </div>


            <div class="agent-job">

              ${
                escapeHtml(
                  activeJob
                    ? activeJob.jobName
                    : "No active job"
                )
              }

            </div>

          </div>


          ${
            activeJob

              ? statusBadge(
                  "In Progress"
                )

              : statusBadge(
                  "Not Started"
                )

          }

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


      grid.appendChild(card);

    }

  );

}


/* =========================
   BADGES
========================= */

function priorityBadge(
  priority
) {

  const high =
    normalize(priority)
    === "high";


  return `

    <span class="
      badge
      ${
        high
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


function statusBadge(
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


/* =========================
   DATE / TIME
========================= */

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

    return String(value);

  }


  return date.toLocaleString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );

}


/* =========================
   HELPERS
========================= */

function normalize(value) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


function escapeHtml(value) {

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
