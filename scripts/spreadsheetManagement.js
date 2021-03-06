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
const tabContent = document.getElementById("nav-tabContent");
const repoOptions = document.getElementById("repo-options");

const branchSelect = document.getElementById("branch-select");
const pathInput = document.getElementById("path-input");
const pathButton = document.getElementById("path-button");

const studentFilter = document.getElementById("student-filter");

const navOverview = document.getElementById("nav-overview");
const navCommits = document.getElementById("nav-commits");

const tabs = document.getElementById("tabs");

const spreadsheetList = document.getElementById("spreadsheet-list");

var currentLink = "";
var currentSheetToDelete = "";
var currentStudentList = [];

const sheetIdInfo = document.getElementById("sheet-id-info");

let getIndexesOfArrayElementsContainValue = (array, value) => {
  var indices = [];

  for (var i = 0; i < array.length; i++) {
    if (array[i].toUpperCase().includes(value.toUpperCase())) {
      indices.push(i);
    }
  }

  return indices;
};

let generateChart = (data, headers) => {
  let chart = document.createElement("table");
  chart.classList.add(
    "charts-css",
    "column",
    "show-labels",
    "show-data-on-hover",
    "hide-data"
  );
  chart.style.height = "300px";
  chart.style.width = "500px";
  chart.style.margin = "10px";
  chart.style.maxWidth = "100%";

  let tbody = document.createElement("tbody");

  let maxElement = Math.max(...data);

  data.forEach((row, index) => {
    let tr = document.createElement("tr");

    let th = document.createElement("th");
    th.innerText = headers[index];
    th.setAttribute("scope", "row");

    let td = document.createElement("td");
    td.innerHTML = `<span class="data">${row}</span>`;

    td.style.setProperty("--size", row / maxElement);

    tr.appendChild(th);
    tr.appendChild(td);

    tbody.appendChild(tr);
  });

  chart.appendChild(tbody);

  return chart;
};

let loadRepo = (taskLink, branch, path) => {
  commitTableContent.innerHTML = `<div id="spinner" class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>`;
  navOverview.innerHTML = `<div id="spinner" class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>`;

  commitTableContent.innerHTML = "";

  if (typeof taskLink != "string" || !taskLink.includes("github.com")) {
    tabContent.style.display = "block";
    let spinner = document.getElementById("spinner");
    spinner.remove();
    let commitAmountChartCaption = document.createElement("caption");
    commitAmountChartCaption.classList.add("caption", "fw-bold", "text-danger");
    commitAmountChartCaption.style.marginBottom = "10px";
    commitAmountChartCaption.style.width = "200px";
    commitAmountChartCaption.innerText = "Invalid link to repository";
    navOverview.appendChild(commitAmountChartCaption);
    return;
  }

  let username = taskLink.split("/")[3];
  let repo = taskLink.split("/")[4];

  if (!username || !repo) {
    tabContent.style.display = "block";
    let spinner = document.getElementById("spinner");
    spinner.remove();
    let commitAmountChartCaption = document.createElement("caption");
    commitAmountChartCaption.classList.add("caption", "fw-bold", "text-danger");
    commitAmountChartCaption.style.marginBottom = "10px";
    commitAmountChartCaption.style.width = "200px";
    commitAmountChartCaption.innerText = "Invalid link to repository";
    navOverview.appendChild(commitAmountChartCaption);
    return;
  }

  tabContent.style.display = "block";

  taskList.childNodes.forEach((tab) => {
    tab.classList.remove("active");
  });
  tabs.style.display = "inline-block";
  fetch(
    `/get-student-repo?username=${username}&repo=${repo}&sha=${branch}&path=${path}`
  )
    .then((response) => response.json())
    .then((data) => {
      let repoTitle = document.createElement("h5");
      repoTitle.classList.add("py-2");
      repoTitle.innerHTML = `${repo}    <a href="${taskLink}" target="_blank"><i class="bi bi-box-arrow-up-right"></a>`;

      let commitAmountChartCaption = document.createElement("caption");
      commitAmountChartCaption.innerText = "Commit Amount Chart";
      commitAmountChartCaption.classList.add("caption", "fw-bold");
      commitAmountChartCaption.style.marginBottom = "10px";
      commitAmountChartCaption.style.width = "200px";

      let headers = ["30 days", "7 days", "24 hours"];
      let commitAmount = [
        data.commitsLastMonth.length,
        data.commitsLastWeek.length,
        data.commitsLastDay.length,
      ];

      if (commitAmount.reduce((a, b) => a + b, 0) === 0) {
        commitAmountChartCaption.innerText = "No commits found :(";
        navOverview.appendChild(commitAmountChartCaption);
      } else {
        let commitAmountChart = generateChart(commitAmount, headers);

        let authorsChartCaption = document.createElement("caption");
        authorsChartCaption.innerText = "Authors Chart";
        authorsChartCaption.classList.add("caption", "fw-bold");
        authorsChartCaption.style.marginBottom = "10px";
        authorsChartCaption.style.width = "200px";

        let allCommits = data.commitsLastMonth.concat(
          data.commitsLastWeek,
          data.commitsLastDay
        );

        let authors = allCommits.map((commit) => commit.author);

        let uniqueAuthors = [...new Set(authors)];

        let authorCommits = uniqueAuthors.map((author) => {
          let authorCommits = data.commitsLastMonth.filter(
            (commit) => commit.author == author
          );
          return authorCommits.length;
        });

        if (uniqueAuthors.length >= 8) {
          while (uniqueAuthors.length >= 8) {
            let index = authorCommits.findIndex(
              (a) => a == Math.min(...authorCommits)
            );

            uniqueAuthors.splice(index, 1);
            authorCommits.splice(index, 1);
          }
        }

        let authorChart = generateChart(authorCommits, uniqueAuthors);

        navOverview.appendChild(repoTitle);

        navOverview.appendChild(commitAmountChartCaption);
        navOverview.appendChild(commitAmountChart);

        navOverview.appendChild(authorsChartCaption);
        navOverview.appendChild(authorChart);

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
          commitMessage.innerHTML = commit.message.split(
            "PiperOrigin-RevId: "
          )[0];

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

        //TODO: Add lazy loading for commits

        let branches = data.branches;
        branchSelect.innerHTML = "";

        branches.forEach((branch) => {
          let branchOption = document.createElement("option");
          branchOption.value = branch.sha;
          branchOption.innerText = branch.name;
          branchSelect.appendChild(branchOption);
        });
        let mainBranchIndex = branches.findIndex(
          (branch) => branch.name == "master" || branch.name == "main"
        );
        branchSelect.selectedIndex = mainBranchIndex;
      }
      let spinner = document.getElementById("spinner");
      spinner.remove();
    })
    .catch((error) => {
      tabContent.style.display = "block";
      let spinner = document.getElementById("spinner");
      spinner.remove();
      let commitAmountChartCaption = document.createElement("caption");
      commitAmountChartCaption.classList.add(
        "caption",
        "fw-bold",
        "text-danger"
      );
      commitAmountChartCaption.style.marginBottom = "10px";
      commitAmountChartCaption.style.width = "200px";
      commitAmountChartCaption.innerText =
        "Invalid link to repository or repository is private to you";
      navOverview.appendChild(commitAmountChartCaption);
    });
};

//sheet onchange
sheetsSelect.addEventListener("change", (event) => {
  repoOptions.style.display = "none";
  tabs.style.display = "none";
  tabContent.style.display = "none";
  taskList.style.display = "none";

  studentFilter.value = "";
  const sheetId = sheetsSelect.value;

  if (sheetId == "") {
    studentListGroup.innerHTML = "";
    return;
  }

  studentListGroup.innerHTML = `<div id="spinner" class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>`;
  const spinner = document.getElementById("spinner");
  fetch(`/get-google-spreadsheet?sheetId=${sheetId}`)
    .then((response) => {
      console.log(response.status);
      if (response.status !== 200) {
        throw new Error(
          "Failed to load Google Spreadsheet. Please check spreadsheet id, access for service email or try again later."
        );
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) throw new Error(data);
      if (data.sheetData[0].length < data.nameCol) {
        throw new Error("Name column not found");
      }
      data.tasks.forEach((task) => {
        if (data.sheetData[0].length < task.col)
          throw new Error("Task column not found");
      });

      currentStudentList = data.sheetData.map(
        (row, index) => row[data.nameCol - 1]
      );
      currentStudentList.shift();
      data.sheetData.forEach((row, index) => {
        if (index != 0) {
          let student = document.createElement("li");
          student.classList.add("list-group-item", "student");
          student.innerHTML = row[data.nameCol - 1];
          student.id = index;

          //student onclick
          student.addEventListener("click", (event) => {
            tabs.style.display = "none";
            tabContent.style.display = "none";
            repoOptions.style.display = "block";
            taskList.style.display = "flex";

            taskList.innerHTML = "";
            commitTableContent.innerHTML = "";
            navOverview.innerHTML = "";
            currentLink = "";

            const studentId = event.target.id;

            studentListGroup.childNodes.forEach((student) => {
              student.classList.remove("active");
            });
            event.target.classList.add("active");

            data.tasks.forEach((task) => {
              const taskName = task.name;
              const taskCol = task.col - 1;
              const taskLink = data.sheetData[studentId][taskCol];

              const taskListElement = document.createElement("li");
              taskListElement.classList.add("nav-item");
              taskButton = document.createElement("a");
              taskButton.classList.add("nav-link");
              taskButton.innerHTML = taskName;

              //task onclick
              taskButton.addEventListener("click", (event) => {
                currentLink = taskLink;

                taskList.childNodes.forEach((tab) => {
                  tab.childNodes.forEach((task) => {
                    task.classList.remove("active");
                  });
                });
                event.target.classList.add("active");

                loadRepo(taskLink, "", "");
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
          spinner.remove();
        }
      });
    })
    .catch((error) => {
      console.log(error);
      const studentListElement = document.createElement("li");
      studentListElement.classList.add("list-group-item", "text-danger");

      studentListElement.innerHTML = error.message;

      studentListGroup.appendChild(studentListElement);
      spinner.remove();
    });
});

branchSelect.addEventListener("change", (event) => {
  loadRepo(currentLink, event.target.value, pathInput.value);
});

pathButton.addEventListener("click", (event) => {
  if (currentLink !== "") {
    loadRepo(currentLink, branchSelect.value, pathInput.value);
  }
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
  const taskCol = document.createElement("input");
  taskCol.classList.add("form-control", "my-2");
  taskCol.setAttribute("type", "number");
  taskCol.setAttribute("name", "taskCol");
  taskCol.setAttribute("placeholder", "Column number");
  taskCol.required = true;
  addTaskList.appendChild(taskCol);
});

const deleteSheetButtons = document.getElementsByClassName("delete-sheet");
const spreadsheetToDelete = document.getElementById("spreadsheet-to-delete");

for (let i = 0; i < deleteSheetButtons.length; i++) {
  deleteSheetButtons[i].addEventListener("click", (event) => {
    currentSheetToDelete = event.currentTarget.getAttribute("data-sheet-id");
    spreadsheetToDelete.innerHTML =
      event.currentTarget.getAttribute("data-sheet-name");
  });
}

const deleteSheetModalButton = document.getElementById(
  "delete-sheet-modal-button"
);

deleteSheetModalButton.addEventListener("click", (event) => {
  fetch(`/delete-google-spreadsheet?sheetId=${currentSheetToDelete}`, {
    method: "DELETE",
  })
    .then((response) => {
      location.reload();
    })
    .catch((error) => {
      console.log(error);
    });
});

studentFilter.addEventListener("keyup", (event) => {
  const filter = event.target.value.trim();

  const filteredStudentsIndexes = getIndexesOfArrayElementsContainValue(
    currentStudentList,
    filter
  );

  studentListGroup.childNodes.forEach((student) => {
    if (filteredStudentsIndexes.includes(parseInt(student.id - 1))) {
      student.style.display = "block";
    } else {
      student.style.display = "none";
    }
  });
});

studentFormTable.style.display = "none";
tabs.style.display = "none";
