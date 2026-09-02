import { Router } from "express";
import { createEmployee, getEmployees, updateEmployee, deleteEmployee } from "../controllers/employeeController.js"
import { protect, protectAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createEmployeeSchema, updateEmployeeSchema } from "../validators/index.js";

const employeeRouter = Router();

employeeRouter.get("/", protect, protectAdmin, getEmployees)

employeeRouter.post("/", protect, protectAdmin, validate(createEmployeeSchema), createEmployee)

employeeRouter.put("/:id", protect, protectAdmin, validate(updateEmployeeSchema), updateEmployee)

employeeRouter.delete("/:id", protect, protectAdmin, deleteEmployee)

export default employeeRouter;
