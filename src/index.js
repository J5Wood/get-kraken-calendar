const fileSelector = document.getElementById("file-selector");
const fileList = document.getElementById("file-list");

fileSelector.addEventListener("change", (event) => {
  fileList.innerHTML = "";
  const list = document.createElement("ul");
  const listItem = document.createElement("li");

  const selectedFile = event.target.files[0];
  listItem.innerHTML = selectedFile.name;
  list.appendChild(listItem);
  fileList.appendChild(list);

  const button = document.createElement("button");
  button.addEventListener("click", () => parseFile(selectedFile));
  button.innerText = "Format for Google Calendar";
  fileList.append(button);
});

const parseFile = async (file) => {
  let fileData = await readFile(file);

  const data = formatData(fileData);

  writeNewFile(data);
};

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("loadend", () => {
      resolve(reader.result);
    });
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function formatData(text) {
  // Need to change home team detection to use for other teams
  const data = text.split("\r\n").slice(1);

  const columnTitles = [
    "Subject",
    "Start Date",
    "Start Time",
    "End Date",
    "End Time",
    "All day event",
    "Description",
    "Location",
    "Private\n",
  ];

  const tableData = data.flatMap((teamData) => {
    const team = teamData.split(",");
    if (team[3] !== "Climate Pledge Arena") return [];
    const [date, time] = formatDateTime(team[2].split(" "));

    const subject = `${team[5]} vs ${team[4]}`;
    const startDate = `${date}`;
    const startTime = `${time}`;
    const endDate = `${date}`;
    const endTime = `${
      (parseInt(time.slice(0, 2)) + 3).toString().padStart(2, "0") +
      time.slice(2)
    }`;
    const allDayEvent = "FALSE";
    const description = "";
    const location = "Climate Pledge Arena";
    const private = "TRUE";
    return `${subject}, ${startDate}, ${startTime}, ${endDate}, ${endTime}, ${allDayEvent}, ${description}, ${location}, ${private}\n`;
  });
  return columnTitles.join(",") + tableData.join("");
}

function formatDateTime([date, time]) {
  // Will need to change year by year to account for daylight savings days changing
  let formattedDate = date.slice(3, 6) + date.slice(0, 3) + date.slice(6);
  const hour = parseInt(time.slice(0, 2));
  let formattedTime = "";
  let daylightSavings =
    (parseInt(formattedDate.slice(0, 2)) > 3 &&
      parseInt(formattedDate.slice(0, 2)) < 11) ||
    (parseInt(formattedDate.slice(0, 2)) === 3 &&
      parseInt(formattedDate.slice(3, 5)) > 12) ||
    (parseInt(formattedDate.slice(0, 2)) === 11 &&
      parseInt(formattedDate.slice(3, 5)) < 6);

  let timeDiff = daylightSavings ? 7 : 8;

  if (hour < timeDiff) {
    formattedDate =
      formattedDate.slice(0, 3) +
      (parseInt(formattedDate.slice(3, 5)) - 1).toString().padStart(2, "0") +
      formattedDate.slice(5);
    const newTime = timeDiff - hour;
    formattedTime =
      (12 - newTime).toString().padStart(2, "0") + time.slice(2) + " PM";
  } else if (hour === timeDiff) {
    formattedTime = `12:00 AM`;
  } else if (hour < 12) {
    formattedTime =
      (hour - timeDiff).toString().padStart(2, "0") + time.slice(2) + " AM";
  } else if (hour === 12) {
    formattedTime = "12:00 PM";
  } else {
    formattedTime =
      (hour - timeDiff - 12).toString().padStart(2, "0") +
      time.slice(2) +
      " PM";
  }
  return [formattedDate, formattedTime];
}

function writeNewFile(data) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(data)
  );
  element.setAttribute("download", "hockey-schedule.csv");
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
