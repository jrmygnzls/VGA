// =====================================================
// AGENT JOB TRACKER
// Google Sheets + Apps Script + GitHub Pages
// =====================================================


// =====================================================
// API URL
// =====================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbxGpEvTmnk2sz7ZjLT3ITFHwh8W6bb2xlxV2XJzreCGw2VZb7zkod1JWobGhPbtebBE/exec";


let jobs = [];

let agents = [];


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupEvents();

    loadJobs();

  }
);


// =====================================================
// EVENTS
// =====================================================

function setupEvents() {

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


  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );


  const newJobBtn =
    document.getElementById(
      "newJobBtn"
    );


  const closeJobModal =
    document.getElementById(
      "closeJobModal"
    );


  const cancelJobBtn =
    document.getElementById(
      "cancelJobBtn"
    );


  const jobForm =
    document.getElementById(
      "jobForm"
    );


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


  if (newJobBtn) {

    newJobBtn.addEventListener(
      "click",
      openNewJobModal
    );

  }


  if (closeJobModal) {

    closeJobModal.addEventListener(
      "click",
      closeNewJobModal
    );

  }


  if (cancelJobBtn) {

    cancelJobBtn.addEventListener(
      "click",
      closeNewJobModal
    );

  }


  if (jobForm) {

    jobForm.addEventListener(
      "submit",
      submitNewJob
    );

  }

}


// =====================================================
// LOAD GOOGLE SHEETS DATA
// =====================================================

function loadJobs() {

  if (
    !API_URL ||
    API_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    showError(
      "Apps Script URL has not been added."
    );

    return;

  }


  const callbackName =
    "sheetCallback_" +
    Date.now();


  const script =
    document.createElement(
      "script"
    );


  window[callbackName] =
    function(data) {

      delete window[
        callbackName
      ];


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(
            script
          );

      }


      if (
        !data ||
        data.success !== true
      ) {

        showError(
          data?.message ||
          "Apps Script returned an error."
        );

        return;

      }


      jobs =
        Array.isArray(
          data.jobs
        )
          ? data.jobs
          : [];


      agents =
        Array.isArray(
          data.agents
        )
          ? data.agents
          : [];


      renderAll();

    };


  script.onerror =
    function() {

      delete window[
        callbackName
      ];


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(
            script
          );

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


  document.body.appendChild(
    script
  );

}


// =====================================================
// RENDER
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

  const active =
    jobs.filter(
      job =>
        normalize(
          job.status
        ) ===
        "in progress"
    ).length;


  const completed =
    jobs.filter(
      job =>
        normalize(
          job.status
        ) ===
        "completed"
    ).length;


  const high =
    jobs.filter(
      job =>
        normalize(
          job.priority
        ) ===
        "high"
    ).length;


  const slices =
    jobs.reduce(
      (
        total,
        job
      ) =>
        total +
        Number(
          job.slices || 0
        ),
      0
    );


  setText(
    "activeJobs",
    active
  );


  setText(
    "completedJobs",
    completed
  );


  setText(
    "highPriority",
    high
  );


  setText(
    "totalSlices",
    slices.toLocaleString()
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


  const empty =
    document.getElementById(
      "emptyState"
    );


  if (!body) {
    return;
  }


  const search =
    document
      .getElementById(
        "searchInput"
      )
      ?.value
      .trim()
      .toLowerCase() ||
    "";


  const status =
    document.getElementById(
      "statusFilter"
    )?.value ||
    "all";


  const priority =
    document.getElementById(
      "priorityFilter"
    )?.value ||
    "all";


  const filtered =
    jobs.filter(
      job => {

        const searchableText = [

          job.jobName,

          job.agentName,

          job.taskType,

          job.session

        ]
          .join(" ")
          .toLowerCase();


        return (

          (
            !search ||
            searchableText
              .includes(
                search
              )
          )

          &&

          (
            status === "all" ||
            normalize(
              job.status
            ) ===
            normalize(
              status
            )
          )

          &&

          (
            priority === "all" ||
            normalize(
              job.priority
            ) ===
            normalize(
              priority
            )
          )

        );

      }
    );


  body.innerHTML = "";


  if (
    filtered.length === 0
  ) {

    if (empty) {

      empty.hidden = false;

      empty.textContent =
        jobs.length === 0

          ? "No jobs found."

          : "No jobs match your filters.";

    }

    return;

  }


  if (empty) {

    empty.hidden = true;

  }


  filtered.forEach(
    job => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td class="job-name">

          ${escapeHtml(
            job.jobName ||
            "—"
          )}

        </td>


        <td>

          ${escapeHtml(
            job.agentName ||
            "—"
          )}

        </td>


        <td>

          ${escapeHtml(
            job.taskType ||
            "—"
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
            job.duration ||
            "—"
          )}

        </td>

      `;


      body.appendChild(
        row
      );

    }
  );

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


  const agentNames = [];


  /*
    Use names from the Agents sheet first.
  */

  agents.forEach(
    agent => {

      if (
        agent.agentName &&
        !agentNames.includes(
          agent.agentName
        )
      ) {

        agentNames.push(
          agent.agentName
        );

      }

    }
  );


  /*
    Also include agents who have jobs.
  */

  jobs.forEach(
    job => {

      if (
        job.agentName &&
        !agentNames.includes(
          job.agentName
        )
      ) {

        agentNames.push(
          job.agentName
        );

      }

    }
  );


  container.innerHTML = "";


  agentNames.forEach(
    agentName => {

      const agentJobs =
        jobs.filter(
          job =>
            job.agentName ===
            agentName
        );


      const activeJob =
        agentJobs.find(
          job =>
            normalize(
              job.status
            ) ===
            "in progress"
        );


      const slices =
        agentJobs.reduce(
          (
            total,
            job
          ) =>
            total +
            Number(
              job.slices || 0
            ),
          0
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
                      activeJob
                        .jobName
                    )
                  : "No active job"
              }

            </div>

          </div>


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


        <div class="agent-metrics">

          <div class="metric">

            <span>
              Jobs
            </span>

            <strong>
              ${agentJobs.length}
            </strong>

          </div>


          <div class="metric">

            <span>
              Slices
            </span>

            <strong>
              ${slices.toLocaleString()}
            </strong>

          </div>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


// =====================================================
// NEW JOB MODAL
// =====================================================

function openNewJobModal() {

  const modal =
    document.getElementById(
      "jobModal"
    );


  if (!modal) {
    return;
  }


  populateNewJobOptions();


  const message =
    document.getElementById(
      "jobFormMessage"
    );


  if (message) {

    message.textContent = "";

    message.className =
      "form-message";

  }


  modal.hidden = false;

}


function closeNewJobModal() {

  const modal =
    document.getElementById(
      "jobModal"
    );


  if (modal) {

    modal.hidden =
      true;

  }


  const form =
    document.getElementById(
      "jobForm"
    );


  if (form) {

    form.reset();

  }

}


// =====================================================
// NEW JOB OPTIONS
// =====================================================

function populateNewJobOptions() {

  const agentSelect =
    document.getElementById(
      "newAgent"
    );


  const taskSelect =
    document.getElementById(
      "newTaskType"
    );


  const sessionSelect =
    document.getElementById(
      "newSession"
    );


  /*
    AGENTS
  */

  if (agentSelect) {

    agentSelect.innerHTML = `
      <option value="">
        Select agent
      </option>
    `;


    const names = [];


    agents.forEach(
      agent => {

        if (
          agent.agentName &&
          !names.includes(
            agent.agentName
          )
        ) {

          names.push(
            agent.agentName
          );

        }

      }
    );


    /*
      If the Agents sheet isn't
      populated yet, use agents
      already found in jobs.
    */

    jobs.forEach(
      job => {

        if (
          job.agentName &&
          !names.includes(
            job.agentName
          )
        ) {

          names.push(
            job.agentName
          );

        }

      }
    );


    names.forEach(
      name => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          name;


        option.textContent =
          name;


        agentSelect.appendChild(
          option
        );

      }
    );

  }


  /*
    TASK TYPES
  */

  if (taskSelect) {

    taskSelect.innerHTML = `

      <option value="">
        Select task type
      </option>

      <option value="encroachment">
        encroachment
      </option>

      <option value="identification of poles and lines">
        identification of poles and lines
      </option>

    `;

  }


  /*
    SESSIONS
  */

  if (sessionSelect) {

    sessionSelect.innerHTML = `
      <option value="">
        Select session
      </option>
    `;


    for (
      let i = 1;
      i <= 50;
      i++
    ) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        `S${i}`;


      option.textContent =
        `S${i}`;


      sessionSelect.appendChild(
        option
      );

    }

  }

}


// =====================================================
// CREATE NEW JOB
// =====================================================

function submitNewJob(
  event
) {

  event.preventDefault();


  const jobName =
    document.getElementById(
      "newJobName"
    ).value.trim();


  const agentName =
    document.getElementById(
      "newAgent"
    ).value;


  const taskType =
    document.getElementById(
      "newTaskType"
    ).value;


  const session =
    document.getElementById(
      "newSession"
    ).value;


  const slices =
    document.getElementById(
      "newSlices"
    ).value;


  const priority =
    document.getElementById(
      "newPriority"
    ).value;


  if (!jobName) {

    showFormMessage(
      "Please enter a job name.",
      "error"
    );

    return;

  }


  if (!agentName) {

    showFormMessage(
      "Please select an agent.",
      "error"
    );

    return;

  }


  if (!taskType) {

    showFormMessage(
      "Please select a task type.",
      "error"
    );

    return;

  }


  if (!session) {

    showFormMessage(
      "Please select a session.",
      "error"
    );

    return;

  }


  if (
    slices === "" ||
    Number(slices) < 0
  ) {

    showFormMessage(
      "Please enter a valid number of slices.",
      "error"
    );

    return;

  }


  if (
    !API_URL ||
    API_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    showFormMessage(
      "Apps Script URL has not been configured.",
      "error"
    );

    return;

  }


  showFormMessage(
    "Saving job...",
    "success"
  );


  const callbackName =
    "createJobCallback_" +
    Date.now();


  const script =
    document.createElement(
      "script"
    );


  window[callbackName] =
    function(result) {

      delete window[
        callbackName
      ];


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(
            script
          );

      }


      if (
        !result ||
        result.success !== true
      ) {

        showFormMessage(
          result?.message ||
          "Unable to create the job.",
          "error"
        );

        return;

      }


      showFormMessage(
        "Job created successfully.",
        "success"
      );


      setTimeout(
        () => {

          closeNewJobModal();

          loadJobs();

        },
        500
      );

    };


  script.onerror =
    function() {

      delete window[
        callbackName
      ];


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(
            script
          );

      }


      showFormMessage(
        "Unable to connect to Google Sheets.",
        "error"
      );

    };


  const params =
    new URLSearchParams({

      action:
        "createJob",

      prefix:
        callbackName,

      jobName:
        jobName,

      agentName:
        agentName,

      taskType:
        taskType,

      session:
        session,

      slices:
        slices,

      priority:
        priority

    });


  script.src =
    API_URL +
    "?" +
    params.toString();


  document.body.appendChild(
    script
  );

}


// =====================================================
// BADGES
// =====================================================

function renderPriorityBadge(
  priority
) {

  const isHigh =
    normalize(
      priority
    ) ===
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
        priority ||
        "Normal"
      )}

    </span>

  `;

}


function renderStatusBadge(
  status
) {

  const value =
    normalize(
      status
    );


  let className =
    "badge-not-started";


  if (
    value ===
    "in progress"
  ) {

    className =
      "badge-progress";

  }


  if (
    value ===
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
        status ||
        "Not Started"
      )}

    </span>

  `;

}


// =====================================================
// SESSION DISPLAY
// =====================================================

function formatSession(
  session
) {

  if (!session) {

    return "—";

  }


  const value =
    String(
      session
    );


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
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return escapeHtml(
      String(
        value
      )
    );

  }


  return escapeHtml(

    date.toLocaleString(
      "en-PH",
      {
        month:
          "short",

        day:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit"
      }
    )

  );

}


// =====================================================
// FORM MESSAGE
// =====================================================

function showFormMessage(
  message,
  type
) {

  const element =
    document.getElementById(
      "jobFormMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    "form-message " +
    type;

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


  if (body) {

    body.innerHTML =
      "";

  }


  if (empty) {

    empty.hidden =
      false;

    empty.textContent =
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
    value ||
    ""
  )
    .trim()
    .toLowerCase();

}


function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


function escapeHtml(
  value
) {

  return String(
    value ??
    ""
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
