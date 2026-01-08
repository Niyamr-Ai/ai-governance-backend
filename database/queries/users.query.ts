import db from "../knex";

export async function insertUser(userid?: string, email?: string) {
  if (!userid || !email) {
    throw new Error("Faced some errors. Please try again.");
  }
  // insert in rds users table
  const [newEntry] = await db("users")
    .insert({
      user_id: userid,
      email: email,
    })
    .returning("*");

  console.log(newEntry);

  return newEntry;
}
