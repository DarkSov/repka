let sheetsSelect = document.getElementById("sheets-select");
let sheet = document.getElementById("sheet");
let studentInfo = document.getElementById("student-info");
const studentListGroup = document.getElementById("student-list-group");

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
          student.addEventListener("click", (event) => {
            studentInfo.innerHTML = "";
            const studentId = event.target.id;
            data.tasks.forEach((task) => {
              const taskName = task.name;
              const taskRow = task.row - 1;
              const taskLink = data.sheetData[studentId][taskRow];
              if (taskLink != "") {
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
                    studentInfo.appendChild(studentRepo);
                    studentInfo.appendChild(studentCommits);
                  });
              }
            });
          });
          studentListGroup.appendChild(student);
        }
      });
      spinner.remove();
    });
});

let taskList = document.getElementById("task-list");
let addTaskButton = document.getElementById("add-task");
addTaskButton.addEventListener("click", (event) => {
  event.preventDefault();
  const taskName = document.createElement("input");
  taskName.classList.add("form-control", "my-2");
  taskName.setAttribute("type", "text");
  taskName.setAttribute("name", "taskName");
  taskName.setAttribute("placeholder", "Task name");
  taskName.required = true;
  taskList.appendChild(taskName);
  const taskRow = document.createElement("input");
  taskRow.classList.add("form-control", "my-2");
  taskRow.setAttribute("type", "number");
  taskRow.setAttribute("name", "taskRow");
  taskRow.setAttribute("placeholder", "Row");
  taskRow.required = true;
  taskList.appendChild(taskRow);
});
