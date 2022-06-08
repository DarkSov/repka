let sheetsSelect = document.getElementById("sheets-select");
let sheet = document.getElementById("sheet");
let studentInfo = document.getElementById("student-info");

sheetsSelect.addEventListener("change", (event) => {
  sheet.innerHTML = "";
  const sheetId = sheetsSelect.value;
  if (sheetId == "") return;
  fetch(`/get-google-spreadsheet?sheetId=${sheetId}`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.sheetData.forEach((row, index) => {
        if (index != 0) {
          let student = document.createElement("div");
          student.className = "student";
          student.innerHTML = row[data.nameRow - 1];
          student.id = index;
          student.addEventListener("click", (event) => {
            studentInfo.innerHTML = "";
            const studentId = event.target.id;
            data.tasks.forEach((task) => {
              const taskName = task.name;
              const taskRow = task.row;
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
          sheet.appendChild(student);
        }
      });
    });
});

let sheetForm = document.getElementById("spreadsheet-form");
let addTaskButton = document.getElementById("add-task");
addTaskButton.addEventListener("click", (event) => {
  const taskName = document.createElement("input");
  taskName.setAttribute("type", "text");
  taskName.setAttribute("name", "taskName");
  taskName.setAttribute("placeholder", "Task name");
  sheetForm.appendChild(taskName);
  const taskRow = document.createElement("input");
  taskRow.setAttribute("type", "number");
  taskRow.setAttribute("name", "taskRow");
  taskRow.setAttribute("placeholder", "Row");
  sheetForm.appendChild(taskRow);
});
