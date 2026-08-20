// =====================================================
// AGENT JOB TRACKER
// GOOGLE SHEETS CONNECTION
// =====================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycby1A_PyCuH0-ZUq3Z70twUstxtTdx_V2GvmcWf2BXPkERSVZ_NzTi8CDfRQGc2B6s0-/exec";

let jobs = [];


// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  loadJobs();

  document
    .getElementById("searchInput")
    .addEventListener("input", renderJobs);

  document
    .getElementById("statusFilter")
    .addEventListener("change", renderJobs);

  document
    .getElementById("priorityFilter")
    .addEventListener("change", renderJobs);

  document
    .getElementById("refreshBtn")
    .addEventListener("click", loadJobs);
});


// =====================================================
// LOAD GOOGLE SHEETS
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
    "sheetCallback_" + Date.now();


  const script =
    document.createElement("script");


  window[callbackName] =
    function(data) {

      delete window[callbackName];

      script.remove();


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

      script.remove();


      showError(
        "Could not connect to Google Sheets."
      );

    };


  script.src =
    API_URL +
    "?action=getAll&callback=" +
    callbackName;


  document.body.appendChild(script);

}


// =====================================================
// RENDER EVERYTHING
// =====================================================

function renderAll() {

  renderStats();

  renderJobs();

  renderAgents();

}


// =====================================================
// STATS
// =====================================================

function renderStats() {

  const active =
    jobs.filter(
      job =>
        String(job.status)
          .toLowerCase() ===
        "in progress"
    ).length;


  const completed =
    jobs.filter(
      job =>
        String(job.status)
          .toLowerCase() ===
        "completed"
    ).length;


  const high =
    jobs.filter(
      job =>
        String(job.priority)
          .toLowerCase() ===
        "high"
    ).length;


  const slices =
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
  ).textContent = high;


  document.getElementById(
    "totalSlices"
  ).textContent =
    slices.toLocaleString();

}


// =====================================================
// JOB TABLE
// =====================================================

function renderJobs() {

  const body =
    document.getElementById(
      "jobsBody"
    );


  const empty =
    document.getElementById(
      "emptyState"
    );


  const search =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .toLowerCase()
      .trim();


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

      const text = [

        job.jobName,

        job.agentName,

        job.taskType,

        job.session

      ]
        .join(" ")
        .toLowerCase();


      return (

        (!search ||
          text.includes(search))

        &&

        (
          status === "all" ||
          job.status === status
        )

        &&

        (
          priority === "all" ||
          job.priority === priority
        )

      );

    });


  body.innerHTML = "";


  if (!filtered.length) {

    empty.hidden = false;

    return;
  }


  empty.hidden = true;


  filtered.forEach(job => {

    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td class="job-name">
        ${safe(job.jobName)}
      </td>

      <td>
        ${safe(job.agentName)}
      </td>

      <td>
        ${safe(job.taskType)}
      </td>

      <td>
        ${safe(job.session)}
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
        ${formatDate(
          job.startTimestamp
        )}
      </td>

      <td>
        ${formatDate(
          job.finishTimestamp
        )}
      </td>

      <td>
        ${safe(
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


  const agents = {};


  jobs.forEach(job => {

    const name =
      job.agentName ||
      "Unassigned";


    if (!agents[name]) {

      agents[name] = {

        jobs: 0,

        slices: 0,

        activeJob: ""

      };

    }


    agents[name].jobs++;

    agents[name].slices +=
      Number(job.slices || 0);


    if (
      String(job.status)
        .toLowerCase() ===
      "in progress"
    ) {

      agents[name].activeJob =
        job.jobName;

    }

  });


  container.innerHTML = "";


  Object.entries(
    agents
  ).forEach(
    ([name, data]) => {

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
              ${safe(name)}
            </div>

            <div class="agent-job">
              ${
                safe(
                  data.activeJob ||
                  "No active job"
                )
              }
            </div>

          </div>

        </div>

        <div class="agent-metrics">

          <div class="metric">

            <span>
              Jobs
            </span>

            <strong>
              ${data.jobs}
            </strong>

          </div>

          <div class="metric">

            <span>
              Slices
            </span>

            <strong>
              ${data.slices}
            </strong>

          </div>

        </div>

      `;


      container.appendChild(card);

    }
  );

}


// =====================================================
// BADGES
// =====================================================

function priorityBadge(
  priority
) {

  const high =
    String(priority)
      .toLowerCase() ===
    "high";


  return `

    <span class="
      badge
      ${
        high
          ? "badge-high"
          : "badge-normal"
      }
    ">

      ${safe(priority || "Normal")}

    </span>

  `;

}


function statusBadge(
  status
) {

  const value =
    String(status || "")
      .toLowerCase();


  let className =
    "badge-not-started";


  if (
    value === "in progress"
  ) {

    className =
      "badge-progress";

  }


  if (
    value === "completed"
  ) {

    className =
      "badge-completed";

  }


  return `

    <span class="
      badge
      ${className}
    ">

      ${safe(status || "Not Started")}

    </span>

  `;

}


// =====================================================
// DATE
// =====================================================

function formatDate(
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

    return safe(value);

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


// =====================================================
// ERROR
// =====================================================

function showError(
  message
) {

  const body =
    document.getElementById(
      "jobsBody"
    );


  const empty =
    document.getElementById(
      "emptyState"
    );


  body.innerHTML = "";


  empty.hidden = false;


  empty.textContent =
    message;

}


// =====================================================
// SECURITY
// =====================================================

function safe(value) {

  return String(
    value ?? "—"
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
