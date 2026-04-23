import { Hono } from "hono";
import { db } from "../db";

const deleteAccountRouter = new Hono();

deleteAccountRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "User ID is required" }, 400);
  }

  const existing = await db.signup.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Account not found" }, 404);
  }

  await db.signup.delete({ where: { id } });

  return c.json({ success: true });
});

export { deleteAccountRouter };
