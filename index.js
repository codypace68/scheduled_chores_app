import { JSDOM } from "jsdom";
import fs from "fs";
import { sendMail } from "./sendMail.js";
const { document } = new JSDOM(`...`).window;

const NO_CHORE_CONFIG_ERROR_TEXT =
  "No chore config found. Please define a choreConfig.json file or pass config in as env variable.";

function getChoreTable(choreData) {
  const formattedChoreData = spreadChores(choreData);

  // generate an HTML table with the chore assignments
  // header row should show days of the week
  // the first header should say "Chores"
  // the first column should show the name of each chore
  // each cell should show the name of the child assigned to that chore on that day
  const table = document.createElement("table");
  table.style.border = "1px solid black";
  table.style.borderCollapse = "collapse";
  table.style.width = "75%";
  // center in page
  table.style.marginLeft = "auto";
  table.style.marginRight = "auto";
  table.style.textAlign = "left";
  table.style.fontFamily = "Arial, Helvetica, sans-serif";
  // make the table print nicely in landscape
  table.style.borderSpacing = "0";
  table.style.borderCollapse = "collapse";
  table.style.pageBreakAfter = "always";
  table.style.pageBreakInside = "avoid";
  table.style.width = "100%";
  table.style.marginTop = "20px";
  table.style.marginBottom = "20px";
  table.style.pageBreakBefore = "always";
  table.style.pageBreakAfter = "always";
  table.style.pageBreakInside = "avoid";
  // adjust the table to fit the page
  table.style.height = "95%";

  const headerElement = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const headerCell = document.createElement("th");
  headerCell.innerHTML = "Chores";
  headerCell.style.padding = "5px";
  headerRow.appendChild(headerCell);
  choreData.daysForChores.forEach((day) => {
    const headerCell = document.createElement("th");
    headerCell.style.padding = "5px";

    headerCell.innerHTML = day;

    headerRow.appendChild(headerCell);
  });
  table.appendChild(headerRow);

  Object.keys(formattedChoreData).forEach((chore) => {
    const row = document.createElement("tr");
    row.style.borderTop = "1px solid black";
    const cell = document.createElement("td");
    cell.innerHTML = chore;
    cell.style.padding = "5px";
    row.appendChild(cell);
    const cellsArray = [];

    Object.keys(formattedChoreData[chore]).forEach((day) => {
      const cell = document.createElement("td");
      const dayIndex = choreData.daysForChores.indexOf(day);
      cell.style.padding = "5px";
      cell.innerHTML = formattedChoreData[chore][day];

      cellsArray[dayIndex] = cell;
    });

    choreData.daysForChores.forEach((day) => {
      const dayIndex = choreData.daysForChores.indexOf(day);
      if (!cellsArray[dayIndex]) {
        const cell = document.createElement("td");
        cell.style.padding = "5px";
        cell.innerHTML = "";
        cellsArray[dayIndex] = cell;
      }

      row.appendChild(cellsArray[dayIndex]);
    });

    table.appendChild(row);
  });

  return table;
}

// Spread chores randomly to all children in the house based on the days for each chore
function spreadChores(choreData) {
  const processedChoreData = {};
  const choreAssignmentData = {};
  choreData.chores.forEach((chore) => {
    const assignmentDataForChore = getAssignmentDataForChore(
      chore,
      processedChoreData,
    );
    choreAssignmentData[chore.Name] = assignmentDataForChore;
    processedChoreData[chore.Name] = assignmentDataForChore;
  });

  return choreAssignmentData;
}

// using the current chore data and data from past chores, determine who should be assigned to this chore be each day this chore is performed
function getAssignmentDataForChore(chore, processedChoreData) {
  const assignmentData = {};
  let assignableChildren = [...chore.assignedChildren];

  chore.Days.forEach((day) => {
    if (assignableChildren.length === 0)
      assignableChildren = [...chore.assignedChildren];

    assignmentData[day] = findValidChild(chore, day, processedChoreData, [
      ...assignableChildren,
    ]);

    // This force assigns a child regardless of whether they have done it in the same week.
    // we do try to avoid this situation if possible, but sometimes it isn't possible.
    if (assignmentData[day] === null) {
      assignmentData[day] = findValidChild(chore, day, processedChoreData, [
        ...chore.assignedChildren,
      ]);
    }

    assignableChildren.splice(
      assignableChildren.indexOf(assignmentData[day]),
      1,
    );
  });

  return assignmentData;
}

function findValidChild(chore, day, processedChoreData, validChildren) {
  // ran out of valid children to assign to this chore on this day
  if (validChildren.length === 0) {
    return null;
  }

  let assignedChild =
    validChildren[Math.floor(Math.random() * validChildren.length)];

  if (
    validChildren.length > 0 &&
    checkForPastAssignmentForDay(day, assignedChild, processedChoreData)
  ) {
    validChildren.splice(validChildren.indexOf(assignedChild), 1);
    return findValidChild(chore, day, processedChoreData, validChildren);
  }

  return assignedChild;
}

/**
 * Determine if a child has already been assigned to a chore on the same day
 * @param {*} day
 * @param {*} assignedChild
 * @param {*} processedChoreData
 * @returns
 */
function checkForPastAssignmentForDay(day, assignedChild, processedChoreData) {
  let pastAssignmentFound = false;

  Object.keys(processedChoreData).forEach((chore) => {
    if (processedChoreData[chore][day] === assignedChild) {
      pastAssignmentFound = true;
    }
  });

  return pastAssignmentFound;
}

function main() {
  let rawChoreData;
  // Attempt to read in local json file.
  // If it doesn't exist, assume it's running with chore data defined as env variable.
  try {
    rawChoreData = JSON.parse(fs.readFileSync("./choreConfig.json", "utf8"));
  } catch (e) {
    rawChoreData = undefined;
  }

  // Next, attempt to read it in from an environment variable
  if (rawChoreData === undefined) {
    try {
      rawChoreData = JSON.parse(process.env.CHORE_CONFIG_JSON);
    } catch (e) {
      rawChoreData === undefined;
    }
  }

  if (rawChoreData === undefined)
    throw new Error("No chore configuration found.");

  sendMail(getChoreTable(rawChoreData).outerHTML);
}

main();
