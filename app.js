const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");
let db = null;

app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const checkRequestQueries = async (request, response, next) => {
  const { category, priority, status, date } = request.query;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    if (categoryArray.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    if (priorityArray.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    if (statusArray.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  
  if (date !== undefined) {
      try{
    const myDate = new Date(date);
    console.log(myDate);
    const formattedDate = format(myDate, "yyyy-MM-dd");
    console.log(formattedDate);
    const result = toDate(new Date(formattedDate));
    const resultValid = isValid(result);
    console.log(resultValid)
    if (resultValid===true) {
      request.date = formattedDate;
      console.log(request.date)
    } else {
        console.log(request.date)
      response.status(400);
      response.send("Invalid Due Date");
    }
  }catch(e){
      response.status(400);
      response.send("Invalid Due Date");
  }}
  next();
};

const checkRequestBody = async (request, response, next) => {
  const {
    id,
    todo,
    category,
    priority,
    status,
    search_q,
    dueDate,
  } = request.body;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    if (categoryArray.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    if (priorityArray.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    if (statusArray.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (dueDate !== undefined) {
      try{
    const myDate = new Date(dueDate);
    console.log(myDate);
    const formattedDate = format(myDate, "yyyy-MM-dd");
    console.log(formattedDate);
    const result = toDate(new Date(formattedDate));
    const resultValid = isValid(result);
    console.log(resultValid)
    if (resultValid===true) {
      request.date = formattedDate;
      console.log(request.date)
    } else {
        console.log(request.date)
      response.status(400);
      response.send("Invalid Due Date");
    }
  }catch(e){
      response.status(400);
      response.send("Invalid Due Date");
  }}
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};
app.get("/todos/", checkRequestQueries, async (request, response) => {
  const { search_q = "" } = request.query;
  const { status = "", priority = "", category = "" } = request;
  console.log(status, priority, category);
  const getTodoQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
    FROM todo
    WHERE id=${todoId};
    `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request;
  console.log(date);
  const getTodoQuery = `
    SELECT id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
    FROM todo
    WHERE due_date='${date}';
    `;
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
});

app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, date } = request;
  console.log(id, todo, priority, status, category, date);
  const addTodoQuery = `
    INSERT INTO todo(id,todo,priority,status,category, due_date)
    VALUES(${id},'${todo}','${priority}','${status}', '${category}', '${date}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", checkRequestBody,async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let mess = "";
  if (requestBody.status !== undefined) {
    mess = "Status";
  }
  if (requestBody.priority !== undefined) {
    mess = "Priority";
  }
  if (requestBody.todo !== undefined) {
    mess = "Todo";
  }
  if (requestBody.category !== undefined) {
    mess = "Category";
  }
  if (requestBody.dueDate!== undefined) {
    mess = "Due Date";
  }
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id=${todoId};
    `;
  const todoP = await db.get(getTodoQuery);
  //console.log(todoP);
  const {
    status = todoP.status,
    priority = todoP.priority,
    todo = todoP.todo,
    category=todoP.category,
    date=todoP.dueDate
  } = request;

  //console.log(status);
  //console.log(priority);
  //console.log(todo);
  //console.log(mess);

  const updateTodoQuery = `
    UPDATE todo
    SET
    status='${status}',
    priority='${priority}',
    todo='${todo}',
    category='${category}',
    due_date='${date}'
    WHERE 
    id=${todoId};
  `;
  await db.run(updateTodoQuery);
  response.send(`${mess} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
