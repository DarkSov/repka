let sheetsSelect = document.getElementById("sheets-select");
let sheet = document.getElementById("sheet");
let studentList = document.getElementById("student-list");
let studentInfo = document.getElementById("student-info");
const studentListGroup = document.getElementById("student-list-group");
const taskList = document.getElementById("task-list");
const taskInfoTabs = document.getElementById("task-info-tabs");
const studentFormTable = document.getElementById("student-form-table");
const studentFormTableContent = document.getElementById(
  "student-form-table-content"
);
const commitTableContent = document.getElementById("commit-table-content");

const navOverview = document.getElementById("nav-overview");
const navCommits = document.getElementById("nav-commits");

const tabs = document.getElementById("tabs");

//sheet onchange
sheetsSelect.addEventListener("change", (event) => {
  studentListGroup.innerHTML = `<div id="spinner" class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>`;
  const sheetId = sheetsSelect.value;
  const spinner = document.getElementById("spinner");
  if (sheetId == "") return;
  fetch(`/get-google-spreadsheet?sheetId=${sheetId}`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.sheetData.forEach((row, index) => {
        if (index != 0) {
          let student = document.createElement("li");
          student.classList.add("list-group-item", "student");
          student.innerHTML = row[data.nameRow - 1];
          student.id = index;

          //student onclick
          student.addEventListener("click", (event) => {
            tabs.style.display = "none";

            taskList.innerHTML = "";
            commitTableContent.innerHTML = "";
            navOverview.innerHTML = "";

            const studentId = event.target.id;

            studentListGroup.childNodes.forEach((student) => {
              student.classList.remove("active");
            });
            event.target.classList.add("active");

            data.tasks.forEach((task) => {
              const taskName = task.name;
              const taskRow = task.row - 1;
              const taskLink = data.sheetData[studentId][taskRow];

              const taskListElement = document.createElement("li");
              taskListElement.classList.add("nav-item", "task");
              taskButton = document.createElement("p");
              taskButton.classList.add("nav-link", "task-button");
              taskButton.innerHTML = taskName;

              //task onclick
              taskButton.addEventListener("click", (event) => {
                commitTableContent.innerHTML = `<div id="spinner" class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>`;
                navOverview.innerHTML = `<div id="spinner" class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>`;

                commitTableContent.innerHTML = "";

                taskList.childNodes.forEach((tab) => {
                  tab.classList.remove("active");
                });
                event.target.classList.add("active");
                tabs.style.display = "inline-block";
                if (taskLink.includes("github.com")) {
                  const username = taskLink.split("/")[3];
                  const repo = taskLink.split("/")[4];
                  fetch(`/get-student-repo?username=${username}&repo=${repo}`)
                    .then((response) => response.json())
                    .then((data) => {
                      const studentRepo = document.createElement("div");
                      studentRepo.className = "student-repo";
                      studentRepo.innerHTML = `${taskName} <a href="${taskLink}" target="_blank">${taskLink}</a>`;
                      const studentCommits = document.createElement("div");
                      studentCommits.className = "student-commits";
                      studentCommits.innerHTML = `${data.commitsLastDay.length} commits in the last day <br> ${data.commitsLastWeek.length} commits in the last week <br> ${data.commitsLastMonth.length} commits in the last month`;
                      navOverview.appendChild(studentRepo);
                      navOverview.appendChild(studentCommits);

                      const commits = data.commitsLastDay
                        .concat(data.commitsLastWeek)
                        .concat(data.commitsLastMonth);

                      const commitTable = document.createElement("table");
                      commitTable.className = "table";

                      commits.forEach((commit) => {
                        commitRow = document.createElement("tr");
                        commitRow.className = "commit-row";

                        let commitDate = document.createElement("td");
                        commitDate.className = "commit-date";
                        commitDate.innerHTML = new Date(commit.date)
                          .toString()
                          .split(" ")
                          .slice(0, 4)
                          .join(" ");

                        let commitMessage = document.createElement("td");
                        commitMessage.className = "commit-message";
                        commitMessage.innerHTML = commit.message;

                        commitAuthor = document.createElement("td");
                        commitAuthor.className = "commit-author";
                        commitAuthor.innerHTML = commit.author;

                        commitLink = document.createElement("td");
                        commitLink.className = "commit-link";
                        commitLink.innerHTML = `<a href="${
                          taskLink + "/commit/" + commit.sha
                        }" target="_blank">
                        <i class="bi bi-box-arrow-up-right"></i>
                        </a>`;

                        commitRow.appendChild(commitDate);
                        commitRow.appendChild(commitMessage);
                        commitRow.appendChild(commitAuthor);
                        commitRow.appendChild(commitLink);
                        commitTableContent.appendChild(commitRow);
                      });
                      let spinner = document.getElementById("spinner");
                      spinner.remove();
                    });
                }
              });
              taskListElement.appendChild(taskButton);
              taskList.appendChild(taskListElement);
            });

            studentFormTable.style.display = "block";
            studentFormTableContent.innerHTML = "";

            data.sheetData[studentId].forEach((cell, index) => {
              const dataRow = document.createElement("tr");

              const cellElementName = document.createElement("td");
              cellElementName.innerHTML = data.sheetData[0][index];
              dataRow.appendChild(cellElementName);

              const cellElementValue = document.createElement("td");
              cellElementValue.innerHTML = cell;
              dataRow.appendChild(cellElementValue);

              studentFormTableContent.appendChild(dataRow);
            });
          });
          studentListGroup.appendChild(student);
        }
      });
      spinner.remove();
    });
});

let addTaskList = document.getElementById("add-task-list");
let addTaskButton = document.getElementById("add-task");
addTaskButton.addEventListener("click", (event) => {
  event.preventDefault();
  const taskName = document.createElement("input");
  taskName.classList.add("form-control", "my-2");
  taskName.setAttribute("type", "text");
  taskName.setAttribute("name", "taskName");
  taskName.setAttribute("placeholder", "Task name");
  taskName.required = true;
  addTaskList.appendChild(taskName);
  const taskRow = document.createElement("input");
  taskRow.classList.add("form-control", "my-2");
  taskRow.setAttribute("type", "number");
  taskRow.setAttribute("name", "taskRow");
  taskRow.setAttribute("placeholder", "Row");
  taskRow.required = true;
  addTaskList.appendChild(taskRow);
});

studentFormTable.style.display = "none";
tabs.style.display = "none";
